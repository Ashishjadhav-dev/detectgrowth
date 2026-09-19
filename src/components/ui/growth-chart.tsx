"use client";
import { useId, useMemo, useState } from "react";

export function GrowthChart({ days, endScore = 87 }: { days: number; endScore?: number }) {
  const gradient = useId();
  const [active, setActive] = useState<number | null>(null);
  const points = useMemo(() => Array.from({ length: days }, (_, index) => {
    const date = new Date(); date.setDate(date.getDate() - days + 1 + index);
    const progress = index / (days - 1);
    const score = Math.max(0, Math.min(100, Math.round(endScore - 19 + progress * 19 + (Math.sin(index * 0.9) - Math.sin((days - 1) * 0.9) * progress) * 1.5)));
    return { date: date.toLocaleDateString(undefined, { month: "short", day: "numeric" }), score, signals: 3 + index % 9, x: 12 + index / (days - 1) * 616, y: (100 - score) * 1.8 };
  }), [days, endScore]);
  const line = points.map((point, index) => `${index ? "L" : "M"}${point.x},${point.y}`).join(" ");
  const selected = active === null ? null : points[active];
  const change = active !== null && active > 0 ? points[active].score - points[active - 1].score : 0;
  return <div className="relative h-64 min-w-0 rounded-2xl bg-primary-soft/30 pl-9 pr-2 pt-4 sm:pr-4">
    <div aria-hidden="true" className="pointer-events-none absolute bottom-8 left-2 top-4 flex flex-col justify-between text-[10px] text-muted">{[100, 75, 50, 25, 0].map((value) => <span key={value}>{value}</span>)}</div>
    <div className="relative h-[calc(100%-32px)] w-full cursor-crosshair rounded-lg outline-none focus-visible:ring-2 focus-visible:ring-primary" role="slider" tabIndex={0} aria-label="Growth score history. Use arrow keys to explore dates." aria-valuemin={1} aria-valuemax={days} aria-valuenow={(active ?? 0) + 1} aria-valuetext={selected ? `${selected.date}, score ${selected.score}` : "Move across the chart to view a score"}
      onPointerMove={(event) => { const bounds = event.currentTarget.getBoundingClientRect(); const x = ((event.clientX - bounds.left) / bounds.width) * 640; setActive(Math.max(0, Math.min(days - 1, Math.round((x - 12) / 616 * (days - 1))))); }}
      onPointerLeave={() => setActive(null)} onPointerCancel={() => setActive(null)} onFocus={() => setActive(0)} onBlur={() => setActive(null)}
      onKeyDown={(event) => { if (!["ArrowLeft", "ArrowRight", "Home", "End", "Escape"].includes(event.key)) return; event.preventDefault(); setActive(event.key === "Escape" ? null : event.key === "Home" ? 0 : event.key === "End" ? days - 1 : Math.min(days - 1, Math.max(0, (active ?? 0) + (event.key === "ArrowRight" ? 1 : -1)))); }}>
      <svg className="pointer-events-none h-full w-full overflow-visible" viewBox="0 0 640 180" preserveAspectRatio="none" aria-hidden="true">
        <defs><linearGradient id={gradient} x1="0" x2="0" y1="0" y2="1"><stop stopColor="#5b35e6" stopOpacity=".2" /><stop offset="1" stopColor="#5b35e6" stopOpacity="0" /></linearGradient></defs>
        {[0, 45, 90, 135, 180].map((y) => <line key={y} x1="0" x2="640" y1={y} y2={y} stroke="#dce0e7" strokeDasharray="4 4" />)}
        <path d={`${line} L628,180 L12,180 Z`} fill={`url(#${gradient})`} />
        <path d={line} fill="none" stroke="#5b35e6" strokeWidth="2.5" vectorEffect="non-scaling-stroke" strokeLinejoin="round" />
      </svg>
      {selected ? <>
        <div className="pointer-events-none absolute inset-y-0 border-l border-dashed border-primary/40 transition-[left] duration-75 motion-reduce:transition-none" style={{ left: `${selected.x / 640 * 100}%` }} />
        <div className="pointer-events-none absolute size-3 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-primary bg-white transition-[left,top] duration-75 motion-reduce:transition-none" style={{ left: `${selected.x / 640 * 100}%`, top: `${selected.y / 180 * 100}%` }} />
        <div role="tooltip" className="pointer-events-none absolute top-[48%] z-10 w-40 rounded-xl border border-border bg-white p-3 text-xs shadow-lg transition-[left] duration-75 motion-reduce:transition-none" style={{ left: `clamp(0px, calc(${selected.x / 640 * 100}% - 80px), calc(100% - 160px))` }}><p className="font-medium text-muted">{selected.date}</p><p className="mt-1 text-xl font-semibold">{selected.score}<span className="ml-1 text-xs font-normal text-muted">/ 100</span></p><p className="mt-1 text-muted">{change > 0 ? "+" : ""}{change} pts vs previous day</p><p className="mt-1 text-muted">{selected.signals} signals</p></div>
      </> : null}
    </div>
    <div aria-hidden="true" className="mt-2 flex justify-between text-[10px] text-muted"><span>{points[0].date}</span><span>{points[Math.floor(days / 2)].date}</span><span>Today</span></div>
  </div>;
}
