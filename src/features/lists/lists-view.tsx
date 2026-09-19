"use client";
import { WorkspaceCollection } from "@/components/ui/workspace-collection";
import { demoLists } from "@/data/demo";
export function ListsView() {
  return <WorkspaceCollection resource="lists" title="Lists and watchlists" description="Search, organize, and manage your workspace records." fields={[{"key":"name","label":"Name","required":true},{"key":"type","label":"Type","options":["manual","smart","watchlist"]},{"key":"description","label":"Description"}]} seed={demoLists}  />;
}
