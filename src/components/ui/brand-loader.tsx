import Image from "next/image";

export function BrandLoader() {
  return (
    <div role="status" aria-label="Loading DetectGrowth" className="grid min-h-screen place-items-center bg-canvas">
      <div className="flex flex-col items-center gap-4">
        <Image src="/detectgrowth-logo.png" alt="DetectGrowth" width={320} height={107} priority className="brand-logo h-auto w-[220px] animate-pulse object-contain" />
        <div className="flex items-center gap-1.5" aria-hidden="true">
          <span className="size-1.5 animate-bounce rounded-full bg-loading-accent [animation-delay:-.2s]" />
          <span className="size-1.5 animate-bounce rounded-full bg-loading-accent [animation-delay:-.1s]" />
          <span className="size-1.5 animate-bounce rounded-full bg-loading-accent" />
        </div>
        <span className="sr-only">Loading DetectGrowth…</span>
      </div>
    </div>
  );
}
