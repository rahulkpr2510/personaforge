// Sequential evaluation of user personas to prevent rate limits.

import Groq from "groq-sdk";
import { getAIConfig } from "../config/ai-providers";
import type {
	PersonaEvaluation,
	PersonaContext,
	SiteContext,
	StructuredPainPoint,
	StructuredRecommendation,
	StructuredPositive,
	UxCategoryScores,
} from "../types";

import { buildPersonaPrompt } from "./persona-engine-internals";

const FALLBACK_EVALUATION: PersonaEvaluation = {
	sentiment: "NEUTRAL",
	frictionScore: 50,
	adoptionLikelihood: 50,
	overallUxScore: 50,
	firstImpressions:
		"Evaluation unavailable for this persona due to a service error.",
	positives: [],
	painPoints: [],
	recommendations: [],
	evidence: [],
};

async function sleep(ms: number): Promise<void> {
	return new Promise((r) => setTimeout(r, ms));
}

function parseAndValidate(raw: string, pageCount: number): PersonaEvaluation {
	let cleaned = raw.trim();
	if (cleaned.startsWith("```json"))
		cleaned = cleaned.replace(/^```json\n?/, "");
	else if (cleaned.startsWith("```")) cleaned = cleaned.replace(/^```\n?/, "");
	if (cleaned.endsWith("```")) cleaned = cleaned.replace(/\n?```$/, "");

	const parsed = JSON.parse(cleaned.trim()) as PersonaEvaluation &
		Record<string, unknown>;

	if (parsed.frictionScore != null)
		parsed.frictionScore = Math.min(100, Math.max(0, parsed.frictionScore));
	if (parsed.adoptionLikelihood != null)
		parsed.adoptionLikelihood = Math.min(
			100,
			Math.max(0, parsed.adoptionLikelihood),
		);
	if (parsed.overallUxScore != null)
		parsed.overallUxScore = Math.min(100, Math.max(0, parsed.overallUxScore));

	if (parsed.uxCategoryScores) {
		const cats = parsed.uxCategoryScores as UxCategoryScores &
			Record<string, unknown>;
		for (const key of Object.keys(cats)) {
			const cat = cats[key] as
				| { score?: number; confidence?: number }
				| undefined;
			if (cat?.score != null) cat.score = Math.min(100, Math.max(0, cat.score));
			if (cat?.confidence != null)
				cat.confidence = Math.min(100, Math.max(0, cat.confidence));
		}
		if (!parsed.overallUxScore) {
			const scores = Object.values(cats)
				.map((c) => (c as { score: number }).score)
				.filter((s) => typeof s === "number");
			if (scores.length > 0)
				parsed.overallUxScore = Math.round(
					scores.reduce((a, b) => a + b, 0) / scores.length,
				);
		}
	}

	if (Array.isArray(parsed.painPoints)) {
		parsed.painPoints = (
			parsed.painPoints as (StructuredPainPoint | string)[]
		).filter((pp) =>
			typeof pp === "string" ? pp.trim().length > 0 : pp.issue && pp.evidence,
		) as StructuredPainPoint[] | string[];
	}
	if (Array.isArray(parsed.recommendations)) {
		parsed.recommendations = (
			parsed.recommendations as (StructuredRecommendation | string)[]
		).filter((r) =>
			typeof r === "string"
				? r.trim().length > 0
				: r.issue && (r.evidence || r.improvement),
		) as StructuredRecommendation[] | string[];
	}
	if (Array.isArray(parsed.positives)) {
		parsed.positives = (
			parsed.positives as (StructuredPositive | string)[]
		).filter((p) =>
			typeof p === "string" ? p.trim().length > 0 : p.finding && p.evidence,
		) as StructuredPositive[] | string[];
	}

	const VALID_LEVELS = new Set([
		"OBSERVED",
		"MEASURED",
		"INFERRED",
		"SPECULATIVE",
	]);
	if (Array.isArray(parsed.evidence)) {
		parsed.evidence = parsed.evidence.map((e) => ({
			...e,
			confidence: Math.min(100, Math.max(0, e.confidence ?? 50)),
			evidenceLevel: (VALID_LEVELS.has(e.evidenceLevel ?? "")
				? e.evidenceLevel
				: "INFERRED") as "OBSERVED" | "MEASURED" | "INFERRED" | "SPECULATIVE",
		}));
	}

	const enforceLevel = (items: unknown[]) => {
		for (const item of items as Array<{
			evidenceLevel?: string;
			confidence?: number;
		}>) {
			if (item.evidenceLevel === "SPECULATIVE" && (item.confidence ?? 0) > 49)
				item.confidence = 49;
			if (item.evidenceLevel === "INFERRED" && (item.confidence ?? 0) > 79)
				item.confidence = 79;
		}
	};
	if (Array.isArray(parsed.painPoints))
		enforceLevel(parsed.painPoints as unknown[]);
	if (Array.isArray(parsed.positives))
		enforceLevel(parsed.positives as unknown[]);
	if (Array.isArray(parsed.recommendations))
		enforceLevel(parsed.recommendations as unknown[]);

	if (pageCount <= 1 && parsed.evidence) {
		parsed.evidence = parsed.evidence.map((e) => ({
			...e,
			confidence: Math.min(85, e.confidence),
		}));
	}

	return parsed;
}

// ── Single Persona Call with Retry ────────────────────────────────────────────
async function callGroq(
	groq: Groq,
	model: string,
	prompt: string,
	maxTokens: number,
	temperature: number,
): Promise<string> {
	const completion = await groq.chat.completions.create({
		model,
		messages: [{ role: "user", content: prompt }],
		temperature,
		max_tokens: maxTokens,
		response_format: { type: "json_object" },
	});
	return completion.choices[0].message.content ?? "{}";
}

async function callOpenRouter(
	apiKey: string,
	model: string,
	prompt: string,
	maxTokens: number,
	temperature: number,
	timeoutMs: number,
): Promise<string> {
	const controller = new AbortController();
	const timer = setTimeout(() => controller.abort(), timeoutMs);
	try {
		const res = await fetch("https://openrouter.ai/api/v1/chat/completions", {
			method: "POST",
			headers: {
				Authorization: `Bearer ${apiKey}`,
				"Content-Type": "application/json",
				"HTTP-Referer": "https://personaforge.vercel.app",
				"X-Title": "PersonaForge",
			},
			body: JSON.stringify({
				model,
				messages: [{ role: "user", content: prompt }],
				response_format: { type: "json_object" },
				max_tokens: maxTokens,
				temperature,
			}),
			signal: controller.signal,
		});
		if (!res.ok) {
			const body = await res.text();
			throw new Error(`OpenRouter ${res.status}: ${body.slice(0, 200)}`);
		}
		const data = (await res.json()) as {
			choices: Array<{ message: { content: string } }>;
		};
		return data.choices[0]?.message?.content ?? "{}";
	} finally {
		clearTimeout(timer);
	}
}

async function evaluateSinglePersona(
	persona: PersonaContext,
	siteContext: SiteContext | Record<string, unknown>,
	groq: Groq,
	attempt = 0,
): Promise<PersonaEvaluation> {
	const cfg = getAIConfig();
	const textCfg = cfg.text;
	const primaryCfg = textCfg.providers[textCfg.primary];
	const fallbackCfg = textCfg.fallback
		? textCfg.providers[textCfg.fallback]
		: null;
	const pageCount = (siteContext as SiteContext).pageCount ?? 1;
	const prompt = buildPersonaPrompt(persona, siteContext as SiteContext);

	for (let i = 0; i <= primaryCfg.maxRetries; i++) {
		try {
			const raw = await callGroq(
				groq,
				primaryCfg.model,
				prompt,
				primaryCfg.maxTokens,
				primaryCfg.temperature,
			);
			const result = parseAndValidate(raw, pageCount);
			console.log(
				`[PersonaAnalysis] ${persona.label} — ${primaryCfg.name} succeeded (attempt ${i + 1})`,
			);
			return result;
		} catch (err) {
			const msg = (err as Error).message.toLowerCase();
			const isRateLimit =
				msg.includes("429") ||
				msg.includes("rate_limit") ||
				msg.includes("quota");
			const baseDelay = isRateLimit
				? cfg.pipeline.rateLimitDelayMs
				: primaryCfg.baseDelayMs;
			const delay = Math.min(
				baseDelay * Math.pow(2, i),
				cfg.pipeline.retryMaxDelayMs,
			);

			if (i < primaryCfg.maxRetries) {
				console.warn(
					`[PersonaAnalysis] ${persona.label} — ${primaryCfg.name} attempt ${i + 1} failed (${(err as Error).message}), retry in ${delay}ms`,
				);
				await sleep(delay);
			} else {
				console.error(
					`[PersonaAnalysis] ${persona.label} — ${primaryCfg.name} exhausted retries`,
				);
			}
		}
	}

	if (fallbackCfg && process.env.OPENROUTER_API_KEY) {
		for (let i = 0; i <= fallbackCfg.maxRetries; i++) {
			try {
				const raw = await callOpenRouter(
					process.env.OPENROUTER_API_KEY,
					fallbackCfg.model,
					prompt,
					fallbackCfg.maxTokens,
					fallbackCfg.temperature,
					fallbackCfg.timeoutMs,
				);
				const result = parseAndValidate(raw, pageCount);
				console.log(
					`[PersonaAnalysis] ${persona.label} — fallback ${fallbackCfg.name} succeeded`,
				);
				return result;
			} catch (err) {
				const msg = (err as Error).message.toLowerCase();
				const isRateLimit = msg.includes("429") || msg.includes("rate_limit");
				const baseDelay = isRateLimit
					? cfg.pipeline.rateLimitDelayMs
					: fallbackCfg.baseDelayMs;
				const delay = Math.min(
					baseDelay * Math.pow(2, i),
					cfg.pipeline.retryMaxDelayMs,
				);

				if (i < fallbackCfg.maxRetries) {
					console.warn(
						`[PersonaAnalysis] ${persona.label} — fallback attempt ${i + 1} failed, retry in ${delay}ms`,
					);
					await sleep(delay);
				}
			}
		}
	}

	console.error(
		`[PersonaAnalysis] ${persona.label} — all providers failed. Using fallback evaluation.`,
	);
	return { ...FALLBACK_EVALUATION };
}

export interface PersonaProgress {
	total: number;
	completed: number;
	current: string | null;
	failed: string[];
}

export async function runSequentialEvaluations(
	personas: PersonaContext[],
	siteContext: SiteContext | Record<string, unknown>,
	onProgress?: (progress: PersonaProgress) => void,
): Promise<PersonaEvaluation[]> {
	const cfg = getAIConfig();
	const groq = new Groq({ apiKey: process.env.GROQ_API_KEY! });
	const results: PersonaEvaluation[] = [];
	const failed: string[] = [];

	const progress: PersonaProgress = {
		total: personas.length,
		completed: 0,
		current: null,
		failed: [],
	};

	for (let i = 0; i < personas.length; i++) {
		const persona = personas[i];
		progress.current = persona.label;
		onProgress?.(progress);

		console.log(
			`[PersonaAnalysis] Starting [${i + 1}/${personas.length}]: ${persona.label}`,
		);

		try {
			const result = await evaluateSinglePersona(persona, siteContext, groq);
			results.push(result);
			progress.completed++;
			console.log(
				`[PersonaAnalysis] Completed [${i + 1}/${personas.length}]: ${persona.label}`,
			);
		} catch (err) {
			console.error(
				`[PersonaAnalysis] Unexpected error for ${persona.label}:`,
				err,
			);
			results.push({ ...FALLBACK_EVALUATION });
			failed.push(persona.label);
			progress.failed.push(persona.label);
		}

		if (i < personas.length - 1) {
			await sleep(cfg.pipeline.personaDelayMs);
		}
	}

	progress.current = null;
	onProgress?.(progress);

	if (failed.length > 0) {
		console.warn(
			`[PersonaAnalysis] Pipeline complete. Failed personas: ${failed.join(", ")}`,
		);
	} else {
		console.log(
			`[PersonaAnalysis] All ${personas.length} personas completed successfully.`,
		);
	}

	return results;
}
