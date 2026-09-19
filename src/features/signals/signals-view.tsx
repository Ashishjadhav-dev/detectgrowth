"use client";
import { WorkspaceCollection } from "@/components/ui/workspace-collection";
import { demoSignals } from "@/data/demo";
export function SignalsView() {
  return <WorkspaceCollection resource="signals" title="Growth signals" description="Search, organize, and manage your workspace records." fields={[{"key":"type","label":"Signal","required":true},{"key":"company","label":"Company","required":true},{"key":"impact","label":"Impact","options":["High","Medium","Low"]},{"key":"confidence","label":"Confidence","type":"number","max":100},{"key":"description","label":"Description","required":true}]} seed={demoSignals}  />;
}
