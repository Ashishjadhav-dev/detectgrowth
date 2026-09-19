"use client";
import { WorkspaceCollection } from "@/components/ui/workspace-collection";
import { demoPeople } from "@/data/demo";
export function PeopleView() {
  return <WorkspaceCollection resource="people" title="People" description="Search, organize, and manage your workspace records." fields={[{"key":"name","label":"Name","required":true},{"key":"title","label":"Job title","required":true},{"key":"department","label":"Department","options":["Marketing","Sales","Leadership","Engineering","Other"]},{"key":"email","label":"Email","type":"email"},{"key":"score","label":"Score","type":"number","max":100}]} seed={demoPeople}  />;
}
