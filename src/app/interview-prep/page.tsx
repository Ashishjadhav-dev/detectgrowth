"use client";

import { useMemo, useState } from "react";
import { CheckCircle2, MessageCircle, PlayCircle, Sparkles } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { personalize, type AIInterviewResult } from "@/lib/ai";

const questionBank = [
  "Tell me about your most relevant achievement for this role.",
  "Describe a difficult problem you solved and how you measured success.",
  "How do you prioritize when several stakeholders need your attention?",
  "What would you focus on in your first 30 days?",
  "Tell me about a time you changed your approach after seeing new data.",
  "Why are you interested in this role and this company?",
];

function storedResume() {
  try { const draft = JSON.parse(window.localStorage.getItem("detectgrowth-resume-draft") ?? "{}"); return [draft.headline, draft.summary, draft.experience, draft.skills].filter(Boolean).join("\n"); } catch { return ""; }
}

export default function InterviewPrepPage() {
  const [role, setRole] = useState("");
  const [started, setStarted] = useState(false);
  const [active, setActive] = useState(0);
  const [answer, setAnswer] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [aiReview, setAiReview] = useState<AIInterviewResult | null>(null);
  const [aiBusy, setAiBusy] = useState(false);
  const [aiError, setAiError] = useState("");
  const [resume] = useState(() => storedResume());
  const questions = useMemo(() => questionBank.map((question) => role.trim() ? question.replace("this role", `the ${role.trim()} role`) : question), [role]);
  const answerScore = Math.min(100, Math.max(35, Math.round(35 + answer.trim().split(/\s+/).filter(Boolean).length / 2 + (answer.match(/\d+(?:%|\+)?/g)?.length ?? 0) * 8)));
  const start = () => { setStarted(true); setSubmitted(false); setActive(0); setAnswer(""); setAiReview(null); setAiError(""); };
  const reviewAnswer = async () => {
    setSubmitted(true); setAiBusy(true); setAiError("");
    try { setAiReview(await personalize<AIInterviewResult>("interview", { resume, targetRole: role || "target role", answer })); }
    catch (error) { setAiError(error instanceof Error ? error.message : "AI interview review is unavailable."); }
    finally { setAiBusy(false); }
  };
  return <div className="mx-auto max-w-6xl space-y-6"><div><Badge><Sparkles className="size-3" />Career hub</Badge><h1 className="page-title mt-3">Interview preparation</h1><p className="meta mt-2 max-w-2xl">Practice role-specific questions using your resume, structure answers with STAR, and improve before the interview.</p></div><Card className="p-5 sm:p-6"><div className="flex flex-col gap-3 sm:flex-row sm:items-end"><label className="flex-1 text-sm font-medium text-ink">Target role<Input className="mt-2" value={role} onChange={(event) => setRole(event.target.value)} placeholder="Growth Marketing Manager" /></label><Button onClick={start}><PlayCircle className="size-4" />{started ? "Restart practice" : "Start practice"}</Button></div>{!resume ? <p className="mt-3 text-xs text-amber-700">Add a resume first for more personalized prompts.</p> : <p className="mt-3 text-xs text-muted">Your saved resume is loaded into this practice session.</p>}</Card>{started ? <div className="grid gap-5 lg:grid-cols-[minmax(0,1.2fr)_minmax(280px,.8fr)]"><Card className="p-5 sm:p-6"><div className="flex items-start justify-between gap-3"><div><span className="text-xs font-semibold text-primary">QUESTION {String(active + 1).padStart(2, "0")} / {questions.length}</span><h2 className="mt-4 text-xl font-semibold leading-8 text-ink">{questions[active]}</h2></div><MessageCircle className="size-5 text-primary" /></div><div className="mt-6 rounded-xl border border-primary/15 bg-primary-soft/35 p-4 text-sm text-muted"><span className="font-semibold text-ink">STAR prompt:</span> explain the situation, your task, the action you took, and the measurable result.</div><textarea value={answer} onChange={(event) => { setAnswer(event.target.value); setSubmitted(false); setAiReview(null); }} rows={10} placeholder="Write your answer here…" className="mt-5 w-full resize-y rounded-xl border border-border bg-white p-3 text-sm leading-6 text-ink focus:border-primary/50 focus:outline-none" /><div className="mt-3 flex flex-wrap justify-between gap-2"><Button variant="secondary" onClick={reviewAnswer} disabled={answer.trim().length < 20 || aiBusy}>{aiBusy ? "Reviewing with AI…" : "Review with AI"}</Button><div className="flex gap-2">{active > 0 ? <Button variant="ghost" onClick={() => { setActive((value) => value - 1); setAnswer(""); setSubmitted(false); setAiReview(null); }}>Previous</Button> : null}{active < questions.length - 1 ? <Button onClick={() => { setActive((value) => value + 1); setAnswer(""); setSubmitted(false); setAiReview(null); }}>Next question</Button> : null}</div></div>{aiError ? <p role="alert" className="mt-3 text-sm text-amber-700">{aiError}</p> : null}{submitted ? <div className="mt-5 rounded-xl border border-emerald-200 bg-emerald-50 p-4"><div className="flex items-center justify-between"><p className="flex items-center gap-2 text-sm font-semibold text-emerald-900"><CheckCircle2 className="size-4" />{aiReview ? "AI answer review" : "Answer review"}</p><span className="font-semibold text-emerald-800">{aiReview?.score ?? answerScore}/100</span></div><p className="mt-2 text-sm leading-6 text-emerald-900/80">{aiReview?.feedback?.[0] ?? (answerScore >= 75 ? "Strong structure. Make the result even more specific if possible." : "Add a clear action and a measurable outcome to make this answer more persuasive.")}</p>{aiReview?.improvedAnswer ? <div className="mt-4 rounded-xl bg-white/70 p-3"><p className="text-xs font-semibold uppercase tracking-[.12em] text-emerald-900">Improved answer</p><p className="mt-2 whitespace-pre-line text-sm leading-6 text-emerald-950">{aiReview.improvedAnswer}</p></div> : null}</div> : null}</Card><Card className="p-5 sm:p-6"><h2 className="section-title">Practice checklist</h2><div className="mt-4 space-y-3 text-sm text-muted">{["Start with the situation, not a long background", "Use ownership language: I led, I changed, I delivered", "Include a metric, timeframe, or observable result", "Connect the story back to the target role"].map((item) => <div key={item} className="flex gap-2"><CheckCircle2 className="mt-0.5 size-4 shrink-0 text-primary" />{item}</div>)}</div><div className="mt-6 rounded-xl bg-elevated p-4"><p className="text-xs font-semibold uppercase tracking-[.12em] text-primary">Session progress</p><div className="mt-3 h-2 rounded-full bg-white"><div className="h-2 rounded-full bg-primary transition-all" style={{ width: `${((active + 1) / questions.length) * 100}%` }} /></div><p className="mt-2 text-xs text-muted">{active + 1} of {questions.length} questions</p></div></Card></div> : <Card className="p-10 text-center"><span className="mx-auto grid size-12 place-items-center rounded-full bg-primary-soft text-primary"><MessageCircle className="size-5" /></span><h2 className="mt-4 text-lg font-semibold text-ink">Your practice set is ready</h2><p className="meta mx-auto mt-2 max-w-md">Choose a target role above to start a guided practice session with structured feedback.</p></Card>}</div>;
}
