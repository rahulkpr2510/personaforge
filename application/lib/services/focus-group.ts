import Groq from "groq-sdk";
import type {
  FocusGroupResult,
  PersonaEvaluationWithLabel,
  StructuredPainPoint,
  StructuredPositive,
} from "../types";

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY! });

// ─── Prompt ──────────────────────────────────────────────────────────────────

function buildFocusGroupPrompt(
  evaluations: PersonaEvaluationWithLabel[],
  siteUrl: string,
): string {
  const safe = (v: unknown, max = 2000) =>
    String(v ?? "")
      .replace(/[`{}\\]/g, "")
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

${evaluations.length} personas have independently evaluated this website. Synthesize their views into a MODERATED DEBATE — not sequential monologues.

PERSONA EVALUATIONS:
${personaSummaries}

══════════════════════════════════════════════════════════════════
FOCUS GROUP FORMAT (STRICT — follow this sequence)
══════════════════════════════════════════════════════════════════

The discussion MUST follow this moderated debate structure:
1. Moderator opens with a framing question about the most contentious finding
2. Persona 1 raises their primary concern (evidence-grounded)
3. Persona 2 partially agrees OR challenges a specific point Persona 1 made
4. Persona 3 challenges an assumption made by the previous speaker
5. Moderator intervenes with a follow-up question that surfaces disagreement
6. Further back-and-forth — personas reference each other by FIRST NAME
7. A moment of genuine consensus emerges naturally
8. Moderator closes with open questions and research gaps

TOTAL TURNS: At least ${minTurns} turns. At least 3 moderator interventions.

══════════════════════════════════════════════════════════════════
MANDATORY RULES
══════════════════════════════════════════════════════════════════

1. CROSS-REFERENCING IS MANDATORY: Personas MUST reference each other by first name.
   ✓ "I see what ${p1?.name ?? "Alex"} means about navigation, but my bigger concern is..."
   ✓ "I actually disagree with ${p2?.name ?? "Priya"} here — for me..."
   ✓ "Building on ${p3?.name ?? "David"}'s point about trust..."
   ✗ Never write isolated monologues that don't engage with other personas

2. AUTHENTIC VOICES: Each persona must speak in character.
   - A student uses casual, relatable language ("I'd just bounce", "this is confusing")
   - A developer mentions technical concerns ("rendering", "ARIA", "performance budget")
   - A PM speaks about business outcomes ("activation", "trust", "conversion risk")
   Make the voices DISTINCTLY different.

3. GENUINE DISAGREEMENT: Personas with different sentiments MUST conflict on specific points.
   Do not manufacture fake consensus. Do not avoid hard disagreements.

4. MODERATOR INTERVENTIONS: The moderator must:
   - Ask follow-up questions that draw out specific insights
   - Surface underlying disagreements when they're avoided
   - Summarize tensions accurately before asking for resolution
   Style: professional, neutral, slightly formal. "That's an interesting tension — ${p2?.name ?? "Priya"}, you mentioned X, but ${p1?.name ?? "Alex"} raised Y. Can you speak to that?"

5. EVIDENCE-GROUNDED: Discussion should reference specific observations from evaluations
   (friction scores, pain point details, adoption rates).

6. RESEARCH GAPS: At the end, identify 2-3 areas that could NOT be assessed due to
   limited crawl coverage (e.g., "Whether the checkout flow is as confusing as the landing
   page was not tested, as only ${evaluations.length > 0 ? "limited" : "no"} pages were crawled").

7. TURNTYPE: Assign one of these to each turn:
   "opening" (first statement), "challenge" (disagrees), "agreement" (agrees),
   "partial_agreement" (partially agrees), "moderator" (moderator speaks), "conclusion" (wraps up)

Generate ONLY valid JSON with this exact structure:
{
  "moderatorSummary": "3-4 sentence synthesis of what the group collectively found — key tensions, shared frustrations, and where opinions diverged",
  "discussion": [
    { "speaker": "Moderator", "statement": "framing question about the most contested finding", "referencesPersona": null, "turnType": "moderator" },
    { "speaker": "${personaNames[0] ?? "Alex Chen (Student)"}", "statement": "opening observation in authentic voice, citing specific evidence", "referencesPersona": null, "turnType": "opening" },
    { "speaker": "Moderator", "statement": "follow-up question that draws out disagreement", "referencesPersona": null, "turnType": "moderator" },
    { "speaker": "${personaNames[1] ?? "Priya Sharma (Developer)"}", "statement": "response that references ${p1?.name ?? "Alex"} by name and challenges or builds on their point", "referencesPersona": "${p1?.name ?? "Alex"}", "turnType": "challenge" }
  ],
  "consensus": [
    "specific point that all or most personas agreed on, with evidence basis",
    "another point of agreement"
  ],
  "openQuestions": [
    "unresolved tension that the group did not resolve — phrased as a research question",
    "another open question"
  ],
  "researchGaps": [
    "area that could not be assessed due to limited crawl coverage",
    "another gap"
  ],
  "conflicts": {
    "items": [
      {
        "topic": "specific area of genuine disagreement",
        "personasAgree": ["names of personas with positive view"],
        "personasDisagree": ["names of personas with negative view"],
        "reason": "evidence-based explanation of why they disagree",
        "segmentExplanation": "what demographic or psychographic factor drives this difference"
      }
    ]
  },
  "personaAgreementMatrix": {
    "${evaluations[0]?.name ?? "Alex"}": {
      "${evaluations[1]?.name ?? "Priya"}": "agree|disagree|neutral"
    }
  },
  "summary": "1-2 sentence top-line summary for an executive dashboard"
}

Only report genuine conflicts supported by data. Do not manufacture conflicts where personas actually agree. Do not fabricate consensus where genuine disagreement exists.`;
}

// ─── Runners ─────────────────────────────────────────────────────────────────

function cleanJsonString(raw: string): string {
  let cleaned = raw.trim();
  if (cleaned.startsWith("```json")) cleaned = cleaned.replace(/^```json\n?/, "");
  else if (cleaned.startsWith("```")) cleaned = cleaned.replace(/^```\n?/, "");
  if (cleaned.endsWith("```")) cleaned = cleaned.replace(/\n?```$/, "");
  return cleaned.trim();
}

async function runWithGroq(prompt: string): Promise<FocusGroupResult> {
  const completion = await groq.chat.completions.create({
    model: "llama-3.3-70b-versatile",
    messages: [{ role: "user", content: prompt }],
    temperature: 0.62,
    max_tokens: 4500,
    response_format: { type: "json_object" },
  });

  const raw = completion.choices[0].message.content ?? "{}";
  const parsed = JSON.parse(cleanJsonString(raw)) as FocusGroupResult;

  if (!parsed.summary && parsed.moderatorSummary) {
    parsed.summary = parsed.moderatorSummary;
  }

  return parsed;
}

async function runWithOpenRouter(prompt: string): Promise<FocusGroupResult> {
  if (!process.env.OPENROUTER_API_KEY) {
    throw new Error("OPENROUTER_API_KEY not configured");
  }

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 60_000);

  try {
    const response = await fetch(
      "https://openrouter.ai/api/v1/chat/completions",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${process.env.OPENROUTER_API_KEY}`,
          "Content-Type": "application/json",
          "HTTP-Referer": "https://personaforge.vercel.app",
          "X-Title": "PersonaForge",
        },
        body: JSON.stringify({
          model: "meta-llama/llama-3.3-70b-instruct",
          messages: [{ role: "user", content: prompt }],
          response_format: { type: "json_object" },
        }),
        signal: controller.signal,
      },
    );

    if (!response.ok) throw new Error(`OpenRouter ${response.status}`);

    const data = (await response.json()) as {
      choices: Array<{ message: { content: string } }>;
    };
    const rawContent = data.choices[0].message.content;
    const parsed = JSON.parse(cleanJsonString(rawContent)) as FocusGroupResult;

    if (!parsed.summary && parsed.moderatorSummary) {
      parsed.summary = parsed.moderatorSummary;
    }

    return parsed;
  } finally {
    clearTimeout(timeout);
  }
}

// ─── Public API ──────────────────────────────────────────────────────────────

export async function runFocusGroup(
  evaluations: PersonaEvaluationWithLabel[],
  siteUrl: string,
): Promise<FocusGroupResult> {
  const prompt = buildFocusGroupPrompt(evaluations, siteUrl);

  try {
    return await runWithGroq(prompt);
  } catch (groqErr) {
    console.error("[focus-group] Groq failed:", (groqErr as Error).message);
  }

  try {
    return await runWithOpenRouter(prompt);
  } catch (orErr) {
    console.error(
      "[focus-group] OpenRouter fallback failed:",
      (orErr as Error).message,
    );
  }

  return {
    summary:
      "Focus group synthesis was unavailable due to a temporary service outage. Individual persona evaluations above contain full findings.",
    moderatorSummary:
      "The focus group session could not be completed due to a service error. Please refer to individual persona evaluations for detailed findings.",
    discussion: [],
    consensus: [],
    openQuestions: [],
    researchGaps: [],
    conflicts: { items: [] },
  };
}
