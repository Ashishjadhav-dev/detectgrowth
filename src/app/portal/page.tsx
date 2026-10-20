import Link from "next/link";
import { ArrowRight, CircleUserRound, FileText } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";

export default function PortalPage() {
  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <div><Badge>My Portal</Badge><h1 className="page-title mt-3">Your resume workspace</h1><p className="meta mt-2">Manage your resume, create a new version, or review your ATS analysis.</p></div>
      <div className="grid gap-5 md:grid-cols-2">
        <Link href="/resume/create" className="group"><Card className="h-full p-6 transition hover:-translate-y-0.5 hover:border-primary/40"><span className="grid size-11 place-items-center rounded-xl bg-primary-soft text-primary"><FileText className="size-5" /></span><h2 className="section-title mt-5">Create a resume</h2><p className="meta mt-2">Build a polished resume from your professional details.</p><span className="mt-5 inline-flex items-center gap-2 text-sm font-medium text-primary">Open creator <ArrowRight className="size-4 transition group-hover:translate-x-1" /></span></Card></Link>
        <Link href="/resume/analysis" className="group"><Card className="h-full p-6 transition hover:-translate-y-0.5 hover:border-primary/40"><span className="grid size-11 place-items-center rounded-xl bg-primary-soft text-primary"><CircleUserRound className="size-5" /></span><h2 className="section-title mt-5">Review ATS analysis</h2><p className="meta mt-2">Check your resume score and improvement recommendations.</p><span className="mt-5 inline-flex items-center gap-2 text-sm font-medium text-primary">View analysis <ArrowRight className="size-4 transition group-hover:translate-x-1" /></span></Card></Link>
      </div>
    </div>
  );
}
