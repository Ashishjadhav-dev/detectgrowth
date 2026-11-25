import { leadCategories, safeWebUrl, type LeadCategory } from "@/lib/leads";
import type { LeadsResponse, LocalLead } from "@/types/leads";

type Tags = Record<string, string>;
type OsmElement = { type: "node" | "way" | "relation"; id: number; tags?: Tags; lat?: number; lon?: number; center?: { lat: number; lon: number } };
type PhotonResult = { features?: Array<{ geometry?: { coordinates?: number[] }; properties?: Tags }> };
type GooglePlace = { id?: string; displayName?: { text?: string }; primaryTypeDisplayName?: { text?: string }; formattedAddress?: string; nationalPhoneNumber?: string; websiteUri?: string; googleMapsUri?: string; rating?: number; userRatingCount?: number };

const photonSearchTerms: Record<LeadCategory, string> = {
  "Dental clinics": "dental", "Clinics": "clinic", "Restaurants": "restaurant", "Cafés": "cafe",
  "Salons & barbers": "salon", "Gyms & fitness": "fitness", "Hotels": "hotel",
  "Real estate agencies": "real estate", "Auto repair": "auto", "Veterinarians": "vet",
  "Bakeries": "bakery", "Pharmacies": "pharmacy",
};

const headers = { "User-Agent": "DetectGrowth/1.0 (local business search)", Accept: "application/json" };

export class LeadProviderError extends Error {}

async function providerJson<T>(url: URL | string, service: string, options: RequestInit = {}, timeout = 7000): Promise<T> {
  try {
    const response = await fetch(url, {
      ...options,
      cache: "no-store",
      redirect: "error",
      headers: { ...headers, ...options.headers },
      signal: AbortSignal.timeout(timeout),
    });
    if (!response.ok) throw new Error(String(response.status));
    return await response.json() as T;
  } catch {
    throw new LeadProviderError(`${service} is temporarily unavailable. Please try again shortly.`);
  }
}

function result(source: LeadsResponse["source"], leads: LocalLead[], resolvedLocality: string | null): LeadsResponse {
  return { leads, source, resolvedLocality, fetchedAt: new Date().toISOString() };
}

export function demoLeads(locality: string, category: string) {
  const leads = ["Northstar", "Greenline", "Cornerstone", "Maple & Co", "Bluebird", "West End"].map((name, index): LocalLead => ({
    id: `demo-${index}-${encodeURIComponent(`${locality.toLowerCase()}-${category.toLowerCase()}`)}`,
    name: `${name} ${category}`,
    category,
    address: `${index + 12} Example Street, ${locality}`,
    locality,
    phone: index % 3 === 0 ? "" : "+1 202 555 0148",
    email: index % 3 === 0 ? "hello@example.com" : "",
    website: index % 2 ? "https://example.com/" : "",
    mapsUrl: "",
    rating: null,
    reviewCount: 0,
    source: "Demo",
  }));
  return result("Demo", leads, locality);
}

async function photonBusinesses(photon: URL, lat: number, lon: number, radius: number, category: LeadCategory): Promise<OsmElement[]> {
  const query = new URL(photon);
  query.search = "";
  const latSpan = radius / 111_000;
  const lonSpan = latSpan / Math.max(0.01, Math.cos(lat * Math.PI / 180));
  const bounds = [Math.max(-180, lon - lonSpan), Math.max(-90, lat - latSpan), Math.min(180, lon + lonSpan), Math.min(90, lat + latSpan)];
  for (const [key, value] of Object.entries({ q: photonSearchTerms[category], lat, lon, bbox: bounds.join(","), limit: 50 })) query.searchParams.set(key, String(value));
  for (const selector of leadCategories[category]) {
    const match = selector.match(/^\["([^"]+)"(=|~)"([^"]+)"\]$/);
    if (!match) continue;
    const values = match[2] === "=" ? [match[3]] : match[3].slice(2, -2).split("|");
    for (const value of values) query.searchParams.append("osm_tag", `${match[1]}:${value}`);
  }
  const data = await providerJson<PhotonResult>(query, "The secondary business search");
  if (!Array.isArray(data.features)) throw new LeadProviderError("The secondary business search returned an invalid result.");
  return data.features.flatMap((item): OsmElement[] => {
    const props = item.properties ?? {};
    const type = props.osm_type === "N" ? "node" : props.osm_type === "W" ? "way" : props.osm_type === "R" ? "relation" : null;
    const id = Number(props.osm_id);
    const [x, y] = item.geometry?.coordinates ?? [];
    if (!type || !Number.isSafeInteger(id) || id <= 0 || !props.name || !Number.isFinite(x) || !Number.isFinite(y)) return [];
    if (Math.hypot((y - lat) / latSpan, (x - lon) / lonSpan) > 1) return [];
    return [{
      type, id, lon: x, lat: y,
      tags: { name: props.name, "addr:housenumber": props.housenumber, "addr:street": props.street, "addr:suburb": props.locality, "addr:city": props.city, "addr:postcode": props.postcode },
    }];
  });
}

async function openStreetMapLeads(locality: string, category: LeadCategory, radius: number) {
  const photon = new URL(process.env.LEADS_PHOTON_URL || "https://photon.komoot.io/api/");
  photon.searchParams.set("q", locality);
  photon.searchParams.set("limit", "5");
  for (const layer of ["city", "district", "locality", "county", "state"]) photon.searchParams.append("layer", layer);
  const places = await providerJson<PhotonResult>(photon, "The location search");
  const place = places.features?.find((item) => {
    const [lon, lat] = item.geometry?.coordinates ?? [];
    return Number.isFinite(lat) && Math.abs(lat) <= 90 && Number.isFinite(lon) && Math.abs(lon) <= 180;
  });
  if (!place) return result("OpenStreetMap", [], null);

  const [lon, lat] = place.geometry!.coordinates!;
  const { name, city, state, country } = place.properties ?? {};
  const resolved = [...new Set([name, city, state, country].filter(Boolean))].join(", ") || locality;
  const filters = leadCategories[category].map((selector) => `nwr(around:${radius},${lat},${lon})${selector}["name"];`).join("");
  const query = `[out:json][timeout:8][maxsize:16777216];(${filters});out center 160;`;
  const endpoint = process.env.LEADS_OVERPASS_URL || "https://overpass-api.de/api/interpreter";
  let elements: OsmElement[];
  let limitedCoverage = false;
  try {
    const data = await providerJson<{ elements?: OsmElement[]; remark?: string }>(endpoint, "The business directory", {
      method: "POST",
      body: new URLSearchParams({ data: query }),
    }, 8500);
    if (!Array.isArray(data.elements) || data.remark) throw new Error("Incomplete directory response");
    elements = data.elements;
  } catch {
    elements = await photonBusinesses(photon, lat, lon, radius, category);
    limitedCoverage = true;
  }
  const prospects = elements.flatMap((item) => {
    const tags = item.tags ?? {};
    if (!tags.name?.trim() || tags.disused === "yes" || tags.abandoned === "yes") return [];
    const street = [tags["addr:housenumber"], tags["addr:street"] || tags["addr:place"]].filter(Boolean).join(" ");
    const address = [tags["addr:full"] || street, tags["addr:suburb"], tags["addr:city"], tags["addr:postcode"]].filter(Boolean).join(", ");
    const lead: LocalLead = {
      id: `osm-${item.type}-${item.id}`,
      name: tags.name.trim(),
      category,
      address,
      locality: resolved,
      phone: (tags["contact:phone"] || tags.phone || tags["contact:mobile"] || "").split(";")[0].trim(),
      email: (tags["contact:email"] || tags.email || "").split(";")[0].trim(),
      website: safeWebUrl(tags["contact:website"] || tags.website || tags.url),
      mapsUrl: `https://www.openstreetmap.org/${item.type}/${item.id}`,
      rating: null,
      reviewCount: 0,
      source: "OpenStreetMap",
      ...(limitedCoverage ? { nameIndexOnly: true } : {}),
    };
    const point = item.center ?? item;
    const distance = Math.hypot((point.lat ?? lat) - lat, ((point.lon ?? lon) - lon) * Math.cos(lat * Math.PI / 180));
    return [{ lead, distance }];
  });

  // Nearby map nodes and building outlines can describe the same business.
  const deduped: LocalLead[] = [];
  for (const { lead, distance } of prospects.sort((a, b) => a.distance - b.distance)) {
    const duplicate = deduped.find((other) => other.name.toLowerCase() === lead.name.toLowerCase() && (
      (other.phone && other.phone === lead.phone) ||
      (other.address && other.address === lead.address)
    ));
    if (duplicate) {
      duplicate.phone ||= lead.phone;
      duplicate.email ||= lead.email;
      duplicate.website ||= lead.website;
      duplicate.address ||= lead.address;
    } else if (Number.isFinite(distance)) deduped.push(lead);
  }
  return { ...result("OpenStreetMap", deduped.slice(0, 80), resolved), limitedCoverage };
}

async function googleLeads(locality: string, category: LeadCategory) {
  const key = process.env.GOOGLE_MAPS_API_KEY?.trim();
  if (!key) throw new LeadProviderError("Google Places needs a server API key.");
  const payload = await providerJson<{ places?: GooglePlace[] }>("https://places.googleapis.com/v1/places:searchText", "Google Places", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-Goog-Api-Key": key,
      "X-Goog-FieldMask": "places.id,places.displayName,places.formattedAddress,places.nationalPhoneNumber,places.websiteUri,places.googleMapsUri,places.rating,places.userRatingCount,places.primaryTypeDisplayName",
    },
    body: JSON.stringify({ textQuery: `${category} in ${locality}`, pageSize: 20, languageCode: "en" }),
  });
  return result("Google Places", (payload.places ?? []).flatMap((place): LocalLead[] => {
    if (!place.id || !place.displayName?.text) return [];
    return [{
      id: `google-${place.id}`,
      name: place.displayName.text,
      category: place.primaryTypeDisplayName?.text ?? category,
      address: place.formattedAddress ?? "",
      locality,
      phone: place.nationalPhoneNumber ?? "",
      email: "",
      website: safeWebUrl(place.websiteUri),
      mapsUrl: safeWebUrl(place.googleMapsUri),
      rating: place.rating ?? null,
      reviewCount: place.userRatingCount ?? 0,
      source: "Google Places",
    }];
  }), locality);
}

type CacheEntry = { expires: number; task: Promise<LeadsResponse>; pending: boolean };
const shared = globalThis as typeof globalThis & { osmLeadCache?: Map<string, CacheEntry> };
const cache = shared.osmLeadCache ??= new Map();

export function findLeads(locality: string, category: LeadCategory, radius: number, mode: "osm" | "google" | "demo", fresh = false) {
  if (mode === "demo") return Promise.resolve(demoLeads(locality, category));
  if (mode === "google") return googleLeads(locality, category);
  const key = JSON.stringify([locality.toLocaleLowerCase("en"), category, radius]);
  const now = Date.now();
  const cached = cache.get(key);
  if (cached && cached.expires > now && (!fresh || cached.pending)) return cached.task;
  for (const [id, entry] of cache) if (entry.expires <= now) cache.delete(id);
  if (cache.size >= 100) cache.delete(cache.keys().next().value!);
  const task = openStreetMapLeads(locality, category, radius).catch((error) => {
    if (cache.get(key)?.task === task) cache.delete(key);
    throw error;
  });
  cache.set(key, { expires: now + 5 * 60_000, task, pending: true });
  void task.then((value) => {
    const entry = cache.get(key);
    if (entry?.task !== task) return;
    entry.pending = false;
    if (value.limitedCoverage) entry.expires = Date.now() + 60_000;
  }, () => {});
  return task;
}
