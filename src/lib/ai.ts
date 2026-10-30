import { apiRequest } from "@/lib/api/client";

export type AIPersonalizationMode = "resume" | "cover-letter" | "interview" | "linkedin";
export type AIResumeResult = { summary: string; bullets: string[]; rationale: string[] };
export type AICoverLetterResult = { coverLetter: string; personalizationNotes: string[] };
export type AIInterviewResult = { score: number; feedback: string[]; improvedAnswer: string; followUps: string[] };
export type AILinkedInResult = { headline: string; about: string; suggestions: string[] };

export function personalize<T>(mode: AIPersonalizationMode, input: { resume: string; jobDescription?: string; answer?: string; targetRole?: string; instruction?: string }) {
  return apiRequest<T>("/api/ai/personalize", { method: "POST", body: JSON.stringify({ mode, ...input }) });
}
