import { apiRequest } from "./client";

export type ApiCompany = {
  id: string;
  name: string;
  domain: string;
  industry: string;
  location: string;
  employeeRange: string;
  status: string;
  createdAt: string;
  updatedAt: string;
  signals?: { id: string; type: string; description: string; impact: "High" | "Medium" | "Low"; time: string; confidence?: number }[];
};

export function listCompanies(query?: string) {
  const params = query?.trim() ? `?q=${encodeURIComponent(query.trim())}` : "";
  return apiRequest<ApiCompany[]>(`/api/v1/companies${params}`);
}

export function getCompany(id: string) {
  return apiRequest<ApiCompany>(`/api/v1/companies/${encodeURIComponent(id)}`);
}

export function createCompany(input: Pick<ApiCompany, "name"> & Partial<Omit<ApiCompany, "id" | "name" | "createdAt" | "updatedAt">>) {
  return apiRequest<ApiCompany>("/api/v1/companies", { method: "POST", body: JSON.stringify(input) });
}

export function updateCompany(id: string, input: Partial<Pick<ApiCompany, "name" | "domain" | "industry" | "location" | "employeeRange" | "status">>) {
  return apiRequest<ApiCompany>(`/api/v1/companies/${encodeURIComponent(id)}`, { method: "PATCH", body: JSON.stringify(input) });
}

export function deleteCompany(id: string) {
  return apiRequest<{ id: string; deleted: boolean }>(`/api/v1/companies/${encodeURIComponent(id)}`, { method: "DELETE" });
}
