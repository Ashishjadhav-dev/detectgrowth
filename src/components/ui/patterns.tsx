import type { ReactNode } from "react";
import { cn } from "@/lib/cn";
import { Badge } from "./badge";
import { Card } from "./card";

export function SectionHeader({
  title,
  description,
  action,
  className,
}: {
  title: string;
  description?: string;
  action?: ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("mb-3 flex flex-wrap items-start justify-between gap-3", className)}>
      <div>
        <h2 className="section-title">{title}</h2>
        {description ? <p className="mt-1 text-sm text-muted">{description}</p> : null}
      </div>
      {action ? <div className="shrink-0">{action}</div> : null}
    </div>
  );
}

export function MetricCard({
  label,
  value,
  delta,
  note,
  icon,
}: {
  label: string;
  value: string;
  delta: string;
  note?: string;
  icon?: ReactNode;
}) {
  return (
    <Card className="glass-card p-4 transition duration-180 hover:-translate-y-0.5 hover:shadow-[0_12px_40px_rgba(23,27,43,.08)]">
      <div className="flex items-start justify-between gap-3">
        <div className="space-y-1">
          <div className="text-xs font-semibold uppercase tracking-[0.12em] text-subtle">{label}</div>
          <div className="text-3xl font-semibold tracking-tight text-ink">{value}</div>
          <div className="text-xs font-medium text-success">{delta}</div>
          {note ? <div className="text-[11px] text-subtle">{note}</div> : null}
        </div>
        {icon ? <div className="grid size-9 place-items-center rounded-2xl bg-primary-soft text-primary">{icon}</div> : null}
      </div>
    </Card>
  );
}

export function SummaryPill({
  label,
  value,
  tone = "default",
}: {
  label: string;
  value: string;
  tone?: "default" | "success" | "info" | "warning";
}) {
  const toneClass =
    tone === "success"
      ? "bg-emerald-50 text-success"
      : tone === "info"
        ? "bg-blue-50 text-info"
        : tone === "warning"
          ? "bg-amber-50 text-warning"
          : "bg-primary-soft text-primary";

  return (
    <div className="flex items-center justify-between rounded-2xl border border-border bg-white px-3 py-2.5">
      <div className="text-[11px] font-medium uppercase tracking-[0.12em] text-subtle">{label}</div>
      <Badge className={cn("rounded-full px-2.5 py-0.5 text-[11px] font-semibold", toneClass)}>{value}</Badge>
    </div>
  );
}

export function SmallStat({
  label,
  value,
  change,
}: {
  label: string;
  value: string;
  change: string;
}) {
  return (
    <div className="rounded-2xl border border-border bg-white p-3">
      <div className="text-[11px] font-medium uppercase tracking-[0.12em] text-subtle">{label}</div>
      <div className="mt-2 text-xl font-semibold tracking-tight text-ink">{value}</div>
      <div className="mt-1 text-xs font-medium text-success">{change}</div>
    </div>
  );
}

export function AvatarStack({ names }: { names: string[] }) {
  return (
    <div className="flex -space-x-2">
      {names.map((name, index) => (
        <div
          key={name}
          className={cn(
            "grid size-8 place-items-center rounded-full border-2 border-white text-[11px] font-semibold text-primary",
            index % 2 === 0 ? "bg-primary-soft" : "bg-blue-50"
          )}
        >
          {name
            .split(" ")
            .map((part) => part[0])
            .slice(0, 2)
            .join("")}
        </div>
      ))}
    </div>
  );
}

export function DonutChart({
  value,
  label,
  sublabel,
}: {
  value: string;
  label: string;
  sublabel: string;
}) {
  return (
    <div className="flex items-center gap-4">
      <div
        className="grid size-28 place-items-center rounded-full"
        style={{
          background:
            "conic-gradient(#5b35e6 0 38%, #7c5cff 38% 67%, #2f6fed 67% 82%, #18a66b 82% 100%)",
        }}
      >
        <div className="grid size-20 place-items-center rounded-full bg-white text-center shadow-[inset_0_0_0_1px_rgba(231,233,242,.9)]">
          <div>
            <div className="text-[11px] font-medium uppercase tracking-[0.12em] text-subtle">{label}</div>
            <div className="text-xl font-semibold text-ink">{value}</div>
          </div>
        </div>
      </div>
      <div className="space-y-2">
        <div className="text-sm text-muted">{sublabel}</div>
        <div className="space-y-2">
          <div className="flex items-center gap-2 text-xs text-muted">
            <span className="size-2 rounded-full bg-primary" />
            Qualified
          </div>
          <div className="flex items-center gap-2 text-xs text-muted">
            <span className="size-2 rounded-full bg-info" />
            Proposed
          </div>
          <div className="flex items-center gap-2 text-xs text-muted">
            <span className="size-2 rounded-full bg-success" />
            Won
          </div>
        </div>
      </div>
    </div>
  );
}

export function PreviewCard({
  eyebrow,
  title,
  description,
  bullets,
  footer,
}: {
  eyebrow: string;
  title: string;
  description: string;
  bullets: string[];
  footer: string;
}) {
  return (
    <Card className="glass-card p-4">
      <div className="text-[11px] font-semibold uppercase tracking-[0.16em] text-primary">{eyebrow}</div>
      <h3 className="mt-2 text-lg font-semibold text-ink">{title}</h3>
      <p className="mt-2 text-sm leading-6 text-muted">{description}</p>
      <ul className="mt-4 space-y-2">
        {bullets.map((bullet) => (
          <li key={bullet} className="flex items-start gap-2 text-sm text-muted">
            <span className="mt-1 size-1.5 rounded-full bg-primary" />
            <span>{bullet}</span>
          </li>
        ))}
      </ul>
      <div className="mt-4 text-xs font-medium text-success">{footer}</div>
    </Card>
  );
}
