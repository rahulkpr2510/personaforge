// lib/services/vision/types.ts
import type { VisionAnalysis } from "../../types";

export interface VisionProvider {
	readonly name: string;
	analyzeScreenshot(
		imageData: string, // base64 encoded image bytes
		mimeType: string,
		pageTitle: string,
		prompt: string,
	): Promise<VisionAnalysis>;
}

export interface VisionCacheEntry {
	result: VisionAnalysis;
	fetchedAt: number;
}
