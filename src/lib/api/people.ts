import { apiRequest } from "./client";

export type ApiPerson = { id: string; name: string; title: string; department: string; score: number };

export function listPeople(query?: string) {
  const params = query?.trim() ? `?q=${encodeURIComponent(query.trim())}` : "";
  return apiRequest<ApiPerson[]>(`/api/v1/people${params}`);
}

export function createPerson(input: { name: string; companyId?: string; title?: string; department?: string; email?: string; phone?: string; linkedinUrl?: string; decisionScore?: number }) {
  return apiRequest<ApiPerson>("/api/v1/people", { method: "POST", body: JSON.stringify(input) });
}

export function updatePerson(id: string, input: Partial<Omit<ApiPerson, "id">>) {
  return apiRequest<ApiPerson>(`/api/v1/people/${encodeURIComponent(id)}`, { method: "PATCH", body: JSON.stringify(input) });
}

export function deletePerson(id: string) {
  return apiRequest<{ id: string; deleted: boolean }>(`/api/v1/people/${encodeURIComponent(id)}`, { method: "DELETE" });
}
