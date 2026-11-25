import { NextRequest } from "next/server";
import { hasSameOrigin } from "@/lib/server/request-origin";
import { opportunityFor, safeWebUrl } from "@/lib/leads";
import { tokenHash, transact } from "@/lib/server/accounts";
import { leadError, leadJson } from "@/lib/server/lead-access";
import { leadStatuses, type SavedLead, type LocalLead, type WebsiteAudit } from "@/types/leads";
import { initialWorkspace } from "@/lib/server/workspace";

const osmId = /^osm-(node|way|relation)-([1-9]\d{0,18})$/;
const text = (value: unknown, length: number) => typeof value === "string" ? value.trim().slice(0, length) : "";

function readLead(value: Record<string, unknown>): LocalLead | null {
  const id = text(value.id, 80);
  const match = osmId.exec(id);
  const name = text(value.name, 300);
  if (!match || !name || value.source !== "OpenStreetMap") return null;
  return {
    id, name,
    category: text(value.category, 120),
    address: text(value.address, 400),
    locality: text(value.locality, 240),
    phone: text(value.phone, 100),
    email: text(value.email, 254),
    website: safeWebUrl(value.website),
    mapsUrl: `https://www.openstreetmap.org/${match[1]}/${match[2]}`,
    rating: null,
    reviewCount: 0,
    source: "OpenStreetMap",
    ...(value.nameIndexOnly === true ? { nameIndexOnly: true } : {}),
  };
}

function readAudit(value: unknown): WebsiteAudit | null {
  if (!value || typeof value !== "object") return null;
  const { checkedAt, status, title, mobileReady, secure, lastModified, changeSignals } = value as Partial<WebsiteAudit>;
  if (typeof checkedAt !== "string" || checkedAt.length > 35 || !Number.isFinite(Date.parse(checkedAt)) ||
      typeof status !== "number" || !Number.isInteger(status) || status < 100 || status > 599 ||
      typeof title !== "string" || typeof secure !== "boolean" || (mobileReady !== null && typeof mobileReady !== "boolean") ||
      (lastModified !== null && typeof lastModified !== "string") || !Array.isArray(changeSignals) ||
      changeSignals.length > 6 || changeSignals.some((signal) => typeof signal !== "string" || signal.length > 180)) return null;
  return { checkedAt, status, title: title.slice(0, 300), mobileReady, secure, lastModified: lastModified?.slice(0, 100) ?? null, changeSignals };
}

async function handle(request: NextRequest) {
  const token = request.cookies.get("detectgrowth_session")?.value;
  if (!token) return leadError("Sign in to save leads to your workspace.", 401);
  if (request.method !== "GET" && !hasSameOrigin(request)) return leadError("Invalid origin.", 403);
  let input: Record<string, unknown> = {};
  if (request.method === "POST" || request.method === "PATCH") {
    try {
      const raw = await request.text();
      if (raw.length > 12_000) return leadError("Lead details are too long.", 413);
      const value: unknown = JSON.parse(raw);
      if (!value || typeof value !== "object" || Array.isArray(value)) throw new Error();
      input = value as Record<string, unknown>;
    } catch {
      return leadError("Enter valid lead details.", 400);
    }
  }

  return transact((db) => {
    const user = db.sessions[tokenHash(token)]?.user;
    if (!user || user.isDemo) return leadError("Sign in to save leads to your workspace.", 401);
    db.workspaces ??= {};
    const workspace = db.workspaces[user.id] ??= initialWorkspace();
    const leads = (workspace.savedLeads ??= []) as SavedLead[];
    if (request.method === "GET") return leadJson(leads);
    const id = request.nextUrl.searchParams.get("id");
    const existing = leads.find((lead) => lead.id === id);
    if (request.method === "POST" && input.action === "promote") {
      if (!existing) return leadError("Save this lead before creating an opportunity.", 404);
      const opportunities = workspace.opportunities as Array<Record<string, unknown>>;
      const previous = opportunities.find((item) => item.leadId === existing.id);
      if (previous) return leadJson({ id: previous.id });
      const insight = opportunityFor(existing, existing.websiteAudit);
      const opportunity = {
        id: crypto.randomUUID(), leadId: existing.id, company: existing.name,
        industry: existing.category, location: existing.address || existing.locality,
        stage: existing.status === "Won" ? "Won" : existing.status === "Interested" ? "Qualified" : existing.status === "Contacted" ? "Discovery" : existing.status === "Not interested" ? "Lost" : "New",
        score: insight.score, notes: [existing.notes, insight.reason, existing.mapsUrl].filter(Boolean).join("\n\n"),
        signals: [{
          id: existing.id, title: insight.observation, description: insight.reason,
          detectedAt: (insight.kind === "audit" ? existing.websiteAudit?.checkedAt : existing.savedAt),
          sourceUrl: insight.kind === "audit" ? existing.website : existing.mapsUrl,
        }], employees: "—", expectedValue: 0, updated: "Today", createdAt: new Date().toISOString(),
      };
      opportunities.unshift(opportunity);
      return leadJson({ id: opportunity.id });
    }
    if (request.method === "POST") {
      const lead = readLead(input);
      if (!lead) return leadError("Choose a valid OpenStreetMap lead.", 400);
      const saved = leads.find((item) => item.id === lead.id);
      if (saved) return leadJson(saved);
      if (leads.length >= 500) return leadError("Your shortlist is full. Remove a lead to add another.", 409);
      const websiteAudit = input.websiteAudit === undefined ? undefined : readAudit(input.websiteAudit);
      if (input.websiteAudit !== undefined && (!lead.website || !websiteAudit)) return leadError("Invalid website check.", 400);
      const record: SavedLead = { ...lead, ...(websiteAudit ? { websiteAudit } : {}), status: "New", notes: "", savedAt: new Date().toISOString() };
      leads.unshift(record);
      return leadJson(record);
    }
    if (!existing) return leadError("Saved lead not found.", 404);
    if (request.method === "DELETE") {
      leads.splice(leads.indexOf(existing), 1);
      return leadJson({ id: existing.id });
    }
    if (input.status !== undefined && !leadStatuses.some((status) => status === input.status)) return leadError("Choose a valid lead stage.", 400);
    if (input.notes !== undefined && (typeof input.notes !== "string" || input.notes.length > 2000)) return leadError("Notes must be 2,000 characters or fewer.", 400);
    if (input.websiteAudit !== undefined) {
      const websiteAudit = readAudit(input.websiteAudit);
      if (!existing.website || !websiteAudit) return leadError("Invalid website check.", 400);
      if (!existing.websiteAudit || Date.parse(websiteAudit.checkedAt) >= Date.parse(existing.websiteAudit.checkedAt)) existing.websiteAudit = websiteAudit;
    }
    if (input.status !== undefined) existing.status = input.status as SavedLead["status"];
    if (typeof input.notes === "string") existing.notes = input.notes.trim();
    return leadJson(existing);
  });
}

export { handle as GET, handle as POST, handle as PATCH, handle as DELETE };
