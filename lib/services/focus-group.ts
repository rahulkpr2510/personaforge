import Groq from "groq-sdk";
import type { FocusGroupResult, PersonaEvaluationWithLabel } from "../types";

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY! });

export async function runFocusGroup(
  evaluations: PersonaEvaluationWithLabel[],
  siteUrl: string,
): Promise<FocusGroupResult> {
  const summaries = evaluations
    .map(
      (e) =>
        `[${e.label} (${e.name}, ${e.age})]: Friction=${e.frictionScore}/100, Sentiment=${e.sentiment}. Pain points: ${e.painPoints?.slice(0, 2).join("; ")}. Positives: ${e.positives?.slice(0, 2).join("; ")}.`,
    )
    .join("\n\n");

  const prompt = `You are an AI focus group moderator analyzing UX feedback for: ${siteUrl}

PERSONA EVALUATIONS:
${summaries}

Synthesize this into a JSON focus group report:
{
  "summary": "2-3 paragraph narrative summary of key findings across personas",
  "conflicts": {
    "items": [
      {
        "topic": "area of disagreement",
        "personasAgree": ["list of personas who view it positively"],
        "personasDisagree": ["list of personas who view it negatively"],
        "reason": "explanation of why viewpoints differ",
        "segmentExplanation": "what demographic/psychographic factor drives this conflict"
      }
    ]
  }
}

Find REAL disagreements backed by the data. If personas unanimously agree on something, don't manufacture a conflict. Return only valid JSON.`;

  const completion = await groq.chat.completions.create({
    model: "llama-3.3-70b-versatile",
    messages: [{ role: "user", content: prompt }],
    temperature: 0.5,
    max_tokens: 2000,
    response_format: { type: "json_object" },
  });

  return JSON.parse(
    completion.choices[0].message.content ?? "{}",
  ) as FocusGroupResult;
}
