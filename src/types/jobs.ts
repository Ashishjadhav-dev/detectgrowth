export type JobSource = string;

export type JobListing = {
  id: string;
  title: string;
  company: string;
  location: string;
  workplace: "Remote" | "Hybrid" | "On-site" | "Unknown";
  source: JobSource;
  tags: string[];
  description: string;
  url: string;
  postedAt: string | null;
  department: string;
  employmentType: string;
  logoUrl?: string;
};

export type JobsResponse = {
  jobs: JobListing[];
  sources: Record<string, { ok: boolean; count: number; error?: string }>;
  fetchedAt: string;
};
