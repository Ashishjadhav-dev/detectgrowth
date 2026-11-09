import { NextResponse } from "next/server";
import type { JobListing, JobSource, JobsResponse } from "@/types/jobs";
import { matchesRelatedRoleQuery, matchesRoleQuery } from "@/lib/jobs-search";

export const revalidate = 300;
const configuredBackendUrl = process.env.NEXT_PUBLIC_API_URL ?? "";
const backendBaseUrl = /^https?:\/\//i.test(configuredBackendUrl) ? configuredBackendUrl.replace(/\/$/, "") : "";

const MAX_BOARD_COUNT = 20;
const MAX_BOARD_SLUG_LENGTH = 80;
const MAX_SEARCH_LENGTH = 200;
const FEED_TIMEOUT_MS = 12_000;
type FeedKind = "arbeitnow" | "greenhouse" | "lever" | "remotive" | "himalayas" | "adzuna";

function boardSlugs(value: string | null, fallback: string[]) {
  const values = (value ?? "")
    .split(",")
    .map((item) => item.trim().toLowerCase())
    .filter((item) => /^[a-z0-9][a-z0-9_-]*$/.test(item) && item.length <= MAX_BOARD_SLUG_LENGTH);
  return [...new Set(values.length ? values : fallback)].slice(0, MAX_BOARD_COUNT);
}

function displayName(slug: string) {
  return slug.split(/[-_]+/).map((word) => word ? word[0].toUpperCase() + word.slice(1) : "").join(" ");
}

function textValue(value: unknown, fallback = "") {
  if (typeof value === "string") return value.trim();
  if (value === null || value === undefined) return fallback;
  return String(value);
}

function configuredBoards(key: string) {
  return boardSlugs(process.env[key] ?? "", []);
}

function feedsFor(request: Request) {
  const params = new URL(request.url).searchParams;
  const search = params.get("search")?.trim().slice(0, MAX_SEARCH_LENGTH) ?? "";
  const page = Math.max(1, Number(params.get("page") ?? "1") || 1);
  const greenhouse = configuredBoards("JOB_GREENHOUSE_BOARDS");
  const lever = configuredBoards("JOB_LEVER_BOARDS");
  const remotiveParams = new URLSearchParams({ limit: "20" });
  if (/software|developer|engineer|frontend|backend|devops|qa|data|programmer|tech/i.test(search)) remotiveParams.set("category", "software-dev");
  if (search) remotiveParams.set("search", search);
  const himalayasParams = new URLSearchParams({ country: "IN", sort: "recent", page: String(page) });
  if (search) himalayasParams.set("q", search);
  const feeds: Array<{ source: string; url: string; kind: FeedKind; company?: string }> = [
    { source: "Arbeitnow", url: `https://www.arbeitnow.com/api/job-board-api?page=${page}&search=${encodeURIComponent(search)}`, kind: "arbeitnow" },
    { source: "Remotive", url: `https://remotive.com/api/remote-jobs?${remotiveParams}`, kind: "remotive" },
    { source: "Himalayas", url: `https://himalayas.app/jobs/api/search?${himalayasParams}`, kind: "himalayas" },
  ];
  const adzunaAppId = process.env.ADZUNA_APP_ID?.trim();
  const adzunaAppKey = process.env.ADZUNA_APP_KEY?.trim();
  if (adzunaAppId && adzunaAppKey) {
    const location = params.get("location")?.trim();
    const where = location && location !== "All India" ? `&where=${encodeURIComponent(location)}` : "&where=India";
    feeds.push({ source: "Adzuna India", url: `https://api.adzuna.com/v1/api/jobs/in/search/${page}?app_id=${encodeURIComponent(adzunaAppId)}&app_key=${encodeURIComponent(adzunaAppKey)}&what=${encodeURIComponent(search)}${where}&results_per_page=100&sort_by=date`, kind: "adzuna" });
  }
  feeds.push(
    ...greenhouse.map((slug) => ({ source: `Greenhouse · ${displayName(slug)}`, url: `https://boards-api.greenhouse.io/v1/boards/${encodeURIComponent(slug)}/jobs?content=true`, kind: "greenhouse" as const, company: displayName(slug) })),
    ...lever.map((slug) => ({ source: `Lever · ${displayName(slug)}`, url: `https://api.lever.co/v0/postings/${encodeURIComponent(slug)}?mode=json`, kind: "lever" as const, company: displayName(slug) }))
  );
  return feeds;
}

const INDIA_ALIASES: Record<string, string[]> = {
  "All India": ["india", "bengaluru", "bangalore", "mumbai", "delhi", "gurugram", "gurgaon", "noida", "hyderabad", "pune", "chennai", "kolkata", "ahmedabad", "kochi", "jaipur", "remote"],
  Bengaluru: ["bengaluru", "bangalore"],
  Mumbai: ["mumbai"],
  "Delhi NCR": ["delhi", "new delhi", "gurugram", "gurgaon", "noida"],
  Hyderabad: ["hyderabad"],
  Pune: ["pune"],
  Chennai: ["chennai", "madras"],
  Gurugram: ["gurugram", "gurgaon"],
  Noida: ["noida"],
  Kolkata: ["kolkata", "calcutta"],
  Ahmedabad: ["ahmedabad"],
  Kochi: ["kochi", "cochin"],
  Jaipur: ["jaipur"],
  "Remote India": ["remote", "india"],
};

function matchesLocation(location: string, filter: string, workplaceValue = "") {
  if (!filter || filter === "Any location") return true;
  if ((filter === "All India" || filter === "Remote India") && workplaceValue === "Remote") return true;
  const value = location.toLowerCase();
  return (INDIA_ALIASES[filter] ?? [filter.toLowerCase()]).some((alias) => value.includes(alias));
}

function matchesTerms(job: JobListing, query: string) {
  return matchesRoleQuery(job, query);
}

function postedSince(filter: string) {
  const days = filter === "24 hours" ? 1 / 24 : filter === "7 days" ? 7 : filter === "30 days" ? 30 : 0;
  return days ? Date.now() - days * 86_400_000 : 0;
}

function matchesFilters(job: JobListing, search: string, location: string, employmentType: string, postedWithin: string) {
  return matchesTerms(job, search) && matchesLocation(job.location, location, job.workplace) &&
    (!employmentType || employmentType === "Any type" || job.employmentType.toLowerCase().includes(employmentType.toLowerCase())) &&
    (!postedSince(postedWithin) || (job.postedAt ? new Date(job.postedAt).getTime() >= postedSince(postedWithin) : false));
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
  if (typeof value !== "string") return "";
  let text = value;
  // Some feeds return escaped HTML (for example &lt;div&gt;), so decode first.
  for (let pass = 0; pass < 2; pass += 1) text = decodeEntities(text);
  return text
    .replace(/<!--[\s\S]*?-->/g, " ")
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/<\/(p|div|li|h[1-6]|section|article|ul|ol)>/gi, "\n")
    .replace(/<[^>]*>/g, " ")
    .replace(/[ \t]+/g, " ")
    .replace(/\n\s*\n+/g, "\n")
    .trim();
}

function descriptionExcerpt(description: string, company: string) {
  const sentences = description.split(/(?<=[.!?])\s+/).map((sentence) => sentence.trim()).filter(Boolean);
  const companyName = company.toLowerCase();
  const useful = sentences.filter((sentence, index) => {
    const value = sentence.toLowerCase();
    const boilerplate = index < 3 && (
      value.startsWith("about us") || value.startsWith("who we are") || value.startsWith("we are ") ||
      value.startsWith("we're ") || value.startsWith("at ") || value.startsWith("founded ") ||
      value.startsWith("wir sind ") || value.startsWith("über uns") || value.includes(`${companyName} is`)
    );
    return !boilerplate;
  });
  return (useful.length ? useful : sentences).slice(0, 2).join(" ").slice(0, 360).trim();
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

function safeJobUrl(value: unknown, fallback: string) {
  const candidate = textValue(value);
  try {
    const url = new URL(candidate || fallback);
    return url.protocol === "https:" ? url.toString() : fallback;
  } catch {
    return fallback;
  }
}

function arbeitnowJobs(payload: { data?: Array<Record<string, unknown>> }): JobListing[] {
  return (payload.data ?? []).map((job, index) => {
    const location = textValue(job.location);
    return {
      id: `arbeitnow-${String(job.slug ?? job.id ?? index)}`,
      title: textValue(job.title, "Untitled role"),
      company: textValue(job.company_name, "Unknown company"),
      location,
      workplace: workplace(location, Boolean(job.remote)),
      source: "Arbeitnow",
      tags: Array.isArray(job.tags) ? job.tags.map(String).filter((tag) => tag.toLowerCase() !== "remote") : [],
      description: descriptionExcerpt(stripHtml(job.description), textValue(job.company_name, "Unknown company")),
      url: safeJobUrl(job.url, "https://www.arbeitnow.com/"),
      postedAt: dateValue(job.created_at),
      department: String(job.category ?? ""),
      employmentType: Array.isArray(job.job_types) ? textValue(job.job_types[0]) : "",
      logoUrl: textValue(job.company_logo) || undefined,
    };
  });
}

function greenhouseJobs(payload: { jobs?: Array<Record<string, unknown>> }, source: string, company: string): JobListing[] {
  return (payload.jobs ?? []).map((job) => {
    const location = typeof job.location === "object" && job.location ? textValue((job.location as Record<string, unknown>).name) : "";
    const departments = Array.isArray(job.departments) ? job.departments as Array<Record<string, unknown>> : [];
    return {
      id: `${source.toLowerCase().replace(/[^a-z]+/g, "-")}-${String(job.id)}`,
      title: textValue(job.title, "Untitled role"),
      company,
      location,
      workplace: workplace(location),
      source,
      tags: departments.map((department) => String(department.name ?? "")).filter(Boolean),
      description: descriptionExcerpt(stripHtml(job.content), company),
      url: safeJobUrl(job.absolute_url, "https://boards.greenhouse.io/"),
      postedAt: dateValue(job.updated_at),
      department: String(departments[0]?.name ?? ""),
      employmentType: "",
    };
  });
}

function leverJobs(payload: Array<Record<string, unknown>>, source: string, company: string): JobListing[] {
  return payload.map((job) => {
    const categories = typeof job.categories === "object" && job.categories ? job.categories as Record<string, unknown> : {};
    const location = textValue(categories.location);
    return {
      id: `${source.toLowerCase().replace(/[^a-z]+/g, "-")}-${String(job.id)}`,
      title: textValue(job.text, "Untitled role"),
      company,
      location,
      workplace: workplace(location),
      source,
      tags: [String(categories.team ?? ""), String(categories.department ?? "")].filter(Boolean),
      description: descriptionExcerpt(stripHtml(job.descriptionPlain ?? job.description), company),
      url: safeJobUrl(job.hostedUrl ?? job.applyUrl, "https://jobs.lever.co/"),
      postedAt: dateValue(job.createdAt),
      department: String(categories.team ?? ""),
      employmentType: String(categories.commitment ?? ""),
    };
  });
}

function remotiveJobs(payload: { jobs?: Array<Record<string, unknown>> }): JobListing[] {
  return (payload.jobs ?? []).map((job) => {
    const location = textValue(job.candidate_required_location, "Remote");
    return {
      id: `remotive-${String(job.id)}`,
      title: textValue(job.title, "Untitled role"),
      company: textValue(job.company_name, "Unknown company"),
      location,
      workplace: "Remote",
      source: "Remotive",
      tags: Array.isArray(job.tags) ? job.tags.map(String) : [textValue(job.category)].filter(Boolean),
      description: descriptionExcerpt(stripHtml(job.description), textValue(job.company_name, "Unknown company")),
      url: safeJobUrl(job.url, "https://remotive.com/"),
      postedAt: dateValue(job.publication_date),
      department: textValue(job.category),
      employmentType: textValue(job.job_type),
      logoUrl: textValue(job.company_logo) || undefined,
    };
  });
}

function adzunaJobs(payload: { results?: Array<Record<string, unknown>> }): JobListing[] {
  return (payload.results ?? []).map((job) => {
    const company = typeof job.company === "object" && job.company ? textValue((job.company as Record<string, unknown>).display_name, "Unknown company") : "Unknown company";
    const location = typeof job.location === "object" && job.location ? textValue((job.location as Record<string, unknown>).display_name, "India") : "India";
    const category = typeof job.category === "object" && job.category ? textValue((job.category as Record<string, unknown>).label) : "";
    return {
      id: `adzuna-in-${String(job.id)}`,
      title: textValue(job.title, "Untitled role"),
      company,
      location,
      workplace: workplace(location, false),
      source: "Adzuna India",
      tags: [category].filter(Boolean),
      description: descriptionExcerpt(stripHtml(job.description ?? job.redirect_url), company),
      url: safeJobUrl(job.redirect_url, "https://www.adzuna.in/"),
      postedAt: dateValue(job.created),
      department: category,
      employmentType: textValue(job.contract_time ?? job.contract_type),
    };
  });
}

function himalayasJobs(payload: { jobs?: Array<Record<string, unknown>> }): JobListing[] {
  return (payload.jobs ?? []).map((job) => {
    const restrictions = Array.isArray(job.locationRestrictions) ? job.locationRestrictions as Array<Record<string, unknown>> : [];
    const location = restrictions.map((item) => textValue(item.name || item.alpha2)).filter(Boolean).join(", ") || "Remote / Worldwide";
    const categories = Array.isArray(job.categories) ? job.categories.map(String) : [];
    return {
      id: `himalayas-${textValue(job.guid || job.slug || job.title)}`,
      title: textValue(job.title, "Untitled role"),
      company: textValue(job.companyName, "Unknown company"),
      location,
      workplace: "Remote",
      source: "Himalayas",
      tags: [...categories, textValue(job.seniority)].filter(Boolean),
      description: descriptionExcerpt(stripHtml(job.description ?? job.excerpt), textValue(job.companyName, "Unknown company")),
      url: safeJobUrl(job.applicationLink, "https://himalayas.app/"),
      postedAt: dateValue(job.pubDate),
      department: categories[0] ?? "",
      employmentType: textValue(job.employmentType),
      logoUrl: textValue(job.companyLogo) || undefined,
    };
  });
}

async function fetchFeed(feed: ReturnType<typeof feedsFor>[number]) {
  const response = await fetch(feed.url, {
    next: { revalidate: 300 },
    headers: { Accept: "application/json", "User-Agent": "DetectGrowth/1.0 job-feed-sync" },
    signal: AbortSignal.timeout(FEED_TIMEOUT_MS),
  });
  if (!response.ok) throw new Error(`${response.status} ${response.statusText}`);
  const payload = await response.json();
  if (feed.kind === "arbeitnow") return arbeitnowJobs(payload);
  if (feed.kind === "greenhouse") return greenhouseJobs(payload, feed.source, feed.company ?? "Unknown company");
  if (feed.kind === "lever") return leverJobs(payload, feed.source, feed.company ?? "Unknown company");
  if (feed.kind === "remotive") return remotiveJobs(payload);
  if (feed.kind === "himalayas") return himalayasJobs(payload);
  return adzunaJobs(payload);
}

export async function GET(request: Request) {
  if (backendBaseUrl) {
    const incoming = new URL(request.url);
    const backendUrl = new URL("/api/v1/jobs", backendBaseUrl);
    for (const key of ["q", "search", "source", "workplace", "location", "employmentType", "postedWithin", "page", "pageSize"]) {
      const value = incoming.searchParams.get(key);
      if (value) backendUrl.searchParams.set(key === "search" ? "q" : key, value);
    }
    try {
      const response = await fetch(backendUrl, {
        headers: { Accept: "application/json", Cookie: request.headers.get("cookie") ?? "" },
        cache: "no-store",
        signal: AbortSignal.timeout(FEED_TIMEOUT_MS),
      });
      const payload = await response.json() as { data?: JobsResponse; meta?: JobsResponse["meta"]; error?: { message?: string } };
      if (!response.ok || !payload.data) return NextResponse.json({ error: payload.error?.message ?? "Unable to load jobs." }, { status: response.status || 502 });
      return NextResponse.json({ ...payload.data, meta: payload.meta }, { headers: { "Cache-Control": "private, no-store" } });
    } catch {
      return NextResponse.json({ error: "The jobs service is temporarily unavailable." }, { status: 502 });
    }
  }
  if (process.env.JOBS_DATA_MODE !== "live") {
    const { demoJobs } = await import("@/data/demo-jobs");
    const query = new URL(request.url).searchParams.get("search")?.trim().slice(0, MAX_SEARCH_LENGTH).toLowerCase() ?? "";
    const params = new URL(request.url).searchParams;
    const location = params.get("location") ?? "All India";
    const employmentType = params.get("employmentType") ?? "Any type";
    const postedWithin = params.get("postedWithin") ?? "Any time";
    const jobs = demoJobs.jobs.filter((job) => matchesFilters(job, query, location, employmentType, postedWithin));
    return NextResponse.json(
      { ...demoJobs, jobs, meta: { page: 1, pageSize: jobs.length, total: jobs.length, hasNextPage: false } },
      { headers: { "Cache-Control": "private, no-store" } },
    );
  }
  const feeds = feedsFor(request);
  const params = new URL(request.url).searchParams;
  const search = params.get("search")?.trim().slice(0, MAX_SEARCH_LENGTH).toLowerCase() ?? "";
  const location = params.get("location") ?? "All India";
  const employmentType = params.get("employmentType") ?? "Any type";
  const postedWithin = params.get("postedWithin") ?? "Any time";
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

  const uniqueJobs = [...new Map(jobs.map((job) => [job.url, job])).values()];
  const matchingJobs = uniqueJobs.filter((job) => matchesFilters(job, search, location, employmentType, postedWithin));
  let outputJobs = matchingJobs;
  let isFallback = false;
  let fallbackKind: "related" | "recent" | undefined;
  if (!matchingJobs.length && search) {
    const related = uniqueJobs.filter((job) => matchesRelatedRoleQuery(job, search) && matchesFilters(job, "", location, employmentType, postedWithin));
    outputJobs = related.length ? related : uniqueJobs.filter((job) => matchesRelatedRoleQuery(job, search)).slice(0, 12);
    if (!outputJobs.length) outputJobs = uniqueJobs.slice(0, 12);
    isFallback = outputJobs.length > 0;
    fallbackKind = related.length ? "related" : "recent";
  }
  const page = Math.max(1, Number(params.get("page") ?? "1") || 1);
  const pageSize = Math.min(100, Math.max(1, Number(params.get("pageSize") ?? "100") || 100));
  const pageJobs = outputJobs.slice((page - 1) * pageSize, page * pageSize);
  const body: JobsResponse = { jobs: pageJobs, sources, fetchedAt: new Date().toISOString(), meta: { page, pageSize, total: outputJobs.length, hasNextPage: page * pageSize < outputJobs.length, isFallback, fallbackKind } };
  return NextResponse.json(body, { headers: { "Cache-Control": "s-maxage=300, stale-while-revalidate=600" } });
}
