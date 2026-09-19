"use client";
import { useEffect, useState, type ReactNode } from "react";
import { usePathname } from "next/navigation";
import { Sidebar } from "./sidebar";
import { Topbar } from "./topbar";
import { hasDemoSession } from "@/lib/auth";
import { ToastProvider } from "@/components/ui/toast";

export function AppShell({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const [authReady, setAuthReady] = useState(false);
  const shellHidden = pathname.startsWith("/auth") || pathname.startsWith("/onboarding");

  useEffect(() => {
    setMobileNavOpen(false);
  }, [pathname]);

  useEffect(() => {
    if (pathname.startsWith("/auth")) {
      setAuthReady(true);
      return;
    }
    if (!hasDemoSession()) {
      window.location.replace("/auth");
      return;
    }
    setAuthReady(true);
  }, [pathname]);

  if (!authReady) return <div className="min-h-screen bg-[#f7f8fc]" />;

  if (shellHidden) {
    return <ToastProvider><div className="min-h-screen">{children}</div></ToastProvider>;
  }

  return <ToastProvider>
    <div className="min-h-screen lg:flex">
      <Sidebar mobileOpen={mobileNavOpen} onClose={() => setMobileNavOpen(false)} />
      <div className="min-w-0 flex-1">
        <Topbar onMenuClick={() => setMobileNavOpen(true)} />
        <main className="mx-auto min-h-[calc(100vh-4rem)] max-w-[1600px] p-4 md:p-6 lg:p-7">{children}</main>
      </div>
    </div>
  </ToastProvider>;
}
