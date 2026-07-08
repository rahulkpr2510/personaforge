import api, { TIMEOUTS } from "./client";
import type { CreateAnalysisData, AnalysisSummary, AnalysisStatusData } from "./types";

export interface CreateAnalysisInput {
  url: string;
  personaIds: string[];
  customPersonas: unknown[];
  deviceType: "DESKTOP" | "MOBILE";
}

export const AnalysisApi = {
  async create(input: CreateAnalysisInput): Promise<CreateAnalysisData> {
    const res = await api.post<CreateAnalysisData>("/analyses", input, {
      timeout: TIMEOUTS.general,
    });
    return res.data;
  },

  async list(): Promise<{ analyses: AnalysisSummary[] }> {
    const res = await api.get<{ analyses: AnalysisSummary[] }>("/analyses", {
      timeout: TIMEOUTS.general,
    });
    return res.data;
  },

  async get(id: string): Promise<{ analysis: unknown }> {
    const res = await api.get<{ analysis: unknown }>(`/analyses/${id}`, {
      timeout: TIMEOUTS.general,
    });
    return res.data;
  },

  async getStatus(id: string, signal?: AbortSignal): Promise<AnalysisStatusData> {
    const res = await api.get<AnalysisStatusData>(`/analyses/${id}/status`, {
      timeout: TIMEOUTS.polling,
      signal,
    });
    return res.data;
  },

  async cancel(id: string): Promise<{ cancelled: boolean }> {
    const res = await api.patch<{ cancelled: boolean }>(`/analyses/${id}`, null, {
      timeout: TIMEOUTS.general,
    });
    return res.data;
  },

  async delete(id: string): Promise<{ deleted: boolean }> {
    const res = await api.delete<{ deleted: boolean }>(`/analyses/${id}`, {
      timeout: TIMEOUTS.general,
    });
    return res.data;
  },
};
