"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { ArrowRight, Check, Copy, FileText, Lightbulb, Save, Sparkles, Target, WandSparkles } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { personalize, type AIResumeResult } from "@/lib/ai";
import { compareResumeToJob, type JobComparison } from "@/lib/resume-analysis";

function savedResumeText() {
  try {
    const draft = JSON.parse(window.localStorage.getItem("detectgrowth-resume-draft") ?? "{}");
    return [draft.name, draft.headline, draft.summary, draft.experience, draft.education, draft.skills, draft.projects].filter(Boolean).join("\n");
  } catch { return ""; }
}

export default function ResumeMatchPage() {
  const [resumeText, setResumeText] = useState("");
  const [description, setDescription] = useState("");
  const [comparison, setComparison] = useState<JobComparison | null>(null);
  const [busy, setBusy] = useState(false);
  const [coverLetter, setCoverLetter] = useState("");
  const [message, setMessage] = useState("");
  const [aiBusy, setAiBusy] = useState(false);
  const [aiError, setAiError] = useState("");

  useEffect(() => setResumeText(savedResumeText()), []);

  const analyze = () => {
    if (!resumeText.trim() || !description.trim()) return;
    setBusy(true); setMessage(""); setCoverLetter("");
    window.setTimeout(() => { setComparison(compareResumeToJob(resumeText, description)); setBusy(false); }, 700);
  };

  const generateResume = () => {
    if (!comparison) return;
    try {
      const draft = JSON.parse(window.localStorage.getItem("detectgrowth-resume-draft") ?? "{}");
      window.localStorage.setItem("detectgrowth-resume-draft", JSON.stringify({ ...draft, summary: comparison.tailoredSummary, experience: `${draft.experience ?? ""}\n\n${comparison.tailoredBullets.map((bullet) => `• ${bullet}`).join("\n")}`.trim() }));
      setMessage("Tailored content saved to your resume creator.");
    } catch { setMessage("Open the resume creator to review your tailored content."); }
  };

  const improveWithAI = async () => {
    if (!comparison) return;
    setAiBusy(true); setAiError("");
    try {
      const result = await personalize<AIResumeResult>("resume", { resume: resumeText, jobDescription: description });
      setComparison((current) => current ? { ...current, tailoredSummary: result.summary, tailoredBullets: result.bullets } : current);
      setMessage("AI personalization applied. Review the rewritten content before saving.");
    } catch (error) { setAiError(error instanceof Error ? error.message : "AI personalization is unavailable."); }
    finally { setAiBusy(false); }
  };

  const generateCoverLetter = () => {
    if (!comparison) return;
    const role = description.split(/\n|[.!?]/).map((line) => line.trim()).find((line) => line.length > 4 && line.length < 90) ?? "this opportunity";
    setCoverLetter(`Dear Hiring Manager,\n\nI am excited to apply for ${role}. My background combines ${comparison.matchedKeywords.slice(0, 4).join(", ") || "relevant experience"} with a track record of turning priorities into measurable outcomes.\n\nIn my recent work, I have ${comparison.tailoredBullets[0].toLowerCase()} I would welcome the opportunity to bring this ownership, clarity, and execution focus to your team.\n\nThank you for your consideration. I would be glad to discuss how my experience can support your goals.\n\nBest,\nYour Name`);
  };

  const generateAICoverLetter = async () => {
    if (!comparison) return;
    setAiBusy(true); setAiError("");
    try {
      const result = await personalize<{ coverLetter: string }>("cover-letter", { resume: resumeText, jobDescription: description });
      setCoverLetter(result.coverLetter);
    } catch (error) { setAiError(error instanceof Error ? error.message : "AI cover-letter generation is unavailable."); }
    finally { setAiBusy(false); }
  };

  const saveApplication = () => {
    if (!comparison) return;
    const applications = JSON.parse(window.localStorage.getItem("detectgrowth-applications") ?? "[]") as Array<Record<string, unknown>>;
    applications.unshift({ id: crypto.randomUUID(), company: "Target company", role: "Target role", stage: "Saved", score: comparison.score, createdAt: new Date().toISOString() });
    window.localStorage.setItem("detectgrowth-applications", JSON.stringify(applications));
    setMessage("Application saved to your tracker.");
  };

  return <div className="mx-auto max-w-[1500px] space-y-6"><div><Badge><Sparkles className="size-3" />Resume tailoring</Badge><h1 className="page-title mt-3">Match your resume to a specific role</h1><p className="meta mt-2 max-w-3xl">Paste a job description to get a real comparison, targeted edits, a tailored resume draft, and a ready-to-personalize cover letter.</p></div>
    {!resumeText ? <Card className="border-amber-200 bg-amber-50 p-5"><p className="text-sm text-amber-900">Upload or create a resume first so the comparison uses your actual experience.</p><Link href="/resume/upload" className="mt-3 inline-flex text-sm font-semibold text-amber-900 underline">Open resume workspace</Link></Card> : null}
    <div className="grid gap-5 xl:grid-cols-[minmax(320px,.9fr)_minmax(0,1.1fr)]"><Card className="flex min-h-[620px] flex-col p-5 sm:p-6"><div className="flex items-start gap-3"><span className="grid size-10 shrink-0 place-items-center rounded-xl bg-primary-soft text-primary"><FileText className="size-5" /></span><div><h2 className="section-title">Target job description</h2><p className="meta mt-1">Paste the complete role listing for the strongest analysis.</p></div></div><textarea value={description} onChange={(event) => { setDescription(event.target.value); setComparison(null); }} rows={20} placeholder="Paste the job description here…" className="mt-5 min-h-80 w-full flex-1 resize-y rounded-xl border border-border bg-white px-3.5 py-3 text-sm leading-6 text-ink placeholder:text-subtle focus:border-primary/50 focus:outline-none" /><div className="mt-2 flex items-center justify-between text-xs text-subtle"><span>{description.length.toLocaleString()} characters</span><span>Use the full posting</span></div><Button className="mt-4 w-full" disabled={!resumeText || !description.trim() || busy} onClick={analyze}>{busy ? "Analyzing match…" : <><Target className="size-4" />Analyze match</>}</Button></Card>
      <Card className="min-h-[620px] p-5 sm:p-6"><div className="flex items-start justify-between gap-3"><div><Badge>Role intelligence</Badge><h2 className="section-title mt-3">Your match report</h2><p className="meta mt-1">Scores are calculated from your saved resume and this job description.</p></div>{comparison ? <span className="rounded-full bg-primary-soft px-3 py-1 text-sm font-semibold text-primary">{comparison.score}/100</span> : null}</div>{comparison ? <><div className="mt-6 grid gap-4 sm:grid-cols-3">{comparison.sections.map((section) => <div key={section.label} className="rounded-xl border border-border p-3"><p className="text-xs text-muted">{section.label}</p><p className="mt-2 text-xl font-semibold text-ink">{section.score}</p><p className="mt-1 text-[11px] text-muted">{section.detail}</p></div>)}</div><div className="mt-6 grid gap-5 lg:grid-cols-2"><div><h3 className="text-xs font-semibold uppercase tracking-[.12em] text-primary">Matched keywords</h3><div className="mt-3 flex flex-wrap gap-2">{comparison.matchedKeywords.length ? comparison.matchedKeywords.map((keyword) => <span key={keyword} className="rounded-full bg-green-50 px-2.5 py-1 text-xs text-green-800">{keyword}</span>) : <span className="text-sm text-muted">No exact matches yet.</span>}</div></div><div><h3 className="text-xs font-semibold uppercase tracking-[.12em] text-amber-700">Keywords to address</h3><div className="mt-3 flex flex-wrap gap-2">{comparison.missingKeywords.length ? comparison.missingKeywords.map((keyword) => <span key={keyword} className="rounded-full bg-amber-50 px-2.5 py-1 text-xs text-amber-900">{keyword}</span>) : <span className="text-sm text-muted">No major gaps detected.</span>}</div></div></div><div className="mt-6 rounded-xl border border-amber-200 bg-amber-50 p-4"><div className="flex items-center gap-2 text-amber-900"><Lightbulb className="size-4" /><h3 className="text-sm font-semibold">Recommended fixes</h3></div><ul className="mt-3 space-y-2 text-sm text-amber-900/80">{comparison.suggestions.map((suggestion) => <li key={suggestion} className="flex gap-2"><span>•</span>{suggestion}</li>)}</ul></div>{comparison.learningPlan.length ? <div className="mt-6 rounded-xl border border-border bg-elevated/40 p-4"><h3 className="text-sm font-semibold text-ink">Career gap plan</h3><p className="mt-1 text-xs text-muted">Turn missing keywords into evidence instead of adding unsupported claims.</p><div className="mt-4 space-y-3">{comparison.learningPlan.map((item) => <div key={item.gap} className="rounded-xl border border-border bg-white p-3"><p className="text-sm font-semibold text-ink">{item.gap}</p><p className="mt-1 text-sm text-muted">{item.action}</p><p className="mt-2 text-xs text-subtle">Proof: {item.proof}</p></div>)}</div></div> : null}<div className="mt-6 rounded-xl border border-primary/15 bg-primary-soft/40 p-4"><h3 className="text-sm font-semibold text-ink">Tailored summary</h3><p className="mt-2 text-sm leading-6 text-muted">{comparison.tailoredSummary}</p><h3 className="mt-5 text-sm font-semibold text-ink">Suggested achievement bullets</h3><ul className="mt-2 space-y-2 text-sm leading-6 text-muted">{comparison.tailoredBullets.map((bullet) => <li key={bullet} className="flex gap-2"><Check className="mt-1 size-4 shrink-0 text-primary" />{bullet}</li>)}</ul></div><div className="mt-6 flex flex-wrap gap-2"><Button onClick={improveWithAI} disabled={aiBusy}><Sparkles className="size-4" />{aiBusy ? "Personalizing…" : "Improve with AI"}</Button><Button onClick={generateResume}><WandSparkles className="size-4" />Save tailored resume</Button><Button variant="secondary" onClick={generateAICoverLetter} disabled={aiBusy}><FileText className="size-4" />AI cover letter</Button><Button variant="secondary" onClick={generateCoverLetter}>Local cover letter</Button><Button variant="secondary" onClick={saveApplication}><Save className="size-4" />Save application</Button></div>{aiError ? <p role="alert" className="mt-3 text-sm text-amber-700">{aiError}</p> : null}{message ? <p role="status" className="mt-3 text-sm text-primary">{message}</p> : null}{coverLetter ? <div className="mt-5 rounded-xl border border-border bg-white p-4"><div className="flex items-center justify-between gap-3"><h3 className="text-sm font-semibold text-ink">Cover letter draft</h3><button type="button" className="inline-flex items-center gap-1 text-xs font-semibold text-primary" onClick={() => void navigator.clipboard?.writeText(coverLetter)}><Copy className="size-3.5" />Copy</button></div><textarea value={coverLetter} onChange={(event) => setCoverLetter(event.target.value)} rows={12} className="mt-3 w-full resize-y rounded-xl border border-border p-3 text-sm leading-6 text-ink focus:border-primary/50 focus:outline-none" /></div> : null}</> : <div className="grid min-h-[470px] place-items-center text-center"><div><span className="mx-auto grid size-12 place-items-center rounded-full bg-primary-soft text-primary"><Target className="size-5" /></span><p className="mt-4 text-sm font-semibold text-ink">Your role comparison will appear here</p><p className="meta mt-1 max-w-sm">Paste a job description, then analyze it against your saved resume.</p></div></div>}</Card></div><div className="flex items-center justify-between"><Link href="/resume/upload" className="inline-flex items-center gap-2 text-sm font-semibold text-primary hover:underline">Review full resume <ArrowRight className="size-4" /></Link><span className="text-xs text-subtle">Your resume stays in this workspace</span></div></div>;
}
