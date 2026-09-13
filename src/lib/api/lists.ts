import { apiRequest } from "./client";

export type ApiList = { id: string; name: string; type: "manual" | "smart" | "watchlist"; count: number; updated: string };

export function listLists(query?: string) {
  const params = query?.trim() ? `?q=${encodeURIComponent(query.trim())}` : "";
  return apiRequest<ApiList[]>(`/api/v1/lists${params}`);
}

export function createList(name: string, type: ApiList["type"] = "manual") {
  return apiRequest<ApiList>("/api/v1/lists", { method: "POST", body: JSON.stringify({ name, type }) });
}
