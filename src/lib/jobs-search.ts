import type { JobListing } from "@/types/jobs";

const ROLE_SYNONYMS: Record<string, string[]> = {
  developer: ["developer", "engineer", "programmer", "software engineer", "application engineer"],
  engineer: ["engineer", "developer", "programmer"],
  frontend: ["frontend", "front-end", "front end", "ui developer", "web developer"],
  backend: ["backend", "back-end", "back end", "server-side", "api developer"],
  qa: ["qa", "quality assurance", "test engineer", "tester", "sdet"],
  tester: ["tester", "qa", "quality assurance", "test engineer", "sdet"],
  designer: ["designer", "ux", "ui designer", "product designer"],
  "product manager": ["product manager", "product owner", "product lead"],
  analyst: ["analyst", "business analyst", "data analyst"],
};

function alternativesFor(term: string) {
  return ROLE_SYNONYMS[term] ?? [term];
}

export function searchableJobText(job: JobListing) {
  return `${job.title} ${job.company} ${job.location} ${job.department} ${job.employmentType} ${job.source} ${job.description} ${job.tags.join(" ")}`.toLowerCase();
}

export function matchesRoleQuery(job: JobListing, query: string) {
  const searchable = searchableJobText(job);
  return query.toLowerCase().split(/\s+/).filter(Boolean).every((term) => {
    const alternatives = alternativesFor(term);
    return alternatives.some((alternative) => searchable.includes(alternative));
  });
}

export function matchesRelatedRoleQuery(job: JobListing, query: string) {
  const searchable = searchableJobText(job);
  return query.toLowerCase().split(/\s+/).filter(Boolean).some((term) => alternativesFor(term).some((alternative) => searchable.includes(alternative)));
}
