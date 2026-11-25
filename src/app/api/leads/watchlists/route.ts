import { NextRequest } from "next/server";
import { parseLeadMarket } from "@/lib/leads";
import { tokenHash, transact } from "@/lib/server/accounts";
import { compareWatch, publicWatch, type StoredWatch } from "@/lib/server/growth-watch";
import { leadError, leadJson, takeLeadBudget } from "@/lib/server/lead-access";
import { findLeads, LeadProviderError } from "@/lib/server/lead-sources";
import { hasSameOrigin } from "@/lib/server/request-origin";
import { initialWorkspace } from "@/lib/server/workspace";
import type { LeadMarket } from "@/types/watchlists";

export const runtime = "nodejs";
export const maxDuration = 30;
const LIMIT = 12;

function sameMarket(a: LeadMarket, b: LeadMarket) {
  return a.locality.toLowerCase() === b.locality.toLowerCase() && a.category === b.category && a.radius === b.radius;
}

async function handle(request: NextRequest) {
  const token = request.cookies.get("detectgrowth_session")?.value;
  if (!token) return leadError("Sign in to use Growth Watchlists.", 401);
  if (request.method !== "GET" && !hasSameOrigin(request)) return leadError("Invalid origin.", 403);

  const key = tokenHash(token);
  const id = request.nextUrl.searchParams.get("id");
  const state = await transact((db) => {
    const user = db.sessions[key]?.user;
    if (!user) return null;
    const watches = (db.workspaces?.[user.id]?.growthWatches ?? []) as StoredWatch[];
    if (request.method === "DELETE") {
      const index = watches.findIndex((watch) => watch.id === id);
      return { user, watches, removed: index >= 0 ? watches.splice(index, 1)[0] : undefined };
    }
    return { user, watches, removed: undefined };
  });

  if (!state) return leadError("Sign in to use Growth Watchlists.", 401);
  if (request.method === "GET") return leadJson(state.watches.map(publicWatch));
  if (request.method === "DELETE") return state.removed ? leadJson({ id }) : leadError("Watchlist not found.", 404);

  let input: Record<string, unknown>;
  try {
    const raw = await request.text();
    if (raw.length > 2048) return leadError("Watchlist details are too long.", 413);
    const value: unknown = JSON.parse(raw);
    if (!value || typeof value !== "object" || Array.isArray(value)) throw new Error();
    input = value as Record<string, unknown>;
  } catch {
    return leadError("Enter valid watchlist details.", 400);
  }

  const existing = state.watches.find((watch) => watch.id === id);
  const recheck = input.action === "recheck";
  if (recheck && !existing) return leadError("Watchlist not found.", 404);
  const requested = recheck ? existing!.market : input;
  const parsed = parseLeadMarket(requested.locality, requested.category, requested.radius);
  if ("error" in parsed) return leadError(parsed.error, 400);
  const market = parsed.market;
  const demo = recheck ? existing!.demo : input.demo === true || process.env.LEADS_DATA_MODE === "demo";

  if (!recheck) {
    const duplicate = state.watches.find((watch) => watch.demo === demo && sameMarket(watch.market, market));
    if (duplicate) return leadJson(publicWatch(duplicate));
    if (state.watches.length >= LIMIT) return leadError("Remove a watchlist before adding another.", 409);
  }
  if (!demo && !takeLeadBudget("search", state.user.isDemo ? "guest" : state.user.id)) {
    return leadError("Too many searches. Try again in a minute.", 429);
  }

  try {
    const result = await findLeads(market.locality, market.category, market.radius, demo ? "demo" : "osm", recheck);
    if (!result.resolvedLocality) return leadError("The market could not be located. Check the location and try again.", 422);
    const resolvedLocality = result.resolvedLocality;

    return await transact((db) => {
      const user = db.sessions[key]?.user;
      if (!user || user.id !== state.user.id) return leadError("Sign in to use Growth Watchlists.", 401);
      db.workspaces ??= {};
      const workspace = db.workspaces[user.id] ??= initialWorkspace();
      const watches = (workspace.growthWatches ??= []) as StoredWatch[];

      if (recheck) {
        const current = watches.find((watch) => watch.id === id);
        if (!current) return leadError("Watchlist not found.", 404);
        if (current.report.checkedAt !== existing!.report.checkedAt) return leadJson(publicWatch(current));
        Object.assign(current, { ...compareWatch(result, current.baseline), resolvedLocality });
        return leadJson(publicWatch(current));
      }

      const duplicate = watches.find((watch) => watch.demo === demo && sameMarket(watch.market, market));
      if (duplicate) return leadJson(publicWatch(duplicate));
      if (watches.length >= LIMIT) return leadError("Remove a watchlist before adding another.", 409);
      const watch: StoredWatch = { id: crypto.randomUUID(), market, demo, resolvedLocality, ...compareWatch(result) };
      watches.unshift(watch);
      return leadJson(publicWatch(watch));
    });
  } catch (error) {
    return leadError(error instanceof LeadProviderError ? error.message : "Unable to check this market right now.", 502);
  }
}

export { handle as GET, handle as POST, handle as DELETE };
