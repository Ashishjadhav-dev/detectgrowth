import { test, expect } from "@playwright/test";

async function login(page: import("@playwright/test").Page) {
  await page.goto("/auth");
  await page.getByRole("button", { name: "Continue with demo account" }).click();
  await expect(page.getByRole("heading", { name: "Hi Demo User" })).toBeVisible();
}
test("protected pages, demo login, refresh persistence, and logout", async ({ page }) => {
  await page.goto("/dashboard");
  await expect(page).toHaveURL(/\/auth$/);
  await login(page);
  await page.reload();
  await expect(page.getByRole("heading", { name: "Hi Demo User" })).toBeVisible();
  await page.goto("/settings");
  await page.getByRole("button", { name: "Sign out", exact: true }).last().click();
  await expect(page).toHaveURL(/\/auth$/);
});
test("list creation persists and filters reach an empty state", async ({ page }) => {
  await login(page);
  await page.goto("/lists");
  await page.getByRole("button", { name: "Create list", exact: true }).click();
  await page.getByRole("dialog").getByLabel("Name", { exact: true }).fill("Browser test list");
  await page.getByRole("dialog").getByRole("button", { name: "Save changes" }).click();
  await expect(page.getByRole("heading", { name: "Browser test list" })).toBeVisible();
  await page.reload();
  await expect(page.getByRole("heading", { name: "Browser test list" })).toBeVisible();
  await page.getByRole("searchbox", { name: "Search lists" }).fill("no-match-123");
  await expect(page.getByRole("heading", { name: "No matching records" })).toBeVisible();
});
test("workspace pages fit the viewport without page overflow", async ({ page }) => {
  await login(page);
  for (const route of ["dashboard", "discover", "people", "signals", "opportunities", "lists", "research", "settings", "icp", "integrations", "companies/abc-fashion", "opportunities/abc-fashion"]) {
    await page.goto(`/${route}`);
    await expect(page.locator("main h1")).toBeVisible();
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth + 1), route).toBeTruthy();
  }
});
test("chart tooltip is hidden initially and supports keyboard exploration", async ({ page }) => {
  await login(page);
  await expect(page.getByRole("tooltip")).toHaveCount(0);
  const chart = page.getByRole("slider");
  await chart.focus();
  await chart.press("ArrowRight");
  await expect(chart).toHaveAttribute("aria-valuenow", "2");
  await expect(page.getByRole("tooltip")).toBeVisible();
  await chart.press("Escape");
  await expect(page.getByRole("tooltip")).toHaveCount(0);
});

test("registration, onboarding, profile update and returning sign-in", async ({ page }) => {
  const email = `browser-${crypto.randomUUID()}@example.com`;
  await page.goto("/auth");
  await page.getByRole("button", { name: "Create a new account" }).click();
  await page.getByLabel("Name", { exact: true }).fill("Browser User");
  await page.getByLabel("Email", { exact: true }).fill(email);
  await page.getByLabel("Password", { exact: true }).fill("Browser-password-123");
  await page.getByRole("button", { name: "Create account", exact: true }).click();
  await expect(page).toHaveURL(/\/onboarding$/);
  await page.getByRole("button", { name: "Continue", exact: true }).click();
  await page.getByRole("button", { name: "Continue", exact: true }).click();
  await page.getByRole("button", { name: "Open dashboard" }).click();
  await expect(page.getByRole("heading", { name: "Hi Browser User" })).toBeVisible();
  await page.goto("/settings");
  await page.getByLabel("Full name").fill("Updated User");
  await page.getByRole("button", { name: "Save profile" }).click();
  await expect(page.getByText("Changes saved")).toBeVisible();
  await page.getByRole("button", { name: "Sign out", exact: true }).last().click();
  await expect(page).toHaveURL(/\/auth$/);
  await page.getByLabel("Email", { exact: true }).fill(email);
  await page.getByLabel("Password", { exact: true }).fill("Browser-password-123");
  await page.getByRole("button", { name: "Sign in", exact: true }).click();
  await expect(page.getByRole("heading", { name: "Hi Updated User" })).toBeVisible();
});

test("jobs search, job selection, and saved state work", async ({ page }, testInfo) => {
  await login(page);
  await page.goto("/jobs");
  await expect(page.getByRole("textbox", { name: "Search jobs", exact: true })).toHaveValue("accenture");
  await page.getByRole("button", { name: /Software Engineer/ }).click();
  const scope = testInfo.project.name === "mobile" ? page.getByRole("dialog") : page.locator("main");
  await scope.getByRole("button", { name: "Save", exact: true }).click();
  await expect(scope.getByRole("button", { name: "Saved", exact: true })).toBeVisible();
  if (testInfo.project.name === "mobile") await page.getByRole("button", { name: "Close dialog" }).click();
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth + 1)).toBeTruthy();
});

test("navigation collapses or opens a keyboard-accessible mobile drawer", async ({ page }, testInfo) => {
  await login(page);
  if (testInfo.project.name === "mobile") {
    await page.getByRole("button", { name: "Open navigation" }).click();
    await expect(page.getByRole("dialog", { name: "Navigation" })).toBeVisible();
    await page.keyboard.press("Escape");
    await expect(page.getByRole("dialog", { name: "Navigation" })).toHaveCount(0);
  } else {
    await page.getByRole("button", { name: "Collapse sidebar" }).click();
    await page.reload();
    await expect(page.getByRole("button", { name: "Expand sidebar" })).toBeVisible();
  }
});
