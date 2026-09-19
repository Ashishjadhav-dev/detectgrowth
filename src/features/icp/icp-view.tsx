"use client";
import { useEffect, useMemo, useState, type ReactNode } from "react";
import { Database, Target, TrendingUp, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { SectionHeader } from "@/components/ui/patterns";
import { getICP, updateICP } from "@/lib/api/icp";
import { listCompanies, type ApiCompany } from "@/lib/api/companies";
import { demoCompanies } from "@/data/demo";

const Field = ({ label, children }: { label: string; children: ReactNode }) => (
  <label className="block">
    <span className="mb-2 block text-sm font-medium text-ink">{label}</span>
    {children}
  </label>
);

export function IcpView() {
  const [industries, setIndustries] = useState("");
  const [locations, setLocations] = useState("");
  const [employeeSize, setEmployeeSize] = useState("");
  const [revenue, setRevenue] = useState("");
  const [signals, setSignals] = useState({
    hiring: false,
    website: false,
    marketing: false,
    launch: false,
    expansion: false,
    tech: false,
  });
  const [companies, setCompanies] = useState<ApiCompany[]>([]); const [message, setMessage] = useState("");
  useEffect(() => { getICP().then((settings) => { setIndustries(settings.industries || ""); setLocations(settings.locations || ""); setEmployeeSize(settings.employeeSize || ""); setRevenue(settings.revenue || ""); setSignals((current) => ({ ...current, ...(settings.signals || {}) })); }).catch(() => { setIndustries("E-commerce, SaaS"); setLocations("Bangalore, Mumbai"); setEmployeeSize("20-1,000 employees"); setRevenue("$1M-$50M"); }); listCompanies().then(setCompanies).catch(() => setCompanies(demoCompanies)); }, []);

  const selectedSignalCount = Object.values(signals).filter(Boolean).length;
  const fitScore = useMemo(() => {
    return Math.min(99, selectedSignalCount * 10 + (industries ? 20 : 0) + (locations ? 20 : 0) + (employeeSize ? 15 : 0) + (revenue ? 15 : 0));
  }, [industries, locations, employeeSize, revenue, selectedSignalCount]);
  const matchingCompanies = companies.filter((company) => (!industries || industries.toLowerCase().split(",").some((item) => company.industry.toLowerCase().includes(item.trim()))) && (!locations || locations.toLowerCase().split(",").some((item) => company.location.toLowerCase().includes(item.trim()))));
  const save = () => { setMessage("Saving…"); updateICP({ industries, locations, employeeSize, revenue, signals }).then(() => setMessage("ICP saved.")).catch((error: Error) => setMessage(error.message)); };

  return (
    <div className="space-y-5">
      <section className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <div className="text-[11px] font-semibold uppercase tracking-[0.18em] text-primary">ICP Builder</div>
          <h1 className="page-title mt-2">Define your ideal customer profile</h1>
          <p className="mt-1 text-sm text-muted">Shape the matching logic, signal priorities, and qualification thresholds for discovery.</p>
        </div>
        <Button onClick={save}>Save & find opportunities</Button>
      </section>

      <section className="grid gap-4 lg:grid-cols-[.85fr_1.15fr]">
        <Card className="glass-card grid place-items-center p-8 text-center">
          <div>
            <div className="mx-auto grid size-20 place-items-center rounded-full bg-primary-soft text-primary">
              <Target className="size-9" />
            </div>
            <h2 className="mt-4 text-xl font-semibold text-ink">Define your ICP</h2>
            <p className="mt-2 text-sm text-muted">Wire the profile to search, scoring, and recommendation logic.</p>
            <div className="mt-5 grid gap-3 sm:grid-cols-2">
              <div className="rounded-2xl border border-border bg-white p-4">
                <div className="text-xs uppercase tracking-[0.12em] text-subtle">Matching companies</div>
                <div className="mt-2 text-2xl font-semibold text-ink">{matchingCompanies.length}</div>
              </div>
              <div className="rounded-2xl border border-border bg-white p-4">
                <div className="text-xs uppercase tracking-[0.12em] text-subtle">High fit</div>
                <div className="mt-2 text-2xl font-semibold text-ink">{matchingCompanies.filter((company) => company.status === "active").length}</div>
              </div>
            </div>
          </div>
        </Card>

        <Card className="glass-card p-5">
          <SectionHeader title="Profile inputs" description="Use consistent, reusable fields and action buttons." />
          <div className="grid gap-5 md:grid-cols-2">
            <Field label="Industries">
              <input className="h-10 w-full rounded-xl border border-border bg-white px-3 text-sm" value={industries} onChange={(event) => setIndustries(event.currentTarget.value)} />
            </Field>
            <Field label="Locations">
              <input className="h-10 w-full rounded-xl border border-border bg-white px-3 text-sm" value={locations} onChange={(event) => setLocations(event.currentTarget.value)} />
            </Field>
            <Field label="Company size">
              <select className="h-10 w-full rounded-xl border border-border bg-white px-3 text-sm" value={employeeSize} onChange={(event) => setEmployeeSize(event.currentTarget.value)}>
                <option>20-1,000 employees</option>
                <option>51-200 employees</option>
                <option>201-500 employees</option>
                <option>500+ employees</option>
              </select>
            </Field>
            <Field label="Annual revenue">
              <select className="h-10 w-full rounded-xl border border-border bg-white px-3 text-sm" value={revenue} onChange={(event) => setRevenue(event.currentTarget.value)}>
                <option>$1M-$50M</option>
                <option>$10M-$100M</option>
                <option>$50M-$250M</option>
              </select>
            </Field>
          </div>

          <div className="mt-5">
            <div className="mb-2 text-sm font-medium text-ink">Important signals</div>
            <div className="grid gap-2 sm:grid-cols-2">
              {[
                ["Hiring", "hiring"],
                ["Website activity", "website"],
                ["Marketing activity", "marketing"],
                ["New product launch", "launch"],
                ["Expansion", "expansion"],
                ["Technology changes", "tech"],
              ].map(([label, key]) => (
                <label key={key} className="flex items-center gap-2 rounded-2xl border border-border bg-white p-3 text-sm text-muted">
                  <input
                    type="checkbox"
                    checked={signals[key as keyof typeof signals]}
                    onChange={(event) =>
                      setSignals((current) => ({
                        ...current,
                        [key]: event.currentTarget.checked,
                      }))
                    }
                  />
                  {label}
                </label>
              ))}
            </div>
          </div>

          <Button className="mt-5 w-full" onClick={save}>
            <Database className="size-4" />
            Save ICP and update matching
          </Button>
          {message && <div className="mt-3 text-center text-sm text-muted">{message}</div>}
        </Card>
      </section>

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {[
          ["Fit score", String(fitScore), "From saved criteria", TrendingUp],
          ["Signals watched", String(selectedSignalCount), "High priority", Users],
          ["Sources connected", "2", "GDELT + Hacker News", Database],
          ["Recommended matches", String(matchingCompanies.length), "Current workspace", Target],
        ].map(([title, value, hint, Icon]) => (
          <Card key={title as string} className="glass-card p-4">
            <div className="flex items-start justify-between gap-3">
              <div>
                <div className="text-sm font-semibold text-ink">{title as string}</div>
                <div className="mt-1 text-2xl font-semibold text-primary">{value as string}</div>
              </div>
              <div className="grid size-9 place-items-center rounded-2xl bg-primary-soft text-primary">
                <Icon className="size-4" />
              </div>
            </div>
            <div className="mt-4 text-xs font-medium text-success">{hint as string}</div>
          </Card>
        ))}
      </section>
    </div>
  );
}
