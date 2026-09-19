"use client";
import { WorkspaceCollection } from "@/components/ui/workspace-collection";
import { demoOpportunities } from "@/data/demo";
export function OpportunitiesView() {
  return <WorkspaceCollection resource="opportunities" title="Growth opportunities" description="Search, organize, and manage your workspace records." fields={[{"key":"company","label":"Company","required":true},{"key":"stage","label":"Stage","options":["New","Discovery","Qualified","Proposal","Won","Lost"]},{"key":"industry","label":"Industry"},{"key":"score","label":"Score","type":"number","max":100},{"key":"expectedValue","label":"Expected value","type":"number"}]} seed={demoOpportunities} detailPath="/opportunities" />;
}
