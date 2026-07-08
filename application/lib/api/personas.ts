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

export const PersonaApi = {
  async list(): Promise<ListPersonasData> {
    const res = await api.get<ListPersonasData>("/personas", {
      timeout: TIMEOUTS.general,
    });
    return res.data;
  },

  async create(input: CreatePersonaInput): Promise<{ persona: PersonaData }> {
    const res = await api.post<{ persona: PersonaData }>("/personas", input, {
      timeout: TIMEOUTS.ai,
    });
    return res.data;
  },

  async update(id: string, input: UpdatePersonaInput): Promise<{ persona: PersonaData }> {
    const res = await api.patch<{ persona: PersonaData }>(`/personas/${id}`, input, {
      timeout: TIMEOUTS.general,
    });
    return res.data;
  },

  async delete(id: string): Promise<{ deleted: boolean }> {
    const res = await api.delete<{ deleted: boolean }>(`/personas/${id}`, {
      timeout: TIMEOUTS.general,
    });
    return res.data;
  },
};
