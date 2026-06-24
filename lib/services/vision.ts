import { GoogleGenerativeAI } from "@google/generative-ai";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);

export type VisionAnalysis = {
  uiStructure: string;
  layoutHierarchy: string;
  visualComplexity: "low" | "medium" | "high";
  formComplexity: "simple" | "moderate" | "complex";
  accessibilityObservations: string[];
  navigationPatterns: string;
  interfaceElements: string[];
  primaryPurpose: string;
};

export async function analyzeScreenshot(
  screenshotUrl: string,
  pageTitle: string,
): Promise<VisionAnalysis> {
  const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

  const prompt = `You are a senior UX analyst. Analyze this webpage screenshot for the page titled "${pageTitle}".

Return a JSON object with EXACTLY these fields:
{
  "uiStructure": "description of the overall UI layout and structure",
  "layoutHierarchy": "visual hierarchy description: hero/navigation/content/footer",
  "visualComplexity": "low|medium|high",
  "formComplexity": "simple|moderate|complex",
  "accessibilityObservations": ["array", "of", "accessibility", "notes"],
  "navigationPatterns": "description of navigation approach",
  "interfaceElements": ["list", "of", "key", "UI", "elements"],
  "primaryPurpose": "what is the main purpose/CTA of this page"
}

Be specific and evidence-based. Return only valid JSON.`;

  const response = await model.generateContent([
    prompt,
    {
      inlineData: {
        mimeType: "image/png",
        data: await urlToBase64(screenshotUrl),
      },
    },
  ]);

  const text = response.response.text();
  const jsonMatch = text.match(/\{[\s\S]*\}/);
  if (!jsonMatch) throw new Error("Gemini Vision returned invalid JSON");
  return JSON.parse(jsonMatch[0]) as VisionAnalysis;
}

async function urlToBase64(url: string): Promise<string> {
  const response = await fetch(url);
  const buffer = await response.arrayBuffer();
  return Buffer.from(buffer).toString("base64");
}
