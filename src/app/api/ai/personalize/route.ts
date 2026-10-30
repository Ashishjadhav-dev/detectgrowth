import OpenAI from "openai";
import { NextRequest, NextResponse } from "next/server";
import { tokenHash, transact } from "@/lib/server/accounts";

export const runtime = "nodejs";

type Mode = "resume" | "cover-letter" | "interview" | "linkedin";
const MAX_CONTEXT = 30000;

function error(message: string, status = 400) {
  return NextResponse.json({ error: { message } }, { status });
}

async function hasSession(request: NextRequest) {
  if (request.cookies.get("detectgrowth_guest")?.value === "1") return true;
  const token = request.cookies.get("detectgrowth_session")?.value;
  if (!token) return false;
  return transact((db) => Boolean(db.sessions[tokenHash(token)]));
}

function jsonOutput(value: string) {
  const cleaned = value.trim().replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/i, "");
  try { return JSON.parse(cleaned) as Record<string, unknown>; } catch { return { text: cleaned }; }
}

function instructions(mode: Mode) {
  if (mode === "resume") return `Return JSON with exactly these keys: summary (string), bullets (array of 3 strings), rationale (array of 3 strings). Rewrite only from facts in the supplied resume. Never invent employers, dates, metrics, tools, certifications, or outcomes. Make bullets action-led and preserve uncertainty where evidence is missing.`;
  if (mode === "cover-letter") return `Return JSON with exactly these keys: coverLetter (string), personalizationNotes (array of 3 strings). Write a concise, specific cover letter using only facts in the resume and job description. Do not invent a hiring manager name, company facts, achievements, or metrics.`;
  if (mode === "interview") return `Return JSON with exactly these keys: score (number 0-100), feedback (array of 3 strings), improvedAnswer (string), followUps (array of 3 strings). Review the answer against the resume and role. Do not add achievements or metrics that are not present in the resume.`;
  return `Return JSON with exactly these keys: headline (string), about (string), suggestions (array of 4 strings). Improve the profile using only facts in the resume. Do not claim unsupported skills or achievements.`;
}

export async function POST(request: NextRequest) {
  if (!(await hasSession(request))) return error("Please sign in to use AI personalization.", 401);
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) return error("AI personalization is not configured. Add OPENAI_API_KEY to the server environment.", 503);
  if (Number(request.headers.get("content-length") ?? 0) > 100000) return error("Request is too large.", 413);
  let body: { mode?: Mode; resume?: string; jobDescription?: string; answer?: string; targetRole?: string; instruction?: string };
  try { body = await request.json(); } catch { return error("Invalid JSON request."); }
  const mode = body.mode;
  if (!mode || !["resume", "cover-letter", "interview", "linkedin"].includes(mode)) return error("Unsupported AI personalization mode.");
  const resume = typeof body.resume === "string" ? body.resume.slice(0, MAX_CONTEXT) : "";
  const jobDescription = typeof body.jobDescription === "string" ? body.jobDescription.slice(0, MAX_CONTEXT) : "";
  const answer = typeof body.answer === "string" ? body.answer.slice(0, 12000) : "";
  if (resume.length < 40) return error("Add a resume before requesting personalization.");
  if ((mode === "cover-letter" || mode === "interview" || mode === "resume") && !jobDescription && !body.targetRole) return error("Add a target role or job description.");
  if (mode === "interview" && answer.length < 20) return error("Write an interview answer before requesting feedback.");

  const client = new OpenAI({ apiKey });
  const userPrompt = [
    `Mode: ${mode}`,
    body.targetRole ? `Target role: ${body.targetRole.slice(0, 500)}` : "",
    `Resume:\n${resume}`,
    jobDescription ? `Job description:\n${jobDescription}` : "",
    answer ? `Interview answer:\n${answer}` : "",
    body.instruction ? `User request:\n${body.instruction.slice(0, 2000)}` : "",
  ].filter(Boolean).join("\n\n");
  try {
    const response = await client.responses.create({
      model: process.env.OPENAI_MODEL || "gpt-4o-mini",
      store: false,
      max_output_tokens: 1800,
      input: [
        { role: "system", content: instructions(mode) },
        { role: "user", content: userPrompt },
      ],
    });
    return NextResponse.json({ data: jsonOutput(response.output_text) }, { headers: { "Cache-Control": "no-store" } });
  } catch (cause) {
    console.error("AI personalization request failed", cause);
    return error("The AI provider could not complete this request. Please retry.", 502);
  }
}
