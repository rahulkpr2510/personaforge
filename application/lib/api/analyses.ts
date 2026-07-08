// lib/api/analyses.ts
// ─────────────────────────────────────────────────────────────────────────────
// Typed API module for all analysis-related requests.
// All functions return typed data directly (envelope is unwrapped by interceptor).
// ─────────────────────────────────────────────────────────────────────────────

import api, { TIMEOUTS } from "./client";
import type { CreateAnalysisData, AnalysisSummary, AnalysisStatusData } from "./types";

export interface CreateAnalysisInput {
  url: string;
  personaIds: string[];
  customPersonas: unknown[];
  deviceType: "DESKTOP" | "MOBILE";
}

// ── Analysis API ────────────────────────────────────────────────────────────

export const AnalysisApi = {
  /**
   * Create a new analysis. Returns the analysis ID immediately.
   * The crawler is triggered asynchronously.
   */
  async create(input: CreateAnalysisInput): Promise<CreateAnalysisData> {
    const res = await api.post<CreateAnalysisData>("/analyses", input, {
      timeout: TIMEOUTS.general,
    });
    return res.data;
  },

  /**
   * List all analyses for the current user.
   */
  async list(): Promise<{ analyses: AnalysisSummary[] }> {
    const res = await api.get<{ analyses: AnalysisSummary[] }>("/analyses", {
      timeout: TIMEOUTS.general,
    });
    return res.data;
  },

  /**
   * Fetch full analysis detail including pages, personas, and focus group.
   */
  async get(id: string): Promise<{ analysis: unknown }> {
    const res = await api.get<{ analysis: unknown }>(`/analyses/${id}`, {
      timeout: TIMEOUTS.general,
    });
    return res.data;
  },

  /**
   * Poll for the current analysis status.
   * Pass an AbortSignal to cancel when polling stops.
   */
  async getStatus(id: string, signal?: AbortSignal): Promise<AnalysisStatusData> {
    const res = await api.get<AnalysisStatusData>(`/analyses/${id}/status`, {
      timeout: TIMEOUTS.polling,
      signal,
    });
    return res.data;
  },

  /**
   * Cancel an in-progress analysis (sets status to FAILED).
   */
  async cancel(id: string): Promise<{ cancelled: boolean }> {
    const res = await api.patch<{ cancelled: boolean }>(`/analyses/${id}`, null, {
      timeout: TIMEOUTS.general,
    });
    return res.data;
  },

  /**
   * Delete a completed or failed analysis.
   */
  async delete(id: string): Promise<{ deleted: boolean }> {
    const res = await api.delete<{ deleted: boolean }>(`/analyses/${id}`, {
      timeout: TIMEOUTS.general,
    });
    return res.data;
  },
};
