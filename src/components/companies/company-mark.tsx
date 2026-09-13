export function CompanyMark({ name }: { name: string }) {
  const initials = name.split(" ").map((x) => x[0]).slice(0,2).join("");
  return <div className="grid size-10 shrink-0 place-items-center rounded-xl bg-primary text-xs font-bold text-white">{initials}</div>;
}
