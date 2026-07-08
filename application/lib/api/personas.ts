// lib/api/personas.ts
// ─────────────────────────────────────────────────────────────────────────────
// Typed API module for all persona-related requests.
// ─────────────────────────────────────────────────────────────────────────────

import api, { TIMEOUTS } from "./client";
import type { PersonaData, ListPersonasData } from "./types";

export interface CreatePersonaInput {
  name: string;
  age: number;
  occupation: string;
  technicalLevel: "LOW" | "MEDIUM" | "HIGH";
  goals: string;
  frustrations: string;
  tags: string[];
}

export interface UpdatePersonaInput {
  name?: string;
  age?: number;
  occupation?: string;
  technicalLevel?: "LOW" | "MEDIUM" | "HIGH";
  goals?: string;
  frustrations?: string;
  tags?: string[];
}

// ── Persona API ─────────────────────────────────────────────────────────────

export const PersonaApi = {
  /**
   * Fetch all prebuilt and custom personas for the current user.
   */
  async list(): Promise<ListPersonasData> {
    const res = await api.get<ListPersonasData>("/personas", {
      timeout: TIMEOUTS.general,
    });
    return res.data;
  },

  /**
   * Create a new custom persona.
   * AI description generation happens server-side and is non-blocking.
   */
  async create(input: CreatePersonaInput): Promise<{ persona: PersonaData }> {
    const res = await api.post<{ persona: PersonaData }>("/personas", input, {
      timeout: TIMEOUTS.ai, // Allow time for AI description generation
    });
    return res.data;
  },

  /**
   * Update an existing custom persona.
   */
  async update(id: string, input: UpdatePersonaInput): Promise<{ persona: PersonaData }> {
    const res = await api.patch<{ persona: PersonaData }>(`/personas/${id}`, input, {
      timeout: TIMEOUTS.general,
    });
    return res.data;
  },

  /**
   * Delete a custom persona. Only works on personas owned by the current user.
   */
  async delete(id: string): Promise<{ deleted: boolean }> {
    const res = await api.delete<{ deleted: boolean }>(`/personas/${id}`, {
      timeout: TIMEOUTS.general,
    });
    return res.data;
  },
};
