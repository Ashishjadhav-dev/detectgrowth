import Link from "next/link";
import { Button } from "@/components/ui/button";
export default function NotFound(){return <div className="grid min-h-[60vh] place-items-center text-center"><div><div className="text-sm font-semibold text-primary">404</div><h1 className="mt-2 text-3xl font-semibold">Page not found</h1><p className="mt-2 text-sm text-muted">The page you requested does not exist.</p><Button asChild className="mt-5"><Link href="/dashboard">Back to dashboard</Link></Button></div></div>}
