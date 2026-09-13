import type { HTMLAttributes } from "react";
import { cn } from "@/lib/cn";

export function Card({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return <div className={cn("rounded-2xl border border-border bg-surface shadow-[0_1px_1px_rgba(23,27,43,.02)]", className)} {...props} />;
}
