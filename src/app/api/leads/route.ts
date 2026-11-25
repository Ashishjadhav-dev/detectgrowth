import { NextRequest } from "next/server";
import { parseLeadMarket } from "@/lib/leads";
import { leadAccess, leadError, leadJson, takeLeadBudget } from "@/lib/server/lead-access";
import { findLeads, LeadProviderError } from "@/lib/server/lead-sources";

export const runtime = "nodejs";
export const maxDuration = 30;

export async function GET(request: NextRequest) {
  const actor = await leadAccess(request);
  if (!actor) return leadError("Sign in to search for leads.", 401);

  const params = request.nextUrl.searchParams;
  const parsed = parseLeadMarket(params.get("locality"), params.get("category"), params.get("radius") ?? 3000);
  if ("error" in parsed) return leadError(parsed.error, 400);
  const { locality, category, radius } = parsed.market;

  const configured = process.env.LEADS_DATA_MODE;
  const demo = params.get("mode") === "demo" || configured === "demo";
  const google = (configured === "google" || (configured === "live" && process.env.GOOGLE_MAPS_API_KEY)) && !actor.guest;
  const mode = demo ? "demo" : google ? "google" : "osm";
  if (mode !== "demo" && !takeLeadBudget("search", actor.id)) return leadError("Too many lead searches. Try again in a minute.", 429);
  try {
    return leadJson(await findLeads(locality, category, radius, mode));
  } catch (error) {
    return leadError(error instanceof LeadProviderError ? error.message : "Unable to search for businesses right now.", 502);
  }
}
