import type { AxiosError } from "axios";

const RETRYABLE_STATUSES = new Set([429, 500, 502, 503, 504]);
const NON_RETRYABLE_STATUSES = new Set([400, 401, 403, 404, 409, 422]);

export interface RetryConfig {
  maxRetries: number;
  baseDelayMs: number;
  maxDelayMs: number;
}

export const DEFAULT_RETRY_CONFIG: RetryConfig = {
  maxRetries: 3,
  baseDelayMs: 1000,
  maxDelayMs: 8000,
};

export function calcRetryDelay(attempt: number, config: RetryConfig): number {
  const exponential = config.baseDelayMs * Math.pow(2, attempt - 1);
  const jitter = Math.random() * 200;
  return Math.min(exponential + jitter, config.maxDelayMs);
}

export function shouldRetry(error: AxiosError, currentAttempt: number, config: RetryConfig): boolean {
  if (currentAttempt >= config.maxRetries) return false;
  if (!error.response) return true;

  const status = error.response.status;
  if (NON_RETRYABLE_STATUSES.has(status)) return false;
  if (RETRYABLE_STATUSES.has(status)) return true;

  return false;
}

export function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
