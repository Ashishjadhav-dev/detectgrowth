const careerRoutes = new Set(["jobs", "resume", "applications", "interview-prep", "networking", "portal"]);

export function isCareerPath(pathname: string) {
  return careerRoutes.has(pathname.split("/")[1]);
}
