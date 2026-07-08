// lib/api/errors.ts
// ─────────────────────────────────────────────────────────────────────────────
// Backend error classification — maps known exception types to structured
// ApiErrorDetail objects. Never exposes raw stack traces to clients.
// ─────────────────────────────────────────────────────────────────────────────

import { ErrorCategory, type ApiErrorDetail } from "./types";

// ── Known error codes ─────────────────────────────────────────────────────

export const ApiErrorCode = {
  // Auth
  UNAUTHORIZED: "UNAUTHORIZED",
  FORBIDDEN: "FORBIDDEN",
  // Validation
  INVALID_JSON: "INVALID_JSON",
  VALIDATION_FAILED: "VALIDATION_FAILED",
  INVALID_URL: "INVALID_URL",
  // Resources
  ANALYSIS_NOT_FOUND: "ANALYSIS_NOT_FOUND",
  PERSONA_NOT_FOUND: "PERSONA_NOT_FOUND",
  // State conflicts
  ALREADY_COMPLETED: "ALREADY_COMPLETED",
  CANNOT_CANCEL: "CANNOT_CANCEL",
  CANNOT_DELETE_RUNNING: "CANNOT_DELETE_RUNNING",
  PERSONA_LIMIT_REACHED: "PERSONA_LIMIT_REACHED",
  // Rate limiting
  RATE_LIMIT_EXCEEDED: "RATE_LIMIT_EXCEEDED",
  // Pipeline errors
  CRAWLER_FAILED: "CRAWLER_FAILED",
  CRAWLER_TRIGGER_FAILED: "CRAWLER_TRIGGER_FAILED",
  VISION_FAILED: "VISION_FAILED",
  LLM_FAILED: "LLM_FAILED",
  PIPELINE_FAILED: "PIPELINE_FAILED",
  // Database
  DATABASE_ERROR: "DATABASE_ERROR",
  // Unknown
  INTERNAL_ERROR: "INTERNAL_ERROR",
} as const;

export type ApiErrorCodeType = (typeof ApiErrorCode)[keyof typeof ApiErrorCode];

// ── Pre-built error factories ──────────────────────────────────────────────

export const ApiErrors = {
  unauthorized(): ApiErrorDetail {
    return {
      code: ApiErrorCode.UNAUTHORIZED,
      category: ErrorCategory.AUTHENTICATION,
      title: "Authentication required",
      message: "You must be signed in to perform this action.",
      technicalReason: "requireAuth() returned null — Clerk session missing or expired.",
      suggestedAction: "Sign in and try again.",
      retryable: false,
    };
  },

  forbidden(): ApiErrorDetail {
    return {
      code: ApiErrorCode.FORBIDDEN,
      category: ErrorCategory.PERMISSION,
      title: "Access denied",
      message: "You do not have permission to access this resource.",
      technicalReason: "Resource belongs to a different user.",
      suggestedAction: "Check you are signed in with the correct account.",
      retryable: false,
    };
  },

  invalidJson(): ApiErrorDetail {
    return {
      code: ApiErrorCode.INVALID_JSON,
      category: ErrorCategory.VALIDATION,
      title: "Invalid request",
      message: "The request body could not be parsed.",
      technicalReason: "JSON.parse() failed on the incoming request body.",
      suggestedAction: "Ensure the request body is valid JSON with Content-Type: application/json.",
      retryable: false,
    };
  },

  validationFailed(fieldErrors: Record<string, string[]>): ApiErrorDetail {
    return {
      code: ApiErrorCode.VALIDATION_FAILED,
      category: ErrorCategory.VALIDATION,
      title: "Validation failed",
      message: "Some fields contain invalid values. Please check and try again.",
      technicalReason: "Zod schema validation rejected one or more fields.",
      suggestedAction: "Review the field errors and correct the highlighted inputs.",
      retryable: false,
      fieldErrors,
    };
  },

  invalidUrl(): ApiErrorDetail {
    return {
      code: ApiErrorCode.INVALID_URL,
      category: ErrorCategory.VALIDATION,
      title: "Invalid URL",
      message: "The provided URL is not valid.",
      technicalReason: "URL constructor threw — protocol may be missing or malformed.",
      suggestedAction: "Include the full URL with https:// (e.g. https://your-product.com).",
      retryable: false,
    };
  },

  analysisNotFound(): ApiErrorDetail {
    return {
      code: ApiErrorCode.ANALYSIS_NOT_FOUND,
      category: ErrorCategory.VALIDATION,
      title: "Analysis not found",
      message: "This analysis does not exist or you do not have access to it.",
      technicalReason: "db.analysis.findFirst() returned null for the given id + userId.",
      suggestedAction: "Return to your analyses list and select a valid analysis.",
      retryable: false,
    };
  },

  personaNotFound(): ApiErrorDetail {
    return {
      code: ApiErrorCode.PERSONA_NOT_FOUND,
      category: ErrorCategory.VALIDATION,
      title: "Persona not found",
      message: "This persona does not exist or you do not have access to it.",
      technicalReason: "db.persona.findFirst() returned null for the given id + userId.",
      suggestedAction: "Refresh the page and try again.",
      retryable: false,
    };
  },

  cannotCancel(currentStatus: string): ApiErrorDetail {
    return {
      code: ApiErrorCode.CANNOT_CANCEL,
      category: ErrorCategory.VALIDATION,
      title: "Cannot cancel",
      message: `This analysis cannot be cancelled because it is already ${currentStatus.toLowerCase()}.`,
      technicalReason: `Analysis status is "${currentStatus}" — only PENDING, CRAWLING, and ANALYZING can be cancelled.`,
      suggestedAction: "No action needed — the analysis has already finished.",
      retryable: false,
    };
  },

  cannotDeleteRunning(): ApiErrorDetail {
    return {
      code: ApiErrorCode.CANNOT_DELETE_RUNNING,
      category: ErrorCategory.VALIDATION,
      title: "Analysis is still running",
      message: "Cancel the analysis before deleting it.",
      technicalReason: "Analysis status is CRAWLING or ANALYZING — deletion blocked to avoid orphan pipeline runs.",
      suggestedAction: "Cancel the analysis first, then delete it.",
      retryable: false,
    };
  },

  rateLimitExceeded(retryAfterMs: number): ApiErrorDetail {
    const retryAfter = Math.ceil(retryAfterMs / 1000);
    return {
      code: ApiErrorCode.RATE_LIMIT_EXCEEDED,
      category: ErrorCategory.RATE_LIMIT,
      title: "Too many requests",
      message: `You've reached the request limit. Please wait ${Math.ceil(retryAfter / 60)} minute(s) before trying again.`,
      technicalReason: `In-process sliding window rate limiter rejected the request. Reset in ${retryAfter}s.`,
      suggestedAction: `Wait ${Math.ceil(retryAfter / 60)} minute(s) and try again.`,
      retryable: true,
      retryAfter,
    };
  },

  personaLimitReached(): ApiErrorDetail {
    return {
      code: ApiErrorCode.PERSONA_LIMIT_REACHED,
      category: ErrorCategory.VALIDATION,
      title: "Persona limit reached",
      message: "You've reached the maximum of 20 custom personas.",
      technicalReason: "db.persona.count() >= 20 for this userId.",
      suggestedAction: "Delete an existing custom persona to make room.",
      retryable: false,
    };
  },

  crawlerTriggerFailed(details: string): ApiErrorDetail {
    return {
      code: ApiErrorCode.CRAWLER_TRIGGER_FAILED,
      category: ErrorCategory.CRAWLER,
      title: "Could not start crawl",
      message: "The website crawl could not be started. Your analysis has been queued.",
      technicalReason: `Crawler service HTTP request failed: ${details}`,
      suggestedAction: "Try creating a new analysis. If the problem persists, the crawler service may be down.",
      retryable: true,
    };
  },

  crawlerFailed(details: string): ApiErrorDetail {
    return {
      code: ApiErrorCode.CRAWLER_FAILED,
      category: ErrorCategory.CRAWLER,
      title: "Website could not be crawled",
      message: "The website could not be crawled. It may be blocking automated access.",
      technicalReason: details,
      suggestedAction: "Check that the URL is publicly accessible and not behind a login or bot protection.",
      retryable: true,
    };
  },

  visionFailed(details: string): ApiErrorDetail {
    return {
      code: ApiErrorCode.VISION_FAILED,
      category: ErrorCategory.VISION,
      title: "Image analysis failed",
      message: "Screenshot analysis could not be completed for one or more pages.",
      technicalReason: `Gemini Vision call failed: ${details}`,
      suggestedAction: "The analysis will continue with text-only evaluation. If results seem incomplete, try again.",
      retryable: true,
    };
  },

  llmFailed(provider: string, details: string): ApiErrorDetail {
    return {
      code: ApiErrorCode.LLM_FAILED,
      category: ErrorCategory.LLM,
      title: "Persona generation failed",
      message: "The AI persona evaluation could not be completed.",
      technicalReason: `${provider} request failed: ${details}`,
      suggestedAction: "Try again. If this keeps happening, the AI provider may be experiencing high load.",
      retryable: true,
    };
  },

  pipelineFailed(phase: string, details: string): ApiErrorDetail {
    return {
      code: ApiErrorCode.PIPELINE_FAILED,
      category: ErrorCategory.UNKNOWN,
      title: "Analysis pipeline failed",
      message: "The analysis could not be completed due to an unexpected error.",
      technicalReason: `Pipeline failed at phase "${phase}": ${details}`,
      suggestedAction: "Try creating a new analysis. Contact support if the problem continues.",
      retryable: true,
    };
  },

  databaseError(details: string): ApiErrorDetail {
    return {
      code: ApiErrorCode.DATABASE_ERROR,
      category: ErrorCategory.DATABASE,
      title: "Database error",
      message: "A database error occurred. Please try again.",
      technicalReason: details,
      suggestedAction: "Try again in a moment.",
      retryable: true,
    };
  },

  internalError(details?: string): ApiErrorDetail {
    return {
      code: ApiErrorCode.INTERNAL_ERROR,
      category: ErrorCategory.UNKNOWN,
      title: "Unexpected error",
      message: "An unexpected error occurred. Please try again.",
      technicalReason: details ?? "Unknown internal error",
      suggestedAction: "Refresh the page and try again. Contact support if the problem persists.",
      retryable: true,
    };
  },
};

// ── Error classifier ───────────────────────────────────────────────────────
// Maps unknown exception types to structured ApiErrorDetail.
// Used in catch blocks so each route handler doesn't need custom logic.

export function classifyError(err: unknown): ApiErrorDetail {
  if (err instanceof Error) {
    const msg = err.message;
    const code = (err as NodeJS.ErrnoException).code;

    // Auth errors thrown by requireAuth()
    if (code === "UNAUTHORIZED") return ApiErrors.unauthorized();

    // Prisma "record not found" (P2025)
    if (msg.includes("P2025") || msg.includes("Record to delete does not exist")) {
      return ApiErrors.databaseError("Record not found in database.");
    }

    // Prisma connection / timeout
    if (msg.includes("P1001") || msg.includes("Can't reach database")) {
      return ApiErrors.databaseError("Cannot reach database server.");
    }

    // Groq rate limit
    if (msg.includes("429") && msg.toLowerCase().includes("groq")) {
      return {
        code: ApiErrorCode.LLM_FAILED,
        category: ErrorCategory.LLM,
        title: "AI provider busy",
        message: "The AI provider is temporarily busy. The analysis will be retried automatically.",
        technicalReason: `Groq returned HTTP 429 (rate limited). ${msg}`,
        suggestedAction: "Wait a moment and try again.",
        retryable: true,
        retryAfter: 30,
      };
    }

    // Gemini quota
    if (msg.includes("429") && (msg.toLowerCase().includes("gemini") || msg.toLowerCase().includes("google"))) {
      return {
        code: ApiErrorCode.VISION_FAILED,
        category: ErrorCategory.VISION,
        title: "Vision quota exceeded",
        message: "Image analysis quota has been exceeded. The analysis will use text-only evaluation.",
        technicalReason: `Gemini Vision returned HTTP 429. ${msg}`,
        suggestedAction: "Retry after 2 minutes or contact support to increase quota.",
        retryable: true,
        retryAfter: 120,
      };
    }

    // Crawler connectivity
    if (msg.includes("ECONNREFUSED") || msg.includes("ENOTFOUND")) {
      return ApiErrors.crawlerTriggerFailed(msg);
    }
  }

  // Fallback
  const safeDetails = err instanceof Error ? err.message.slice(0, 200) : String(err).slice(0, 200);
  return ApiErrors.internalError(safeDetails);
}
