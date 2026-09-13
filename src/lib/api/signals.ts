import { apiRequest } from "./client";

export type ApiSignal = { id: string; type: string; company: string; description: string; time: string; impact: "High" | "Medium" | "Low"; confidence: number };

export function listSignals(query?: string) {
  const params = query?.trim() ? `?q=${encodeURIComponent(query.trim())}` : "";
  return apiRequest<ApiSignal[]>(`/api/v1/signals${params}`);
}
