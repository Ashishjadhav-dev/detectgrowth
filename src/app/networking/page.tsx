import Link from "next/link";
import { ArrowUpRight, Globe2, Users } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

export default function NetworkingPage() {
  return <div className="mx-auto max-w-6xl space-y-6"><div><Badge>Career hub</Badge><h1 className="page-title mt-3">Networking & Portals</h1><p className="meta mt-2">Keep your professional profiles and networking destinations within reach.</p></div><div className="grid gap-5 md:grid-cols-2"><Card className="p-6"><span className="grid size-11 place-items-center rounded-xl bg-primary-soft text-primary"><Globe2 className="size-5" /></span><h2 className="section-title mt-5">Career portals</h2><div className="mt-4 space-y-3">{["LinkedIn", "Wellfound", "Indeed"].map((portal) => <div key={portal} className="flex items-center justify-between rounded-xl border border-border p-3"><span className="text-sm font-medium">{portal}</span><Button variant="ghost" aria-label={`Open ${portal}`}><ArrowUpRight className="size-4" /></Button></div>)}</div></Card><Card className="p-6"><span className="grid size-11 place-items-center rounded-xl bg-primary-soft text-primary"><Users className="size-5" /></span><h2 className="section-title mt-5">Networking plan</h2><p className="meta mt-2">Save people to follow up with and keep your outreach focused.</p><Link href="/people"><Button className="mt-5">Open people workspace</Button></Link></Card></div></div>;
}
