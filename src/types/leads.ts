export type LeadStatus = "New" | "Contacted" | "Interested" | "Won" | "Not interested";

export type WebsiteAudit = {
  checkedAt: string;
  status: number | null;
  hasWebsite: boolean;
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
  website: string;
  mapsUrl: string;
  rating: number | null;
  reviewCount: number;
  status: LeadStatus;
  source: "Google Places" | "Demo data";
  isDemo?: boolean;
  audit?: WebsiteAudit;
};

export type LeadsResponse = {
  leads: LocalLead[];
  source: string;
  isDemo: boolean;
  fetchedAt: string;
};
