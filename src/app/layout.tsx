import type { Metadata } from "next";
import "@/styles/globals.css";
import { AppShell } from "@/components/layout/app-shell";
import { QueryProvider } from "@/components/providers/query-provider";

export const metadata: Metadata = {
  title: {
    default: "DetectGrowth",
    template: "%s | DetectGrowth",
  },
  description: "B2B growth intelligence",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head><script dangerouslySetInnerHTML={{ __html: `try { const theme = localStorage.getItem("detectgrowth-theme"); if (theme === "dark" || (!theme && matchMedia("(prefers-color-scheme: dark)").matches)) document.documentElement.classList.add("dark"); } catch {}` }} /></head>
      <body>
        <QueryProvider><AppShell>{children}</AppShell></QueryProvider>
      </body>
    </html>
  );
}
