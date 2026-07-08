// lib/services/vision/vision.service.ts
// The ONLY entry point for vision analysis in the entire application.
// No other file should ever import @google/generative-ai or call OpenRouter for vision.

import { getAIConfig } from "../../config/ai-providers";
import { GeminiVisionProvider } from "./providers/gemini.provider";
import { OpenRouterVisionProvider } from "./providers/openrouter.provider";
import type { VisionProvider, VisionCacheEntry } from "./types";
import type { VisionAnalysis } from "../../types";

const VISION_PROMPT = `You are a senior UX analyst. Analyze this webpage screenshot. Return a JSON object with EXACTLY these fields — no extra fields, no markdown:
{
  "uiStructure": "description of overall UI layout",
  "layoutHierarchy": "visual hierarchy: hero/navigation/content/footer",
  "visualComplexity": "low|medium|high",
  "formComplexity": "simple|moderate|complex",
  "accessibilityObservations": ["array of accessibility notes"],
  "navigationPatterns": "description of navigation approach",
  "interfaceElements": ["list of key UI elements found"],
  "primaryPurpose": "main purpose or CTA of this page"
}
Be specific and evidence-based. Return only valid JSON.`;

// In-process LRU-style cache keyed by CDN URL.
// NOTE: This cache is ephemeral — it lives only for the current warm serverless
// instance. Cold starts and scaled-out instances each begin with an empty cache,
// so the same screenshot may be analysed multiple times across instances.
// The primary purpose is deduplication *within* a single analysis run.
const cache = new Map<string, VisionCacheEntry>();
const CACHE_TTL_MS = 60 * 60 * 1_000; // 1 hour (per warm instance)

function getFromCache(url: string): VisionAnalysis | null {
	const entry = cache.get(url);
	if (!entry) return null;
	if (Date.now() - entry.fetchedAt > CACHE_TTL_MS) {
		cache.delete(url);
		return null;
	}
	return entry.result;
}

function setInCache(url: string, result: VisionAnalysis): void {
	if (cache.size > 500) {
		// Evict oldest entry
		const firstKey = cache.keys().next().value;
		if (firstKey) cache.delete(firstKey);
	}
	cache.set(url, { result, fetchedAt: Date.now() });
}

async function sleep(ms: number): Promise<void> {
	return new Promise((r) => setTimeout(r, ms));
}

// Valid literal values for VisionAnalysis union fields.
const VALID_VISUAL_COMPLEXITY = ["low", "medium", "high"] as const;
const VALID_FORM_COMPLEXITY = ["simple", "moderate", "complex"] as const;

/**
 * Clamps a raw value to the nearest valid union literal.
 * If the model returns an unrecognised string (e.g. "Very High"), we fall back
 * to the supplied default rather than letting an invalid value through.
 */
function clampLiteral<T extends string>(
	val: unknown,
	valid: readonly T[],
	fallback: T,
): T {
	const normalised = String(val ?? "").toLowerCase().trim();
	return (valid as readonly string[]).includes(normalised)
		? (normalised as T)
		: fallback;
}

/**
 * Normalises the raw LLM output to guarantee it satisfies the VisionAnalysis
 * type contract — specifically the union-typed complexity fields.
 */
function normaliseVisionResult(raw: VisionAnalysis): VisionAnalysis {
	return {
		...raw,
		visualComplexity: clampLiteral(raw.visualComplexity, VALID_VISUAL_COMPLEXITY, "medium"),
		formComplexity: clampLiteral(raw.formComplexity, VALID_FORM_COMPLEXITY, "simple"),
	};
}

async function fetchImageBase64(
	url: string,
	timeoutMs: number,
): Promise<{ data: string; mimeType: string }> {
	const controller = new AbortController();
	const timer = setTimeout(() => controller.abort(), timeoutMs);
	try {
		const res = await fetch(url, { signal: controller.signal });
		if (!res.ok) throw new Error(`Image fetch failed: ${res.status}`);
		const contentType = res.headers.get("content-type") ?? "image/jpeg";
		const mimeType = contentType.split(";")[0].trim();
		const buf = await res.arrayBuffer();
		return { data: Buffer.from(buf).toString("base64"), mimeType };
	} finally {
		clearTimeout(timer);
	}
}

async function callWithRetry(
	provider: VisionProvider,
	imageData: string,
	mimeType: string,
	pageTitle: string,
	maxRetries: number,
	baseDelayMs: number,
): Promise<VisionAnalysis> {
	let lastErr: Error = new Error("Unknown error");
	for (let attempt = 0; attempt <= maxRetries; attempt++) {
		try {
			const raw = await provider.analyzeScreenshot(
				imageData,
				mimeType,
				pageTitle,
				VISION_PROMPT,
			);
			return normaliseVisionResult(raw);
		} catch (err) {
			lastErr = err as Error;
			const msg = lastErr.message.toLowerCase();

			// Do not retry on non-retryable errors
			if (
				msg.includes("400") ||
				msg.includes("invalid") ||
				msg.includes("unsafe")
			) {
				throw lastErr;
			}

			const isRateLimit =
				msg.includes("429") ||
				msg.includes("rate limit") ||
				msg.includes("quota");
			const delay = isRateLimit
				? baseDelayMs * 4 * Math.pow(2, attempt)
				: baseDelayMs * Math.pow(2, attempt);
			const capped = Math.min(delay, 30_000);

			if (attempt < maxRetries) {
				console.warn(
					`[VisionService] ${provider.name} attempt ${attempt + 1} failed (${lastErr.message}), retrying in ${capped}ms`,
				);
				await sleep(capped);
			}
		}
	}
	throw lastErr;
}

function buildProviders(): {
	primary: VisionProvider | null;
	fallback: VisionProvider | null;
} {
	const cfg = getAIConfig();
	const primaryCfg = cfg.vision.providers[cfg.vision.primary];
	const fallbackName = cfg.vision.fallback;
	const fallbackCfg = fallbackName ? cfg.vision.providers[fallbackName] : null;

	const make = (c: typeof primaryCfg | null): VisionProvider | null => {
		if (!c || !c.enabled) return null;
		if (c.name === "gemini") {
			return new GeminiVisionProvider(process.env.GEMINI_API_KEY!, c.model);
		}
		if (c.name === "openrouter") {
			return new OpenRouterVisionProvider(
				process.env.OPENROUTER_API_KEY!,
				c.model,
				c.timeoutMs,
			);
		}
		return null;
	};

	return { primary: make(primaryCfg), fallback: make(fallbackCfg) };
}

/**
 * Analyzes a single screenshot URL.
 * - Checks in-memory cache first (never analyzes same URL twice).
 * - Tries primary provider with retries + exponential backoff.
 * - Falls back to secondary provider on failure.
 * - Returns null (never throws) so callers can gracefully skip vision.
 */
export async function analyzeScreenshot(
	screenshotUrl: string,
	pageTitle: string,
): Promise<VisionAnalysis | null> {
	// Cache hit
	const cached = getFromCache(screenshotUrl);
	if (cached) {
		console.log(`[VisionService] Cache hit for ${screenshotUrl}`);
		return cached;
	}

	const cfg = getAIConfig();
	const primaryCfg = cfg.vision.providers[cfg.vision.primary];
	const { primary, fallback } = buildProviders();

	let imageData: string;
	let mimeType: string;

	try {
		const fetched = await fetchImageBase64(screenshotUrl, primaryCfg.timeoutMs);
		imageData = fetched.data;
		mimeType = fetched.mimeType;
	} catch (fetchErr) {
		console.warn(
			`[VisionService] Image fetch failed for ${screenshotUrl}:`,
			(fetchErr as Error).message,
		);
		return null;
	}

	// Try primary provider
	if (primary) {
		try {
			const result = await callWithRetry(
				primary,
				imageData,
				mimeType,
				pageTitle,
				primaryCfg.maxRetries,
				primaryCfg.baseDelayMs,
			);
			setInCache(screenshotUrl, result);
			console.log(
				`[VisionService] ${primary.name} succeeded for ${screenshotUrl}`,
			);
			return result;
		} catch (primaryErr) {
			console.warn(
				`[VisionService] Primary provider (${primary.name}) failed:`,
				(primaryErr as Error).message,
			);
		}
	}

	// Try fallback provider
	if (fallback) {
		const fallbackCfgEntry = cfg.vision.providers[cfg.vision.fallback!];
		try {
			const result = await callWithRetry(
				fallback,
				imageData,
				mimeType,
				pageTitle,
				fallbackCfgEntry.maxRetries,
				fallbackCfgEntry.baseDelayMs,
			);
			setInCache(screenshotUrl, result);
			console.log(
				`[VisionService] Fallback provider (${fallback.name}) succeeded for ${screenshotUrl}`,
			);
			return result;
		} catch (fallbackErr) {
			console.warn(
				`[VisionService] Fallback provider (${fallback.name}) also failed:`,
				(fallbackErr as Error).message,
			);
		}
	}

	console.error(
		`[VisionService] All providers failed for ${screenshotUrl}. Skipping vision.`,
	);
	return null;
}

/**
 * Determines whether a page warrants vision analysis based on its type.
 * Expensive vision should only run on high-value pages.
 */
export function shouldRunVision(
	pageType: string,
	hasScreenshot: boolean,
): boolean {
	if (!hasScreenshot) return false;
	const cfg = getAIConfig();
	const normalized = pageType.toUpperCase();
	return cfg.vision_optimization.priorityPageTypes.includes(normalized);
}

/**
 * Returns the maximum number of pages that should receive vision analysis.
 */
export function getMaxVisionPages(): number {
	return getAIConfig().vision_optimization.maxVisionPages;
}
