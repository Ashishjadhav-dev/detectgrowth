"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowLeft, Bookmark, Building2, Download, Mail, MoreHorizontal, Phone, Sparkles, Users } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { CompanyMark } from "@/components/companies/company-mark";
import { Progress } from "@/components/ui/progress";
import { SectionHeader } from "@/components/ui/patterns";
import { getCompany, type ApiCompany } from "@/lib/api/companies";
import { demoCompanies } from "@/data/demo";

const tabs = ["Overview", "Growth", "Signals", "People", "Tech", "Funding", "Notes"] as const;

export function CompanyDetail({ id }: { id: string }) {
  const [activeTab, setActiveTab] = useState<(typeof tabs)[number]>("Overview");
  const [company, setCompany] = useState<ApiCompany | null>(null);
  useEffect(() => { getCompany(id).then(setCompany).catch(() => { setCompany(demoCompanies.find((item) => item.id === id) ?? demoCompanies[0]); }); }, [id]);
  const liveSignals = company?.signals ?? [];
  const averageConfidence = liveSignals.length ? Math.round(liveSignals.reduce((sum, signal) => sum + (signal.confidence ?? 0), 0) / liveSignals.length) : 0;

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <Link href="/discover" className="inline-flex items-center gap-2 text-sm text-muted hover:text-primary">
          <ArrowLeft className="size-4" />
          Back to discovery
        </Link>
        <div className="flex flex-wrap gap-2">
          <Button variant="secondary">
            <Bookmark className="size-4" />
            Save
          </Button>
          <Button variant="secondary">
            <Download className="size-4" />
            Export
          </Button>
          <Button variant="secondary">
            <Sparkles className="size-4" />
            AI summary
          </Button>
        </div>
      </div>

      <Card className="glass-card p-5">
        <div className="flex flex-wrap items-start gap-4">
          <CompanyMark name={company?.name ?? "Company"} />
          <div className="min-w-0 flex-1">
            <div className="text-[11px] font-semibold uppercase tracking-[0.16em] text-primary">Company 360</div>
            <h1 className="page-title mt-2">{company?.name ?? "Loading company…"}</h1>
            <p className="mt-1 text-sm text-muted">{company?.industry || "—"} · {company?.location || "—"} · <span className="text-primary">{company?.domain || "—"}</span></p>
          </div>
          <div className="text-right"><Badge className="bg-primary-soft text-primary">{company?.status || "loading"}</Badge></div>
        </div>

        <div className="mt-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          {[ ["Active signals", String(liveSignals.length), "current"], ["People found", "2", "decision makers"], ["Confidence", averageConfidence ? `${averageConfidence}%` : "—", "signal confidence"], ["Last updated", company?.updatedAt ? new Date(company.updatedAt).toLocaleDateString() : "—", "recently refreshed"] ].map(([label, value, delta]) => (
            <div key={label} className="rounded-2xl border border-border bg-white p-4">
              <div className="text-xs uppercase tracking-[0.12em] text-subtle">{label}</div>
              <div className="mt-2 text-2xl font-semibold text-ink">{value}</div>
              <div className="mt-1 text-xs text-success">{delta} this week</div>
            </div>
          ))}
        </div>
      </Card>

      <div className="flex gap-6 overflow-x-auto border-b border-border text-sm">
        {tabs.map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`whitespace-nowrap border-b-2 px-1 pb-3 ${activeTab === tab ? "border-primary font-semibold text-primary" : "border-transparent text-muted"}`}
          >
            {tab}
          </button>
        ))}
      </div>

      <section className="grid gap-4 xl:grid-cols-[1.2fr_.8fr]">
        <Card className="glass-card p-5">
          <SectionHeader title={`Company ${activeTab.toLowerCase()}`} description="Key facts, context, and quick reference details." />
          {activeTab === "Overview" ? (
            <div className="grid gap-4 md:grid-cols-2">
              <div className="rounded-2xl border border-border bg-white p-4">
                <div className="text-sm font-medium text-ink">Business summary</div>
                <p className="mt-2 text-sm leading-6 text-muted">
                  {company?.name || "This company"} is monitored from the account and signal data currently available in your workspace.
                </p>
              </div>
              <div className="rounded-2xl border border-border bg-white p-4">
                <div className="text-sm font-medium text-ink">Highlights</div>
                <div className="mt-3 space-y-2">
                  {(liveSignals.length ? liveSignals.slice(0, 4).map((signal) => signal.type) : ["No signals collected yet"]).map((item) => (
                    <div key={item} className="flex items-center gap-2 text-sm text-muted">
                      <span className="size-1.5 rounded-full bg-primary" />
                      {item}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ) : (
            <div className="rounded-2xl border border-dashed border-border bg-elevated p-5 text-sm text-muted">
              {activeTab} content can render the detailed module-specific view here.
            </div>
          )}
          <div className="mt-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
            {[["Employees", company?.employeeRange || "—"], ["Industry", company?.industry || "—"], ["Location", company?.location || "—"], ["Domain", company?.domain || "—"], ["Status", company?.status || "—"], ["Updated", company?.updatedAt ? new Date(company.updatedAt).toLocaleString() : "—"]].map(([label, value]) => (
              <div key={label} className="rounded-2xl border border-border bg-white p-4">
                <div className="text-xs uppercase tracking-[0.12em] text-subtle">{label}</div>
                <div className="mt-2 text-sm font-medium text-ink">{value}</div>
              </div>
            ))}
          </div>
        </Card>

        <Card className="glass-card p-5">
          <SectionHeader title="Growth score" description="Explainable signals and momentum behind the score." />
          <div className="space-y-3">
            {(liveSignals.length ? liveSignals.slice(0, 5).map((signal) => [signal.type, Math.round(signal.confidence ?? 0)] as [string, number]) : [["Signal coverage", 0] as [string, number]]).map(([label, value]) => (
              <div key={label} className="space-y-2 rounded-2xl border border-border bg-white p-3">
                <div className="flex items-center justify-between text-sm">
                  <span className="font-medium text-ink">{label}</span>
                  <span className="text-muted">{value}</span>
                </div>
                <Progress value={value as number} />
              </div>
            ))}
          </div>
          <div className="mt-4 rounded-2xl border border-dashed border-border bg-elevated p-4 text-sm text-muted">
            Score explanations, history, and evidence should appear here as structured UI, not raw text.
          </div>
        </Card>
      </section>

      <section className="grid gap-4 xl:grid-cols-[1.15fr_.85fr]">
        <Card className="glass-card p-5">
          <SectionHeader title="Signals timeline" description="Recent events that justify the account being active now." />
          <div className="space-y-3">
            {liveSignals.slice(0, 4).map((signal) => (
              <div key={signal.id} className="rounded-2xl border border-border bg-white p-3">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <div className="text-sm font-medium text-ink">{signal.type}</div>
                    <div className="mt-1 text-sm text-muted">{signal.description}</div>
                  </div>
                  <Badge className="bg-primary-soft text-primary">{signal.impact}</Badge>
                </div>
                <div className="mt-2 text-xs text-muted">{signal.time}</div>
              </div>
            ))}
          </div>
        </Card>

        <Card className="glass-card p-5">
          <SectionHeader title="People" description="The buyer committee and likely decision makers." />
          <div className="space-y-2">{["Rahul Sharma · Head of Marketing", "Neha Patil · Marketing Manager"].map((person) => <div key={person} className="rounded-2xl border border-border bg-white p-3 text-sm text-ink">{person}</div>)}</div>
          <Button className="mt-4 w-full">
            <Users className="size-4" />
            View all contacts
          </Button>
        </Card>
      </section>

      <Card className="glass-card p-5">
        <SectionHeader title="Recommended action" description="A clear next step closes the loop from signal to outreach." />
        <div className="grid gap-4 xl:grid-cols-[1.1fr_.9fr]">
          <div className="rounded-2xl border border-border bg-white p-4">
            <div className="text-sm font-medium text-ink">Suggested outreach</div>
            <p className="mt-2 text-sm leading-6 text-muted">
              Reach out to the Head of Marketing with a proposal tied to the new collection and rising ad activity.
            </p>
          </div>
          <div className="rounded-2xl border border-border bg-white p-4">
            <div className="text-sm font-medium text-ink">Quick actions</div>
            <div className="mt-3 flex flex-wrap gap-2">
              <Button variant="secondary" size="sm">
                <Mail className="size-4" />
                Email
              </Button>
              <Button variant="secondary" size="sm">
                <Phone className="size-4" />
                Call
              </Button>
              <Button variant="secondary" size="sm">
                <Building2 className="size-4" />
                Add to list
              </Button>
              <Button variant="secondary" size="sm">
                <MoreHorizontal className="size-4" />
              </Button>
            </div>
          </div>
        </div>
      </Card>
    </div>
  );
}
