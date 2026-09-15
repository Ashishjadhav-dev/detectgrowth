export function Skeleton({ className = "h-4 w-full" }: { className?: string }) {
  return <div aria-hidden="true" className={`relative isolate overflow-hidden rounded-lg bg-[#edf0f7] before:absolute before:inset-0 before:-translate-x-full before:animate-[skeleton-shimmer_1.6s_ease-in-out_infinite] before:bg-gradient-to-r before:from-transparent before:via-white/90 before:to-transparent before:content-[''] ${className}`} />;
}
