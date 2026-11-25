import type { Metadata } from "next";
import { parseLeadMarket } from "@/lib/leads";
import { LeadsView } from "@/features/leads/leads-view";

export const metadata: Metadata = { title: "Lead discovery" };

export default async function Page({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const params = await searchParams;
  const parsed = parseLeadMarket(params.locality, params.category, params.radius);
  if ("error" in parsed) return <LeadsView />;
  const { market } = parsed;
  return <LeadsView key={JSON.stringify([market, params.mode])} initialSearch={{ ...market, radius: String(market.radius), ...(params.mode === "demo" ? { mode: "demo" } : {}) }} />;
}
