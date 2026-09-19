import type { ApiCompany } from "@/lib/api/companies";
import type { DashboardData } from "@/lib/api/dashboard";
import type { ApiIntegration } from "@/lib/api/integrations";
import type { ApiList } from "@/lib/api/lists";
import type { ApiOpportunity } from "@/lib/api/opportunities";
import type { ApiPerson } from "@/lib/api/people";
import type { ResearchResult } from "@/lib/api/research";
import type { ApiSignal } from "@/lib/api/signals";

const now = new Date().toISOString();

export const demoCompanies: ApiCompany[] = [
  { id: "abc-fashion", name: "ABC Fashion", domain: "abcfashion.in", industry: "E-commerce", location: "Bangalore, India", employeeRange: "51-200", status: "active", createdAt: now, updatedAt: now },
  { id: "xyz-restaurant", name: "XYZ Restaurant", domain: "xyzrestaurant.in", industry: "Food & Beverage", location: "Bangalore, India", employeeRange: "201-500", status: "active", createdAt: now, updatedAt: now },
  { id: "lmn-solutions", name: "LMN Solutions", domain: "lmnsolutions.io", industry: "SaaS", location: "Mumbai, India", employeeRange: "51-200", status: "active", createdAt: now, updatedAt: now },
  { id: "pqr-electronics", name: "PQR Electronics", domain: "pqrelectronics.com", industry: "Consumer Electronics", location: "Delhi, India", employeeRange: "201-500", status: "active", createdAt: now, updatedAt: now },
];

export const demoPeople: ApiPerson[] = [
  { id: "demo-person-1", name: "Rahul Sharma", title: "Head of Marketing", department: "Marketing", score: 91 },
  { id: "demo-person-2", name: "Neha Patil", title: "Marketing Manager", department: "Marketing", score: 78 },
  { id: "demo-person-3", name: "Amit Verma", title: "Founder & CEO", department: "Leadership", score: 95 },
  { id: "demo-person-4", name: "Sanjay Mehta", title: "Sales Director", department: "Sales", score: 72 },
];

export const demoSignals: ApiSignal[] = [
  { id: "demo-signal-1", type: "New product launch", company: "ABC Fashion", description: "Launched a new winter collection.", time: "4 min ago", impact: "High", confidence: 96 },
  { id: "demo-signal-2", type: "Hiring detected", company: "PQR Electronics", description: "Hiring a Digital Marketing Manager.", time: "1 hour ago", impact: "High", confidence: 91 },
  { id: "demo-signal-3", type: "New outlet opened", company: "XYZ Restaurant", description: "Opened a new outlet in Koramangala.", time: "3 hours ago", impact: "Medium", confidence: 88 },
  { id: "demo-signal-4", type: "Website updated", company: "LMN Solutions", description: "Updated pricing and packaging pages.", time: "5 hours ago", impact: "Medium", confidence: 86 },
];

export const demoOpportunities: ApiOpportunity[] = [
  { id: "abc-fashion", company: "ABC Fashion", industry: "E-commerce", location: "Bangalore, India", score: 94, employees: "51-200", stage: "Qualified", status: "open", expectedValue: 24000, signals: [{ id: "demo-signal-1", title: "New product launch", description: "Launched a new winter collection.", impact: "High", confidence: 96, detectedAt: now, sourceUrl: "" }] },
  { id: "xyz-restaurant", company: "XYZ Restaurant", industry: "Food & Beverage", location: "Bangalore, India", score: 91, employees: "201-500", stage: "Discovery", status: "open", expectedValue: 18000, signals: [{ id: "demo-signal-3", title: "New outlet opened", description: "Opened a new outlet in Koramangala.", impact: "Medium", confidence: 88, detectedAt: now, sourceUrl: "" }] },
  { id: "lmn-solutions", company: "LMN Solutions", industry: "SaaS", location: "Mumbai, India", score: 86, employees: "51-200", stage: "New", status: "open", expectedValue: 32000, signals: [{ id: "demo-signal-4", title: "Website updated", description: "Updated pricing and packaging pages.", impact: "Medium", confidence: 86, detectedAt: now, sourceUrl: "" }] },
];

export const demoLists: ApiList[] = [
  { id: "demo-list-1", name: "High Intent Accounts", type: "smart", count: 24, updated: "Today" },
  { id: "demo-list-2", name: "Bangalore Follow-ups", type: "watchlist", count: 12, updated: "Yesterday" },
  { id: "demo-list-3", name: "Marketing Leaders", type: "manual", count: 38, updated: "3 days ago" },
];

export const demoIntegrations: ApiIntegration[] = [
  { provider: "gdelt", name: "GDELT News", kind: "public", description: "Public company and market news signals.", status: "connected", lastSyncedAt: now, error: "" },
  { provider: "hacker-news", name: "Hacker News", kind: "public", description: "Public technology and startup signals.", status: "connected", lastSyncedAt: now, error: "" },
  { provider: "linkedin", name: "LinkedIn", kind: "oauth", description: "Professional profile and company data.", status: "disabled", lastSyncedAt: "", error: "" },
];

export const demoDashboard: DashboardData = {
  summary: { newOpportunities: "12", companiesSurging: "8", newSignals: "34", peopleDiscovered: "146", pipelineValue: "$184K", averageGrowthScore: "87", growthDelta: "+12%" },
  insights: [{ id: "demo-insight-1", text: "ABC Fashion launched a new collection", age: "4 min ago" }, { id: "demo-insight-2", text: "8 accounts show high buying intent", age: "1 hour ago" }],
  tasks: [{ id: "demo-task-1", label: "Review high-intent accounts", urgency: "High", due: "Today", completed: false }, { id: "demo-task-2", label: "Follow up with Rahul Sharma", urgency: "Medium", due: "Tomorrow", completed: false }],
  activity: [{ id: "demo-activity-1", text: "New signal detected for ABC Fashion", age: "4 min ago" }, { id: "demo-activity-2", text: "Added LMN Solutions to pipeline", age: "Yesterday" }],
  signals: demoSignals.map((signal) => ({ id: signal.id, type: signal.type, company: signal.company, confidence: signal.confidence, impact: signal.impact })),
  opportunities: demoOpportunities.map((opportunity) => ({ id: opportunity.id, company: opportunity.company, industry: opportunity.industry, score: opportunity.score, employees: opportunity.employees, signal: opportunity.signals?.[0]?.title ?? "Growth signal" })),
  watchlist: [{ name: "High Intent Accounts", score: 92, delta: "+8%" }, { name: "Bangalore Follow-ups", score: 84, delta: "+4%" }],
  pipeline: [{ title: "New", count: "8", value: "$64K" }, { title: "Qualified", count: "5", value: "$82K" }, { title: "Discovery", count: "3", value: "$38K" }],
  trending: [{ name: "E-commerce", score: "91", delta: "+14%" }, { name: "SaaS", score: "86", delta: "+9%" }],
};

export function demoResearch(query: string): ResearchResult {
  const company = demoCompanies.find((item) => item.name.toLowerCase().includes(query.trim().toLowerCase())) ?? demoCompanies[0];
  return { company, evidence: demoSignals.slice(0, 3).map((signal) => ({ id: signal.id, title: signal.type, description: signal.description, impact: signal.impact, detectedAt: now, confidence: signal.confidence, sourceUrl: "" })), generatedAt: now };
}
