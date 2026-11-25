import type { LocalLead, WebsiteAudit } from "@/types/leads";
import type { LeadMarket } from "@/types/watchlists";

export const leadCategories = {
  "Dental clinics": ['["amenity"="dentist"]', '["healthcare"="dentist"]'],
  "Clinics": ['["amenity"~"^(clinic|doctors)$"]', '["healthcare"~"^(clinic|doctor|physiotherapist)$"]'],
  "Restaurants": ['["amenity"~"^(restaurant|fast_food)$"]'],
  "Cafés": ['["amenity"="cafe"]'],
  "Salons & barbers": ['["shop"~"^(hairdresser|barber|beauty)$"]'],
  "Gyms & fitness": ['["leisure"~"^(fitness_centre|sports_centre)$"]', '["sport"="fitness"]'],
  "Hotels": ['["tourism"~"^(hotel|guest_house|hostel)$"]'],
  "Real estate agencies": ['["office"="estate_agent"]'],
  "Auto repair": ['["shop"~"^(car_repair|tyres)$"]'],
  "Veterinarians": ['["amenity"="veterinary"]', '["healthcare"="veterinary"]'],
  "Bakeries": ['["shop"="bakery"]'],
  "Pharmacies": ['["amenity"="pharmacy"]', '["healthcare"="pharmacy"]'],
} as const;

export type LeadCategory = keyof typeof leadCategories;

export function isLeadCategory(value: string): value is LeadCategory {
  return Object.hasOwn(leadCategories, value);
}

export function parseLeadMarket(localityValue: unknown, categoryValue: unknown, radiusValue: unknown):
  { market: LeadMarket & { category: LeadCategory } } | { error: string } {
  const locality = typeof localityValue === "string" ? localityValue.trim().replace(/\s+/g, " ") : "";
  const searchCategory = typeof categoryValue === "string" ? categoryValue.trim().toLowerCase() : "";
  const category = Object.keys(leadCategories).find((item) => item.toLowerCase() === searchCategory) ?? "";
  const radius = typeof radiusValue === "number" || typeof radiusValue === "string" ? Number(radiusValue) : NaN;
  if (locality.length < 2 || locality.length > 120) return { error: "Enter a city or neighborhood between 2 and 120 characters." };
  if (!isLeadCategory(category)) return { error: "Choose a supported business category." };
  if (![1500, 3000, 6000].includes(radius)) return { error: "Choose a supported search radius." };
  return { market: { locality, category, radius } };
}

export function safeWebUrl(value: unknown): string {
  if (typeof value !== "string" || !value.trim() || value.length > 2048) return "";
  const raw = value.trim();
  try {
    const url = new URL(/^[a-z][a-z0-9+.-]*:/i.test(raw) ? raw : `https://${raw}`);
    if (!["https:", "http:"].includes(url.protocol) || url.username || url.password) return "";
    return url.href;
  } catch {
    return "";
  }
}

export function leadContact(lead: LocalLead) {
  const digits = lead.phone.replace(/\D/g, "");
  return {
    phone: digits.length >= 5 ? `${lead.phone.trim().startsWith("+") ? "+" : ""}${digits}` : "",
    email: /^[^\s@?&#]+@[^\s@?&#]+\.[^\s@?&#]+$/.test(lead.email) ? lead.email : "",
  };
}

export const canCaptureLead = (lead: LocalLead, isGuest: boolean) =>
  lead.source === "OpenStreetMap" || (isGuest && lead.source === "Demo");

export function opportunityFor(lead: LocalLead, audit?: WebsiteAudit) {
  const { phone, email } = leadContact(lead);
  const contactable = Boolean(phone || email);
  if (audit && audit.status >= 500) {
    return { kind: "audit", score: contactable ? 90 : 72, observation: `Homepage returned HTTP ${audit.status}`, reason: "The website returned a server error during this check. Confirm the issue before reaching out." } as const;
  }
  if (audit?.mobileReady === false || audit?.secure === false) {
    const mobile = audit.mobileReady === false;
    return {
      kind: "audit",
      score: contactable ? 85 : 67,
      observation: mobile ? "Mobile viewport missing" : "Homepage uses HTTP",
      reason: mobile ? "The homepage has no mobile viewport declaration." : "The homepage responded over HTTP.",
    } as const;
  }
  if (lead.nameIndexOnly && !lead.website) {
    return { kind: "research", score: contactable ? 55 : 35, observation: "Contact details to verify", reason: "This result comes from the map name index. Check the source listing for website and contact details." } as const;
  }
  if (!lead.website) {
    return {
      kind: "listing",
      score: contactable ? 78 : 48,
      observation: "Website link missing from listing",
      reason: "The listing has no website link. Verify the business’s online presence before proposing a new site.",
    } as const;
  }
  return {
    kind: "research",
    score: contactable ? 60 : 43,
    observation: audit ? "Website reviewed" : "Website ready to check",
    reason: "The listing includes a website. Review it for specific opportunities to improve how customers get in touch.",
  } as const;
}

export function outreachFor(lead: LocalLead, audit?: WebsiteAudit) {
  const opening = `Hi ${lead.name} team,\n\nI came across your business while researching ${lead.locality}.`;
  const evidence = audit?.status && audit.status >= 500
    ? "I received a server error when I checked your homepage. If it’s still happening, I can help identify what’s affecting access."
    : audit?.mobileReady === false
      ? "I noticed your homepage is missing a mobile viewport setting, which can make it harder to use on phones. I’d be happy to share a practical fix."
      : audit?.secure === false
        ? "Your homepage responded over HTTP when I checked it. I can help review the HTTPS setup so customers can connect securely."
        : !lead.website && !lead.nameIndexOnly
          ? "I didn’t find a website linked from your business listing. Is there a site you’d like local customers to use to find your services?"
          : "I help local businesses make it easier for customers to find their services and get in touch. I’d be happy to share a few ideas for your site.";
  return `${opening} ${evidence}\n\nWould a quick conversation be useful?`;
}
