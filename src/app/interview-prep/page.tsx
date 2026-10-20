import { MessageCircle, PlayCircle } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

export default function InterviewPrepPage() {
  return <div className="mx-auto max-w-6xl space-y-6"><div><Badge>Career hub</Badge><h1 className="page-title mt-3">Interview Prep</h1><p className="meta mt-2">Practice the questions most likely to come up for your target roles.</p></div><div className="grid gap-5 md:grid-cols-3">{["Tell me about your growth experience.", "How do you measure campaign impact?", "Describe a difficult stakeholder conversation."].map((question, index) => <Card key={question} className="p-5"><span className="text-xs font-semibold text-primary">QUESTION 0{index + 1}</span><h2 className="mt-4 text-base font-semibold leading-6">{question}</h2><p className="meta mt-3">Build a concise answer using context, action, and measurable result.</p><Button variant="secondary" className="mt-5 w-full"><PlayCircle className="size-4" />Practice answer</Button></Card>)}</div><Card className="flex flex-wrap items-center justify-between gap-4 p-5"><div className="flex items-center gap-3"><span className="grid size-10 place-items-center rounded-xl bg-primary-soft text-primary"><MessageCircle className="size-5" /></span><div><h2 className="section-title">Generate a targeted practice set</h2><p className="meta mt-1">Use your resume and target job to prepare with relevant questions.</p></div></div><Button>Start practice set</Button></Card></div>;
}
