import { apiRequest } from "./client";

export type DashboardSummary = {
  newOpportunities: string;
  companiesSurging: string;
  newSignals: string;
  peopleDiscovered: string;
  pipelineValue: string;
  averageGrowthScore: string;
  growthDelta: string;
};

export type DashboardInsight = { text: string; age: string };
export type DashboardTask = { label: string; urgency: string; due: string; completed: boolean };
export type DashboardActivity = { text: string; age: string };

export type DashboardData = {
  summary: DashboardSummary;
  insights: DashboardInsight[];
  tasks: DashboardTask[];
  activity: DashboardActivity[];
};

export function getDashboardData() {
  return Promise.all([
    apiRequest<DashboardSummary>("/api/v1/dashboard/summary"),
    apiRequest<DashboardInsight[]>("/api/v1/dashboard/insights"),
    apiRequest<DashboardTask[]>("/api/v1/dashboard/tasks"),
    apiRequest<DashboardActivity[]>("/api/v1/dashboard/activity"),
  ]).then(([summary, insights, tasks, activity]): DashboardData => ({ summary, insights, tasks, activity }));
}
