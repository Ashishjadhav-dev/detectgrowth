import { cn } from "@/lib/cn";

export function Score({ value, compact = false }: { value: number; compact?: boolean }) {
  return <div className={cn("font-semibold text-primary", compact ? "text-sm" : "text-2xl")}>{value}<span className={cn("ml-1 text-muted", compact ? "text-[10px]" : "text-xs")}>/100</span></div>;
}
