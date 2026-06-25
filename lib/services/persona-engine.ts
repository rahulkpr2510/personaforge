import Groq from "groq-sdk";
import type { PersonaEvaluation, PersonaContext } from "../types";

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY! });

/**
 * Builds the master prompt by replacing placeholders.
 * Template values are stripped of backtick/brace injection chars before insertion.
 */
function buildPrompt(
  persona: PersonaContext,
  siteContext: Record<string, unknown>,
): string {
  const safe = (v: unknown, max = 500) =>
    String(v)
      .replace(/[`{}\\]/g, "")
      .slice(0, max);

  return `You are simulating a UX evaluation by a specific user persona. Stay fully in character.

PERSONA:
Name: ${safe(persona.name, 80)} | Age: ${safe(persona.age, 3)} | Occupation: ${safe(persona.occupation, 100)}
Technical Literacy: ${safe(persona.technicalLevel, 10)}
Goals: ${safe(persona.goals, 500)}
Frustrations: ${safe(persona.frustrations, 500)}

WEBSITE EVIDENCE:
URL: ${safe(siteContext.url, 2048)}
Pages Crawled: ${safe(siteContext.pageCount, 3)}
Total Forms: ${safe(siteContext.formsCount, 5)} | Total Buttons: ${safe(siteContext.buttonsCount, 5)} | Nav Depth: ${safe(siteContext.navDepth, 3)}
Vision Summary: ${safe(siteContext.visionSummary, 800)}
Page Content Sample: ${safe(siteContext.contentSample, 1500)}

Evaluate this website from YOUR persona's perspective. Respond with a JSON object:
{
  "firstImpressions": "string - immediate gut reaction, 2-3 sentences",
  "positives": ["array of specific positive findings with evidence"],
  "painPoints": ["array of specific pain points with evidence"],
  "recommendations": ["array of concrete, actionable suggestions"],
  "accessibilityNotes": "string - observations specific to your profile",
  "adoptionLikelihood": number (0-100),
  "sentiment": "POSITIVE|NEUTRAL|NEGATIVE",
  "frictionScore": number (0-100),
  "evidence": [
    {
      "issue": "string",
      "confidence": number (0-100),
      "reason": "string",
      "support": { "metric": "value" }
    }
  ]
}

Base EVERY finding on specific evidence from the website data. Avoid generic opinions.`;
}

const FALLBACK_EVALUATION: PersonaEvaluation = {
  sentiment: "NEUTRAL",
  frictionScore: 50,
  adoptionLikelihood: 50,
  firstImpressions:
    "Evaluation unavailable for this persona due to a service error.",
  positives: [],
  painPoints: [],
  recommendations: [],
  evidence: [],
};

export async function evaluatePersona(
  persona: PersonaContext,
  siteContext: Record<string, unknown>,
): Promise<PersonaEvaluation> {
  const prompt = buildPrompt(persona, siteContext);

  // Primary: Groq
  try {
    const completion = await groq.chat.completions.create({
      model: "llama-3.3-70b-versatile",
      messages: [{ role: "user", content: prompt }],
      temperature: 0.7,
      max_tokens: 2000,
      response_format: { type: "json_object" },
    });

    const raw = completion.choices[0].message.content ?? "{}";
    const parsed = JSON.parse(raw) as PersonaEvaluation;
    // Clamp numeric fields so bad model output doesn't corrupt DB
    if (parsed.frictionScore != null)
      parsed.frictionScore = Math.min(100, Math.max(0, parsed.frictionScore));
    if (parsed.adoptionLikelihood != null)
      parsed.adoptionLikelihood = Math.min(
        100,
        Math.max(0, parsed.adoptionLikelihood),
      );
    return parsed;
  } catch (groqErr) {
    console.error("[persona-engine] Groq failed:", (groqErr as Error).message);
  }

  // Fallback: OpenRouter
  if (!process.env.OPENROUTER_API_KEY) {
    console.warn("[persona-engine] No OPENROUTER_API_KEY — returning fallback");
    return FALLBACK_EVALUATION;
  }

  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 30_000);

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

    clearTimeout(timeout);

    if (!response.ok) throw new Error(`OpenRouter ${response.status}`);

    const data = (await response.json()) as {
      choices: Array<{ message: { content: string } }>;
    };
    return JSON.parse(data.choices[0].message.content) as PersonaEvaluation;
  } catch (orErr) {
    console.error(
      "[persona-engine] OpenRouter fallback also failed:",
      (orErr as Error).message,
    );
    return FALLBACK_EVALUATION;
  }
}

/**
 * Runs all persona evaluations in parallel.
 * Uses allSettled so one failure never kills the entire analysis.
 */
export async function runParallelEvaluations(
  personas: PersonaContext[],
  siteContext: Record<string, unknown>,
): Promise<PersonaEvaluation[]> {
  const results = await Promise.allSettled(
    personas.map((p) => evaluatePersona(p, siteContext)),
  );

  return results.map((r, i) => {
    if (r.status === "fulfilled") return r.value;
    console.error(
      `[persona-engine] Persona "${personas[i].label}" failed:`,
      r.reason,
    );
    return { ...FALLBACK_EVALUATION };
  });
}
