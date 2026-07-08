// lib/services/vision/providers/gemini.provider.ts
import {
	GoogleGenerativeAI,
	HarmCategory,
	HarmBlockThreshold,
} from "@google/generative-ai";
import type { VisionProvider } from "../types";
import type { VisionAnalysis } from "../../../types";

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

export class GeminiVisionProvider implements VisionProvider {
	readonly name = "gemini";
	private readonly client: GoogleGenerativeAI;
	private readonly model: string;

	constructor(apiKey: string, model: string) {
		this.client = new GoogleGenerativeAI(apiKey);
		this.model = model;
	}

	async analyzeScreenshot(
		imageData: string,
		mimeType: string,
		pageTitle: string,
		prompt: string,
	): Promise<VisionAnalysis> {
		const genModel = this.client.getGenerativeModel({
			model: this.model,
			safetySettings: SAFETY_SETTINGS,
		});

		const response = await genModel.generateContent([
			`Page title: "${pageTitle.slice(0, 200)}"\n\n${prompt}`,
			{ inlineData: { mimeType, data: imageData } },
		]);

		const text = response.response.text();
		const match = text.match(/\{[\s\S]*\}/);
		if (!match) {
			throw new Error(`GeminiVision returned non-JSON: ${text.slice(0, 200)}`);
		}
		return JSON.parse(match[0]) as VisionAnalysis;
	}
}
