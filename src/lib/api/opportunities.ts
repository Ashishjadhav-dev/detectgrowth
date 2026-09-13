import { apiRequest } from "./client";

export type ApiOpportunity = { id: string; company: string; industry: string; location: string; score: number; employees: string; stage: string; status?: string };

export function getOpportunity(id: string) {
  return apiRequest<ApiOpportunity>(`/api/v1/opportunities/${encodeURIComponent(id)}`);
}
