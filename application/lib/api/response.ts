// lib/api/response.ts
// ─────────────────────────────────────────────────────────────────────────────
// Backend response helpers — every API route must use these instead of
// NextResponse.json() directly. Guarantees a consistent ApiResponse<T> envelope.
// ─────────────────────────────────────────────────────────────────────────────

import { NextResponse } from "next/server";
import { randomUUID } from "crypto";
import type { ApiErrorDetail, ApiSuccessResponse, ApiFailureResponse } from "./types";

// ── Request ID utilities ────────────────────────────────────────────────────

/**
 * Extracts the Request-ID from incoming request headers, or generates a new one.
 * All routes should call this at the top of the handler.
 */
export function getRequestId(req?: Request): string {
  if (req) {
    const incoming = req.headers.get("x-request-id");
    if (incoming && incoming.length > 0) return incoming;
  }
  return randomUUID();
}

// ── Success response ────────────────────────────────────────────────────────

/**
 * Return a standardized success response.
 *
 * @example
 * return apiSuccess(req, { analysisId: "abc123" }, undefined, 201);
 */
export function apiSuccess<T>(
  requestId: string,
  data: T,
  metadata?: Record<string, unknown>,
  status = 200,
  extraHeaders?: HeadersInit,
): NextResponse {
  const body: ApiSuccessResponse<T> = {
    success: true,
    requestId,
    timestamp: new Date().toISOString(),
    data,
    ...(metadata ? { metadata } : {}),
  };

  return NextResponse.json(body, {
    status,
    headers: extraHeaders,
  });
}

// ── Failure response ────────────────────────────────────────────────────────

/**
 * Return a standardized error response. Never leaks stack traces.
 *
 * @example
 * return apiFailure(requestId, ApiErrors.unauthorized(), 401);
 */
export function apiFailure(
  requestId: string,
  error: ApiErrorDetail,
  httpStatus: number,
  extraHeaders?: HeadersInit,
): NextResponse {
  const body: ApiFailureResponse = {
    success: false,
    requestId,
    timestamp: new Date().toISOString(),
    error,
  };

  const headers: Record<string, string> = {};
  if (error.retryAfter) {
    headers["Retry-After"] = String(error.retryAfter);
  }
  if (extraHeaders) {
    const extra = new Headers(extraHeaders as HeadersInit);
    extra.forEach((v, k) => {
      headers[k] = v;
    });
  }

  return NextResponse.json(body, {
    status: httpStatus,
    headers: Object.keys(headers).length ? headers : undefined,
  });
}

// ── Convenience: no-cache headers ──────────────────────────────────────────

/** Apply Cache-Control: no-store — use on polling endpoints */
export const NO_CACHE_HEADERS = {
  "Cache-Control": "no-store, no-cache, must-revalidate",
};
