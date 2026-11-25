import { leadContact } from "@/lib/leads";
import type { LeadsResponse, LocalLead } from "@/types/leads";
import type { GrowthWatch, WatchChange, WatchReport } from "@/types/watchlists";

type Baseline = { checkedAt: string; limited: boolean; leads: LocalLead[] };
export type StoredWatch = GrowthWatch & { baseline: Baseline };

export function publicWatch({ baseline: _baseline, ...watch }: StoredWatch): GrowthWatch {
  return watch;
}

const comparedFields = [
  ["name", "Business name"],
  ["address", "Address"],
  ["website", "Website"],
  ["phone", "Phone"],
  ["email", "Email"],
] as const;

const normalized = (value: string) => value.trim().replace(/\s+/g, " ").toLowerCase();

function sameField(lead: LocalLead, previous: LocalLead, field: typeof comparedFields[number][0]) {
  if (field === "phone") return leadContact(lead).phone === leadContact(previous).phone;
  if (field === "website") return lead.website === previous.website;
  return normalized(lead[field]) === normalized(previous[field]);
}

export function compareWatch(result: LeadsResponse, previous?: Baseline) {
  const limited = result.limitedCoverage === true;
  const baseline: Baseline = {
    checkedAt: result.fetchedAt,
    limited,
    leads: result.leads,
  };
  const status: WatchReport["status"] = !previous ? "baseline" :
    previous.limited === limited ? "compared" : limited ? "limited" : "expanded";
  const report: WatchReport = {
    checkedAt: result.fetchedAt, comparedWith: status === "compared" ? previous?.checkedAt ?? null : null,
    status, total: result.leads.length, limitedCoverage: limited, newLeads: [], changedLeads: [],
  };
  if (status === "limited") return { baseline: previous!, report };
  if (status !== "compared" || !previous) return { baseline, report };

  const prior = new Map(previous.leads.map((lead) => [lead.id, lead]));
  for (const lead of result.leads) {
    const existing = prior.get(lead.id);
    if (!existing) {
      report.newLeads.push(lead);
      continue;
    }
    const changes: WatchChange[] = [];
    for (const [field, label] of comparedFields) {
      if (limited && field !== "name" && field !== "address") continue;
      if (!sameField(lead, existing, field)) changes.push({ field: label, before: existing[field], after: lead[field] });
    }
    if (changes.length) report.changedLeads.push({ lead, changes });
  }
  return { baseline, report };
}
