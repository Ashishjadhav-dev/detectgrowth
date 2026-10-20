"use client";

import Link from "next/link";
import { useState } from "react";
import {
  ArrowRight,
  Check,
  ChevronRight,
  FileText,
  Lightbulb,
  MessageSquare,
  Send,
  Sparkles,
  Target,
  WandSparkles,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { AICopilotDrawer } from "@/components/ai/ai-copilot-drawer";

const prompts = [
  "Tailor my resume for this role",
  "Create stronger achievement bullets",
  "Find missing keywords and skills",
  "Make my experience more measurable",
];

const missingKeywords = ["Lifecycle marketing", "A/B testing", "Revenue attribution"];

export default function ResumeMatchPage() {
  const [description, setDescription] = useState("");
  const [prompt, setPrompt] = useState("");
  const [matched, setMatched] = useState(false);
  const [busy, setBusy] = useState(false);
  const [thinking, setThinking] = useState(false);
  const [generated, setGenerated] = useState(false);
  const [messages, setMessages] = useState<string[]>([]);
  const score = description.trim().length > 500 ? 82 : 68;

  const analyze = () => {
    if (!description.trim()) return;
    setBusy(true);
    setMessages((current) => [...current, "Analyze my resume against this job description"]);
    window.setTimeout(() => {
      setMatched(true);
      setBusy(false);
    }, 650);
  };

  const askAI = (value: string) => {
    const nextPrompt = value.trim();
    if (!nextPrompt) return;
    setMessages((current) => [...current, nextPrompt]);
    setPrompt("");
    setMatched(true);
    setThinking(true);
    window.setTimeout(() => setThinking(false), 900);
  };

  const generateResume = () => {
    setGenerated(true);
    setMessages((current) => [...current, "Create a tailored resume using the strongest matches"]);
  };

  return (
    <div className="mx-auto max-w-[1500px] space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <Badge><Sparkles className="size-3" />AI resume workspace</Badge>
          <h1 className="page-title mt-3">Tailor your resume for a job</h1>
          <p className="meta mt-2 max-w-2xl">Paste a job description and work with your resume copilot to find gaps, improve your story, and create a focused version.</p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <AICopilotDrawer triggerLabel="Open AI copilot" autoOpen />
          <Link href="/resume/create" className="inline-flex items-center gap-2 text-sm font-semibold text-primary hover:underline">
            Open resume creator <ArrowRight className="size-4" />
          </Link>
        </div>
      </div>

      <div className="grid gap-5 xl:grid-cols-[minmax(300px,0.9fr)_minmax(380px,1.2fr)_minmax(260px,0.75fr)]">
        <Card className="flex min-h-[620px] flex-col p-5 transition-shadow duration-300 hover:shadow-[0_18px_50px_rgba(55,52,44,.08)] sm:p-6">
          <div className="flex items-start gap-3">
            <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-primary-soft text-primary"><FileText className="size-5" /></span>
            <div><h2 className="section-title">Target job description</h2><p className="meta mt-1">Add the full listing for a more accurate match.</p></div>
          </div>
          <textarea value={description} onChange={(event) => { setDescription(event.target.value); setMatched(false); setGenerated(false); }} rows={18} placeholder="Paste the job description here…" className="mt-5 min-h-72 w-full flex-1 resize-y rounded-xl border border-border bg-white px-3.5 py-3 text-sm leading-6 text-ink placeholder:text-subtle focus:border-primary/50 focus:outline-none" />
          <div className="mt-2 flex items-center justify-between text-xs text-subtle"><span>{description.length.toLocaleString()} characters</span><span>Recommended: 500+ characters</span></div>
          <Button className="mt-4 w-full" disabled={!description.trim() || busy} onClick={analyze}>
            {busy ? <><span className="loading-dots" aria-hidden="true"><i /><i /><i /></span>Analyzing</> : <><Sparkles className="size-4" />Analyze match</>}
          </Button>
        </Card>

        <Card className="flex min-h-[620px] flex-col p-5 sm:p-6">
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-start gap-3"><span className="ai-orb grid size-10 shrink-0 place-items-center rounded-xl bg-primary-soft text-primary"><MessageSquare className="size-5" /></span><div><h2 className="section-title">Resume copilot</h2><p className="meta mt-1">Ask for focused edits and practical next steps.</p></div></div>
            <Badge className={thinking ? "border border-amber-200 bg-amber-50 text-amber-700" : "border border-emerald-200 bg-emerald-50 text-emerald-700"}><span className={`size-1.5 rounded-full ${thinking ? "animate-pulse bg-amber-500" : "bg-emerald-500"}`} />{thinking ? "Thinking" : "Ready"}</Badge>
          </div>
          <div className="mt-5 flex-1 space-y-3 rounded-xl bg-elevated/60 p-3 sm:p-4">
            <div className="rounded-xl border border-border bg-white p-4 text-sm leading-6 shadow-sm"><p className="font-semibold text-ink">Hi! I can help you tailor your resume.</p><p className="mt-1 text-muted">Start with a job description, then choose a prompt below. I’ll focus on relevant keywords, measurable impact, and ATS-friendly wording.</p></div>
            {messages.map((message, index) => <div key={`${message}-${index}`} className="ai-message ml-5 rounded-xl bg-primary px-4 py-3 text-sm leading-6 text-white shadow-sm">{message}</div>)}
            {matched && <div className="rounded-xl border border-primary/20 bg-primary-soft p-4 text-sm leading-6"><p className="font-semibold text-ink">I found a strong starting point.</p><p className="mt-1 text-muted">Your resume currently aligns at {score}%. I can help close the most important gaps before you apply.</p></div>}
            {thinking && <div className="ai-message flex w-fit items-center gap-1 rounded-xl border border-border bg-white px-4 py-3 shadow-sm" aria-label="AI is thinking"><span className="size-1.5 animate-bounce rounded-full bg-primary [animation-delay:-.2s]" /><span className="size-1.5 animate-bounce rounded-full bg-primary [animation-delay:-.1s]" /><span className="size-1.5 animate-bounce rounded-full bg-primary" /></div>}
          </div>
          <div className="mt-4 flex gap-2 overflow-x-auto pb-1">
            {prompts.map((item) => <button key={item} type="button" onClick={() => askAI(item)} className="shrink-0 rounded-full border border-border bg-white px-3 py-2 text-xs font-semibold text-muted transition duration-200 hover:-translate-y-0.5 hover:border-primary/40 hover:text-primary hover:shadow-sm">{item}</button>)}
          </div>
          <form onSubmit={(event) => { event.preventDefault(); askAI(prompt); }} className="mt-3 flex items-center gap-2 rounded-xl border border-border bg-white p-2 focus-within:border-primary/50">
            <input value={prompt} onChange={(event) => setPrompt(event.target.value)} placeholder="Ask your resume copilot…" className="min-w-0 flex-1 bg-transparent px-2 text-sm text-ink outline-none placeholder:text-subtle" />
            <button type="submit" disabled={!prompt.trim()} aria-label="Send prompt" className="grid size-9 shrink-0 place-items-center rounded-lg bg-primary text-white transition hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-40"><Send className="size-4" /></button>
          </form>
        </Card>

        <Card className="min-h-[620px] transition-shadow duration-300 hover:shadow-[0_18px_50px_rgba(55,52,44,.08)] p-5 sm:p-6">
          <div className="flex items-start gap-3"><span className="grid size-10 shrink-0 place-items-center rounded-xl bg-primary-soft text-primary"><Target className="size-5" /></span><div><h2 className="section-title">Match insights</h2><p className="meta mt-1">See what to improve before applying.</p></div></div>
          {matched ? <>
            <div className="mt-6 flex items-center gap-4"><div className="grid size-24 shrink-0 place-items-center rounded-full p-1" style={{ background: `conic-gradient(#5f6f52 ${score * 3.6}deg, #e8ebe5 0deg)` }}><div className="grid size-full place-items-center rounded-full bg-white text-center"><span className="text-2xl font-semibold text-ink">{score}</span><span className="-mt-2 text-[10px] uppercase tracking-wider text-subtle">/100</span></div></div><div><p className="text-sm font-semibold text-ink">Good foundation</p><p className="meta mt-1">A few targeted edits can make this application stronger.</p></div></div>
            <div className="mt-6 space-y-4"><div><div className="mb-1.5 flex justify-between text-xs"><span>Keyword alignment</span><span>{score}/100</span></div><div className="h-2 rounded-full bg-elevated"><div className="h-2 rounded-full bg-primary transition-all duration-700" style={{ width: `${score}%` }} /></div></div><div><div className="mb-1.5 flex justify-between text-xs"><span>Impact and clarity</span><span>74/100</span></div><div className="h-2 rounded-full bg-elevated"><div className="h-2 w-[74%] rounded-full bg-amber-400" /></div></div></div>
            <div className="mt-6 rounded-xl border border-amber-200 bg-amber-50 p-4"><div className="flex items-center gap-2 text-amber-900"><Lightbulb className="size-4" /><h3 className="text-sm font-semibold">Improve next</h3></div><div className="mt-3 space-y-1">{missingKeywords.map((item) => <button key={item} type="button" onClick={() => askAI(`Add missing keyword: ${item}`)} className="flex w-full items-center gap-2 rounded-lg px-2 py-2 text-left text-sm text-amber-900/80 transition hover:bg-amber-100"><span className="size-1.5 rounded-full bg-amber-500" />{item}<ChevronRight className="ml-auto size-4" /></button>)}</div></div>
            <Button className="mt-5 w-full" onClick={generateResume}><WandSparkles className="size-4" />{generated ? "Tailored draft ready" : "Generate tailored resume"}</Button>
            <Link href="/resume/create" className="mt-3 flex items-center justify-center gap-2 text-sm font-semibold text-primary hover:underline">Review in resume creator <ArrowRight className="size-4" /></Link>
          </> : <div className="grid min-h-80 place-items-center text-center"><div><span className="mx-auto grid size-12 place-items-center rounded-full bg-primary-soft text-primary"><Check className="size-5" /></span><p className="mt-4 text-sm font-semibold text-ink">Your insights will appear here</p><p className="meta mt-1 max-w-xs">Analyze a job description to see your score, missing keywords, and tailored suggestions.</p></div></div>}
        </Card>
      </div>
    </div>
  );
}
