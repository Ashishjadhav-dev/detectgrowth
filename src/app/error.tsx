"use client";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
export default function Error({ reset }: { reset: () => void }){return <Card className="mx-auto max-w-lg p-8 text-center"><h2 className="text-xl font-semibold">Something went wrong</h2><p className="mt-2 text-sm text-muted">We couldn&apos;t load this screen. Please try again.</p><Button className="mt-5" onClick={reset}>Retry</Button></Card>}
