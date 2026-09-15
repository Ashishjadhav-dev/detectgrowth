import { apiRequest } from "./client";

export type ApiIntegration = { provider: string; name: string; kind: "public" | "oauth"; description: string; status: string; lastSyncedAt: string; error: string };
export function listIntegrations() { return apiRequest<ApiIntegration[]>("/api/v1/integrations"); }
export function updateIntegration(provider: string, status: "connected" | "disabled") { return apiRequest<{ provider: string; status: string }>(`/api/v1/integrations/${encodeURIComponent(provider)}`, { method: "PATCH", body: JSON.stringify({ status }) }); }
