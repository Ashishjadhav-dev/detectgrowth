import type { GrowthWatch, LeadMarket } from "@/types/watchlists";
import type { LeadsResponse, LocalLead, SavedLead, WebsiteAudit } from "@/types/leads";

export type LeadSearch = { locality: string; category: string; radius: string; mode?: "demo" };
export const savedLeadKey = (id: string) => ["saved-leads", id];

async function request<T>(path: string, options?: RequestInit): Promise<T> {
  const response = await fetch(`/api/leads${path}`, {
    ...options,
    cache: "no-store",
    headers: { Accept: "application/json", ...(options?.body ? { "Content-Type": "application/json" } : {}) },
  });
  const payload = await response.json();
  if (!response.ok) throw new Error(typeof payload.error === "string" ? payload.error : "The lead service is unavailable.");
  return payload as T;
}

export const searchLeads = (input: LeadSearch, signal: AbortSignal) =>
  request<LeadsResponse>(`?${new URLSearchParams(input)}`, { signal });

export const auditLeadWebsite = (website: string) =>
  request<WebsiteAudit>(`/audit?url=${encodeURIComponent(website)}`);

export const listSavedLeads = () => request<SavedLead[]>("/saved");
export const saveLead = (lead: LocalLead, websiteAudit?: WebsiteAudit) => request<SavedLead>("/saved", { method: "POST", body: JSON.stringify({ ...lead, websiteAudit }) });
export const updateSavedLead = (id: string, changes: Partial<Pick<SavedLead, "status" | "notes" | "websiteAudit">>) =>
  request<SavedLead>(`/saved?id=${encodeURIComponent(id)}`, { method: "PATCH", body: JSON.stringify(changes) });
export const removeSavedLead = (id: string) =>
  request<{ id: string }>(`/saved?id=${encodeURIComponent(id)}`, { method: "DELETE" });
export const promoteSavedLead = (id: string) =>
  request<{ id: string }>(`/saved?id=${encodeURIComponent(id)}`, { method: "POST", body: JSON.stringify({ action: "promote" }) });


export const watchlistsKey = (id: string) => ["growth-watchlists", id];

export const listGrowthWatches = () => request<GrowthWatch[]>("/watchlists");
export const createGrowthWatch = (market: LeadMarket, demo: boolean) =>
  request<GrowthWatch>("/watchlists", { method: "POST", body: JSON.stringify({ ...market, demo }) });
export const recheckGrowthWatch = (id: string) =>
  request<GrowthWatch>(`/watchlists?id=${encodeURIComponent(id)}`, { method: "POST", body: JSON.stringify({ action: "recheck" }) });
export const removeGrowthWatch = (id: string) =>
  request<{ id: string }>(`/watchlists?id=${encodeURIComponent(id)}`, { method: "DELETE" });
