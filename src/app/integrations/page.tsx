import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { SectionHeader } from "@/components/ui/patterns";
import { CheckCircle2, Plug, Plus } from "lucide-react";

const integrations = ["HubSpot", "Salesforce", "Gmail", "Google Calendar", "Slack", "Segment", "Webhook API", "CSV Import"];

export default function Page() {
  return (
    <div className="space-y-5">
      <div>
        <h1 className="page-title">Integrations</h1>
        <p className="mt-1 text-sm text-muted">Connect CRM, enrichment, calendar, and messaging systems to power the rest of the app.</p>
      </div>

      <section className="grid gap-4 xl:grid-cols-[1fr_.9fr]">
        <Card className="glass-card p-5">
          <SectionHeader title="Connected apps" description="A friendlier, more complete integration surface." />
          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
            {integrations.map((item, index) => (
              <div key={item} className="rounded-2xl border border-border bg-white p-4">
                <div className="flex items-center justify-between gap-3">
                  <div className="grid size-10 place-items-center rounded-2xl bg-primary-soft text-primary">
                    <Plug className="size-4" />
                  </div>
                  <CheckCircle2 className={`size-4 ${index < 5 ? "text-success" : "text-subtle"}`} />
                </div>
                <div className="mt-4 text-sm font-medium text-ink">{item}</div>
                <div className="mt-1 text-xs text-muted">{index < 5 ? "Connected" : "Available"}</div>
              </div>
            ))}
          </div>
        </Card>

        <Card className="glass-card p-5">
          <SectionHeader title="Automation hooks" description="Keep the supporting surfaces visible for power users." />
          <div className="space-y-3">
            {[
              ["CRM sync", "Bi-directional account, contact, and deal updates"],
              ["Event export", "Push signals into downstream systems"],
              ["Identity map", "Match contacts across systems"],
              ["API access", "Secure keys and usage visibility"],
            ].map(([title, text]) => (
              <div key={title} className="rounded-2xl border border-border bg-white p-3">
                <div className="text-sm font-medium text-ink">{title}</div>
                <div className="mt-1 text-sm text-muted">{text}</div>
              </div>
            ))}
          </div>
          <Button className="mt-4 w-full">
            <Plus className="size-4" />
            Add integration
          </Button>
        </Card>
      </section>
    </div>
  );
}
