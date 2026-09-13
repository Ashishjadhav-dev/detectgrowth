import { apiRequest } from "./client";

export type ResearchResult = {
  company: { id: string; name: string; domain: string; industry: string; location: string; employeeRange: string; status: string };
  evidence: { id: string; title: string; description: string; impact: string; detectedAt: string; confidence: number; sourceUrl: string }[];
  generatedAt: string;
};

export function runResearch(query: string) {
  return apiRequest<ResearchResult>(`/api/v1/research?q=${encodeURIComponent(query.trim())}`);
}
