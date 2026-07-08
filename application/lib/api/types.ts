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

export interface ApiErrorDetail {
  code: string;
  category: ErrorCategory;
  title: string;
  message: string;
  technicalReason: string;
  suggestedAction: string;
  retryable: boolean;
  retryAfter?: number;
  fieldErrors?: Record<string, string[]>;
}

export interface ApiSuccessResponse<T> {
  success: true;
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

export interface CreateAnalysisData {
  analysisId: string;
  status: "PENDING";
}

export interface AnalysisSummary {
  id: string;
  url: string;
  normalizedHost: string;
  status: "PENDING" | "CRAWLING" | "ANALYZING" | "COMPLETED" | "FAILED";
  deviceType: "DESKTOP" | "MOBILE";
  overallSentiment: "POSITIVE" | "NEUTRAL" | "NEGATIVE" | null;
  overallFrictionScore: number | null;
  createdAt: string;
  completedAt: string | null;
  error?: string | null;
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

export interface PersonaData {
  id: string;
  label: string;
  name: string;
  age: number;
  occupation: string;
  technicalLevel: "LOW" | "MEDIUM" | "HIGH";
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

  get isAuthError() {
    return (
      this.category === ErrorCategory.AUTHENTICATION ||
      this.httpStatus === 401 ||
      this.httpStatus === 403
    );
  }

  get isRateLimitError() {
    return this.category === ErrorCategory.RATE_LIMIT || this.httpStatus === 429;
  }

  get isValidationError() {
    return this.category === ErrorCategory.VALIDATION || this.httpStatus === 400;
  }
}
