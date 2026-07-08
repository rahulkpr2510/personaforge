// lib/api/types.ts
// ─────────────────────────────────────────────────────────────────────────────
// Shared API types used by BOTH frontend (Axios client) and backend (route handlers).
// Never import anything from Next.js / Node-only modules here.
// ─────────────────────────────────────────────────────────────────────────────

// ── Error classification ───────────────────────────────────────────────────

export enum ErrorCategory {
  VALIDATION = "VALIDATION",
  NETWORK = "NETWORK",
  DATABASE = "DATABASE",
  CRAWLER = "CRAWLER",
  VISION = "VISION",
  LLM = "LLM",
  PDF = "PDF",
  QUEUE = "QUEUE",
  AUTHENTICATION = "AUTHENTICATION",
  PERMISSION = "PERMISSION",
  RATE_LIMIT = "RATE_LIMIT",
  UNKNOWN = "UNKNOWN",
}

// ── Structured API error ───────────────────────────────────────────────────

export interface ApiErrorDetail {
  /** Machine-readable code — e.g. "ANALYSIS_NOT_FOUND" */
  code: string;
  /** Error category for routing to the right handler */
  category: ErrorCategory;
  /** Short, user-facing title — e.g. "Analysis not found" */
  title: string;
  /** User-facing sentence explaining what happened */
  message: string;
  /** Developer-facing explanation — never shown in production UI */
  technicalReason: string;
  /** Actionable next step for the user */
  suggestedAction: string;
  /** Whether the client can safely retry this request */
  retryable: boolean;
  /** Seconds to wait before retrying (used for 429 responses) */
  retryAfter?: number;
  /** Field-level validation errors */
  fieldErrors?: Record<string, string[]>;
}

// ── Response envelope ──────────────────────────────────────────────────────

export interface ApiSuccessResponse<T> {
  success: true;
  /** UUID that correlates this request through frontend → backend → logs */
  requestId: string;
  timestamp: string;
  data: T;
  metadata?: Record<string, unknown>;
}

export interface ApiFailureResponse {
  success: false;
  requestId: string;
  timestamp: string;
  error: ApiErrorDetail;
}

export type ApiResponse<T> = ApiSuccessResponse<T> | ApiFailureResponse;

// ── Analysis API data shapes ───────────────────────────────────────────────

export interface CreateAnalysisData {
  analysisId: string;
  status: "PENDING";
}

export interface AnalysisSummary {
  id: string;
  url: string;
  normalizedHost: string;
  status: string;
  deviceType: string;
  overallSentiment: string | null;
  overallFrictionScore: number | null;
  createdAt: string;
  completedAt: string | null;
  _count: { pages: number; personas: number };
  focusGroup: { id: string } | null;
}

export interface AnalysisStatusData {
  id: string;
  status: string;
  error: string | null;
  startedAt: string | null;
  completedAt: string | null;
  overallSentiment: string | null;
  overallFrictionScore: number | null;
  meta: unknown;
  _count: { pages: number; personas: number };
  personas: unknown[];
  focusGroup: unknown | null;
  crawlerEvents: CrawlerEvent[];
  crawlMeta: CrawlMeta | null;
}

export interface CrawlerEvent {
  type: string;
  message: string;
  data?: Record<string, unknown>;
  timestamp: string;
}

export interface CrawlMeta {
  partial?: boolean;
  partialReason?: string | null;
}

// ── Persona API data shapes ────────────────────────────────────────────────

export interface PersonaData {
  id: string;
  label: string;
  name: string;
  age: number;
  occupation: string;
  technicalLevel: string;
  goals: string;
  frustrations: string;
  tags: string[];
  description?: string | null;
  metadata?: unknown;
  createdAt?: string;
}

export interface ListPersonasData {
  prebuilt: PersonaData[];
  custom: PersonaData[];
}

// ── Client-side AppError ───────────────────────────────────────────────────
// Thrown by the Axios response interceptor so callers receive structured errors.

export class AppError extends Error {
  readonly requestId: string;
  readonly category: ErrorCategory;
  readonly code: string;
  readonly title: string;
  readonly userMessage: string;
  readonly technicalReason: string;
  readonly suggestedAction: string;
  readonly retryable: boolean;
  readonly retryAfter: number | undefined;
  readonly fieldErrors: Record<string, string[]> | undefined;
  readonly httpStatus: number | undefined;

  constructor(detail: ApiErrorDetail, requestId: string, httpStatus?: number) {
    super(detail.message);
    this.name = "AppError";
    this.requestId = requestId;
    this.category = detail.category;
    this.code = detail.code;
    this.title = detail.title;
    this.userMessage = detail.message;
    this.technicalReason = detail.technicalReason;
    this.suggestedAction = detail.suggestedAction;
    this.retryable = detail.retryable;
    this.retryAfter = detail.retryAfter;
    this.fieldErrors = detail.fieldErrors;
    this.httpStatus = httpStatus;
  }

  /** Is this an authentication failure? */
  get isAuthError() {
    return (
      this.category === ErrorCategory.AUTHENTICATION ||
      this.httpStatus === 401 ||
      this.httpStatus === 403
    );
  }

  /** Is this a rate limit error? */
  get isRateLimitError() {
    return this.category === ErrorCategory.RATE_LIMIT || this.httpStatus === 429;
  }

  /** Is this a validation error? */
  get isValidationError() {
    return this.category === ErrorCategory.VALIDATION || this.httpStatus === 400;
  }
}
