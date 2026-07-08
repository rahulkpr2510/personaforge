// lib/api/errors.ts

export interface ApiError {
	code: string;
	message: string;
	technicalReason: string;
	fieldErrors?: Record<string, string[]>;
}

export const ApiErrors = {
	unauthorized: (): ApiError => ({
		code: "UNAUTHORIZED",
		message: "Authentication required.",
		technicalReason: "Missing or invalid x-internal-api-key header.",
	}),
	invalidJson: (): ApiError => ({
		code: "INVALID_JSON",
		message: "Request body could not be parsed.",
		technicalReason: "Body is not valid JSON.",
	}),
	validationFailed: (fieldErrors: Record<string, string[]>): ApiError => ({
		code: "VALIDATION_FAILED",
		message: "Request payload validation failed.",
		technicalReason: "One or more fields did not pass schema validation.",
		fieldErrors,
	}),
	analysisNotFound: (): ApiError => ({
		code: "ANALYSIS_NOT_FOUND",
		message: "Analysis not found.",
		technicalReason: "No analysis record exists for the provided ID.",
	}),
	cannotCancel: (status: string): ApiError => ({
		code: "INVALID_STATUS_TRANSITION",
		message: `Cannot process an analysis with status "${status}".`,
		technicalReason: `Analysis is in terminal state: ${status}.`,
	}),
	rateLimitExceeded: (retryAfterMs: number): ApiError => ({
		code: "RATE_LIMIT_EXCEEDED",
		message: "Too many requests. Please slow down.",
		technicalReason: `Rate limit exceeded. Retry after ${retryAfterMs}ms.`,
	}),
	internalError: (reason: string): ApiError => ({
		code: "INTERNAL_ERROR",
		message: "An unexpected error occurred.",
		technicalReason: reason.slice(0, 300),
	}),
	serviceUnavailable: (): ApiError => ({
		code: "SERVICE_UNAVAILABLE",
		message: "The AI analysis service is temporarily unavailable. Please try again shortly.",
		technicalReason: "All configured AI providers failed to respond.",
	}),
	cannotDeleteRunning: (): ApiError => ({
		code: "CANNOT_DELETE_RUNNING",
		message: "Cannot delete an analysis that is currently running.",
		technicalReason: "Analysis is in CRAWLING or ANALYZING state and cannot be deleted.",
	}),
	personaNotFound: (): ApiError => ({
		code: "PERSONA_NOT_FOUND",
		message: "Persona not found.",
		technicalReason: "No persona record exists for the provided ID.",
	}),
	personaLimitReached: (): ApiError => ({
		code: "PERSONA_LIMIT_REACHED",
		message: "You have reached the maximum number of personas allowed.",
		technicalReason: "Persona creation limit exceeded for this account.",
	}),
	invalidUrl: (): ApiError => ({
		code: "INVALID_URL",
		message: "The provided URL is not valid or not reachable.",
		technicalReason: "URL failed validation or reachability check.",
	}),
};

/**
 * Safely extracts a human-readable message from any thrown value.
 * Handles: Error instances, objects with a `message` property (e.g. SDK errors),
 * and falls back to String() only as a last resort to avoid "[object Object]".
 */
function extractMessage(err: unknown): string {
	if (err instanceof Error) return err.message.slice(0, 300);
	if (
		err !== null &&
		typeof err === "object" &&
		"message" in err &&
		typeof (err as Record<string, unknown>).message === "string"
	) {
		return ((err as Record<string, unknown>).message as string).slice(0, 300);
	}
	return String(err).slice(0, 300);
}

export function classifyError(err: unknown): ApiError {
	const msg = extractMessage(err);

	// auth.ts throws Error("Unauthorized") with .code = "UNAUTHORIZED" set on the object.
	// Must be checked first so routes correctly return 401, not 500.
	const code =
		err !== null && typeof err === "object" && "code" in err
			? (err as Record<string, unknown>).code
			: undefined;
	if (
		code === "UNAUTHORIZED" ||
		msg.toLowerCase() === "unauthorized" ||
		msg.toLowerCase().startsWith("unauthorized")
	) {
		return {
			code: "UNAUTHORIZED",
			message: "Authentication required.",
			technicalReason: msg,
		};
	}

	if (msg.toLowerCase().includes("rate") || msg.includes("429")) {
		return {
			code: "RATE_LIMIT_ERROR",
			message: "AI provider rate limit reached.",
			technicalReason: msg,
		};
	}
	if (
		msg.toLowerCase().includes("timeout") ||
		msg.toLowerCase().includes("abort")
	) {
		return {
			code: "TIMEOUT_ERROR",
			message: "Analysis timed out.",
			technicalReason: msg,
		};
	}
	return ApiErrors.internalError(msg);
}
