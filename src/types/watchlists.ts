import type { LocalLead } from "./leads";

export type LeadMarket = {
  locality: string;
  category: string;
  radius: number;
};

export type WatchChange = {
  field: "Business name" | "Address" | "Website" | "Phone" | "Email";
  before: string;
  after: string;
};

export type WatchReport = {
  checkedAt: string;
  comparedWith: string | null;
  status: "baseline" | "compared" | "limited" | "expanded";
  total: number;
  limitedCoverage: boolean;
  newLeads: LocalLead[];
  changedLeads: { lead: LocalLead; changes: WatchChange[] }[];
};

export type GrowthWatch = {
  id: string;
  market: LeadMarket;
  resolvedLocality: string;
  demo: boolean;
  report: WatchReport;
};
