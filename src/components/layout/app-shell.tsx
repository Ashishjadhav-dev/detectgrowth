"use client";
import { useEffect, useState, type ReactNode } from "react";
import { usePathname } from "next/navigation";
import { Sidebar } from "./sidebar";
import { Topbar } from "./topbar";
import type { SessionUser } from "@/lib/auth";
import { SessionContext } from "@/components/auth/session-provider";
import { ToastProvider } from "@/components/ui/toast";

export function AppShell({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const [authReady, setAuthReady] = useState(false);
  const [user, setUser] = useState<SessionUser | null>(null);
  const [sessionError, setSessionError] = useState(false);
  const shellHidden = pathname.startsWith("/auth") || pathname.startsWith("/onboarding");

  useEffect(() => {
    setMobileNavOpen(false);
  }, [pathname]);

  useEffect(() => {
    let cancelled = false;
    const check = async () => {
      try {
        const response = await fetch("/api/auth/session", { cache: "no-store" });
        if (!response.ok) throw new Error("Session unavailable");
        const data = await response.json();
        if (cancelled) return;
        if (!data.user && !pathname.startsWith("/auth")) { window.location.replace("/auth"); return; }
        if (data.user && pathname.startsWith("/auth")) { window.location.replace("/dashboard"); return; }
        setUser(data.user);
        setSessionError(false);
        setAuthReady(true);
      } catch { if (!cancelled) setSessionError(true); }
    };
    void check();
    window.addEventListener("focus", check);
    window.addEventListener("auth-changed", check);
    const timer = window.setInterval(check, 60000);
    return () => { cancelled = true; window.clearInterval(timer); window.removeEventListener("focus", check); window.removeEventListener("auth-changed", check); };
  }, [pathname]);

  if (sessionError) return <div className="grid min-h-screen place-content-center gap-4 p-6 text-center"><p role="alert">Unable to load your session.</p><button onClick={() => window.location.reload()} className="text-primary">Try again</button></div>;
  if (!authReady) return <div role="status" className="grid min-h-screen place-items-center bg-[#f7f8fc]">Loading workspace…</div>;

  if (shellHidden) {
    return <SessionContext.Provider value={user}><ToastProvider><div className="min-h-screen">{children}</div></ToastProvider></SessionContext.Provider>;
  }

  return <SessionContext.Provider value={user}><ToastProvider>
    <div className="min-h-screen lg:flex">
      <Sidebar mobileOpen={mobileNavOpen} onClose={() => setMobileNavOpen(false)} />
      <div className="min-w-0 flex-1">
        <Topbar onMenuClick={() => setMobileNavOpen(true)} />
        <main className="mx-auto min-h-[calc(100vh-4rem)] max-w-[1600px] p-4 md:p-6 lg:p-7">{children}</main>
      </div>
    </div>
  </ToastProvider></SessionContext.Provider>;
}
