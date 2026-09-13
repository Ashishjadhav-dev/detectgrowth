import { Inbox } from "lucide-react";
import { Card } from "./card";

export function EmptyState({ title = "Nothing here yet", body = "Try adjusting filters or add data to get started." }: { title?: string; body?: string }) {
  return <Card className="grid min-h-56 place-items-center p-8 text-center"><div><div className="mx-auto mb-3 grid size-10 place-items-center rounded-full bg-primary-soft text-primary"><Inbox className="size-5" /></div><h3 className="font-semibold">{title}</h3><p className="mt-1 text-sm text-muted">{body}</p></div></Card>;
}
