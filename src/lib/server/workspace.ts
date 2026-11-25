import { demoCompanies, demoDashboard, demoIntegrations, demoLists, demoOpportunities, demoPeople, demoSignals } from "@/data/demo";

export function initialWorkspace(): Record<string, unknown> {
  return structuredClone({
    companies: demoCompanies, people: demoPeople, signals: demoSignals, opportunities: demoOpportunities,
    lists: demoLists, integrations: demoIntegrations, applications: [], jobAlerts: [],
    dashboard: demoDashboard, icp: { industries: "SaaS, E-commerce", locations: "India", employeeSize: "51-200", revenue: "", signals: {} },
  });
}
