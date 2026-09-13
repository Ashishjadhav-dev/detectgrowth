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
};

export function listCompanies(query?: string) {
  const params = query?.trim() ? `?q=${encodeURIComponent(query.trim())}` : "";
  return apiRequest<ApiCompany[]>(`/api/v1/companies${params}`);
}
