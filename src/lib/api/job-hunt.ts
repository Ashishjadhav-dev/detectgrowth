import type { JobListing } from "@/types/jobs";
import { apiRequest } from "./client";

export type JobMatch = {
  id: string;
  jobId: string;
  title: string;
  company: string;
  url: string;
  location: string;
  workplace: string;
  score: number;
  matchedKeywords: string[];
  missingKeywords: string[];
  postedAt: string | null;
  status: "matched" | "applied";
};

export type JobApplication = {
  id: string;
  matchId: string;
  jobId: string;
  title: string;
  company: string;
  url: string;
  appliedAt: string;
  status: "applied" | "reviewing";
};

export type JobHuntSnapshot = {
  matches: JobMatch[];
  applications: JobApplication[];
  lastScanAt: string | null;
};

export function getJobHuntSnapshot() {
  return apiRequest<JobHuntSnapshot>("/api/v1/job-hunt");
}

export function scanJobMatches(resumeText: string, jobs: JobListing[]) {
  return apiRequest<JobHuntSnapshot>("/api/v1/job-hunt/scan", {
    method: "POST",
    body: JSON.stringify({ resumeText, jobs: jobs.slice(0, 100) }),
  });
}

export function recordApplication(matchId: string) {
  return apiRequest<JobApplication>("/api/v1/job-hunt/applications", {
    method: "POST",
    body: JSON.stringify({ matchId }),
  });
}
