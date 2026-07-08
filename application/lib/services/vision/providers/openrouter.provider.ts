// lib/services/vision/providers/openrouter.provider.ts
import type { VisionProvider } from "../types";
import type { VisionAnalysis } from "../../../types";

export class OpenRouterVisionProvider implements VisionProvider {
	readonly name = "openrouter";
	private readonly apiKey: string;
	private readonly model: string;
	private readonly timeoutMs: number;

	constructor(apiKey: string, model: string, timeoutMs = 30_000) {
		this.apiKey = apiKey;
		this.model = model;
		this.timeoutMs = timeoutMs;
	}

	async analyzeScreenshot(
		imageData: string,
		mimeType: string,
		pageTitle: string,
		prompt: string,
	): Promise<VisionAnalysis> {
		const controller = new AbortController();
		const timer = setTimeout(() => controller.abort(), this.timeoutMs);

		try {
			const res = await fetch("https://openrouter.ai/api/v1/chat/completions", {
				method: "POST",
				headers: {
					Authorization: `Bearer ${this.apiKey}`,
					"Content-Type": "application/json",
					"HTTP-Referer": "https://personaforge.vercel.app",
					"X-Title": "PersonaForge",
				},
				body: JSON.stringify({
					model: this.model,
					messages: [
						{
							role: "user",
							content: [
								{
									type: "text",
									text: `Page title: "${pageTitle.slice(0, 200)}"\n\n${prompt}`,
								},
								{
									type: "image_url",
									image_url: { url: `data:${mimeType};base64,${imageData}` },
								},
							],
						},
					],
				}),
				signal: controller.signal,
			});

			if (!res.ok) {
				const body = await res.text();
				throw new Error(
					`OpenRouterVision ${res.status}: ${body.slice(0, 200)}`,
				);
			}

			const data = (await res.json()) as {
				choices: Array<{ message: { content: string } }>;
			};
			const text = data.choices[0]?.message?.content ?? "";
			const match = text.match(/\{[\s\S]*\}/);
			if (!match) {
				throw new Error(
					`OpenRouterVision returned non-JSON: ${text.slice(0, 200)}`,
				);
			}
			return JSON.parse(match[0]) as VisionAnalysis;
		} finally {
			clearTimeout(timer);
		}
	}
}
