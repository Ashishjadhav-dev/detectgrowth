import { apiRequest } from "./client";

export type ApiPerson = { id: string; name: string; title: string; department: string; score: number };

export function listPeople(query?: string) {
  const params = query?.trim() ? `?q=${encodeURIComponent(query.trim())}` : "";
  return apiRequest<ApiPerson[]>(`/api/v1/people${params}`);
}
