import * as React from "react";
import { cn } from "@/lib/cn";

export function Input({ className, ...props }: React.InputHTMLAttributes<HTMLInputElement>) {
  return <input className={cn("h-10 w-full rounded-xl border border-border bg-white px-3.5 text-sm text-ink placeholder:text-subtle transition focus:border-primary/50", className)} {...props} />;
}
