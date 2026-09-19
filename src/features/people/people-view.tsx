"use client";
import { useEffect, useState } from "react";
import { Bookmark, CalendarDays, Linkedin, Mail, Phone, Search, SlidersHorizontal, Users } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { SearchInput } from "@/components/ui/search-input";
import { listPeople, type ApiPerson } from "@/lib/api/people";
import { SectionHeader } from "@/components/ui/patterns";
import { demoPeople } from "@/data/demo";
import { PageSkeleton } from "@/components/ui/page-skeleton";

const tabs = ["All", "Marketing", "Sales", "Leadership", "Open to outreach"] as const;

export function PeopleView() {
  const [query, setQuery] = useState("");
  const [activeTab, setActiveTab] = useState<(typeof tabs)[number]>("All");
  const [apiPeople, setApiPeople] = useState<ApiPerson[] | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    listPeople(query).then((data) => { setApiPeople(data); setLoading(false); }).catch(() => { setApiPeople(demoPeople); setLoading(false); });
  }, [query]);

  if (loading && !apiPeople) return <PageSkeleton variant="results" />;

  const normalized = query.trim().toLowerCase();
  const sourcePeople = apiPeople ?? [];
  const filtered = sourcePeople.filter((person) => {
    const matchesQuery =
      !normalized ||
      [person.name, person.title, person.department, String(person.score)].some((value) => value.toLowerCase().includes(normalized));
    const matchesTab =
      activeTab === "All" ||
      (activeTab === "Open to outreach" && person.score >= 85) ||
      person.department === activeTab;
    return matchesQuery && matchesTab;
  });

  return (
    <div className="space-y-5">
      <section className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <div className="text-[11px] font-semibold uppercase tracking-[0.18em] text-primary">People</div>
          <h1 className="page-title mt-2">Decision makers and buyers</h1>
          <p className="mt-1 text-sm text-muted">Search contacts, filter by function, and keep the outreach surface tightly tied to account activity.</p>
        </div>
        <Button variant="secondary">
          <SlidersHorizontal className="size-4" />
          Export / filters
        </Button>
      </section>

      <Card className="glass-card p-4">
        <div className="flex flex-col gap-3 lg:flex-row">
          <div className="flex-1">
            <SearchInput value={query} onChange={setQuery} onClear={() => setQuery("")} placeholder="Search people, roles, companies, or signals..." />
          </div>
          <Button variant="secondary">
            <CalendarDays className="size-4" />
            Last 30 days
          </Button>
          <Button>
            <Search className="size-4" />
            Search people
          </Button>
        </div>
        <div className="mt-3 flex flex-wrap gap-2">
          {tabs.map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`rounded-full border px-3 py-2 text-sm ${
                activeTab === tab ? "border-primary bg-primary-soft text-primary" : "border-border bg-white text-muted hover:text-ink"
              }`}
            >
              {tab}
            </button>
          ))}
          <div className="ml-auto text-sm text-muted">{filtered.length} contacts</div>
        </div>
      </Card>

      <section className="grid gap-4 xl:grid-cols-[1.05fr_.95fr]">
        <Card className="glass-card overflow-hidden">
          {filtered.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="min-w-[820px] w-full border-collapse">
                <thead className="bg-elevated text-left text-[11px] font-semibold uppercase tracking-[0.14em] text-subtle">
                  <tr>
                    <th className="table-cell">Name</th>
                    <th className="table-cell">Title</th>
                    <th className="table-cell">Department</th>
                    <th className="table-cell">Score</th>
                    <th className="table-cell">Contact</th>
                    <th className="table-cell">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((person) => (
                    <tr key={person.id} className="border-t border-border/80 hover:bg-elevated/60">
                      <td className="table-cell">
                        <div className="flex items-center gap-3">
                          <div className="grid size-9 place-items-center rounded-full bg-primary-soft text-xs font-semibold text-primary">
                            {person.name
                              .split(" ")
                              .map((part) => part[0])
                              .join("")}
                          </div>
                          <div>
                            <div className="font-medium text-ink">{person.name}</div>
                            <div className="text-xs text-muted">Open profile</div>
                          </div>
                        </div>
                      </td>
                      <td className="table-cell text-muted">{person.title}</td>
                      <td className="table-cell text-muted">{person.department}</td>
                      <td className="table-cell">
                        <Badge className="bg-primary-soft text-primary">{person.score}</Badge>
                      </td>
                      <td className="table-cell">
                        <div className="flex items-center gap-2 text-muted">
                          <Mail className="size-4" />
                          <Phone className="size-4" />
                          <Linkedin className="size-4" />
                        </div>
                      </td>
                      <td className="table-cell">
                        <Bookmark className="size-4 text-subtle" />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="p-4">
              <EmptyState title="No matching people" body="Try adjusting the search or switching to a different department." />
            </div>
          )}
        </Card>

        <Card className="glass-card p-5">
          <SectionHeader title="Engagement summary" description="Signals that help rank which contacts deserve attention first." />
          <div className="space-y-3">
            {[
              ["Email opened", "18 times", "High"],
              ["Profile viewed", "6 times", "Medium"],
              ["Meeting scheduled", "2 times", "High"],
              ["LinkedIn touched", "4 times", "Low"],
            ].map(([label, value, tone]) => (
              <div key={label} className="flex items-center justify-between rounded-2xl border border-border bg-white p-3">
                <div>
                  <div className="text-sm font-medium text-ink">{label}</div>
                  <div className="text-xs text-muted">{value}</div>
                </div>
                <Badge className={tone === "High" ? "bg-emerald-50 text-success" : tone === "Medium" ? "bg-amber-50 text-warning" : "bg-primary-soft text-primary"}>
                  {tone}
                </Badge>
              </div>
            ))}
          </div>
          <div className="mt-4 rounded-2xl border border-dashed border-border bg-elevated p-4 text-sm text-muted">
            Decision Maker Score estimates whether this person can move a deal forward.
          </div>
        </Card>
      </section>
    </div>
  );
}
