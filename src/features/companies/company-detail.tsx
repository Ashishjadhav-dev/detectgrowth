"use client";
import { useState } from "react";
import Link from "next/link";
import { ArrowLeft, Bookmark, Building2, Download, Mail, MoreHorizontal, Phone, Sparkles, Users } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { CompanyMark } from "@/components/companies/company-mark";
import { Score } from "@/components/ui/score";
import { Progress } from "@/components/ui/progress";
import { signals } from "@/data/mock";
import { SectionHeader } from "@/components/ui/patterns";

const metrics = [
  ["Growth", "95", "+12"],
  ["Active signals", "24", "+6"],
  ["People found", "18", "+4"],
  ["Confidence", "96", "+2"],
];

const people = [
  ["Aditi Rao", "Founder", "Decision maker"],
  ["Rahul Sharma", "Head of Marketing", "Warm contact"],
  ["Priya Kapoor", "Growth Lead", "High intent"],
];

const tabs = ["Overview", "Growth", "Signals", "People", "Tech", "Funding", "Notes"] as const;

export function CompanyDetail() {
  const [activeTab, setActiveTab] = useState<(typeof tabs)[number]>("Overview");

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
          <CompanyMark name="ABC Fashion" />
          <div className="min-w-0 flex-1">
            <div className="text-[11px] font-semibold uppercase tracking-[0.16em] text-primary">Company 360</div>
            <h1 className="page-title mt-2">ABC Fashion</h1>
            <p className="mt-1 text-sm text-muted">E-commerce · Bangalore, India · <span className="text-primary">abcfashion.com</span></p>
          </div>
          <div className="text-right">
            <Score value={95} />
            <Badge className="mt-2 bg-emerald-50 text-success">High fit</Badge>
          </div>
        </div>

        <div className="mt-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          {metrics.map(([label, value, delta]) => (
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
                  ABC Fashion is a D2C fashion brand with growing online traction, new product launches, and increasing hiring activity.
                </p>
              </div>
              <div className="rounded-2xl border border-border bg-white p-4">
                <div className="text-sm font-medium text-ink">Highlights</div>
                <div className="mt-3 space-y-2">
                  {["Strong social presence", "Active ads spend", "Recent product launch", "Hiring marketing roles"].map((item) => (
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
            {[
              ["Employees", "75-100"],
              ["Founded", "2013"],
              ["Revenue", "$5M-$10M"],
              ["Type", "Private"],
              ["Industry", "E-commerce"],
              ["Location", "Bangalore, India"],
            ].map(([label, value]) => (
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
            {[
              ["Growth signals", 92],
              ["Marketing activity", 82],
              ["Product fit", 74],
              ["Online presence", 68],
              ["Data confidence", 64],
            ].map(([label, value]) => (
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
            {signals.slice(0, 4).map((signal) => (
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
          <div className="space-y-2">
            {people.map(([name, title, context]) => (
              <div key={name} className="rounded-2xl border border-border bg-white p-3">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <div className="text-sm font-medium text-ink">{name}</div>
                    <div className="text-xs text-muted">{title}</div>
                    <div className="mt-1 text-xs text-muted">{context}</div>
                  </div>
                  <div className="flex items-center gap-2 text-muted">
                    <Mail className="size-4" />
                    <Phone className="size-4" />
                  </div>
                </div>
              </div>
            ))}
          </div>
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
