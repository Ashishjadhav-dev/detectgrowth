export function BrandLoader() {
  return (
    <div role="status" aria-label="Loading DetectGrowth" className="grid min-h-screen place-items-center bg-[#f7f8fc]">
      <div className="flex flex-col items-center gap-4">
        <div className="grid size-14 animate-pulse place-items-center rounded-2xl bg-primary text-base font-semibold text-white shadow-[0_10px_28px_rgba(95,111,82,.24)]">DG</div>
        <div className="flex items-center gap-1.5" aria-hidden="true"><span className="size-1.5 animate-bounce rounded-full bg-primary [animation-delay:-.2s]" /><span className="size-1.5 animate-bounce rounded-full bg-primary [animation-delay:-.1s]" /><span className="size-1.5 animate-bounce rounded-full bg-primary" /></div>
        <span className="sr-only">Loading DetectGrowth…</span>
      </div>
    </div>
  );
}
