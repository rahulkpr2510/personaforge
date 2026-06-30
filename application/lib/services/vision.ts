import {
  GoogleGenerativeAI,
  HarmCategory,
  HarmBlockThreshold,
} from "@google/generative-ai";
import type { VisionAnalysis } from "../types";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);

const SAFETY_SETTINGS = [
  {
    category: HarmCategory.HARM_CATEGORY_HARASSMENT,
    threshold: HarmBlockThreshold.BLOCK_NONE,
  },
  {
    category: HarmCategory.HARM_CATEGORY_HATE_SPEECH,
    threshold: HarmBlockThreshold.BLOCK_NONE,
  },
];

const VISION_PROMPT = `You are a senior UX analyst. Analyze this webpage screenshot.

Return a JSON object with EXACTLY these fields — no extra fields, no markdown:
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

async function fetchImageAsBase64(url: string): Promise<string> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 12_000);

  try {
    const response = await fetch(url, { signal: controller.signal });
    if (!response.ok) throw new Error(`Image fetch failed: ${response.status}`);
    const buffer = await response.arrayBuffer();
    return Buffer.from(buffer).toString("base64");
  } finally {
    clearTimeout(timeout);
  }
}

export async function analyzeScreenshot(
  screenshotUrl: string,
  pageTitle: string,
): Promise<VisionAnalysis> {
  const model = genAI.getGenerativeModel({
    model: "gemini-2.0-flash",
    safetySettings: SAFETY_SETTINGS,
  });

  const imageData = await fetchImageAsBase64(screenshotUrl);

  const response = await model.generateContent([
    `Page title: "${pageTitle.slice(0, 200)}"\n\n${VISION_PROMPT}`,
    { inlineData: { mimeType: "image/png", data: imageData } },
  ]);

  const text = response.response.text();
  const jsonMatch = text.match(/\{[\s\S]*\}/);
  if (!jsonMatch) {
    throw new Error(`Gemini Vision returned non-JSON: ${text.slice(0, 200)}`);
  }

  return JSON.parse(jsonMatch[0]) as VisionAnalysis;
}
