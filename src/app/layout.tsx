import type { Metadata } from "next";
import "@/styles/globals.css";
import { AppShell } from "@/components/layout/app-shell";

export const metadata: Metadata = {
  title: {
    default: "DetectGrowth",
    template: "%s | DetectGrowth",
  },
  description: "B2B growth intelligence",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body>
        <AppShell>{children}</AppShell>
      </body>
    </html>
  );
}
