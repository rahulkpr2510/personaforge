import Groq from "groq-sdk";
import type { PersonaEvaluation, PersonaContext } from "../types";

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY! });

const MASTER_PROMPT = `You are simulating a UX evaluation by a specific user persona. Stay fully in character.

PERSONA:
Name: {name} | Age: {age} | Occupation: {occupation}
Technical Literacy: {technicalLevel}
Goals: {goals}
Frustrations: {frustrations}

WEBSITE EVIDENCE:
URL: {url}
Pages Crawled: {pageCount}
Total Forms: {formsCount} | Total Buttons: {buttonsCount} | Nav Depth: {navDepth}
Vision Summary: {visionSummary}
Page Content Sample: {contentSample}

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

export async function evaluatePersona(
  persona: PersonaContext,
  siteContext: Record<string, unknown>,
): Promise<PersonaEvaluation> {
  const prompt = MASTER_PROMPT.replace("{name}", persona.name)
    .replace("{age}", String(persona.age))
    .replace("{occupation}", persona.occupation)
    .replace("{technicalLevel}", persona.technicalLevel)
    .replace("{goals}", persona.goals)
    .replace("{frustrations}", persona.frustrations)
    .replace("{url}", String(siteContext.url))
    .replace("{pageCount}", String(siteContext.pageCount))
    .replace("{formsCount}", String(siteContext.formsCount))
    .replace("{buttonsCount}", String(siteContext.buttonsCount))
    .replace("{navDepth}", String(siteContext.navDepth))
    .replace("{visionSummary}", String(siteContext.visionSummary))
    .replace(
      "{contentSample}",
      String(siteContext.contentSample).slice(0, 1500),
    );

  try {
    const completion = await groq.chat.completions.create({
      model: "llama-3.3-70b-versatile",
      messages: [{ role: "user", content: prompt }],
      temperature: 0.7,
      max_tokens: 2000,
      response_format: { type: "json_object" },
    });

    const raw = completion.choices[0].message.content ?? "{}";
    return JSON.parse(raw) as PersonaEvaluation;
  } catch (err) {
    console.error(
      "[persona-engine] Groq failed, trying OpenRouter fallback:",
      err,
    );
    return evaluatePersonaFallback(prompt);
  }
}

async function evaluatePersonaFallback(
  prompt: string,
): Promise<PersonaEvaluation> {
  // OpenRouter fallback using OpenAI-compatible API
  const response = await fetch(
    "https://openrouter.ai/api/v1/chat/completions",
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${process.env.OPENROUTER_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "meta-llama/llama-3.3-70b-instruct",
        messages: [{ role: "user", content: prompt }],
        response_format: { type: "json_object" },
      }),
    },
  );
  const data = (await response.json()) as {
    choices: Array<{ message: { content: string } }>;
  };
  return JSON.parse(data.choices[0].message.content) as PersonaEvaluation;
}

export async function runParallelEvaluations(
  personas: PersonaContext[],
  siteContext: Record<string, unknown>,
): Promise<PersonaEvaluation[]> {
  return Promise.all(personas.map((p) => evaluatePersona(p, siteContext)));
}
