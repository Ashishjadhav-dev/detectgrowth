"use client";
import { useEffect, useState, type ReactNode } from "react";
import { usePathname } from "next/navigation";
import { Sidebar } from "./sidebar";
import { Topbar } from "./topbar";

export function AppShell({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const shellHidden = pathname.startsWith("/auth") || pathname.startsWith("/onboarding");

  useEffect(() => {
    setMobileNavOpen(false);
  }, [pathname]);

  if (shellHidden) {
    return <div className="min-h-screen">{children}</div>;
  }

  return (
    <div className="min-h-screen lg:flex">
      <Sidebar mobileOpen={mobileNavOpen} onClose={() => setMobileNavOpen(false)} />
      <div className="min-w-0 flex-1">
        <Topbar onMenuClick={() => setMobileNavOpen(true)} />
        <main className="mx-auto min-h-[calc(100vh-4rem)] max-w-[1600px] p-4 md:p-6 lg:p-7">{children}</main>
      </div>
    </div>
  );
}
