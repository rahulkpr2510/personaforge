// lib/api/retry.ts
// ─────────────────────────────────────────────────────────────────────────────
// Exponential backoff retry logic for Axios.
// Only retries safe, transient failures — never auth or validation errors.
// ─────────────────────────────────────────────────────────────────────────────

import type { AxiosError } from "axios";

/** HTTP status codes that are safe to retry */
const RETRYABLE_STATUSES = new Set([429, 500, 502, 503, 504]);

/** HTTP status codes that should NEVER be retried */
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

/**
 * Calculate the delay for the nth retry using exponential backoff with jitter.
 */
export function calcRetryDelay(attempt: number, config: RetryConfig): number {
  const exponential = config.baseDelayMs * Math.pow(2, attempt - 1);
  const jitter = Math.random() * 200; // ±200ms jitter
  return Math.min(exponential + jitter, config.maxDelayMs);
}

/**
 * Determines whether an Axios error should trigger a retry.
 */
export function shouldRetry(error: AxiosError, currentAttempt: number, config: RetryConfig): boolean {
  if (currentAttempt >= config.maxRetries) return false;

  // Network errors (no response) are always retried
  if (!error.response) return true;

  const status = error.response.status;

  // Never retry these
  if (NON_RETRYABLE_STATUSES.has(status)) return false;

  // Retry these
  if (RETRYABLE_STATUSES.has(status)) return true;

  return false;
}

/**
 * Sleep for `ms` milliseconds.
 */
export function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
