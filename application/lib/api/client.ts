import axios, { type AxiosError, type InternalAxiosRequestConfig } from "axios";
import { AppError, ErrorCategory, type ApiFailureResponse, type ApiSuccessResponse } from "./types";
import { shouldRetry, calcRetryDelay, sleep, DEFAULT_RETRY_CONFIG } from "./retry";

function generateUUID(): string {
  if (typeof window !== "undefined" && window.crypto && typeof window.crypto.randomUUID === "function") {
    return window.crypto.randomUUID();
  }
  return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === "x" ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

export const TIMEOUTS = {
  general: 15_000,
  ai: 120_000,
  fileGeneration: 180_000,
  polling: 5_000,
} as const;

const CLIENT_VERSION =
  (typeof process !== "undefined" && process.env.NEXT_PUBLIC_APP_VERSION) ||
  "1.0.0";

interface ExtendedAxiosRequestConfig extends InternalAxiosRequestConfig {
  _retryCount?: number;
  _requestId?: string;
  _startTime?: number;
}

const api = axios.create({
  baseURL: "/api",
  timeout: TIMEOUTS.general,
  headers: {
    "Content-Type": "application/json",
  },
});

api.interceptors.request.use((config: ExtendedAxiosRequestConfig) => {
  const requestId = generateUUID();
  config._requestId = requestId;
  config._retryCount = config._retryCount ?? 0;
  config._startTime = config._startTime ?? Date.now();

  config.headers.set("X-Request-ID", requestId);
  config.headers.set("X-Client-Version", CLIENT_VERSION);
  config.headers.set("X-Timestamp", new Date().toISOString());

  if (process.env.NODE_ENV === "development") {
    console.debug(
      `[API] ▶ ${config.method?.toUpperCase()} ${config.url} [${requestId.slice(0, 8)}]`,
    );
  }

  return config;
});

api.interceptors.response.use(
  (response) => {
    const config = response.config as ExtendedAxiosRequestConfig;
    const duration = Date.now() - (config._startTime ?? Date.now());
    const requestId = config._requestId ?? "unknown";

    if (process.env.NODE_ENV === "development") {
      console.debug(
        `[API] ✓ ${config.method?.toUpperCase()} ${config.url} ` +
          `${response.status} — ${duration}ms [${requestId.slice(0, 8)}]`,
      );
    }

    const body = response.data as ApiSuccessResponse<unknown> | unknown;
    if (
      body &&
      typeof body === "object" &&
      "success" in body &&
      (body as ApiSuccessResponse<unknown>).success === true
    ) {
      response.data = (body as ApiSuccessResponse<unknown>).data;
    }

    return response;
  },

  async (error: AxiosError) => {
    const config = error.config as ExtendedAxiosRequestConfig | undefined;
    const duration = config ? Date.now() - (config._startTime ?? Date.now()) : 0;
    const requestId = config?._requestId ?? "unknown";
    const retryCount = config?._retryCount ?? 0;

    if (process.env.NODE_ENV === "development") {
      console.debug(
        `[API] ✗ ${config?.method?.toUpperCase()} ${config?.url} ` +
          `${error.response?.status ?? "NETWORK_ERROR"} — ${duration}ms ` +
          `[${requestId.slice(0, 8)}] retries=${retryCount}`,
      );
    }

    if (config && shouldRetry(error, retryCount, DEFAULT_RETRY_CONFIG)) {
      config._retryCount = retryCount + 1;
      const delay = calcRetryDelay(config._retryCount, DEFAULT_RETRY_CONFIG);

      if (process.env.NODE_ENV === "development") {
        console.debug(
          `[API] ↻ Retry ${config._retryCount}/${DEFAULT_RETRY_CONFIG.maxRetries} ` +
            `in ${Math.round(delay)}ms [${requestId.slice(0, 8)}]`,
        );
      }

      await sleep(delay);
      return api.request(config);
    }

    const responseData = error.response?.data as ApiFailureResponse | undefined;
    const httpStatus = error.response?.status;

    if (
      responseData &&
      typeof responseData === "object" &&
      "success" in responseData &&
      responseData.success === false &&
      responseData.error
    ) {
      throw new AppError(
        responseData.error,
        responseData.requestId ?? requestId,
        httpStatus,
      );
    }

    if (axios.isCancel(error)) {
      throw new AppError(
        {
          code: "REQUEST_CANCELLED",
          category: ErrorCategory.NETWORK,
          title: "Request cancelled",
          message: "The request was cancelled.",
          technicalReason: "AbortController.abort() was called.",
          suggestedAction: "This was intentional — no action needed.",
          retryable: false,
        },
        requestId,
        undefined,
      );
    }

    if (!error.response) {
      throw new AppError(
        {
          code: "NETWORK_ERROR",
          category: ErrorCategory.NETWORK,
          title: "Connection error",
          message: "Cannot connect to the server. Check your internet connection.",
          technicalReason: `Axios network error: ${error.message}`,
          suggestedAction: "Check your connection and try again.",
          retryable: true,
        },
        requestId,
        undefined,
      );
    }

    throw new AppError(
      {
        code: `HTTP_${httpStatus}`,
        category: ErrorCategory.UNKNOWN,
        title: "Request failed",
        message: "An unexpected error occurred. Please try again.",
        technicalReason: `HTTP ${httpStatus}: ${error.message}`,
        suggestedAction: "Try again. Contact support if the problem persists.",
        retryable: httpStatus !== undefined && httpStatus >= 500,
      },
      requestId,
      httpStatus,
    );
  },
);

export default api;

export function createAbortController() {
  const controller = new AbortController();
  return { controller, signal: controller.signal };
}
