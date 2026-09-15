import { NextResponse } from "next/server";
import type { JobListing, JobSource, JobsResponse } from "@/types/jobs";

export const revalidate = 300;

const DEFAULT_GREENHOUSE_BOARDS = ["airbnb"];
const DEFAULT_LEVER_BOARDS = ["netflix"];

function boardSlugs(value: string | null, fallback: string[]) {
  const values = (value ?? "").split(",").map((item) => item.trim().toLowerCase()).filter(Boolean);
  return [...new Set(values.length ? values : fallback)];
}

function displayName(slug: string) {
  return slug.split(/[-_]+/).map((word) => word ? word[0].toUpperCase() + word.slice(1) : "").join(" ");
}

function feedsFor(request: Request) {
  const params = new URL(request.url).searchParams;
  const greenhouse = boardSlugs(params.get("greenhouse"), DEFAULT_GREENHOUSE_BOARDS);
  const lever = boardSlugs(params.get("lever"), DEFAULT_LEVER_BOARDS);
  return [
    { source: "Arbeitnow", url: "https://www.arbeitnow.com/api/job-board-api?page=2&search=", kind: "arbeitnow" as const },
    ...greenhouse.map((slug) => ({ source: `Greenhouse · ${displayName(slug)}`, url: `https://boards-api.greenhouse.io/v1/boards/${encodeURIComponent(slug)}/jobs?content=true`, kind: "greenhouse" as const, company: displayName(slug) })),
    ...lever.map((slug) => ({ source: `Lever · ${displayName(slug)}`, url: `https://api.lever.co/v0/postings/${encodeURIComponent(slug)}?mode=json`, kind: "lever" as const, company: displayName(slug) })),
  ];
}

function decodeEntities(value: string) {
  const named: Record<string, string> = { amp: "&", nbsp: " ", apos: "'", quot: '"', lt: "<", gt: ">", ndash: "–", mdash: "—", hellip: "…" };
  return value.replace(/&#(x?[\da-f]+);|&([a-z]+);/gi, (match, numeric, name) => {
    if (numeric) {
      const code = numeric[0].toLowerCase() === "x" ? parseInt(numeric.slice(1), 16) : parseInt(numeric, 10);
      return Number.isNaN(code) ? match : String.fromCodePoint(code);
    }
    return named[name.toLowerCase()] ?? match;
  });
}

function stripHtml(value: unknown) {
  return typeof value === "string"
    ? decodeEntities(value.replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").trim())
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
      tags: Array.isArray(job.tags) ? job.tags.map(String).filter((tag) => tag.toLowerCase() !== "remote") : [],
      description: stripHtml(job.description),
      url: String(job.url ?? "https://www.arbeitnow.com/"),
      postedAt: dateValue(job.created_at),
      department: String(job.category ?? ""),
      employmentType: Array.isArray(job.job_types) ? String(job.job_types[0] ?? "") : "",
      logoUrl: typeof job.company_logo === "string" ? job.company_logo : undefined,
    };
  });
}

function greenhouseJobs(payload: { jobs?: Array<Record<string, unknown>> }, source: string, company: string): JobListing[] {
  return (payload.jobs ?? []).map((job) => {
    const location = typeof job.location === "object" && job.location ? String((job.location as Record<string, unknown>).name ?? "") : "";
    const departments = Array.isArray(job.departments) ? job.departments as Array<Record<string, unknown>> : [];
    return {
      id: `${source.toLowerCase().replace(/[^a-z]+/g, "-")}-${String(job.id)}`,
      title: String(job.title ?? "Untitled role"),
      company,
      location,
      workplace: workplace(location),
      source,
      tags: departments.map((department) => String(department.name ?? "")).filter(Boolean),
      description: stripHtml(job.content),
      url: String(job.absolute_url ?? "https://careers.airbnb.com/"),
      postedAt: dateValue(job.updated_at),
      department: String(departments[0]?.name ?? ""),
      employmentType: "",
    };
  });
}

function leverJobs(payload: Array<Record<string, unknown>>, source: string, company: string): JobListing[] {
  return payload.map((job) => {
    const categories = typeof job.categories === "object" && job.categories ? job.categories as Record<string, unknown> : {};
    const location = String(categories.location ?? "");
    return {
      id: `${source.toLowerCase().replace(/[^a-z]+/g, "-")}-${String(job.id)}`,
      title: String(job.text ?? "Untitled role"),
      company,
      location,
      workplace: workplace(location),
      source,
      tags: [String(categories.team ?? ""), String(categories.department ?? "")].filter(Boolean),
      description: stripHtml(job.descriptionPlain ?? job.description),
      url: String(job.hostedUrl ?? job.applyUrl ?? "https://jobs.netflix.com/"),
      postedAt: dateValue(job.createdAt),
      department: String(categories.team ?? ""),
      employmentType: String(categories.commitment ?? ""),
    };
  });
}

async function fetchFeed(feed: ReturnType<typeof feedsFor>[number]) {
  const response = await fetch(feed.url, { next: { revalidate: 300 }, headers: { Accept: "application/json" } });
  if (!response.ok) throw new Error(`${response.status} ${response.statusText}`);
  const payload = await response.json();
  if (feed.kind === "arbeitnow") return arbeitnowJobs(payload);
  if (feed.kind === "greenhouse") return greenhouseJobs(payload, feed.source, feed.company);
  return leverJobs(payload, feed.source, feed.company);
}

export async function GET(request: Request) {
  const feeds = feedsFor(request);
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
