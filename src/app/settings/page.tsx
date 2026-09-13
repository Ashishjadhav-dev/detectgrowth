import { Card } from "@/components/ui/card";
import { SectionHeader } from "@/components/ui/patterns";

export default function Page() {
  return (
    <div className="space-y-5">
      <div>
        <h1 className="page-title">Settings</h1>
        <p className="mt-1 text-sm text-muted">Workspace preferences, security, billing, and product configuration.</p>
      </div>

      <section className="grid gap-4 xl:grid-cols-[280px_1fr]">
        <Card className="glass-card p-4">
          <SectionHeader title="Settings sections" description="A place for the supporting admin flows from the wireframe." />
          <div className="space-y-2">
            {["Profile", "Organization", "Security", "Notifications", "Billing", "API keys"].map((item, index) => (
              <button
                key={item}
                className={`w-full rounded-2xl border px-3 py-2.5 text-left text-sm ${
                  index === 0 ? "border-primary bg-primary-soft text-primary" : "border-border bg-white text-muted"
                }`}
              >
                {item}
              </button>
            ))}
          </div>
        </Card>

        <Card className="glass-card p-6">
          <SectionHeader title="Workspace overview" description="This page is scaffolded as a richer admin surface rather than a placeholder." />
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {[
              ["Workspace", "Morgan Growth Team", "Active"],
              ["Members", "18 users", "2 pending invites"],
              ["Billing", "Pro plan", "Next renewal Aug 30, 2026"],
              ["Security", "SSO enabled", "2FA required"],
              ["Usage", "72% of credits used", "3,240 credits remaining"],
              ["Integrations", "9 connected", "CRM and enrichment live"],
            ].map(([title, value, hint]) => (
              <div key={title} className="rounded-2xl border border-border bg-white p-4">
                <div className="text-xs uppercase tracking-[0.12em] text-subtle">{title}</div>
                <div className="mt-2 text-lg font-semibold text-ink">{value}</div>
                <div className="mt-1 text-sm text-muted">{hint}</div>
              </div>
            ))}
          </div>
        </Card>
      </section>
    </div>
  );
}
