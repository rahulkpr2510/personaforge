import Groq from "groq-sdk";
import type { FocusGroupResult, PersonaEvaluationWithLabel } from "../types";

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY! });

function buildFocusGroupPrompt(
  evaluations: PersonaEvaluationWithLabel[],
  siteUrl: string,
): string {
  const safe = (v: unknown, max = 2000) =>
    String(v)
      .replace(/[`{}\\]/g, "")
      .slice(0, max);

  const summaries = evaluations
    .map(
      (e) =>
        `[${safe(e.label, 50)} (${safe(e.name, 80)}, age ${safe(e.age, 3)})]:\n` +
        `  Sentiment=${e.sentiment ?? "NEUTRAL"} | Friction=${e.frictionScore ?? 50}/100 | Adoption=${e.adoptionLikelihood ?? 50}/100\n` +
        `  Pain points: ${(e.painPoints ?? []).slice(0, 3).join("; ")}\n` +
        `  Positives: ${(e.positives ?? []).slice(0, 3).join("; ")}`,
    )
    .join("\n\n");

  return `You are an expert UX research moderator running a synthetic focus group for: ${safe(siteUrl, 2048)}

PERSONA EVALUATIONS:
${summaries}

Synthesize this into a structured focus group report as JSON:
{
  "summary": "3-4 paragraph narrative covering key consensus points, major friction themes, and audience segmentation observations",
  "conflicts": {
    "items": [
      {
        "topic": "specific area of disagreement",
        "personasAgree": ["names of personas with positive view"],
        "personasDisagree": ["names of personas with negative view"],
        "reason": "evidence-based explanation of the disagreement",
        "segmentExplanation": "what demographic or psychographic factor drives this difference"
      }
    ]
  }
}

Only report genuine conflicts supported by the data. If all personas agree on something, do not manufacture a conflict. Return only valid JSON.`;
}

async function runFocusGroupWithGroq(
  prompt: string,
): Promise<FocusGroupResult> {
  const completion = await groq.chat.completions.create({
    model: "llama-3.3-70b-versatile",
    messages: [{ role: "user", content: prompt }],
    temperature: 0.5,
    max_tokens: 2500,
    response_format: { type: "json_object" },
  });

  return JSON.parse(
    completion.choices[0].message.content ?? "{}",
  ) as FocusGroupResult;
}

async function runFocusGroupWithOpenRouter(
  prompt: string,
): Promise<FocusGroupResult> {
  if (!process.env.OPENROUTER_API_KEY) {
    throw new Error("OPENROUTER_API_KEY not configured");
  }

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 45_000);

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
    return JSON.parse(data.choices[0].message.content) as FocusGroupResult;
  } finally {
    clearTimeout(timeout);
  }
}

export async function runFocusGroup(
  evaluations: PersonaEvaluationWithLabel[],
  siteUrl: string,
): Promise<FocusGroupResult> {
  const prompt = buildFocusGroupPrompt(evaluations, siteUrl);

  try {
    return await runFocusGroupWithGroq(prompt);
  } catch (groqErr) {
    console.error("[focus-group] Groq failed:", (groqErr as Error).message);
  }

  try {
    return await runFocusGroupWithOpenRouter(prompt);
  } catch (orErr) {
    console.error(
      "[focus-group] OpenRouter fallback failed:",
      (orErr as Error).message,
    );
  }

  // Hard fallback — analysis should still complete
  return {
    summary:
      "Focus group synthesis was unavailable due to a temporary service outage. Individual persona evaluations above contain full findings.",
    conflicts: { items: [] },
  };
}
