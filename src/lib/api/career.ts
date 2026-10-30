import { apiRequest } from "./client";

export type CareerApplication = { id: string; company: string; role: string; stage: "Saved" | "Applied" | "Interviewing" | "Offered" | "Rejected"; score: number; url?: string; createdAt?: string };
export type JobAlertPreference = { id: string; query: string; workplace: string; frequency: "daily" | "weekly"; enabled: boolean; updatedAt?: string };

export function listApplications() { return apiRequest<CareerApplication[]>("/api/v1/applications"); }
export function createApplication(input: Omit<CareerApplication, "id">) { return apiRequest<CareerApplication>("/api/v1/applications", { method: "POST", body: JSON.stringify(input) }); }
export function updateApplication(id: string, input: Partial<CareerApplication>) { return apiRequest<CareerApplication>(`/api/v1/applications/${encodeURIComponent(id)}`, { method: "PATCH", body: JSON.stringify(input) }); }
export function listJobAlerts() { return apiRequest<JobAlertPreference[]>("/api/v1/jobAlerts"); }
export function createJobAlert(input: Omit<JobAlertPreference, "id">) { return apiRequest<JobAlertPreference>("/api/v1/jobAlerts", { method: "POST", body: JSON.stringify(input) }); }
export function updateJobAlert(id: string, input: Partial<JobAlertPreference>) { return apiRequest<JobAlertPreference>(`/api/v1/jobAlerts/${encodeURIComponent(id)}`, { method: "PATCH", body: JSON.stringify(input) }); }
export function deleteJobAlert(id: string) { return apiRequest<{ id: string; deleted: boolean }>(`/api/v1/jobAlerts/${encodeURIComponent(id)}`, { method: "DELETE" }); }
