export function Progress({ value }: { value: number }) {
  return <div className="h-2 w-full overflow-hidden rounded-full bg-primary-soft"><div className="h-full rounded-full bg-primary" style={{ width: `${Math.max(0, Math.min(100, value))}%` }} /></div>;
}
