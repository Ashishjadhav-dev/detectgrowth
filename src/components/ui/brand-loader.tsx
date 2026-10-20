import Image from "next/image";

export function BrandLoader() {
  return (
    <div role="status" aria-label="Loading DetectGrowth" className="grid min-h-screen place-items-center bg-[#f7f8fc]">
      <div className="flex flex-col items-center gap-4">
        <Image src="/detectgrowth-logo.png" alt="DetectGrowth" width={320} height={107} priority className="h-auto w-[220px] animate-pulse object-contain" />
        <div className="flex items-center gap-1.5" aria-hidden="true"><span className="size-1.5 animate-bounce rounded-full bg-primary [animation-delay:-.2s]" /><span className="size-1.5 animate-bounce rounded-full bg-primary [animation-delay:-.1s]" /><span className="size-1.5 animate-bounce rounded-full bg-primary" /></div>
        <span className="sr-only">Loading DetectGrowth…</span>
      </div>
    </div>
  );
}
