import { NextResponse } from "next/server";
import type { LeadsResponse, LocalLead } from "@/types/leads";

const timeout = 10_000;

function demoLeads(locality: string, category: string): LocalLead[] {
  const safeCategory = category.trim() || "local business";
  const safeLocality = locality.trim() || "your locality";
  return [1, 2, 3, 4].map((index) => ({
    id: `demo-lead-${index}`,
    name: `${safeCategory.replace(/\b\w/g, (letter) => letter.toUpperCase())} ${index}`,
    category: safeCategory,
    address: `${safeLocality} · Demo address ${index}`,
    locality: safeLocality,
    phone: "+91 00000 00000",
    website: index % 2 ? "" : `https://example-${index}.com`,
    mapsUrl: "https://maps.google.com/",
    rating: index % 2 ? null : 4.2,
    reviewCount: index * 18,
    status: "New",
    source: "Demo data",
    isDemo: true,
  }));
}

export async function GET(request: Request) {
  const params = new URL(request.url).searchParams;
  const locality = params.get("locality")?.trim().slice(0, 120) ?? "";
  const category = params.get("category")?.trim().slice(0, 120) ?? "";
  const apiKey = process.env.GOOGLE_MAPS_API_KEY?.trim();
  const liveMode = process.env.LEADS_DATA_MODE === "live";
  if (!liveMode || !apiKey) {
    const body: LeadsResponse = { leads: demoLeads(locality, category), source: "Demo data", isDemo: true, fetchedAt: new Date().toISOString() };
    return NextResponse.json(body, { headers: { "Cache-Control": "private, no-store" } });
  }
  try {
    const response = await fetch("https://places.googleapis.com/v1/places:searchText", {
      method: "POST",
      headers: { "Content-Type": "application/json", "X-Goog-Api-Key": apiKey, "X-Goog-FieldMask": "places.id,places.displayName,places.formattedAddress,places.nationalPhoneNumber,places.websiteUri,places.googleMapsUri,places.rating,places.userRatingCount,places.primaryTypeDisplayName" },
      body: JSON.stringify({ textQuery: `${category || "businesses"} in ${locality || "India"}`, pageSize: 20, languageCode: "en", regionCode: "IN" }),
      signal: AbortSignal.timeout(timeout),
    });
    const payload = await response.json() as { places?: Array<Record<string, unknown>>; error?: { message?: string } };
    if (!response.ok) return NextResponse.json({ error: payload.error?.message ?? "Places provider unavailable." }, { status: response.status });
    const leads: LocalLead[] = (payload.places ?? []).map((place) => {
      const displayName = typeof place.displayName === "object" && place.displayName ? String((place.displayName as Record<string, unknown>).text ?? "Business") : "Business";
      const typeName = typeof place.primaryTypeDisplayName === "object" && place.primaryTypeDisplayName ? String((place.primaryTypeDisplayName as Record<string, unknown>).text ?? category) : category;
      return { id: String(place.id ?? displayName), name: displayName, category: typeName, address: String(place.formattedAddress ?? locality), locality, phone: String(place.nationalPhoneNumber ?? ""), website: String(place.websiteUri ?? ""), mapsUrl: String(place.googleMapsUri ?? "https://maps.google.com/"), rating: typeof place.rating === "number" ? place.rating : null, reviewCount: typeof place.userRatingCount === "number" ? place.userRatingCount : 0, status: "New", source: "Google Places" };
    });
    const body: LeadsResponse = { leads, source: "Google Places", isDemo: false, fetchedAt: new Date().toISOString() };
    return NextResponse.json(body, { headers: { "Cache-Control": "private, no-store" } });
  } catch {
    return NextResponse.json({ error: "Unable to load local businesses right now." }, { status: 502 });
  }
}
