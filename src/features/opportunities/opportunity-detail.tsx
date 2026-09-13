"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowLeft, Bookmark, Download, Mail, MoreHorizontal, Phone, Target, TrendingUp, Users } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Score } from "@/components/ui/score";
import { CompanyMark } from "@/components/companies/company-mark";
import { SectionHeader } from "@/components/ui/patterns";
import { getOpportunity, type ApiOpportunity } from "@/lib/api/opportunities";

const scoreParts = [
  ["Growth Signals", 92, "+22"],
  ["Marketing Activity", 82, "+19"],
  ["Product Fit", 74, "+18"],
  ["Online Presence", 68, "+15"],
  ["Recent Signal", 67, "+15"],
  ["Data Confidence", 64, "+10"],
] as const;

const timeline = [
  ["Aug 12, 2026", "New product collection launched"],
  ["Aug 09, 2026", "Hiring marketing executive"],
  ["Aug 07, 2026", "Increased ad activity detected"],
  ["Aug 05, 2026", "Website updated"],
  ["Aug 15, 2026", "Opportunity detected"],
];

const contacts = [
  ["Priya Kapoor", "Head of Marketing", "priya@abcfashion.com", "Warm"],
  ["Rohan Mehta", "Growth Lead", "rohan@abcfashion.com", "Medium"],
  ["Aditi Rao", "Founder", "aditi@abcfashion.com", "High"],
];

const tabs = ["Overview", "Signals", "People", "Research", "Notes", "Activity"] as const;

export function OpportunityDetail({ id }: { id: string }) {
  const [activeTab, setActiveTab] = useState<(typeof tabs)[number]>("Overview");
  const [opportunity, setOpportunity] = useState<ApiOpportunity | null>(null);
  const [apiError, setApiError] = useState<string | null>(null);

  useEffect(() => {
    getOpportunity(id).then(setOpportunity).catch((error: Error) => setApiError(error.message));
  }, [id]);

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <Link href="/discover" className="inline-flex items-center gap-2 text-sm text-muted hover:text-primary">
          <ArrowLeft className="size-4" />
          Back to discoveries
        </Link>
        <div className="flex gap-2">
          <Button variant="secondary">
            <Bookmark className="size-4" />
            Save
          </Button>
          <Button variant="secondary">
            <Download className="size-4" />
            Export
          </Button>
          <Button variant="secondary" aria-label="More actions">
            <MoreHorizontal className="size-4" />
          </Button>
        </div>
      </div>

      <Card className="glass-card p-5">
        {apiError ? <div className="mb-4 rounded-xl border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-800">Opportunity API unavailable; showing preview data.</div> : null}
        <div className="flex flex-wrap items-start gap-4">
          <CompanyMark name={opportunity?.company ?? "ABC Fashion"} />
          <div className="min-w-0 flex-1">
            <div className="text-[11px] font-semibold uppercase tracking-[0.16em] text-primary">Company 360</div>
            <h1 className="page-title mt-2">{opportunity?.company ?? "ABC Fashion"}</h1>
            <p className="mt-1 text-sm text-muted">
              {opportunity?.industry || "E-commerce"} · {opportunity?.location || "Bangalore, India"}
            </p>
          </div>
          <div className="text-right">
            <Score value={opportunity?.score || 94} />
            <Badge className="mt-2 bg-emerald-50 text-success">High Opportunity</Badge>
          </div>
        </div>

        <div className="mt-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          <div className="rounded-2xl border border-border bg-white p-4">
            <div className="text-xs font-semibold uppercase tracking-[0.12em] text-subtle">Decision makers</div>
            <div className="mt-2 text-2xl font-semibold text-ink">18</div>
            <div className="mt-1 text-xs text-success">+4 this week</div>
          </div>
          <div className="rounded-2xl border border-border bg-white p-4">
            <div className="text-xs font-semibold uppercase tracking-[0.12em] text-subtle">Signals</div>
            <div className="mt-2 text-2xl font-semibold text-ink">24</div>
            <div className="mt-1 text-xs text-success">12 verified</div>
          </div>
          <div className="rounded-2xl border border-border bg-white p-4">
            <div className="text-xs font-semibold uppercase tracking-[0.12em] text-subtle">Pipeline fit</div>
            <div className="mt-2 text-2xl font-semibold text-ink">$780K</div>
            <div className="mt-1 text-xs text-success">Expected ACV</div>
          </div>
          <div className="rounded-2xl border border-border bg-white p-4">
            <div className="text-xs font-semibold uppercase tracking-[0.12em] text-subtle">Account health</div>
            <div className="mt-2 text-2xl font-semibold text-ink">Strong</div>
            <div className="mt-1 text-xs text-success">Growing quickly</div>
          </div>
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

      <div className="grid gap-4 xl:grid-cols-[1.4fr_.95fr]">
        <Card className="glass-card p-5">
          <SectionHeader title={`Why this is a strong fit - ${activeTab}`} description="The same scoring story shown in the wireframes, with explainable parts." />
          {activeTab === "Overview" || activeTab === "Signals" ? (
            <div className="mt-5 space-y-4">
              {scoreParts.map(([label, value, delta]) => (
                <div key={label} className="grid grid-cols-[150px_1fr_48px] items-center gap-3">
                  <div className="text-sm text-muted">{label}</div>
                  <Progress value={value} />
                  <div className="text-right text-sm font-semibold text-ink">{delta}</div>
                </div>
              ))}
            </div>
          ) : (
            <div className="mt-5 rounded-2xl border border-dashed border-border bg-elevated p-5 text-sm text-muted">
              {activeTab} content can render the detailed module-specific content here.
            </div>
          )}
          <div className="mt-5 flex items-center justify-between border-t border-border pt-4">
            <span className="text-sm font-semibold text-ink">Total Score</span>
            <span className="text-sm font-semibold text-primary">94/100</span>
          </div>
        </Card>

        <Card className="glass-card p-5">
          <SectionHeader title="Why now?" description="Recent actions that justify outreach right away." />
          <div className="space-y-0">
            {timeline.map(([date, text], index) => (
              <div key={date + text} className="relative flex gap-3 pb-5 last:pb-0">
                <div className="relative">
                  <span className="mt-1 block size-2.5 rounded-full bg-primary" />
                  {index < timeline.length - 1 ? <span className="absolute left-[4px] top-3 h-[calc(100%+8px)] w-px bg-border" /> : null}
                </div>
                <div>
                  <div className="text-[11px] text-subtle">{date}</div>
                  <div className="text-sm text-ink">{text}</div>
                </div>
              </div>
            ))}
          </div>
        </Card>
      </div>

      <div className="grid gap-4 xl:grid-cols-[1.2fr_.8fr]">
        <Card className="glass-card p-5">
          <SectionHeader title="Recommended next actions" description="Teams can carry this into outreach, qualification, and planning." />
          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
            {[
              ["Meta Ads", "94% Match", "primary"],
              ["Retargeting", "78% Match", "info"],
              ["Email Marketing", "67% Match", "success"],
              ["SEO", "42% Match", "warning"],
            ].map(([name, match, tone]) => (
              <div key={name} className="rounded-2xl border border-border bg-white p-4">
                <div className="text-sm font-semibold text-ink">{name}</div>
                <div className="mt-5 text-xs font-medium text-primary">{match}</div>
              </div>
            ))}
          </div>
        </Card>

        <Card className="glass-card p-5">
          <SectionHeader title="Suggested contacts" description="The wireframe’s contact panel becomes actionable here." />
          <div className="space-y-2">
            {contacts.map(([name, title, email, warmth]) => (
              <div key={name} className="rounded-2xl border border-border bg-white p-3">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <div className="text-sm font-medium text-ink">{name}</div>
                    <div className="text-xs text-muted">{title}</div>
                    <div className="mt-2 text-xs text-muted">{email}</div>
                  </div>
                  <Badge className={warmth === "High" ? "bg-emerald-50 text-success" : warmth === "Warm" ? "bg-blue-50 text-info" : "bg-amber-50 text-warning"}>
                    {warmth}
                  </Badge>
                </div>
                <div className="mt-3 flex items-center gap-2">
                  <Button variant="secondary" size="sm">
                    <Mail className="size-4" />
                    Email
                  </Button>
                  <Button variant="secondary" size="sm">
                    <Phone className="size-4" />
                    Call
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </Card>
      </div>

      <Card className="glass-card p-5">
        <SectionHeader title="Overall account context" description="A production-ready detail page should expose everything needed to act in one place." />
        <div className="grid gap-4 xl:grid-cols-[1.15fr_.85fr]">
          <div className="rounded-2xl border border-border bg-white p-4">
            <div className="flex items-center justify-between">
              <div className="text-sm font-medium text-ink">Signals in the last 7 days</div>
              <Badge className="bg-primary-soft text-primary">24 active</Badge>
            </div>
            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              {[
                ["Hiring surge", "Yes"],
                ["Funding round", "Detected"],
                ["Product launch", "Detected"],
                ["Web traffic", "Accelerating"],
              ].map(([label, value]) => (
                <div key={label} className="rounded-2xl border border-border bg-elevated p-3">
                  <div className="text-xs text-subtle">{label}</div>
                  <div className="mt-1 text-sm font-medium text-ink">{value}</div>
                </div>
              ))}
            </div>
          </div>
          <div className="rounded-2xl border border-border bg-white p-4">
            <div className="flex items-center gap-3">
              <div className="grid size-12 place-items-center rounded-2xl bg-primary-soft text-primary">
                <Target className="size-5" />
              </div>
              <div>
                <div className="text-sm font-medium text-ink">Suggested play</div>
                <div className="text-xs text-muted">Lead with a channel and offer aligned to their current growth motion.</div>
              </div>
            </div>
            <div className="mt-4 rounded-2xl border border-dashed border-border bg-elevated p-4 text-sm text-muted">
              Use this panel to surface AI recommendations, evidence, and the next best action from the product.
            </div>
          </div>
        </div>
      </Card>
    </div>
  );
}
