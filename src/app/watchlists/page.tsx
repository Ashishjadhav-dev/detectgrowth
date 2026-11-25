import type { Metadata } from "next";
import { WatchlistsView } from "@/features/watchlists/watchlists-view";

export const metadata: Metadata = { title: "Growth Watchlists" };

export default async function Page({ searchParams }: { searchParams: Promise<{ watch?: string | string[] }> }) {
  const { watch } = await searchParams;
  return <WatchlistsView key={typeof watch === "string" ? watch : ""} initialWatch={typeof watch === "string" ? watch : ""} />;
}
