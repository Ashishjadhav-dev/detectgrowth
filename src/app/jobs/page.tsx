import { JobsView } from "@/features/jobs/jobs-view";

export default async function Page({ searchParams }: { searchParams: Promise<{ query?: string | string[] }> }) {
  const { query } = await searchParams;
  const initialQuery = typeof query === "string" ? query.trim().slice(0, 200) : "";
  return <JobsView key={initialQuery} initialQuery={initialQuery} />;
}
