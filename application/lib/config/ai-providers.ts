// lib/config/ai-providers.ts
// Central configuration for all AI providers.
// Switching providers requires ONLY changes here — never in business logic.

export type VisionProviderName = "gemini" | "openrouter";
export type TextProviderName = "groq" | "openrouter";

export interface VisionProviderConfig {
	name: VisionProviderName;
	enabled: boolean;
	model: string;
	timeoutMs: number;
	maxRetries: number;
	baseDelayMs: number;
}

export interface TextProviderConfig {
	name: TextProviderName;
	enabled: boolean;
	model: string;
	timeoutMs: number;
	maxRetries: number;
	baseDelayMs: number;
	maxTokens: number;
	temperature: number;
}

export interface AIProviderConfig {
	vision: {
		primary: VisionProviderName;
		fallback: VisionProviderName | null;
		providers: Record<VisionProviderName, VisionProviderConfig>;
	};
	text: {
		primary: TextProviderName;
		fallback: TextProviderName | null;
		providers: Record<TextProviderName, TextProviderConfig>;
	};
	pipeline: {
		personaDelayMs: number; // delay between sequential persona calls
		retryBaseDelayMs: number; // base for exponential backoff
		retryMaxDelayMs: number; // cap on exponential backoff
		rateLimitDelayMs: number; // delay added when 429 is received
	};
	vision_optimization: {
		// Page types that warrant expensive vision analysis
		priorityPageTypes: string[];
		// Max number of pages to run vision on per analysis
		maxVisionPages: number;
	};
}

const config: AIProviderConfig = {
	vision: {
		primary:
			(process.env.VISION_PROVIDER_PRIMARY as VisionProviderName) ?? "gemini",
		fallback:
			(process.env.VISION_PROVIDER_FALLBACK as VisionProviderName) ??
			"openrouter",
		providers: {
			gemini: {
				name: "gemini",
				enabled: Boolean(process.env.GEMINI_API_KEY),
				model: process.env.GEMINI_VISION_MODEL ?? "gemini-2.0-flash",
				timeoutMs: 20_000,
				maxRetries: 3,
				baseDelayMs: 1_000,
			},
			openrouter: {
				name: "openrouter",
				enabled: Boolean(process.env.OPENROUTER_API_KEY),
				model:
					process.env.OPENROUTER_VISION_MODEL ?? "google/gemini-2.0-flash-001",
				timeoutMs: 30_000,
				maxRetries: 2,
				baseDelayMs: 2_000,
			},
		},
	},
	text: {
		primary: (process.env.TEXT_PROVIDER_PRIMARY as TextProviderName) ?? "groq",
		fallback:
			(process.env.TEXT_PROVIDER_FALLBACK as TextProviderName) ?? "openrouter",
		providers: {
			groq: {
				name: "groq",
				enabled: Boolean(process.env.GROQ_API_KEY),
				model: process.env.GROQ_MODEL ?? "llama-3.3-70b-versatile",
				timeoutMs: 60_000,
				maxRetries: 3,
				baseDelayMs: 1_000,
				maxTokens: 4500,
				temperature: 0.65,
			},
			openrouter: {
				name: "openrouter",
				enabled: Boolean(process.env.OPENROUTER_API_KEY),
				model:
					process.env.OPENROUTER_TEXT_MODEL ??
					"meta-llama/llama-3.3-70b-instruct",
				timeoutMs: 60_000,
				maxRetries: 2,
				baseDelayMs: 2_000,
				maxTokens: 4500,
				temperature: 0.65,
			},
		},
	},
	pipeline: {
		personaDelayMs: Number(process.env.PIPELINE_PERSONA_DELAY_MS) || 500,
		retryBaseDelayMs: 1_000,
		retryMaxDelayMs: 30_000,
		rateLimitDelayMs: Number(process.env.PIPELINE_RATE_LIMIT_DELAY_MS) || 8_000,
	},
	vision_optimization: {
		priorityPageTypes: [
			"HOME",
			"PRICING",
			"LOGIN",
			"CHECKOUT",
			"DASHBOARD",
			"PRODUCT",
			"SIGNUP",
			"FORM",
		],
		maxVisionPages: Number(process.env.VISION_MAX_PAGES) || 6,
	},
};

export function getAIConfig(): AIProviderConfig {
	return config;
}
