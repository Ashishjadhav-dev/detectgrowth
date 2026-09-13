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

export type DashboardInsight = { id: string; text: string; age: string };
export type DashboardTask = { id: string; label: string; urgency: string; due: string; completed: boolean };
export type DashboardActivity = { id: string; text: string; age: string };
export type DashboardSignal = { id: string; type: string; company: string; confidence: number; impact: string };
export type DashboardOpportunity = { id: string; company: string; industry: string; score: number; employees: string; signal: string };
export type DashboardWatchlist = { name: string; score: number; delta: string };
export type DashboardPipeline = { title: string; count: string; value: string };
export type DashboardTrending = { name: string; score: string; delta: string };

export type DashboardData = {
  summary: DashboardSummary;
  insights: DashboardInsight[];
  tasks: DashboardTask[];
  activity: DashboardActivity[];
  signals: DashboardSignal[];
  opportunities: DashboardOpportunity[];
  watchlist: DashboardWatchlist[];
  pipeline: DashboardPipeline[];
  trending: DashboardTrending[];
};

export function getDashboardData() {
  return Promise.all([
    apiRequest<DashboardSummary>("/api/v1/dashboard/summary"),
    apiRequest<DashboardInsight[]>("/api/v1/dashboard/insights"),
    apiRequest<DashboardTask[]>("/api/v1/dashboard/tasks"),
    apiRequest<DashboardActivity[]>("/api/v1/dashboard/activity"),
    apiRequest<DashboardSignal[]>("/api/v1/dashboard/signals"),
    apiRequest<DashboardOpportunity[]>("/api/v1/dashboard/opportunities"),
    apiRequest<DashboardWatchlist[]>("/api/v1/dashboard/watchlist"),
    apiRequest<DashboardPipeline[]>("/api/v1/dashboard/pipeline"),
    apiRequest<DashboardTrending[]>("/api/v1/dashboard/trending"),
  ]).then(([summary, insights, tasks, activity, signals, opportunities, watchlist, pipeline, trending]): DashboardData => ({
    summary, insights, tasks, activity, signals, opportunities, watchlist, pipeline, trending,
  }));
}

export function updateDashboardTask(id: string, completed: boolean) {
  return apiRequest<DashboardTask>(`/api/v1/dashboard/tasks/${id}`, {
    method: "PATCH",
    body: JSON.stringify({ completed }),
  });
}
