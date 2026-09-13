import { Skeleton } from "@/components/ui/skeleton";
export default function Loading(){return <div className="space-y-5"><Skeleton className="h-9 w-64"/><div className="grid gap-3 md:grid-cols-4">{Array.from({length:4}).map((_,i)=><Skeleton key={i} className="h-32"/>)}</div><Skeleton className="h-[420px]"/></div>}
