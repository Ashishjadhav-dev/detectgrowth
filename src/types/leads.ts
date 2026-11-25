export const leadStatuses = ["New", "Contacted", "Interested", "Won", "Not interested"] as const;
export type LeadStatus = (typeof leadStatuses)[number];
export type LeadSource = "OpenStreetMap" | "Google Places" | "Demo";

export type WebsiteAudit = {
  checkedAt: string;
  status: number;
  title: string;
  mobileReady: boolean | null;
  secure: boolean;
  lastModified: string | null;
  changeSignals: string[];
};

export type LocalLead = {
  id: string;
  name: string;
  category: string;
  address: string;
  locality: string;
  phone: string;
  email: string;
  website: string;
  mapsUrl: string;
  rating: number | null;
  reviewCount: number;
  source: LeadSource;
  nameIndexOnly?: boolean;
};

export type SavedLead = LocalLead & {
  status: LeadStatus;
  notes: string;
  savedAt: string;
  websiteAudit?: WebsiteAudit;
};

export type LeadsResponse = {
  leads: LocalLead[];
  source: LeadSource;
  resolvedLocality: string | null;
  fetchedAt: string;
  limitedCoverage?: boolean;
};
