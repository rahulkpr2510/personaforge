
import Groq from "groq-sdk";
import { getAIConfig } from "../config/ai-providers";
import type {
	FocusGroupResult,
	PersonaEvaluationWithLabel,
	StructuredPainPoint,
	StructuredPositive,
} from "../types";

async function sleep(ms: number): Promise<void> {
	return new Promise((r) => setTimeout(r, ms));
}

function cleanJson(raw: string): string {
	let s = raw.trim();
	if (s.startsWith("```json")) s = s.replace(/^```json\n?/, "");
	else if (s.startsWith("```")) s = s.replace(/^```\n?/, "");
	if (s.endsWith("```")) s = s.replace(/\n?```$/, "");
	return s.trim();
}

function buildFocusGroupPrompt(
	evaluations: PersonaEvaluationWithLabel[],
	siteUrl: string,
): string {
	const safe = (v: unknown, max = 2000) =>
		String(v ?? "")
			.replace(/[`{}\\\]]/g, "")
			.slice(0, max);

	const personaSummaries = evaluations
		.map((e) => {
			const painPoints = (e.painPoints ?? [])
				.slice(0, 3)
				.map((p) =>
					typeof p === "string" ? p : (p as StructuredPainPoint).issue,
				)
				.join("; ");
			const positives = (e.positives ?? [])
				.slice(0, 2)
				.map((p) =>
					typeof p === "string" ? p : (p as StructuredPositive).finding,
				)
				.join("; ");
			return `[${safe(e.label, 50)} — ${safe(e.name, 80)}, age ${safe(e.age, 3)}]
Sentiment: ${e.sentiment ?? "NEUTRAL"} | Friction: ${e.frictionScore ?? 50}/100 | Adoption: ${e.adoptionLikelihood ?? 50}% | UX Score: ${e.overallUxScore ?? "N/A"}/100
Top pain points: ${painPoints || "None identified"}
Top positives: ${positives || "None identified"}
Adoption reasoning: ${safe(e.adoptionReasoning ?? "Not provided", 200)}`;
		})
		.join("\n\n");

	const personaNames = evaluations.map((e) => `${e.name} (${e.label})`);
	const p1 = evaluations[0];
	const p2 = evaluations[1] ?? evaluations[0];
	const p3 = evaluations[2] ?? evaluations[1] ?? evaluations[0];
	const minTurns = Math.max(evaluations.length * 4, 12);

	return `You are an expert UX research moderator facilitating a synthetic focus group for: ${safe(siteUrl, 2048)}

${evaluations.length} personas have independently evaluated this website.

PERSONA EVALUATIONS:
${personaSummaries}

FOCUS GROUP FORMAT (STRICT):
1. Moderator opens with a framing question about the most contentious finding
2. Persona 1 raises their primary concern (evidence-grounded)
3. Personas challenge each other, referencing by FIRST NAME
4. Moderator intervenes at least 3 times
5. Genuine consensus emerges naturally
6. Moderator closes with open questions and research gaps
TOTAL TURNS: At least ${minTurns}.

MANDATORY RULES:
1. Personas MUST reference each other by first name.
2. Authentic voices: student=casual, developer=technical, PM=business outcomes.
3. Genuine disagreement between personas with differing sentiments.
4. Moderator surfaces underlying tensions.
5. Evidence-grounded discussion referencing friction scores, pain points, adoption rates.

Generate ONLY valid JSON:
{
  "moderatorSummary": "3-4 sentence synthesis",
  "discussion": [
    { "speaker": "Moderator", "statement": "framing question", "referencesPersona": null, "turnType": "moderator" },
    { "speaker": "${personaNames[0] ?? "Alex Chen (Student)"}", "statement": "opening observation", "referencesPersona": null, "turnType": "opening" },
    { "speaker": "Moderator", "statement": "follow-up question", "referencesPersona": null, "turnType": "moderator" },
    { "speaker": "${personaNames[1] ?? "Priya Sharma (Developer)"}", "statement": "response referencing ${p1?.name ?? "Alex"} by name", "referencesPersona": "${p1?.name ?? "Alex"}", "turnType": "challenge" }
  ],
  "consensus": ["specific point of agreement", "another point"],
  "openQuestions": ["unresolved tension as research question", "another gap"],
  "researchGaps": ["area not assessable due to limited crawl coverage", "another gap"],
  "conflicts": {
    "items": [{ "topic": "", "personasAgree": [], "personasDisagree": [], "reason": "", "segmentExplanation": "" }]
  },
  "personaAgreementMatrix": { "${evaluations[0]?.name ?? "Alex"}": { "${evaluations[1]?.name ?? "Priya"}": "agree|disagree|neutral" } },
  "summary": "1-2 sentence top-line summary for executive dashboard"
}`;
}

async function runWithGroq(
	groq: Groq,
	model: string,
	prompt: string,
	maxRetries: number,
	baseDelayMs: number,
): Promise<FocusGroupResult> {
	for (let i = 0; i <= maxRetries; i++) {
		try {
			const completion = await groq.chat.completions.create({
				model,
				messages: [{ role: "user", content: prompt }],
				temperature: 0.62,
				max_tokens: 4500,
				response_format: { type: "json_object" },
			});
			const raw = completion.choices[0].message.content ?? "{}";
			const parsed = JSON.parse(cleanJson(raw)) as FocusGroupResult;
			if (!parsed.summary && parsed.moderatorSummary)
				parsed.summary = parsed.moderatorSummary;
			return parsed;
		} catch (err) {
			const msg = (err as Error).message.toLowerCase();
			const isRateLimit = msg.includes("429") || msg.includes("rate_limit");
			const delay = Math.min(
				(isRateLimit ? baseDelayMs * 4 : baseDelayMs) * Math.pow(2, i),
				30_000,
			);
			if (i < maxRetries) {
				console.warn(
					`[FocusGroupService] Groq attempt ${i + 1} failed, retry in ${delay}ms`,
				);
				await sleep(delay);
			}
		}
	}
	throw new Error("Groq exhausted all retries for focus group");
}

async function runWithOpenRouter(
	apiKey: string,
	model: string,
	prompt: string,
	maxRetries: number,
	baseDelayMs: number,
	timeoutMs: number,
): Promise<FocusGroupResult> {
	for (let i = 0; i <= maxRetries; i++) {
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
				}),
				signal: controller.signal,
			});
			clearTimeout(timer);
			if (!res.ok)
				throw new Error(
					`OpenRouter ${res.status}: ${(await res.text()).slice(0, 200)}`,
				);
			const data = (await res.json()) as {
				choices: Array<{ message: { content: string } }>;
			};
			const parsed = JSON.parse(
				cleanJson(data.choices[0]?.message?.content ?? "{}"),
			) as FocusGroupResult;
			if (!parsed.summary && parsed.moderatorSummary)
				parsed.summary = parsed.moderatorSummary;
			return parsed;
		} catch (err) {
			clearTimeout(timer);
			const msg = (err as Error).message.toLowerCase();
			const isRateLimit = msg.includes("429") || msg.includes("rate_limit");
			const delay = Math.min(
				(isRateLimit ? baseDelayMs * 4 : baseDelayMs) * Math.pow(2, i),
				30_000,
			);
			if (i < maxRetries) {
				console.warn(
					`[FocusGroupService] OpenRouter attempt ${i + 1} failed, retry in ${delay}ms`,
				);
				await sleep(delay);
			}
		}
	}
	throw new Error("OpenRouter exhausted all retries for focus group");
}

const FALLBACK_RESULT: FocusGroupResult = {
	summary:
		"Focus group synthesis was unavailable due to a temporary service outage. Individual persona evaluations above contain full findings.",
	moderatorSummary:
		"The focus group session could not be completed due to a service error. Please refer to individual persona evaluations.",
	discussion: [],
	consensus: [],
	openQuestions: [],
	researchGaps: [],
	conflicts: { items: [] },
};

/**
 * Runs the focus group synthesis.
 * - Tries Groq first with full retry + rate-limit handling.
 * - Falls back to OpenRouter with retry.
 * - Never throws — returns a graceful fallback instead.
 */
export async function runFocusGroup(
	evaluations: PersonaEvaluationWithLabel[],
	siteUrl: string,
): Promise<FocusGroupResult> {
	const cfg = getAIConfig();
	const groq = new Groq({ apiKey: process.env.GROQ_API_KEY! });
	const primaryCfg = cfg.text.providers[cfg.text.primary];
	const fallbackCfg = cfg.text.fallback
		? cfg.text.providers[cfg.text.fallback]
		: null;
	const prompt = buildFocusGroupPrompt(evaluations, siteUrl);

	try {
		return await runWithGroq(
			groq,
			primaryCfg.model,
			prompt,
			primaryCfg.maxRetries,
			primaryCfg.baseDelayMs,
		);
	} catch (groqErr) {
		console.error(
			"[FocusGroupService] Groq failed:",
			(groqErr as Error).message,
		);
	}

	if (fallbackCfg && process.env.OPENROUTER_API_KEY) {
		try {
			return await runWithOpenRouter(
				process.env.OPENROUTER_API_KEY,
				fallbackCfg.model,
				prompt,
				fallbackCfg.maxRetries,
				fallbackCfg.baseDelayMs,
				fallbackCfg.timeoutMs,
			);
		} catch (orErr) {
			console.error(
				"[FocusGroupService] OpenRouter fallback failed:",
				(orErr as Error).message,
			);
		}
	}

	return { ...FALLBACK_RESULT };
}
