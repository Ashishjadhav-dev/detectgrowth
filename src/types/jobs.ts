export type JobSource = "Arbeitnow" | "Airbnb" | "Netflix";

export type JobListing = {
  id: string;
  title: string;
  company: string;
  location: string;
  workplace: "Remote" | "Hybrid" | "On-site" | "Unknown";
  source: JobSource;
  description: string;
  url: string;
  postedAt: string | null;
  department: string;
  employmentType: string;
  logoUrl?: string;
};

export type JobsResponse = {
  jobs: JobListing[];
  sources: Record<JobSource, { ok: boolean; count: number; error?: string }>;
  fetchedAt: string;
};
