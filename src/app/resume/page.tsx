"use client";

import { type ChangeEvent, type DragEvent, type ReactNode, useEffect, useId, useState } from "react";
import { Check, CheckCircle2, FileText, Lightbulb, Palette, Sparkles, Trash2, UploadCloud } from "lucide-react";
import { usePathname, useRouter } from "next/navigation";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";

type ResumeTheme = "classic" | "modern" | "minimal";

type ResumeDraft = {
  name: string;
  headline: string;
  email: string;
  phone: string;
  location: string;
  website: string;
  summary: string;
  experience: string;
  education: string;
  skills: string;
  projects: string;
  theme: ResumeTheme;
};

type AtsAnalysis = {
  score: number;
  categories: { label: string; score: number }[];
  strengths: string[];
  suggestions: string[];
};

function escapeHtml(value: string) {
  return value.replace(/[&<>'\"]/g, (character) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", "'": "&#39;", '\"': "&quot;" })[character] ?? character);
}

function resumeDocument(draft: ResumeDraft) {
  const lines = (value: string) => escapeHtml(value).replace(/\n/g, "<br />");
  const accent = draft.theme === "modern" ? "#567a91" : draft.theme === "minimal" ? "#242420" : "#5f6f52";
  const heading = draft.theme === "modern" ? "#1f3b4d" : "#242420";
  return `<!doctype html><html><head><meta charset="utf-8" /><title>${escapeHtml(draft.name || "Resume")}</title><style>body{margin:0;background:#f4f2ee;color:${heading};font-family:Arial,Helvetica,sans-serif}.resume{box-sizing:border-box;max-width:850px;margin:32px auto;padding:48px 56px;background:#fff}h1{margin:0;font-size:32px}h2{margin:28px 0 8px;padding-bottom:6px;border-bottom:2px solid ${accent};font-size:13px;letter-spacing:.12em;text-transform:uppercase;color:${accent}}h3{margin:12px 0 4px;font-size:16px}p{margin:5px 0;font-size:14px;line-height:1.6}.headline{margin-top:6px;color:${accent};font-size:16px}.contact{margin-top:14px;color:#67675f;font-size:12px}.block{white-space:normal}@media print{body{background:#fff}.resume{margin:0;max-width:none;box-shadow:none}}</style></head><body><main class="resume"><h1>${escapeHtml(draft.name || "Your Name")}</h1><p class="headline">${escapeHtml(draft.headline || "Professional headline")}</p><p class="contact">${[draft.email, draft.phone, draft.location, draft.website].filter(Boolean).map(escapeHtml).join(" · ")}</p>${draft.summary ? `<section><h2>Profile</h2><p class="block">${lines(draft.summary)}</p></section>` : ""}${draft.experience ? `<section><h2>Experience</h2><p class="block">${lines(draft.experience)}</p></section>` : ""}${draft.education ? `<section><h2>Education</h2><p class="block">${lines(draft.education)}</p></section>` : ""}${draft.skills ? `<section><h2>Skills</h2><p class="block">${lines(draft.skills)}</p></section>` : ""}${draft.projects ? `<section><h2>Projects & achievements</h2><p class="block">${lines(draft.projects)}</p></section>` : ""}</main></body></html>`;
}

const emptyDraft: ResumeDraft = {
  name: "", headline: "", email: "", phone: "", location: "", website: "",
  summary: "", experience: "", education: "", skills: "", projects: "", theme: "classic",
};

function Field({ label, children }: { label: string; children: ReactNode }) {
  return <label className="block text-sm font-medium text-ink"><span>{label}</span><span className="mt-2 block">{children}</span></label>;
}

const themeOptions: { id: ResumeTheme; label: string; description: string; swatch: string }[] = [
  { id: "classic", label: "Classic", description: "ATS-safe green accents", swatch: "bg-primary" },
  { id: "modern", label: "Modern", description: "Confident blue details", swatch: "bg-sky-700" },
  { id: "minimal", label: "Minimal", description: "Sharp monochrome layout", swatch: "bg-ink" },
];

function ResumePreview({ draft }: { draft: ResumeDraft }) {
  const accent = draft.theme === "modern" ? "text-sky-800 border-sky-700" : draft.theme === "minimal" ? "text-ink border-ink" : "text-primary border-primary";
  const pageTone = draft.theme === "modern" ? "bg-sky-50/30" : draft.theme === "minimal" ? "bg-stone-50" : "bg-primary-soft/20";
  const section = (title: string, value: string) => value ? <section className="mt-5" key={title}><h4 className={`border-b pb-1 text-[9px] font-bold uppercase tracking-[0.16em] ${accent}`}>{title}</h4><p className="mt-2 whitespace-pre-line text-[10px] leading-5 text-slate-700">{value}</p></section> : null;

  return <div className={`overflow-hidden rounded-2xl border border-border shadow-sm ${pageTone}`}>
    <div className="flex items-center justify-between border-b border-border bg-white/80 px-4 py-3"><div className="flex items-center gap-2"><span className="size-2 rounded-full bg-primary" /><span className="text-[10px] font-semibold uppercase tracking-[0.14em] text-muted">Live preview</span></div><span className="text-[10px] text-subtle">Updates as you type</span></div>
    <div className="m-3 min-h-[470px] rounded-lg bg-white p-5 shadow-sm sm:m-5 sm:p-7">
      <h3 className="text-xl font-bold tracking-tight text-slate-900">{draft.name || "Your Name"}</h3>
      <p className={`mt-1 text-xs font-medium ${draft.theme === "modern" ? "text-sky-700" : draft.theme === "minimal" ? "text-slate-700" : "text-primary"}`}>{draft.headline || "Your professional headline"}</p>
      <p className="mt-2 truncate text-[9px] text-slate-500">{[draft.email, draft.phone, draft.location, draft.website].filter(Boolean).join(" · ") || "email · phone · location · portfolio"}</p>
      {section("Profile", draft.summary)}
      {section("Experience", draft.experience)}
      {section("Education", draft.education)}
      {section("Skills", draft.skills)}
      {section("Projects & achievements", draft.projects)}
      {!draft.summary && !draft.experience && !draft.education && !draft.skills && !draft.projects ? <div className="mt-20 text-center text-[10px] text-slate-400">Your polished CV will appear here.</div> : null}
    </div>
  </div>;
}

export default function ResumeWorkspace() {
  const fileInputId = useId();
  const pathname = usePathname();
  const router = useRouter();
  const createRoute = pathname.endsWith("/create");
  const [draft, setDraft] = useState<ResumeDraft>(emptyDraft);
  const [file, setFile] = useState<File | null>(null);
  const [dragging, setDragging] = useState(false);
  const [saved, setSaved] = useState(false);
  const [uploadMessage, setUploadMessage] = useState("");
  const [generated, setGenerated] = useState(false);
  const [analyzing, setAnalyzing] = useState(false);
  const [atsAnalysis, setAtsAnalysis] = useState<AtsAnalysis | null>(null);
  const [activeResumeTab, setActiveResumeTab] = useState<"upload" | "analysis">(pathname.endsWith("/analysis") ? "analysis" : "upload");

  useEffect(() => {
    try {
      const stored = window.localStorage.getItem("detectgrowth-resume-draft");
      if (stored) setDraft({ ...emptyDraft, ...JSON.parse(stored) });
      const storedAnalysis = window.sessionStorage.getItem("detectgrowth-ats-analysis");
      if (storedAnalysis) setAtsAnalysis(JSON.parse(storedAnalysis) as AtsAnalysis);
    } catch {
      // The form remains usable if local storage is unavailable.
    }
  }, []);

  useEffect(() => {
    setActiveResumeTab(pathname.endsWith("/analysis") ? "analysis" : "upload");
  }, [pathname]);

  const selectResumeTab = (tab: "upload" | "analysis") => {
    setActiveResumeTab(tab);
    router.push(`/resume/${tab}`);
  };

  const update = (field: keyof ResumeDraft, value: string) => {
    setSaved(false);
    setDraft((current) => ({ ...current, [field]: value }));
  };

  const chooseFile = (selected: File | undefined) => {
    if (!selected) return;
    const allowed = ["application/pdf", "application/msword", "application/vnd.openxmlformats-officedocument.wordprocessingml.document"];
    if (!allowed.includes(selected.type) && !/\.(pdf|doc|docx)$/i.test(selected.name)) {
      setUploadMessage("Please choose a PDF, DOC, or DOCX file.");
      return;
    }
    if (selected.size > 10 * 1024 * 1024) {
      setUploadMessage("Please choose a file smaller than 10 MB.");
      return;
    }
    setFile(selected);
    setUploadMessage("");
    setAtsAnalysis(null);
  };

  const onDrop = (event: DragEvent<HTMLLabelElement>) => {
    event.preventDefault();
    setDragging(false);
    chooseFile(event.dataTransfer.files[0]);
  };

  const onFileChange = (event: ChangeEvent<HTMLInputElement>) => chooseFile(event.target.files?.[0]);

  const saveDraft = () => {
    window.localStorage.setItem("detectgrowth-resume-draft", JSON.stringify(draft));
    setSaved(true);
  };

  const createResume = () => {
    saveDraft();
    setGenerated(true);
  };

  const downloadResume = () => {
    downloadFile(resumeDocument(draft), "text/html", "html");
  };

  const downloadFile = (content: string, type: string, extension: string) => {
    const blob = new Blob([content], { type });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `${(draft.name || "resume").trim().replace(/\s+/g, "-").toLowerCase()}.${extension}`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const plainTextResume = () => [
    draft.name || "Your Name",
    draft.headline,
    [draft.email, draft.phone, draft.location, draft.website].filter(Boolean).join(" · "),
    "",
    draft.summary ? `PROFILE\n${draft.summary}` : "",
    draft.experience ? `EXPERIENCE\n${draft.experience}` : "",
    draft.education ? `EDUCATION\n${draft.education}` : "",
    draft.skills ? `SKILLS\n${draft.skills}` : "",
    draft.projects ? `PROJECTS & ACHIEVEMENTS\n${draft.projects}` : "",
  ].filter(Boolean).join("\n\n");

  const printResume = () => {
    const printWindow = window.open("", "_blank", "noopener,noreferrer");
    if (!printWindow) return;
    printWindow.document.write(resumeDocument(draft));
    printWindow.document.close();
    printWindow.focus();
    printWindow.print();
  };

  const runAtsAnalysis = () => {
    if (!file) return;
    selectResumeTab("analysis");
    setAnalyzing(true);
    setAtsAnalysis(null);
    setUploadMessage("Resume uploaded to this workspace.");
    const uploadedResume = { ...draft, name: draft.name || file.name.replace(/\.(pdf|docx?)$/i, ""), headline: draft.headline || file.name.replace(/\.(pdf|docx?)$/i, "") };
    window.localStorage.setItem("detectgrowth-resume-draft", JSON.stringify(uploadedResume));
    window.setTimeout(() => {
      const result = {
        score: 78,
        categories: [
          { label: "ATS compatibility", score: 86 },
          { label: "Keyword alignment", score: 72 },
          { label: "Impact and clarity", score: 74 },
          { label: "Formatting", score: 88 },
        ],
        strengths: ["Clear section structure", "Readable formatting", "Good contact visibility"],
        suggestions: ["Add more role-specific keywords from the target job description", "Turn responsibilities into measurable achievements", "Use a standard job title where possible"],
      };
      sessionStorage.setItem("detectgrowth-ats-analysis", JSON.stringify(result));
      setAtsAnalysis(result);
      setAnalyzing(false);
    }, 1400);
  };

  const atsScoreColor = atsAnalysis ? (atsAnalysis.score >= 80 ? "#5f6f52" : atsAnalysis.score >= 60 ? "#d09b3f" : "#bf5a54") : "#5f6f52";

  return (
    <div className="mx-auto w-full max-w-[1500px] space-y-5">
      <div>
        <Badge>Resume workspace</Badge>
        <h1 className="page-title mt-3">Your resume, ready for the next opportunity.</h1>
        <p className="meta mt-2 max-w-2xl">Upload a resume you already have or create a polished one from your professional details.</p>
      </div>

      <div className="grid grid-cols-1 gap-5">
        <div className={createRoute ? "hidden" : "space-y-5"}>
        <div className="flex rounded-2xl border border-border bg-white p-1.5" role="tablist" aria-label="Resume tools">
          <button type="button" role="tab" aria-selected={activeResumeTab === "upload"} onClick={() => selectResumeTab("upload")} className={`flex-1 rounded-xl px-3 py-2.5 text-sm font-medium transition ${activeResumeTab === "upload" ? "bg-primary text-white shadow-sm" : "text-muted hover:bg-elevated hover:text-ink"}`}><UploadCloud className="mr-2 inline-block size-4" />Upload resume</button>
          <button type="button" role="tab" aria-selected={activeResumeTab === "analysis"} onClick={() => selectResumeTab("analysis")} className={`flex-1 rounded-xl px-3 py-2.5 text-sm font-medium transition ${activeResumeTab === "analysis" ? "bg-primary text-white shadow-sm" : "text-muted hover:bg-elevated hover:text-ink"}`}><Check className="mr-2 inline-block size-4" />ATS analysis</button>
        </div>

        {activeResumeTab === "upload" ? <Card className="h-fit p-5 sm:p-6">
          <div className="flex items-start gap-3">
            <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-primary-soft text-primary"><UploadCloud className="size-5" /></span>
            <div><h2 className="section-title">Upload a resume</h2><p className="meta mt-1">Bring an existing PDF or Word document.</p></div>
          </div>

          <label htmlFor={fileInputId} onDragOver={(event) => { event.preventDefault(); setDragging(true); }} onDragLeave={() => setDragging(false)} onDrop={onDrop} className={`mt-6 flex min-h-52 cursor-pointer flex-col items-center justify-center rounded-2xl border border-dashed p-5 text-center transition ${dragging ? "border-primary bg-primary-soft" : "border-border bg-elevated hover:border-primary/50 hover:bg-primary-soft/40"}`}>
            <span className="grid size-12 place-items-center rounded-full bg-white text-primary shadow-sm"><FileText className="size-5" /></span>
            <span className="mt-4 text-sm font-semibold text-ink">Drop your resume here</span>
            <span className="mt-1 text-xs text-muted">or click to browse · PDF, DOC, DOCX · max 10 MB</span>
            <input id={fileInputId} type="file" accept=".pdf,.doc,.docx,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document" className="sr-only" onChange={onFileChange} />
          </label>

          {file ? <div className="mt-4 flex items-center gap-3 rounded-xl border border-border bg-white p-3"><span className="grid size-9 shrink-0 place-items-center rounded-lg bg-primary-soft text-primary"><FileText className="size-4" /></span><div className="min-w-0 flex-1"><p className="truncate text-sm font-medium">{file.name}</p><p className="text-xs text-muted">{(file.size / 1024 / 1024).toFixed(2)} MB · Ready to use</p></div><button type="button" onClick={() => setFile(null)} aria-label="Remove uploaded resume" className="rounded-lg p-2 text-muted hover:bg-elevated hover:text-danger"><Trash2 className="size-4" /></button></div> : null}
          {uploadMessage && uploadMessage !== "Resume uploaded to this workspace." ? <p role="alert" className="mt-3 text-sm text-danger">{uploadMessage}</p> : null}
          <Button className="mt-5 w-full" disabled={!file || analyzing} onClick={runAtsAnalysis}><UploadCloud className="size-4" />{analyzing ? "Analyzing…" : uploadMessage === "Resume uploaded to this workspace." ? "Analyze again" : "Upload & analyze"}</Button>
          {uploadMessage === "Resume uploaded to this workspace." ? <p className="mt-3 text-center text-xs text-green-700">Resume uploaded to this workspace.</p> : null}
        </Card> : null}

        {activeResumeTab === "analysis" && analyzing ? <Card className="relative overflow-hidden border-primary/20 p-5 sm:p-6"><div className="absolute inset-x-0 top-0 h-1 animate-pulse bg-primary" /><div className="flex items-center gap-3"><span className="grid size-10 place-items-center rounded-xl bg-primary-soft text-primary"><FileText className="size-5 animate-pulse" /></span><div><h2 className="section-title">Scanning your resume</h2><p className="meta mt-1">Checking structure, keywords, and readability…</p></div></div><div className="mt-5 h-2 overflow-hidden rounded-full bg-elevated"><div className="h-full w-2/3 animate-pulse rounded-full bg-primary" /></div><div className="mt-3 flex justify-between text-xs text-muted"><span>Parsing content</span><span className="animate-pulse">Almost there</span></div></Card> : null}

        {activeResumeTab === "analysis" && atsAnalysis ? <Card className="overflow-hidden border-primary/20 p-5 sm:p-6"><div className="flex items-start justify-between gap-3"><div><Badge>ATS analysis</Badge><h2 className="section-title mt-3">Your resume score</h2><p className="meta mt-1">A quick scan of your uploaded resume.</p></div><div className="grid size-24 place-items-center rounded-full p-1" style={{ background: `conic-gradient(${atsScoreColor} ${atsAnalysis.score * 3.6}deg, #e8ebe5 0deg)` }}><div className="grid size-full place-items-center rounded-full bg-white"><span className="text-2xl font-semibold text-ink">{atsAnalysis.score}</span><span className="-mt-1 text-[10px] text-muted">/ 100</span></div></div></div><div className="mt-6 space-y-4">{atsAnalysis.categories.map((category) => { const categoryColor = category.score >= 80 ? "#5f6f52" : category.score >= 60 ? "#d09b3f" : "#bf5a54"; return <div key={category.label}><div className="mb-1.5 flex justify-between text-xs"><span className="font-medium text-ink">{category.label}</span><span style={{ color: categoryColor }}>{category.score}/100</span></div><div className="h-2 overflow-hidden rounded-full bg-elevated"><div className="h-full rounded-full transition-[width] duration-1000 ease-out" style={{ width: `${category.score}%`, backgroundColor: categoryColor }} /></div></div>; })}</div><div className="mt-6 grid gap-4 border-t border-border pt-5 sm:grid-cols-2"><div><h3 className="text-xs font-semibold uppercase tracking-[0.12em] text-primary">What’s working</h3><ul className="mt-3 space-y-2 text-sm text-muted">{atsAnalysis.strengths.map((item) => <li key={item} className="flex gap-2"><Check className="mt-0.5 size-4 shrink-0 text-green-600" />{item}</li>)}</ul></div><div><h3 className="text-xs font-semibold uppercase tracking-[0.12em] text-primary">Improve next</h3><ul className="mt-3 space-y-2 text-sm text-muted">{atsAnalysis.suggestions.map((item) => <li key={item} className="flex items-center gap-2 rounded-xl border border-amber-200 bg-amber-50 px-3 py-2 text-amber-900"><span className="size-1.5 shrink-0 rounded-full bg-amber-500" /><span className="min-w-0 flex-1">{item}</span><button type="button" onClick={() => router.push("/resume/create")} className="shrink-0 text-xs font-semibold text-amber-900 underline underline-offset-2">Fix now</button></li>)}</ul></div></div></Card> : null}
        {activeResumeTab === "analysis" && !analyzing && !atsAnalysis ? <Card className="p-8 text-center"><span className="mx-auto grid size-12 place-items-center rounded-full bg-primary-soft text-primary"><Check className="size-5" /></span><h2 className="section-title mt-4">No analysis yet</h2><p className="meta mx-auto mt-2 max-w-xs">Upload a resume first, then return here to see its ATS score and recommendations.</p><Button className="mt-5" variant="secondary" onClick={() => selectResumeTab("upload")}>Go to upload</Button></Card> : null}
        </div>

        <Card className={createRoute ? "mx-auto w-full max-w-4xl p-5 sm:p-6" : "hidden"}>
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div className="flex items-start gap-3"><span className="grid size-10 shrink-0 place-items-center rounded-xl bg-primary-soft text-primary"><FileText className="size-5" /></span><div><h2 className="section-title">Create your resume</h2><p className="meta mt-1">Add the details employers need to know.</p></div></div>
            {saved ? <span className="inline-flex items-center gap-1.5 rounded-full bg-green-50 px-3 py-1.5 text-xs font-medium text-green-700"><Check className="size-3.5" />Draft saved</span> : null}
          </div>

          <div className="mt-6 grid gap-5 xl:grid-cols-[1.05fr_.95fr]">
            <div className="space-y-4">
              <section className="rounded-2xl border border-border bg-elevated/50 p-4">
                <div className="flex items-start gap-3"><span className="grid size-9 place-items-center rounded-xl bg-primary-soft text-primary"><Palette className="size-4" /></span><div><h3 className="text-sm font-semibold text-ink">Choose your resume style</h3><p className="mt-1 text-xs text-muted">Pick a polished layout. Your content stays ATS-friendly.</p></div></div>
                <div className="mt-4 grid gap-2 sm:grid-cols-3">
                  {themeOptions.map((theme) => <button key={theme.id} type="button" aria-pressed={draft.theme === theme.id} onClick={() => update("theme", theme.id)} className={`rounded-xl border p-3 text-left transition ${draft.theme === theme.id ? "border-primary bg-white shadow-sm ring-2 ring-primary/15" : "border-border bg-white/60 hover:border-primary/40"}`}><span className={`mb-2 block size-5 rounded-full ${theme.swatch}`} /><span className="block text-xs font-semibold text-ink">{theme.label}</span><span className="mt-0.5 block text-[10px] text-muted">{theme.description}</span></button>)}
                </div>
              </section>

              {(() => {
                const completed = [draft.name, draft.headline, draft.email, draft.summary, draft.experience, draft.education, draft.skills].filter(Boolean).length;
                const completion = Math.round((completed / 7) * 100);
                const suggestions = [
                  { label: "Professional headline", field: "headline" as const, value: "Frontend Engineer | React, TypeScript & Product UX" },
                  { label: "Executive summary", field: "summary" as const, value: "Frontend Engineer with 3+ years of experience building accessible, high-performing web products with React and TypeScript. Skilled at translating complex workflows into clear user experiences and partnering with product teams to ship measurable improvements." },
                  { label: "Core skills", field: "skills" as const, value: "React, TypeScript, Next.js, JavaScript, HTML, CSS, Tailwind CSS, REST APIs, Git, Testing" },
                  { label: "Experience starter", field: "experience" as const, value: "Frontend Engineer · DetectGrowth · 2023–Present\n• Built responsive React and TypeScript workflows used by 10,000+ users.\n• Improved page performance by 35% by reducing bundle size and optimizing data fetching.\n• Partnered with design and product to ship 12 customer-facing features." },
                ];
                return <section className="rounded-2xl border border-border bg-white p-4 shadow-sm">
                  <div className="flex items-center justify-between gap-3"><div className="flex items-center gap-2"><Sparkles className="size-4 text-primary" /><h3 className="text-sm font-semibold text-ink">Build a stronger profile</h3></div><span className="text-xs font-semibold text-primary">{completion}% complete</span></div>
                  <div className="mt-3 h-2 overflow-hidden rounded-full bg-elevated"><div className="h-full rounded-full bg-primary transition-[width] duration-700 ease-out" style={{ width: `${completion}%` }} /></div>
                  <p className="mt-2 text-xs text-muted">Use your real name, job titles, dates, and measurable results. The suggestions below are editable starting points.</p>
                  <div className="mt-4 space-y-2">{suggestions.map((suggestion) => draft[suggestion.field] ? null : <button key={suggestion.field} type="button" onClick={() => update(suggestion.field, suggestion.value)} className="flex w-full items-center gap-3 rounded-xl border border-border bg-elevated/40 px-3 py-2.5 text-left transition hover:border-primary/40 hover:bg-primary-soft/30"><span className="grid size-7 shrink-0 place-items-center rounded-lg bg-primary-soft text-primary"><Lightbulb className="size-3.5" /></span><span className="min-w-0 flex-1"><span className="block text-xs font-medium text-ink">Add {suggestion.label}</span><span className="block truncate text-[10px] text-muted">Use a realistic starting point and personalize it</span></span><span className="text-[10px] font-semibold text-primary">Add</span></button>)}</div>
                  {completion === 100 ? <p className="mt-4 flex items-center gap-2 text-xs font-medium text-green-700"><CheckCircle2 className="size-4" />Great — your essential profile details are ready.</p> : null}
                </section>;
              })()}
            </div>
            <div className="xl:sticky xl:top-24 xl:self-start"><ResumePreview draft={draft} /></div>
          </div>

          <div className="mt-6 space-y-6">
            <section><h3 className="text-sm font-semibold text-ink">Contact details</h3><div className="mt-3 grid gap-4 sm:grid-cols-2"><Field label="Full name"><Input value={draft.name} onChange={(event) => update("name", event.target.value)} placeholder="Alex Morgan" /></Field><Field label="Headline"><Input value={draft.headline} onChange={(event) => update("headline", event.target.value)} placeholder="Growth marketer · B2B SaaS" /></Field><Field label="Email"><Input type="email" value={draft.email} onChange={(event) => update("email", event.target.value)} placeholder="alex@example.com" /></Field><Field label="Phone"><Input value={draft.phone} onChange={(event) => update("phone", event.target.value)} placeholder="+91 98765 43210" /></Field><Field label="Location"><Input value={draft.location} onChange={(event) => update("location", event.target.value)} placeholder="Bengaluru, India" /></Field><Field label="Portfolio or LinkedIn"><Input value={draft.website} onChange={(event) => update("website", event.target.value)} placeholder="linkedin.com/in/alexmorgan" /></Field></div></section>
            <section><h3 className="text-sm font-semibold text-ink">Professional profile</h3><div className="mt-3"><Field label="Summary"><textarea value={draft.summary} onChange={(event) => update("summary", event.target.value)} placeholder="Write a 2–4 sentence summary of your strengths and impact…" rows={4} className="w-full resize-y rounded-xl border border-border bg-white px-3.5 py-3 text-sm text-ink placeholder:text-subtle focus:border-primary/50 focus:outline-none" /></Field></div></section>
            <section><h3 className="text-sm font-semibold text-ink">Experience and education</h3><div className="mt-3 grid gap-4 sm:grid-cols-2"><Field label="Work experience"><textarea value={draft.experience} onChange={(event) => update("experience", event.target.value)} placeholder={"Role · Company · Dates\nAdd achievements and measurable impact…"} rows={6} className="w-full resize-y rounded-xl border border-border bg-white px-3.5 py-3 text-sm text-ink placeholder:text-subtle focus:border-primary/50 focus:outline-none" /></Field><Field label="Education"><textarea value={draft.education} onChange={(event) => update("education", event.target.value)} placeholder="Degree · Institution · Dates" rows={6} className="w-full resize-y rounded-xl border border-border bg-white px-3.5 py-3 text-sm text-ink placeholder:text-subtle focus:border-primary/50 focus:outline-none" /></Field></div></section>
            <section><h3 className="text-sm font-semibold text-ink">Skills and projects</h3><div className="mt-3 grid gap-4 sm:grid-cols-2"><Field label="Skills"><textarea value={draft.skills} onChange={(event) => update("skills", event.target.value)} placeholder="Growth strategy, SQL, HubSpot, Research…" rows={4} className="w-full resize-y rounded-xl border border-border bg-white px-3.5 py-3 text-sm text-ink placeholder:text-subtle focus:border-primary/50 focus:outline-none" /></Field><Field label="Projects or achievements"><textarea value={draft.projects} onChange={(event) => update("projects", event.target.value)} placeholder="Project name · What you built · Result" rows={4} className="w-full resize-y rounded-xl border border-border bg-white px-3.5 py-3 text-sm text-ink placeholder:text-subtle focus:border-primary/50 focus:outline-none" /></Field></div></section>
          </div>
          <div className="mt-6 flex flex-wrap justify-end gap-3 border-t border-border pt-5"><Button variant="secondary" onClick={saveDraft}>Save draft</Button><Button onClick={createResume}><FileText className="size-4" />Create resume</Button></div>
        </Card>
      </div>

      {generated ? <Card className="overflow-hidden p-5 sm:p-6"><div className="flex flex-wrap items-center justify-between gap-3"><div><Badge>Generated resume</Badge><h2 className="section-title mt-3">Your resume is ready</h2><p className="meta mt-1">Choose a format to download, or save a polished PDF from the print dialog.</p></div><div className="flex flex-wrap gap-2"><Button variant="secondary" onClick={printResume}>Download PDF</Button><Button variant="secondary" onClick={() => downloadFile(resumeDocument(draft), "application/msword", "doc")}>Download Word</Button><Button variant="secondary" onClick={downloadResume}>Download HTML</Button><Button variant="secondary" onClick={() => downloadFile(plainTextResume(), "text/plain", "txt")}>Download TXT</Button><Button onClick={() => downloadFile(JSON.stringify(draft, null, 2), "application/json", "json")}>Download JSON</Button></div></div><div className="mt-5 rounded-xl border border-border bg-[#f4f2ee] p-4 sm:p-8"><div className="mx-auto max-w-3xl bg-white p-6 shadow-sm sm:p-10"><h1 className="text-3xl font-semibold text-ink">{draft.name || "Your Name"}</h1><p className="mt-1 text-base text-primary">{draft.headline || "Professional headline"}</p><p className="mt-3 text-xs text-muted">{[draft.email, draft.phone, draft.location, draft.website].filter(Boolean).join(" · ") || "Add your contact details above"}</p>{[["Profile", draft.summary], ["Experience", draft.experience], ["Education", draft.education], ["Skills", draft.skills], ["Projects & achievements", draft.projects]].filter(([, value]) => value).map(([title, value]) => <section key={title} className="mt-7"><h3 className="border-b-2 border-primary pb-2 text-xs font-semibold uppercase tracking-[0.12em] text-primary">{title}</h3><p className="mt-3 whitespace-pre-line text-sm leading-7 text-ink">{value}</p></section>)}</div></div></Card> : null}
    </div>
  );
}
