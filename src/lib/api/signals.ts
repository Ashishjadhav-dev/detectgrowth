import { apiRequest } from "./client";

export type ApiSignal = { id: string; type: string; company: string; description: string; time: string; impact: "High" | "Medium" | "Low"; confidence: number };

export function listSignals(query?: string) {
  const params = query?.trim() ? `?q=${encodeURIComponent(query.trim())}` : "";
  return apiRequest<ApiSignal[]>(`/api/v1/signals${params}`);
}

export function createSignal(input: { title: string; signalType?: string; companyId?: string; description?: string; impact?: "High" | "Medium" | "Low"; confidence?: number; sourceType?: string; sourceUrl?: string; detectedAt?: string }) {
  return apiRequest<ApiSignal>("/api/v1/signals", { method: "POST", body: JSON.stringify(input) });
}

export function updateSignal(id: string, input: Partial<Pick<ApiSignal, "type" | "description" | "impact" | "confidence">> & { sourceUrl?: string }) {
  return apiRequest<ApiSignal>(`/api/v1/signals/${encodeURIComponent(id)}`, { method: "PATCH", body: JSON.stringify({ ...input, title: input.type }) });
}

export function deleteSignal(id: string) {
  return apiRequest<{ id: string; deleted: boolean }>(`/api/v1/signals/${encodeURIComponent(id)}`, { method: "DELETE" });
}
