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
  signals?: { id: string; type: string; description: string; impact: "High" | "Medium" | "Low"; time: string }[];
};

export function listCompanies(query?: string) {
  const params = query?.trim() ? `?q=${encodeURIComponent(query.trim())}` : "";
  return apiRequest<ApiCompany[]>(`/api/v1/companies${params}`);
}

export function getCompany(id: string) {
  return apiRequest<ApiCompany>(`/api/v1/companies/${encodeURIComponent(id)}`);
}
