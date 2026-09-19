import type { JobsResponse } from "@/types/jobs";
export const demoJobs: JobsResponse = {
  fetchedAt: new Date().toISOString(),
  sources: { Workspace: { ok: true, count: 4 } },
  jobs: ["Software Engineer", "Business Analyst", "Cloud Consultant", "Data Engineer"].map((title, index) => ({
    id: `workspace-job-${index}`, title, company: "Accenture", location: ["Bangalore, India", "Mumbai, India", "Pune, India", "Remote"][index], workplace: index === 3 ? "Remote" : "Hybrid", source: "Workspace", tags: ["Technology", "Full-time"], department: "Technology", employmentType: "Full-time", description: "Work with a collaborative team to design, build, and improve enterprise solutions. Responsibilities include gathering requirements, delivering maintainable solutions, and working with stakeholders. Explore the company careers page for current openings and application requirements.", url: "https://www.accenture.com/careers", postedAt: new Date(Date.now() - index * 86400000).toISOString(),
  })),
};
