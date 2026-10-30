export type ResumeCategory = { label: string; score: number; detail: string };

export type ResumeAnalysis = {
  score: number;
  categories: ResumeCategory[];
  strengths: string[];
  suggestions: string[];
  keywords: string[];
  grammarIssues: number;
  extractedTextLength: number;
  analyzedWith: string[];
  text: string;
  targetRole: string;
  draft: ExtractedResumeDraft;
};

export type ExtractedResumeDraft = {
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
};

export type JobComparison = {
  score: number;
  matchedKeywords: string[];
  missingKeywords: string[];
  sections: ResumeCategory[];
  suggestions: string[];
  tailoredSummary: string;
  tailoredBullets: string[];
  learningPlan: Array<{ gap: string; action: string; proof: string }>;
};

const sectionNames = ["summary", "profile", "experience", "work history", "education", "skills", "projects", "certifications"];
const actionVerbs = ["built", "created", "delivered", "developed", "improved", "increased", "reduced", "led", "managed", "launched", "optimized", "designed", "implemented", "grew", "achieved", "automated"];
const commonSkills = ["javascript", "typescript", "react", "next.js", "node.js", "python", "java", "sql", "aws", "azure", "gcp", "figma", "excel", "salesforce", "hubspot", "marketing", "analytics", "research", "strategy", "leadership", "project management", "communication", "seo", "paid media", "a/b testing", "rest api", "git", "docker"];

function normalized(value: string) {
  return value.replace(/\u0000/g, " ").replace(/\r/g, "").replace(/[ \t]+/g, " ").replace(/\n{3,}/g, "\n\n").trim();
}

async function extractPdf(file: File) {
  const pdfjs = await import("pdfjs-dist/legacy/build/pdf.mjs");
  pdfjs.GlobalWorkerOptions.workerSrc = "https://unpkg.com/pdfjs-dist@6.4.299/legacy/build/pdf.worker.min.mjs";
  const data = new Uint8Array(await file.arrayBuffer());
  const document = await pdfjs.getDocument({ data }).promise;
  const pages: string[] = [];
  for (let pageNumber = 1; pageNumber <= document.numPages; pageNumber += 1) {
    const page = await document.getPage(pageNumber);
    const content = await page.getTextContent();
    pages.push(content.items.map((item) => "str" in item ? item.str : "").join(" "));
  }
  return normalized(pages.join("\n\n"));
}

async function extractDocx(file: File) {
  const mammoth = await import("mammoth/mammoth.browser");
  const result = await mammoth.extractRawText({ arrayBuffer: await file.arrayBuffer() });
  return normalized(result.value);
}

export async function extractResumeText(file: File) {
  const name = file.name.toLowerCase();
  if (name.endsWith(".pdf") || file.type === "application/pdf") return extractPdf(file);
  if (name.endsWith(".docx") || file.type.includes("wordprocessingml")) return extractDocx(file);
  throw new Error("Old .doc files cannot be parsed in the browser. Please export the resume as PDF or DOCX and try again.");
}

function hasSection(text: string, names: string[]) {
  const lower = text.toLowerCase();
  return names.some((name) => new RegExp(`(^|\\n|\\s)${name.replace(/[.*+?^${}()|[\\]\\\\]/g, "\\\\$&")}(:|\\s|$)`, "i").test(lower));
}

function clamp(value: number) {
  return Math.max(0, Math.min(100, Math.round(value)));
}

export function compareResumeToJob(resumeText: string, jobDescription: string): JobComparison {
  const resume = normalized(resumeText).toLowerCase();
  const job = normalized(jobDescription).toLowerCase();
  const candidates = [...new Set([...commonSkills, ...job.match(/[a-z][a-z+#./-]{3,}/g) ?? []])].filter((word) => word.length > 3 && !["with", "that", "this", "from", "your", "will", "have", "they", "their", "role", "work", "years", "team", "about", "looking", "experience", "required", "responsibilities", "company", "business", "into", "using"].includes(word));
  const jobKeywords = candidates.filter((keyword) => job.includes(keyword)).slice(0, 28);
  const matchedKeywords = jobKeywords.filter((keyword) => resume.includes(keyword));
  const missingKeywords = jobKeywords.filter((keyword) => !resume.includes(keyword)).slice(0, 10);
  const metrics = (resume.match(/(?:\d+(?:\.\d+)?%|[$€£]\s?\d+[\d,.]*|\b\d+[kKmMbB]?\+?\b)/g) ?? []).length;
  const actionVerbCount = actionVerbs.filter((verb) => new RegExp(`\\b${verb}\\b`, "i").test(resume)).length;
  const keywordScore = clamp(25 + (matchedKeywords.length / Math.max(jobKeywords.length, 1)) * 75);
  const impactScore = clamp(35 + metrics * 8 + actionVerbCount * 3);
  const completenessScore = clamp(45 + (hasSection(resumeText, ["experience", "work history"]) ? 20 : 0) + (hasSection(resumeText, ["skills"]) ? 15 : 0) + (hasSection(resumeText, ["education"]) ? 10 : 0));
  const score = clamp(keywordScore * 0.55 + impactScore * 0.25 + completenessScore * 0.2);
  const learningPlan = missingKeywords.slice(0, 6).map((gap) => ({
    gap,
    action: /leadership|management|stakeholder/.test(gap) ? `Practice a ${gap} case study and document the decision, trade-off, and result.` : /analytics|sql|python|javascript|react|aws|docker/.test(gap) ? `Build a small project using ${gap} and publish the result with a short technical write-up.` : `Complete a focused project or course that demonstrates ${gap} in the context of the target role.`,
    proof: `Add the project, certification, or measurable outcome to your resume only after you can explain it confidently.`,
  }));
  const sections = [
    { label: "Keyword alignment", score: keywordScore, detail: `${matchedKeywords.length} of ${jobKeywords.length || 1} role terms found` },
    { label: "Impact evidence", score: impactScore, detail: `${metrics} measurable results and ${actionVerbCount} action verbs found` },
    { label: "Resume completeness", score: completenessScore, detail: "Experience, skills, and education coverage" },
  ];
  const roleName = jobDescription.split(/\n|[.!?]/).map((line) => line.trim()).find((line) => line.length > 4 && line.length < 90) ?? "this role";
  return {
    score,
    matchedKeywords,
    missingKeywords,
    sections,
    suggestions: [missingKeywords.length ? `Add truthful evidence for: ${missingKeywords.slice(0, 5).join(", ")}` : "Your resume covers the main language in this job description", metrics < 3 ? "Add measurable outcomes to at least three experience bullets" : "Lead bullets with the result before the supporting action", actionVerbCount < 4 ? "Replace passive responsibility statements with stronger action verbs" : "Keep your strongest achievements near the top of each role"],
    tailoredSummary: `Results-focused professional targeting ${roleName}. Brings experience across ${matchedKeywords.slice(0, 4).join(", ") || "relevant functional areas"}, with a focus on measurable outcomes, clear ownership, and cross-functional delivery.`,
    tailoredBullets: [
      `Delivered measurable improvements through ${matchedKeywords.slice(0, 2).join(" and ") || "targeted initiatives"}, partnering with stakeholders to move priorities forward.`,
      `Applied ${matchedKeywords.slice(2, 5).join(", ") || "role-relevant tools and methods"} to improve execution quality, speed, and business impact.`,
      "Translated complex work into clear priorities, repeatable processes, and outcomes that teams could measure.",
    ],
    learningPlan,
  };
}

function localSignals(text: string) {
  const lower = text.toLowerCase();
  const words = text.split(/\s+/).filter(Boolean);
  const lines = text.split("\n").map((line) => line.trim()).filter(Boolean);
  const sections = sectionNames.filter((section) => hasSection(text, [section]));
  const metrics = (text.match(/(?:\d+(?:\.\d+)?%|[$€£]\s?\d+[\d,.]*|\b\d+[kKmMbB]?\+?\b)/g) ?? []).length;
  const bullets = lines.filter((line) => /^[•●▪◦*-]/.test(line)).length;
  const verbs = actionVerbs.filter((verb) => new RegExp(`\\b${verb}\\b`, "i").test(lower));
  const skills = commonSkills.filter((skill) => lower.includes(skill));
  const email = /[\w.+-]+@[\w-]+\.[\w.-]+/.test(text);
  const phone = /(?:\+?\d[\d\s().-]{7,}\d)/.test(text);
  const profileLink = /(linkedin\.com|github\.com|portfolio|behance\.net)/i.test(text);
  const wordScore = words.length >= 350 && words.length <= 1000 ? 100 : words.length >= 180 ? 78 : words.length > 0 ? 48 : 0;

  return { words, lines, sections, metrics, bullets, verbs, skills, email, phone, profileLink, wordScore };
}

function extractDraft(text: string): ExtractedResumeDraft {
  const lines = text.split("\n").map((line) => line.trim()).filter(Boolean);
  const email = text.match(/[\w.+-]+@[\w-]+\.[\w.-]+/)?.[0] ?? "";
  const phone = text.match(/(?:\+?\d[\d\s().-]{7,}\d)/)?.[0] ?? "";
  const website = text.match(/(?:https?:\/\/)?(?:www\.)?(?:linkedin\.com|github\.com|behance\.net)\S*/i)?.[0] ?? "";
  const name = lines.find((line) => line.length <= 70 && !line.includes("@") && !/\d{5,}/.test(line) && !sectionNames.includes(line.toLowerCase())) ?? "";
  const nameIndex = name ? lines.indexOf(name) : -1;
  const headline = nameIndex >= 0 ? (lines[nameIndex + 1] ?? "") : "";
  const buckets: Record<string, string[]> = { summary: [], experience: [], education: [], skills: [], projects: [] };
  let active: keyof typeof buckets | null = null;
  for (const line of lines) {
    const lower = line.toLowerCase().replace(/[:\-]/g, "").trim();
    const section = lower.includes("experience") || lower.includes("employment") || lower.includes("work history") ? "experience" : lower.includes("education") ? "education" : lower.includes("skill") || lower === "technologies" ? "skills" : lower.includes("project") || lower.includes("achievement") ? "projects" : lower.includes("summary") || lower.includes("profile") || lower.includes("objective") ? "summary" : null;
    if (section) { active = section; continue; }
    if (active && line !== name && line !== headline && line !== email && line !== phone && line !== website) buckets[active].push(line);
  }
  return { name, headline, email, phone, location: "", website, summary: buckets.summary.join("\n"), experience: buckets.experience.join("\n"), education: buckets.education.join("\n"), skills: buckets.skills.join(", "), projects: buckets.projects.join("\n") };
}

async function languageTool(text: string) {
  const body = new URLSearchParams({ text: text.slice(0, 10000), language: "en-US", enabledOnly: "false" });
  const response = await fetch("https://api.languagetool.org/v2/check", { method: "POST", body, headers: { "Content-Type": "application/x-www-form-urlencoded" } });
  if (!response.ok) throw new Error("LanguageTool unavailable");
  const data = await response.json() as { matches?: Array<{ message?: string; replacements?: Array<{ value?: string }> }> };
  return (data.matches ?? []).slice(0, 8).map((match) => ({ message: match.message ?? "Review this sentence", replacement: match.replacements?.[0]?.value ?? "" }));
}

async function datamuse(text: string, skills: string[]) {
  const topic = skills.slice(0, 3).join(" ") || text.split(/\s+/).slice(0, 3).join(" ");
  if (!topic) return [];
  const response = await fetch(`https://api.datamuse.com/words?ml=${encodeURIComponent(topic)}&max=12`);
  if (!response.ok) throw new Error("Datamuse unavailable");
  const data = await response.json() as Array<{ word?: string }>;
  return data.map((item) => item.word?.trim().toLowerCase()).filter((word): word is string => Boolean(word)).filter((word) => word.length > 2 && !text.toLowerCase().includes(word)).slice(0, 8);
}

export async function analyzeResume(text: string): Promise<ResumeAnalysis> {
  const cleanText = normalized(text).slice(0, 50000);
  if (cleanText.length < 40) throw new Error("We could not find enough readable text. Please upload a text-based PDF or DOCX.");
  const signals = localSignals(cleanText);
  const draft = extractDraft(cleanText);
  const grammarPromise = languageTool(cleanText).catch(() => []);
  const relatedPromise = datamuse(cleanText, signals.skills).catch(() => []);
  const [grammar, relatedKeywords] = await Promise.all([grammarPromise, relatedPromise]);

  const ats = clamp(42 + signals.sections.length * 8 + (signals.email ? 5 : 0) + (signals.phone ? 3 : 0) + (signals.profileLink ? 4 : 0));
  const keyword = clamp(35 + signals.skills.length * 8 + Math.min(signals.sections.length * 3, 15));
  const impact = clamp(35 + signals.metrics * 8 + signals.bullets * 2 + signals.verbs.length * 3);
  const formatting = clamp(signals.wordScore + (signals.sections.length >= 4 ? 4 : 0) - Math.min(grammar.length * 2, 18));
  const categories: ResumeCategory[] = [
    { label: "ATS compatibility", score: ats, detail: `${signals.sections.length} standard sections detected` },
    { label: "Keyword coverage", score: keyword, detail: `${signals.skills.length} recognizable skills found` },
    { label: "Impact and clarity", score: impact, detail: `${signals.metrics} measurable results and ${signals.verbs.length} action verbs found` },
    { label: "Formatting and writing", score: formatting, detail: `${signals.words.length} words · ${grammar.length} language issues flagged` },
  ];
  const score = clamp(categories.reduce((total, category) => total + category.score, 0) / categories.length);
  const strengths = [
    signals.email && signals.phone ? "Contact details are easy for recruiters and ATS tools to find" : signals.email ? "Email address is clearly visible" : "Your content is available for analysis",
    signals.sections.length >= 4 ? `Clear structure with ${signals.sections.length} recognizable resume sections` : "Readable content was extracted successfully",
    signals.metrics >= 3 ? `${signals.metrics} quantified achievements make your impact more concrete` : signals.verbs.length >= 4 ? "Strong action-oriented language appears throughout the resume" : "The resume has a foundation to build on",
  ];
  const suggestions = [
    !signals.email || !signals.phone ? "Add both an email address and phone number near your name" : "Keep your contact block compact and consistent",
    signals.metrics < 3 ? "Add numbers, percentages, revenue, users, or time saved to more achievement bullets" : "Lead each achievement with the result, then explain how you achieved it",
    signals.skills.length < 6 ? "Add a focused skills section with tools and methods used in the target role" : "Mirror the exact terminology used in the job description where it is truthful",
    grammar.length ? `Review ${grammar.length} writing issue${grammar.length === 1 ? "" : "s"} detected by LanguageTool` : "Keep sentences concise and use parallel structure in bullet points",
  ];
  return { score, categories, strengths, suggestions, keywords: relatedKeywords, grammarIssues: grammar.length, extractedTextLength: cleanText.length, analyzedWith: ["Local ATS rubric", "LanguageTool", "Datamuse"], text: cleanText, targetRole: draft.headline || signals.sections[0] || "Professional role", draft };
}
