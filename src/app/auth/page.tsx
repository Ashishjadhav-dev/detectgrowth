import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";

export default function Page() {
  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top_left,rgba(91,53,230,.1),transparent_30%),radial-gradient(circle_at_top_right,rgba(47,111,237,.08),transparent_25%),#f7f8fc] px-4 py-8 sm:px-6 lg:px-8">
      <div className="mx-auto grid min-h-[calc(100vh-4rem)] max-w-6xl gap-6 lg:grid-cols-[1.05fr_.95fr]">
        <Card className="glass-card flex flex-col justify-between overflow-hidden p-8">
          <div>
            <div className="text-[11px] font-semibold uppercase tracking-[0.18em] text-primary">Authentication & account</div>
            <h1 className="mt-3 text-4xl font-semibold tracking-tight text-ink">Sign in to DetectGrowth</h1>
            <p className="mt-3 max-w-xl text-sm leading-6 text-muted">
              Login, SSO, password recovery, and session handling should feel as polished as the rest of the product.
            </p>
          </div>
          <div className="mt-8 grid gap-3 sm:grid-cols-2">
            {["Google", "Microsoft", "Okta", "OneLogin"].map((provider) => (
              <button key={provider} className="rounded-2xl border border-border bg-white px-4 py-3 text-sm text-ink">
                {provider} SSO
              </button>
            ))}
          </div>
          <div className="mt-8 grid gap-3 md:grid-cols-2">
            <div className="rounded-3xl border border-border bg-white p-4">
              <div className="text-sm font-medium text-ink">Security-first login</div>
              <p className="mt-2 text-sm leading-6 text-muted">Support 2FA, session expiry, invite acceptance, and locked account states.</p>
            </div>
            <div className="rounded-3xl border border-border bg-white p-4">
              <div className="text-sm font-medium text-ink">Workspace aware</div>
              <p className="mt-2 text-sm leading-6 text-muted">Users should land inside the right team with the right role and permissions.</p>
            </div>
          </div>
        </Card>

        <Card className="glass-card p-8">
          <div className="mx-auto max-w-md">
            <div className="text-[11px] font-semibold uppercase tracking-[0.18em] text-primary">Sign in</div>
            <h2 className="mt-3 text-2xl font-semibold text-ink">Welcome back</h2>
            <p className="mt-2 text-sm text-muted">Enter your workspace email and password to continue.</p>

            <form className="mt-6 space-y-4">
              <label className="block">
                <span className="mb-2 block text-sm font-medium text-ink">Email</span>
                <Input type="email" defaultValue="ashish@morgangrowth.com" />
              </label>
              <label className="block">
                <span className="mb-2 block text-sm font-medium text-ink">Password</span>
                <Input type="password" defaultValue="password" />
              </label>
              <div className="flex items-center justify-between text-sm">
                <label className="flex items-center gap-2 text-muted">
                  <input type="checkbox" />
                  Remember this device
                </label>
                <button type="button" className="text-primary">
                  Forgot password?
                </button>
              </div>
              <Button className="w-full">Sign in</Button>
            </form>

            <div className="mt-6 rounded-3xl border border-dashed border-border bg-elevated p-4 text-sm text-muted">
              This route is intentionally shell-free so the auth flow matches the dedicated wireframes.
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}
