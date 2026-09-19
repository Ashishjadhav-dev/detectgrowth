"use client";
import { useEffect, useState } from "react";
import { MoreVertical, Plus, Search, Star, Tags, UserRoundPlus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { SearchInput } from "@/components/ui/search-input";
import { SectionHeader } from "@/components/ui/patterns";
import { createList, listLists, type ApiList } from "@/lib/api/lists";
import { demoLists } from "@/data/demo";

const folders = ["All Lists", "Smart Lists", "Watchlists", "Saved Searches"] as const;
export function ListsView() {
  const [query, setQuery] = useState("");
  const [activeFolder, setActiveFolder] = useState<(typeof folders)[number]>("All Lists");
  const [apiLists, setApiLists] = useState<ApiList[] | null>(null);
  useEffect(() => { listLists(query).then(setApiLists).catch(() => { setApiLists(demoLists); }); }, [query]);
  const normalized = query.trim().toLowerCase();

  const sourceRows = apiLists ?? [];
  const filtered = sourceRows.filter((row) => {
    const matchesQuery = !normalized || [row.name, row.type, row.updated, String(row.count)].some((value) => value.toLowerCase().includes(normalized));
    const matchesFolder =
      activeFolder === "All Lists" ||
      (activeFolder === "Smart Lists" && row.type.toLowerCase() === "smart") ||
      (activeFolder === "Watchlists" && row.name.toLowerCase().includes("follow")) ||
      (activeFolder === "Saved Searches" && row.name.toLowerCase().includes("meta"));
    return matchesQuery && matchesFolder;
  });

  return (
    <div className="space-y-5">
      <section className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <div className="text-[11px] font-semibold uppercase tracking-[0.18em] text-primary">Organize</div>
          <h1 className="page-title mt-2">Saved lists and watchlists</h1>
          <p className="mt-1 text-sm text-muted">Filter, search, and manage saved workspaces in a more useful operations view.</p>
        </div>
        <Button onClick={() => {
          const name = window.prompt("List name");
          if (name?.trim()) createList(name.trim()).then((created) => setApiLists((current) => [created, ...(current ?? [])])).catch(() => undefined);
        }}>
          <Plus className="size-4" />
          Create new list
        </Button>
      </section>

      <section className="grid gap-4 xl:grid-cols-[280px_1fr]">
        <Card className="glass-card p-4">
          <SectionHeader title="Folders" description="Group lists the way operators actually work." />
          <div className="space-y-2">
            {folders.map((folder, index) => (
              <button
                key={folder}
                onClick={() => setActiveFolder(folder)}
                className={`flex w-full items-center justify-between rounded-2xl border px-3 py-2.5 text-left text-sm ${
                  activeFolder === folder ? "border-primary bg-primary-soft text-primary" : "border-border bg-white text-muted hover:text-ink"
                }`}
              >
                <span>{folder}</span>
                <span className="text-xs">{index === 0 ? apiLists?.length ?? 0 : filtered.filter((row) => index === 1 ? row.type.toLowerCase() === "smart" : index === 2 ? row.name.toLowerCase().includes("follow") : row.name.toLowerCase().includes("search")).length}</span>
              </button>
            ))}
          </div>
          <div className="mt-4 rounded-2xl border border-dashed border-border bg-elevated p-4 text-sm text-muted">
            Saved searches, digests, and alerts can share this sidebar pattern.
          </div>
        </Card>

        <Card className="glass-card overflow-hidden">
          <div className="border-b border-border p-4">
            <div className="flex flex-col gap-3 lg:flex-row">
              <div className="flex-1">
                <SearchInput value={query} onChange={setQuery} onClear={() => setQuery("")} placeholder="Search lists, watchlists, and saved queries..." />
              </div>
              <Button variant="secondary">
                <Search className="size-4" />
                Search
              </Button>
            </div>
            <div className="mt-3 flex flex-wrap gap-2">
              {["All lists", "Recently viewed", "Shared with me", "Owner", "Tags"].map((tab, index) => (
                <button
                  key={tab}
                  className={`rounded-full border px-3 py-2 text-sm ${index === 0 ? "border-primary bg-primary-soft text-primary" : "border-border bg-white text-muted"}`}
                >
                  {tab}
                </button>
              ))}
            </div>
          </div>

          {filtered.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="min-w-[760px] w-full border-collapse">
                <thead className="bg-elevated text-left text-[11px] font-semibold uppercase tracking-[0.14em] text-subtle">
                  <tr>
                    <th className="table-cell">List name</th>
                    <th className="table-cell">Type</th>
                    <th className="table-cell">Records</th>
                    <th className="table-cell">Last updated</th>
                    <th className="table-cell">Tags</th>
                    <th className="table-cell">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((row) => (
                    <tr key={row.name} className="border-t border-border/80 hover:bg-elevated/60">
                      <td className="table-cell font-medium text-ink">{row.name}</td>
                      <td className="table-cell text-muted">{row.type}</td>
                      <td className="table-cell text-muted">{row.count}</td>
                      <td className="table-cell text-muted">{row.updated}</td>
                      <td className="table-cell">
                        <div className="flex items-center gap-2">
                          <span className="rounded-full bg-primary-soft px-2 py-1 text-[11px] font-medium text-primary">Sales</span>
                          <span className="rounded-full bg-blue-50 px-2 py-1 text-[11px] font-medium text-info">Growth</span>
                        </div>
                      </td>
                      <td className="table-cell">
                        <div className="flex items-center gap-2 text-muted">
                          <UserRoundPlus className="size-4" />
                          <Tags className="size-4" />
                          <MoreVertical className="size-4" />
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="p-4">
              <EmptyState title="No matching lists" body="Try a different folder or broader search terms." />
            </div>
          )}
        </Card>
      </section>

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {[["Lists in workspace", `${apiLists?.length ?? 0} records`, "Total lists"], ["Smart lists", `${apiLists?.filter((list) => list.type.toLowerCase() === "smart").length ?? 0} records`, "Automated views"], ["Watchlists", `${apiLists?.filter((list) => list.name.toLowerCase().includes("watch")).length ?? 0} records`, "Accounts followed"], ["Search results", `${filtered.length} visible`, "Current filter"]].map(([title, value, hint]) => (
          <Card key={title} className="glass-card p-4">
            <div className="flex items-start justify-between gap-3">
              <div>
                <div className="text-sm font-semibold text-ink">{title}</div>
                <div className="mt-1 text-xs text-muted">{value}</div>
              </div>
              <Star className="size-4 text-primary" />
            </div>
            <div className="mt-5 text-xs font-medium text-success">{hint}</div>
          </Card>
        ))}
      </section>
    </div>
  );
}
