"use client";
import { WorkspaceCollection } from "@/components/ui/workspace-collection";
import { demoCompanies } from "@/data/demo";
export function DiscoverView() {
  return <WorkspaceCollection resource="companies" title="Discover companies" description="Find, save, and manage accounts in your workspace." detailPath="/companies" seed={demoCompanies} fields={[
    { key: "name", label: "Company name", required: true },
    { key: "industry", label: "Industry", options: ["SaaS", "E-commerce", "Food & Beverage", "Consumer Electronics", "Other"] },
    { key: "location", label: "Location", required: true },
    { key: "employeeRange", label: "Employees", options: ["1-10", "11-50", "51-200", "201-500", "501-1000", "1000+"] },
    { key: "domain", label: "Website domain" }
  ]} />;
}
