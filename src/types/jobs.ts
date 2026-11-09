export type JobSource = string;

export const INDIA_LOCATION_OPTIONS = [
  "All India",
  "Bengaluru",
  "Mumbai",
  "Delhi NCR",
  "Hyderabad",
  "Pune",
  "Chennai",
  "Gurugram",
  "Noida",
  "Kolkata",
  "Ahmedabad",
  "Kochi",
  "Jaipur",
  "Remote India",
] as const;

export const EMPLOYMENT_TYPE_OPTIONS = ["Any type", "Full-time", "Part-time", "Contract", "Internship"] as const;
export const POSTED_WITHIN_OPTIONS = ["Any time", "24 hours", "7 days", "30 days"] as const;

export type IndiaLocationFilter = (typeof INDIA_LOCATION_OPTIONS)[number];
export type EmploymentTypeFilter = (typeof EMPLOYMENT_TYPE_OPTIONS)[number];
export type PostedWithinFilter = (typeof POSTED_WITHIN_OPTIONS)[number];

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
  meta?: { page: number; pageSize: number; total: number; hasNextPage: boolean; isFallback?: boolean; fallbackKind?: "related" | "recent" };
};
