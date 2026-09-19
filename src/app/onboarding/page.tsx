import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

const steps = [
  "Role selection",
  "Goals",
  "ICP",
  "Signals",
  "Integrations",
  "Import",
  "Invite team",
  "Done",
];

export default function Page() {
  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top_left,rgba(91,53,230,.1),transparent_30%),radial-gradient(circle_at_top_right,rgba(47,111,237,.08),transparent_25%),#f7f8fc] px-4 py-8 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-6xl space-y-6">
        <Card className="glass-card p-6">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <div className="text-[11px] font-semibold uppercase tracking-[0.18em] text-primary">Onboarding</div>
              <h1 className="mt-2 text-3xl font-semibold tracking-tight text-ink">Set up your workspace</h1>
              <p className="mt-2 max-w-2xl text-sm leading-6 text-muted">
                The setup flow should guide role, goals, ICP, signals, integrations, import, and invites in a clean progression.
              </p>
            </div>
            <Button>Continue</Button>
          </div>
          <div className="mt-6 grid gap-3 md:grid-cols-4 xl:grid-cols-8">
            {steps.map((step, index) => (
              <div
                key={step}
                className={`rounded-2xl border px-3 py-2 text-center text-sm ${
                  index === 0 ? "border-primary bg-primary-soft text-primary" : "border-border bg-white text-muted"
                }`}
              >
                {step}
              </div>
            ))}
          </div>
        </Card>

        <div className="grid gap-4 lg:grid-cols-3">
          <Card className="glass-card p-5">
            <div className="text-sm font-semibold text-ink">Role selection</div>
            <div className="mt-4 space-y-2">
              {["Sales", "Marketing", "Founder", "Recruiter"].map((item, index) => (
                <label
                  key={item}
                  className={`flex items-center gap-3 rounded-2xl border px-3 py-3 text-sm ${
                    index === 0 ? "border-primary bg-primary-soft text-primary" : "border-border bg-white text-muted"
                  }`}
                >
                  <input type="radio" name="role" defaultChecked={index === 0} />
                  {item}
                </label>
              ))}
            </div>
          </Card>

          <Card className="glass-card p-5">
            <div className="text-sm font-semibold text-ink">Signals to monitor</div>
            <div className="mt-4 space-y-2">
              {["Hiring surge", "Funding rounds", "Website changes", "Technology changes", "New product launches"].map((item, index) => (
                <label key={item} className="flex items-center gap-3 rounded-2xl border border-border bg-white px-3 py-3 text-sm text-muted">
                  <input type="checkbox" defaultChecked={index < 3} />
                  {item}
                </label>
              ))}
            </div>
          </Card>

          <Card className="glass-card p-5">
            <div className="text-sm font-semibold text-ink">Final state</div>
            <div className="mt-4 rounded-3xl border border-dashed border-border bg-elevated p-5 text-sm leading-6 text-muted">
              Finish your setup and move directly into the dashboard.
            </div>
            <Button className="mt-4 w-full">Go to dashboard</Button>
          </Card>
        </div>
      </div>
    </div>
  );
}
