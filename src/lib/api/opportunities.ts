import { apiRequest } from "./client";

export type ApiOpportunity = { id: string; company: string; industry: string; location: string; score: number; employees: string; stage: string; status?: string };

export function getOpportunity(id: string) {
  return apiRequest<ApiOpportunity>(`/api/v1/opportunities/${encodeURIComponent(id)}`);
}

export function createOpportunity(input: { companyId?: string; stage?: string; status?: string; score?: number; priority?: string; expectedValue?: number; nextAction?: string }) {
  return apiRequest<ApiOpportunity>("/api/v1/opportunities", { method: "POST", body: JSON.stringify(input) });
}

export function updateOpportunity(id: string, input: Partial<{ stage: string; status: string; score: number; priority: string; expectedValue: number; nextAction: string }>) {
  return apiRequest<ApiOpportunity>(`/api/v1/opportunities/${encodeURIComponent(id)}`, { method: "PATCH", body: JSON.stringify(input) });
}

export function deleteOpportunity(id: string) {
  return apiRequest<{ id: string; deleted: boolean }>(`/api/v1/opportunities/${encodeURIComponent(id)}`, { method: "DELETE" });
}
