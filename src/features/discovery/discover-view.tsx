"use client";
import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import {
  Bookmark,
  ChevronDown,
  Filter,
  Mail,
  MoreHorizontal,
  Phone,
  Search,
  SlidersHorizontal,
  Users,
  Zap,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { SearchInput } from "@/components/ui/search-input";
import { Score } from "@/components/ui/score";
import { CompanyMark } from "@/components/companies/company-mark";
import { SectionHeader } from "@/components/ui/patterns";
import { listCompanies, type ApiCompany } from "@/lib/api/companies";
import { listPeople, type ApiPerson } from "@/lib/api/people";
import { listSignals, type ApiSignal } from "@/lib/api/signals";
import { demoCompanies, demoPeople, demoSignals } from "@/data/demo";
import { PageSkeleton } from "@/components/ui/page-skeleton";

const tabs = ["Companies", "People", "Signals", "Saved Views"] as const;
const quickFilters = [
  { label: "Industry", value: "High fit" as const },
  { label: "Location", value: "Recently active" as const },
  { label: "Employees", value: "High intent" as const },
  { label: "Revenue", value: "High fit" as const },
  { label: "Signals", value: "High intent" as const },
  { label: "More", value: "Recently active" as const },
] as const;

export function DiscoverView() {
  const searchParams = useSearchParams();
  const [query, setQuery] = useState(() => searchParams.get("query") ?? "");
  const [activeTab, setActiveTab] = useState<(typeof tabs)[number]>("Companies");
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [filterFocus, setFilterFocus] = useState<"All" | "High fit" | "High intent" | "Recently active">("All");
  const [apiCompanies, setApiCompanies] = useState<ApiCompany[] | null>(null);
  const [apiPeople, setApiPeople] = useState<ApiPerson[] | null>(null);
  const [apiSignals, setApiSignals] = useState<ApiSignal[] | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    Promise.all([listCompanies(query), listPeople(query), listSignals(query)])
      .then(([companies, people, signals]) => {
        if (!cancelled) {
          setApiCompanies(companies);
          setApiPeople(people);
          setApiSignals(signals);
          setLoading(false);
        }
      })
      .catch((error: Error) => {
        if (!cancelled) { setApiCompanies(demoCompanies); setApiPeople(demoPeople); setApiSignals(demoSignals); setLoading(false); }
      });
    return () => {
      cancelled = true;
    };
  }, [query]);

  if (loading && !apiCompanies) return <PageSkeleton variant="results" />;

  const normalized = query.trim().toLowerCase();

  const sourceCompanies = (apiCompanies ?? []).map((company) => ({
    id: company.id,
    company: company.name,
    industry: company.industry || "Unknown",
    location: company.location || "Unknown",
    score: 0,
    signals: [company.status === "active" ? "Live account" : company.status],
  }));

  const companyRows = sourceCompanies.filter((opportunity) => {
    const matchesQuery =
      !normalized ||
      [opportunity.company, opportunity.industry, opportunity.location, ...opportunity.signals].some((value) =>
        value.toLowerCase().includes(normalized)
      );
    const matchesFocus =
      filterFocus === "All" ||
      (filterFocus === "High fit" && opportunity.score >= 90) ||
      (filterFocus === "High intent" && opportunity.signals.some((signal) => signal.toLowerCase().includes("hiring"))) ||
      (filterFocus === "Recently active" && opportunity.signals.some((signal) => signal.toLowerCase().includes("launch") || signal.toLowerCase().includes("updated")));
    return matchesQuery && matchesFocus;
  });

  const peopleRows = (apiPeople ?? []).filter((person) => {
    const matchesQuery =
      !normalized ||
      [person.name, person.title, person.department, String(person.score)].some((value) => value.toLowerCase().includes(normalized));
    const matchesFocus =
      filterFocus === "All" ||
      (filterFocus === "High fit" && person.score >= 85) ||
      (filterFocus === "High intent" && person.department === "Marketing") ||
      filterFocus === "Recently active";
    return matchesQuery && matchesFocus;
  });

  const signalRows = (apiSignals ?? []).filter((signal) => {
    const matchesQuery =
      !normalized ||
      [signal.type, signal.company, signal.description, signal.impact].some((value) => value.toLowerCase().includes(normalized));
    const matchesFocus =
      filterFocus === "All" ||
      (filterFocus === "High fit" && signal.confidence >= 90) ||
      (filterFocus === "High intent" && signal.impact === "High") ||
      (filterFocus === "Recently active" && (signal.time.includes("min") || signal.time.includes("hour")));
    return matchesQuery && matchesFocus;
  });

  const visibleCount = activeTab === "People" ? peopleRows.length : activeTab === "Signals" ? signalRows.length : companyRows.length;
  const selectAllChecked = activeTab === "Companies" && companyRows.length > 0 && selectedIds.length === companyRows.length;

  const toggleSelection = (id: string) => {
    setSelectedIds((current) => (current.includes(id) ? current.filter((item) => item !== id) : [...current, id]));
  };

  return (
    <div className="space-y-5">
      <section className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <div className="text-[11px] font-semibold uppercase tracking-[0.18em] text-primary">Discovery</div>
          <h1 className="page-title mt-2">Discover matching accounts</h1>
          <p className="mt-1 text-sm text-muted">Search companies and people, switch result modes, and act on results without leaving the page.</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button variant="secondary">
            <SlidersHorizontal className="size-4" />
            Saved views
          </Button>
          <Button>
            <Filter className="size-4" />
            Build filter
          </Button>
        </div>
      </section>

      <Card className="glass-card p-4">
        <div className="flex flex-col gap-3 xl:flex-row">
          <div className="flex-1">
            <SearchInput
              value={query}
              onChange={setQuery}
              onClear={() => {
                setQuery("");
                setSelectedIds([]);
              }}
              placeholder="Search companies, people, funding, hiring, signals..."
            />
          </div>
          <Button variant="secondary" onClick={() => setFilterFocus("All")}>
            <Filter className="size-4" />
            Reset filters
          </Button>
          <Button>
            <Search className="size-4" />
            Find matches
          </Button>
        </div>

        <div className="mt-3 flex flex-wrap items-center gap-2">
          {tabs.map((tab) => (
            <button
              key={tab}
              onClick={() => {
                setActiveTab(tab);
                setSelectedIds([]);
              }}
              className={`rounded-full border px-3 py-2 text-sm transition ${
                activeTab === tab ? "border-primary bg-primary-soft text-primary" : "border-border bg-white text-muted hover:text-ink"
              }`}
            >
              {tab}
            </button>
          ))}
          <div className="ml-auto text-sm text-muted">{visibleCount.toLocaleString()} results</div>
        </div>

        <div className="mt-3 flex flex-wrap gap-2">
          {quickFilters.map((filter) => (
            <Button
              key={filter.label}
              variant="secondary"
              size="sm"
              onClick={() => setFilterFocus(filter.value)}
            >
              {filter.label}
              <ChevronDown className="size-3" />
            </Button>
          ))}
          <div className="ml-auto flex items-center gap-2">
            {["All", "High fit", "High intent", "Recently active"].map((focus) => (
              <button
                key={focus}
                className={`rounded-full px-3 py-2 text-xs font-medium transition ${
                  filterFocus === focus ? "bg-primary text-white" : "border border-border bg-white text-muted hover:text-ink"
                }`}
                onClick={() => setFilterFocus(focus as typeof filterFocus)}
              >
                {focus}
              </button>
            ))}
          </div>
        </div>
      </Card>

      {selectedIds.length > 0 && activeTab === "Companies" ? (
        <Card className="glass-card flex flex-wrap items-center justify-between gap-3 px-4 py-3">
          <div className="text-sm text-ink">
            {selectedIds.length} company{selectedIds.length === 1 ? "" : "ies"} selected
          </div>
          <div className="flex flex-wrap gap-2">
            <Button variant="secondary" size="sm">
              <Bookmark className="size-4" />
              Save
            </Button>
            <Button variant="secondary" size="sm">
              <Mail className="size-4" />
              Email
            </Button>
            <Button size="sm">Add to list</Button>
          </div>
        </Card>
      ) : null}

      <section className="grid gap-4 xl:grid-cols-[280px_1fr]">
        <Card className="glass-card p-4">
          <SectionHeader title="Filters" description="Keep the search focused with quick filters." />
          <div className="space-y-4">
            {[
              ["Industry", ["SaaS", "E-commerce", "Fintech", "Healthcare"]],
              ["Location", ["India", "United States", "Europe"]],
              ["Employee size", ["1-50", "51-200", "201-500", "500+"]],
              ["Signals", ["Hiring surge", "Funding round", "Website changes", "Tech changes"]],
            ].map(([label, options]) => (
              <div key={label as string} className="space-y-2">
                <div className="text-sm font-medium text-ink">{label as string}</div>
                <div className="space-y-2">
                  {(options as string[]).map((option) => (
                    <label key={option} className="flex items-center gap-2 rounded-2xl border border-border bg-white px-3 py-2 text-sm text-muted">
                      <input type="checkbox" className="size-4 rounded border-border text-primary" />
                      {option}
                    </label>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </Card>

        <Card className="glass-card overflow-hidden">
          {activeTab === "Companies" ? (
            companyRows.length > 0 ? (
              <>
                <div className="overflow-x-auto">
                  <table className="min-w-[920px] w-full border-collapse">
                    <thead className="bg-elevated text-left text-[11px] font-semibold uppercase tracking-[0.14em] text-subtle">
                      <tr>
                        <th className="table-cell">
                          <input
                            aria-label="Select all"
                            type="checkbox"
                            checked={selectAllChecked}
                            onChange={() => {
                              setSelectedIds(selectAllChecked ? [] : companyRows.map((item) => item.id));
                            }}
                          />
                        </th>
                        <th className="table-cell">Company</th>
                        <th className="table-cell">Industry</th>
                        <th className="table-cell">Location</th>
                        <th className="table-cell">Score</th>
                        <th className="table-cell">Primary reason</th>
                        <th className="table-cell">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {companyRows.map((opportunity) => (
                        <tr key={opportunity.id} className="border-t border-border/80 transition hover:bg-elevated/60">
                          <td className="table-cell">
                            <input
                              aria-label={`Select ${opportunity.company}`}
                              type="checkbox"
                              checked={selectedIds.includes(opportunity.id)}
                              onChange={() => toggleSelection(opportunity.id)}
                            />
                          </td>
                          <td className="table-cell">
                            <Link href={`/companies/${opportunity.id}`} className="flex items-center gap-3">
                              <CompanyMark name={opportunity.company} />
                              <div>
                                <div className="font-semibold text-ink">{opportunity.company}</div>
                                <div className="text-xs text-muted">Open profile</div>
                              </div>
                            </Link>
                          </td>
                          <td className="table-cell text-muted">{opportunity.industry}</td>
                          <td className="table-cell text-muted">{opportunity.location}</td>
                          <td className="table-cell">
                            <Score value={opportunity.score} compact />
                          </td>
                          <td className="table-cell">
                            <div className="flex flex-wrap gap-2">
                              {opportunity.signals.slice(0, 2).map((signal) => (
                                <Badge key={signal} className="bg-primary-soft text-primary">
                                  {signal}
                                </Badge>
                              ))}
                            </div>
                          </td>
                          <td className="table-cell">
                            <div className="flex items-center gap-2">
                              <button aria-label="Save">
                                <Bookmark className="size-4 text-subtle hover:text-primary" />
                              </button>
                              <button aria-label="Email">
                                <Mail className="size-4 text-subtle hover:text-primary" />
                              </button>
                              <button aria-label="More">
                                <MoreHorizontal className="size-4 text-subtle hover:text-primary" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                <div className="flex items-center justify-between gap-3 border-t border-border p-3">
                  <div className="text-sm text-muted">Showing {companyRows.length} companies</div>
                  <div className="flex items-center gap-2">
                    <Button variant="secondary" size="sm">
                      Previous
                    </Button>
                    <Button variant="ghost" size="sm">
                      1
                    </Button>
                    <Button variant="ghost" size="sm">
                      2
                    </Button>
                    <Button variant="ghost" size="sm">
                      3
                    </Button>
                    <span className="text-sm text-subtle">...</span>
                    <Button variant="secondary" size="sm">
                      Next
                    </Button>
                  </div>
                </div>
              </>
            ) : (
              <div className="p-4">
                <EmptyState title="No matching companies" body="Try clearing filters or searching broader terms." />
              </div>
            )
          ) : activeTab === "People" ? (
            peopleRows.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="min-w-[800px] w-full border-collapse">
                  <thead className="bg-elevated text-left text-[11px] font-semibold uppercase tracking-[0.14em] text-subtle">
                    <tr>
                      <th className="table-cell">Name</th>
                      <th className="table-cell">Title</th>
                      <th className="table-cell">Department</th>
                      <th className="table-cell">Score</th>
                      <th className="table-cell">Contact</th>
                    </tr>
                  </thead>
                  <tbody>
                    {peopleRows.map((person) => (
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
                            <Users className="size-4" />
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="p-4">
                <EmptyState title="No matching people" body="Try adjusting role or department filters." />
              </div>
            )
          ) : activeTab === "Signals" ? (
            signalRows.length > 0 ? (
              <div className="divide-y divide-border">
                {signalRows.map((signal) => (
                  <div key={signal.id} className="grid gap-3 p-4 transition hover:bg-elevated md:grid-cols-[1.05fr_1.3fr_.8fr_.65fr_.5fr]">
                    <div>
                      <div className="text-sm font-semibold text-ink">{signal.type}</div>
                      <div className="mt-1 text-xs text-muted">{signal.company}</div>
                    </div>
                    <div className="text-sm leading-6 text-muted">{signal.description}</div>
                    <div className="text-sm text-muted">{signal.time}</div>
                    <div>
                      <Badge className={signal.impact === "High" ? "bg-emerald-50 text-success" : "bg-amber-50 text-warning"}>{signal.impact} impact</Badge>
                    </div>
                    <div className="text-sm font-semibold text-primary">{signal.confidence}%</div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="p-4">
                <EmptyState title="No matching signals" body="Broaden the keyword search to surface more live events." />
              </div>
            )
          ) : (
            <div className="grid gap-4 p-4 md:grid-cols-2">
              {[
                ["Saved views", "12 reusable result sets", "Share with team"],
                ["Watchlists", "9 monitored lists", "Real-time updates"],
                ["Saved searches", "27 query templates", "Filter re-use"],
                ["Alerts", "18 digest rules", "Delivery settings"],
              ].map(([title, value, hint]) => (
                <div key={title} className="rounded-2xl border border-border bg-white p-4">
                  <div className="text-sm font-semibold text-ink">{title}</div>
                  <div className="mt-1 text-sm text-muted">{value}</div>
                  <div className="mt-4 text-xs font-medium text-success">{hint}</div>
                </div>
              ))}
            </div>
          )}
        </Card>
      </section>
    </div>
  );
}
