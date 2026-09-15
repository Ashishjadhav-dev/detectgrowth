import { NextResponse } from "next/server";
import type { JobListing, JobSource, JobsResponse } from "@/types/jobs";

export const revalidate = 300;

const feeds: Array<{ source: JobSource; url: string }> = [
  { source: "Arbeitnow", url: "https://www.arbeitnow.com/api/job-board-api?page=2&search=" },
  { source: "Airbnb", url: "https://boards-api.greenhouse.io/v1/boards/airbnb/jobs?content=true" },
  { source: "Netflix", url: "https://api.lever.co/v0/postings/netflix?mode=json" },
];

function stripHtml(value: unknown) {
  return typeof value === "string"
    ? value.replace(/<[^>]*>/g, " ").replace(/&nbsp;/g, " ").replace(/&amp;/g, "&").replace(/\s+/g, " ").trim()
    : "";
}

function workplace(location: string, remote?: boolean) {
  const value = location.toLowerCase();
  if (remote || value.includes("remote") || value.includes("work from home")) return "Remote" as const;
  if (value.includes("hybrid")) return "Hybrid" as const;
  if (location) return "On-site" as const;
  return "Unknown" as const;
}

function dateValue(value: unknown) {
  if (typeof value === "number") return new Date(value < 10_000_000_000 ? value * 1000 : value).toISOString();
  if (typeof value === "string" && value) {
    const date = new Date(value);
    if (!Number.isNaN(date.getTime())) return date.toISOString();
  }
  return null;
}

function arbeitnowJobs(payload: { data?: Array<Record<string, unknown>> }): JobListing[] {
  return (payload.data ?? []).map((job, index) => {
    const location = String(job.location ?? "");
    return {
      id: `arbeitnow-${String(job.slug ?? job.id ?? index)}`,
      title: String(job.title ?? "Untitled role"),
      company: String(job.company_name ?? "Unknown company"),
      location,
      workplace: workplace(location, Boolean(job.remote)),
      source: "Arbeitnow",
      description: stripHtml(job.description),
      url: String(job.url ?? "https://www.arbeitnow.com/"),
      postedAt: dateValue(job.created_at),
      department: Array.isArray(job.tags) ? String(job.tags[0] ?? "") : "",
      employmentType: Array.isArray(job.job_types) ? String(job.job_types[0] ?? "") : "",
      logoUrl: typeof job.company_logo === "string" ? job.company_logo : undefined,
    };
  });
}

function greenhouseJobs(payload: { jobs?: Array<Record<string, unknown>> }): JobListing[] {
  return (payload.jobs ?? []).map((job) => {
    const location = typeof job.location === "object" && job.location ? String((job.location as Record<string, unknown>).name ?? "") : "";
    const departments = Array.isArray(job.departments) ? job.departments as Array<Record<string, unknown>> : [];
    return {
      id: `airbnb-${String(job.id)}`,
      title: String(job.title ?? "Untitled role"),
      company: "Airbnb",
      location,
      workplace: workplace(location),
      source: "Airbnb",
      description: stripHtml(job.content),
      url: String(job.absolute_url ?? "https://careers.airbnb.com/"),
      postedAt: dateValue(job.updated_at),
      department: String(departments[0]?.name ?? ""),
      employmentType: "",
    };
  });
}

function leverJobs(payload: Array<Record<string, unknown>>): JobListing[] {
  return payload.map((job) => {
    const categories = typeof job.categories === "object" && job.categories ? job.categories as Record<string, unknown> : {};
    const location = String(categories.location ?? "");
    return {
      id: `netflix-${String(job.id)}`,
      title: String(job.text ?? "Untitled role"),
      company: "Netflix",
      location,
      workplace: workplace(location),
      source: "Netflix",
      description: stripHtml(job.descriptionPlain ?? job.description),
      url: String(job.hostedUrl ?? job.applyUrl ?? "https://jobs.netflix.com/"),
      postedAt: dateValue(job.createdAt),
      department: String(categories.team ?? ""),
      employmentType: String(categories.commitment ?? ""),
    };
  });
}

async function fetchFeed(feed: (typeof feeds)[number]) {
  const response = await fetch(feed.url, { next: { revalidate: 300 }, headers: { Accept: "application/json" } });
  if (!response.ok) throw new Error(`${response.status} ${response.statusText}`);
  const payload = await response.json();
  if (feed.source === "Arbeitnow") return arbeitnowJobs(payload);
  if (feed.source === "Airbnb") return greenhouseJobs(payload);
  return leverJobs(payload);
}

export async function GET() {
  const results = await Promise.allSettled(feeds.map(fetchFeed));
  const jobs: JobListing[] = [];
  const sources = {} as JobsResponse["sources"];

  results.forEach((result, index) => {
    const source = feeds[index].source;
    if (result.status === "fulfilled") {
      jobs.push(...result.value);
      sources[source] = { ok: true, count: result.value.length };
    } else {
      sources[source] = { ok: false, count: 0, error: result.reason instanceof Error ? result.reason.message : "Unable to load feed" };
    }
  });

  const body: JobsResponse = { jobs, sources, fetchedAt: new Date().toISOString() };
  return NextResponse.json(body, { headers: { "Cache-Control": "s-maxage=300, stale-while-revalidate=600" } });
}
