"use client";
import { useState } from "react";
import { Card } from "@/components/ui/card";
import { SectionHeader } from "@/components/ui/patterns";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/toast";

export default function Page() {
  const [activeSection, setActiveSection] = useState("Profile");
  const { showToast } = useToast();
  const sectionContent: Record<string, { title: string; description: string; fields: string[] }> = {
    Profile: { title: "Profile details", description: "Keep your personal workspace details up to date.", fields: ["Full name", "Email address", "Role"] },
    Organization: { title: "Organization", description: "Manage your workspace identity and default preferences.", fields: ["Workspace name", "Website", "Timezone"] },
    Security: { title: "Security", description: "Control how your account stays protected.", fields: ["Password", "Two-factor authentication", "Active sessions"] },
    Notifications: { title: "Notifications", description: "Choose which updates should reach you.", fields: ["Signal alerts", "Daily digest", "Task reminders"] },
    Billing: { title: "Billing", description: "Review your plan and usage information.", fields: ["Current plan", "Payment method", "Invoices"] },
    "API keys": { title: "API keys", description: "Manage keys for trusted integrations.", fields: ["Workspace key", "Created date", "Last used"] },
  };
  const content = sectionContent[activeSection];
  return (
    <div className="space-y-5">
      <div>
        <h1 className="page-title">Settings</h1>
        <p className="mt-1 text-sm text-muted">Workspace preferences, security, billing, and product configuration.</p>
      </div>

      <section className="grid gap-4 xl:grid-cols-[280px_1fr]">
        <Card className="glass-card p-4">
          <SectionHeader title="Settings sections" description="Manage your workspace preferences." />
          <div className="space-y-2">
            {["Profile", "Organization", "Security", "Notifications", "Billing", "API keys"].map((item, index) => (
              <button
                key={item}
                onClick={() => setActiveSection(item)}
                className={`w-full rounded-2xl border px-3 py-2.5 text-left text-sm transition ${
                  activeSection === item ? "border-primary bg-primary-soft text-primary" : "border-border bg-white text-muted hover:border-primary/30 hover:text-ink"
                }`}
              >
                {item}
              </button>
            ))}
          </div>
        </Card>

        <Card className="glass-card p-6">
          <SectionHeader title={content.title} description={content.description} />
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {activeSection === "Profile" ? [
              ["Workspace", "Demo Workspace", "Active"],
              ["Members", "1 user", "Demo account"],
              ["Billing", "Pro plan", "Next renewal Aug 30, 2026"],
              ["Security", "SSO enabled", "2FA required"],
              ["Usage", "72% of credits used", "3,240 credits remaining"],
              ["Integrations", "9 connected", "CRM and enrichment live"],
            ] : content.fields.map((field) => [field, "Configured", "Review details"]).map(([title, value, hint]) => (
              <div key={title} className="rounded-2xl border border-border bg-white p-4">
                <div className="text-xs uppercase tracking-[0.12em] text-subtle">{title}</div>
                <div className="mt-2 text-lg font-semibold text-ink">{value}</div>
                <div className="mt-1 text-sm text-muted">{hint}</div>
              </div>
            ))}
          </div>
          <Button className="mt-5" onClick={() => showToast(`${activeSection} settings saved`)}>Save changes</Button>
        </Card>
      </section>
    </div>
  );
}
