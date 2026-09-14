import { apiRequest } from "./client";

export type ICPSettings = { industries: string; locations: string; employeeSize: string; revenue: string; signals: Record<string, boolean> };

export function getICP() { return apiRequest<ICPSettings>("/api/v1/settings/icp"); }
export function updateICP(settings: ICPSettings) { return apiRequest<ICPSettings>("/api/v1/settings/icp", { method: "PATCH", body: JSON.stringify(settings) }); }
