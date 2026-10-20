"use client";

import { useState } from "react";
import { Plus, MoreHorizontal } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";

const stages = ["Saved", "Applied", "Interviewing", "Offered"] as const;
type Stage = (typeof stages)[number];
type Application = { id: number; company: string; role: string; stage: Stage; score: number };

export default function ApplicationsPage() {
  const [applications, setApplications] = useState<Application[]>([
    { id: 1, company: "Northstar Labs", role: "Growth Marketing Manager", stage: "Interviewing", score: 86 },
    { id: 2, company: "Atlas Commerce", role: "Product Marketing Lead", stage: "Applied", score: 78 },
    { id: 3, company: "Orbit Systems", role: "Senior Growth Associate", stage: "Saved", score: 72 },
  ]);
  const [company, setCompany] = useState("");
  const [role, setRole] = useState("");
  const addApplication = () => {
    if (!company.trim() || !role.trim()) return;
    setApplications((current) => [...current, { id: Date.now(), company: company.trim(), role: role.trim(), stage: "Saved", score: 0 }]);
    setCompany(""); setRole("");
  };
  const move = (id: number, stage: Stage) => setApplications((current) => current.map((item) => item.id === id ? { ...item, stage } : item));
  return <div className="mx-auto max-w-7xl space-y-6"><div className="flex flex-wrap items-end justify-between gap-4"><div><Badge>Job search</Badge><h1 className="page-title mt-3">Application Tracker</h1><p className="meta mt-2">Keep every opportunity moving, with your resume score visible at each stage.</p></div><div className="flex flex-wrap gap-2"><Input value={company} onChange={(event) => setCompany(event.target.value)} placeholder="Company" className="w-40" /><Input value={role} onChange={(event) => setRole(event.target.value)} placeholder="Role" className="w-52" /><Button onClick={addApplication}><Plus className="size-4" />Add application</Button></div></div><div className="grid gap-4 xl:grid-cols-4">{stages.map((stage) => <section key={stage} className="min-h-64 rounded-2xl border border-border bg-elevated p-3"><div className="mb-3 flex items-center justify-between"><h2 className="text-sm font-semibold text-ink">{stage}</h2><span className="rounded-full bg-white px-2 py-1 text-xs text-muted">{applications.filter((item) => item.stage === stage).length}</span></div><div className="space-y-3">{applications.filter((item) => item.stage === stage).map((application) => <Card key={application.id} className="p-4"><div className="flex items-start justify-between gap-2"><div><p className="text-sm font-semibold">{application.company}</p><p className="mt-1 text-xs text-muted">{application.role}</p></div><MoreHorizontal className="size-4 text-subtle" /></div><div className="mt-4 flex items-center justify-between"><span className={`rounded-full px-2 py-1 text-[11px] font-semibold ${application.score >= 80 ? "bg-green-50 text-green-700" : application.score >= 60 ? "bg-amber-50 text-amber-700" : "bg-elevated text-muted"}`}>{application.score ? `ATS ${application.score}` : "Not scanned"}</span><select value={application.stage} onChange={(event) => move(application.id, event.target.value as Stage)} aria-label={`Move ${application.company}`} className="rounded-lg border border-border bg-white px-2 py-1 text-[11px] text-muted"><option>Saved</option><option>Applied</option><option>Interviewing</option><option>Offered</option></select></div></Card>)}</div></section>)}</div></div>;
}
