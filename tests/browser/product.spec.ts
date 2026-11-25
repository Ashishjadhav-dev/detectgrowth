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
  for (const route of ["dashboard", "leads", "watchlists", "discover", "people", "signals", "opportunities", "lists", "research", "settings", "icp", "integrations", "companies/abc-fashion", "opportunities/abc-fashion"]) {
    await page.goto(`/${route}`);
    await expect(page.locator("main h1")).toBeVisible();
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth + 1), route).toBeTruthy();
  }
});
test("growth signals, quick capture and lead stages work across reloads", async ({ page }, testInfo) => {
  await login(page);
  await page.route("**/api/leads/audit?*", (route) => route.fulfill({ json: {
    checkedAt: "2026-11-25T09:00:00.000Z", status: 503, title: "", mobileReady: null,
    secure: true, lastModified: null, changeSignals: ["Homepage returned HTTP 503"],
  } }));
  await page.getByRole("link", { name: /Discover business leads/ }).click();
  await page.getByRole("button", { name: "View example results" }).click();
  await expect(page.getByText("Example results use fictional business and contact details.")).toBeVisible();

  const results = page.getByRole("list", { name: "Lead results" });
  const row = results.getByRole("listitem").filter({ hasText: "Greenline Dental clinics" });
  const business = row.getByRole("button", { name: /^Greenline Dental clinics/ });
  await expect(row.getByRole("link", { name: "Call Greenline Dental clinics" })).toHaveAttribute("href", "tel:+12025550148");
  await business.click();
  const mobile = testInfo.project.name === "mobile";
  const scope = mobile ? page.getByRole("dialog") : page.locator("main article");
  await scope.getByRole("button", { name: "Run website check" }).click();
  await expect(scope.getByRole("button", { name: "Check again" })).toBeEnabled();
  if (mobile) await scope.getByRole("button", { name: "Close dialog" }).click();

  await page.getByLabel("Filter by growth signal").selectOption("audit");
  await expect(results.getByRole("listitem")).toHaveCount(1);
  await expect(row.getByText("Homepage returned HTTP 503")).toBeVisible();
  await row.getByRole("button", { name: "Capture Greenline Dental clinics" }).click();
  await expect(row.getByText("Captured", { exact: true })).toBeVisible();
  await business.click();
  await scope.getByLabel("Lead stage").selectOption("Interested");
  await scope.getByLabel("Lead notes").fill("Recheck the homepage before reaching out.");
  await scope.getByRole("button", { name: "Save notes" }).click();
  await expect(page.getByText("Notes saved.")).toBeVisible();

  await page.reload();
  await page.getByRole("button", { name: /Shortlist/ }).click();
  await expect(row.getByText("Homepage returned HTTP 503")).toBeVisible();
  await expect(row.getByText("Interested", { exact: true })).toBeVisible();
  await business.click();
  await expect(scope.getByLabel("Lead stage")).toHaveValue("Interested");
  await expect(scope.getByLabel("Lead notes")).toHaveValue("Recheck the homepage before reaching out.");
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth + 1)).toBeTruthy();
});

test("save, recheck, and remove a market watchlist", async ({ page }) => {
  await login(page);
  await page.getByRole("link", { name: /Discover business leads/ }).click();
  await page.getByRole("button", { name: "View example results" }).click();
  await page.getByRole("button", { name: "Save as watchlist" }).click();
  await page.getByRole("link", { name: "Open watchlist" }).click();
  await expect(page.getByRole("heading", { name: "Growth Watchlists" })).toBeVisible();
  await expect(page.getByText("First check saved.", { exact: false })).toBeVisible();
  await page.reload();
  await page.getByRole("button", { name: "Recheck market" }).click();
  await expect(page.getByRole("heading", { name: "New since last check" })).toBeVisible();
  await expect(page.getByText("No new listings in these results.")).toBeVisible();
  await expect(page.getByRole("heading", { name: "Changed since last check" })).toBeVisible();
  await page.getByRole("link", { name: "Open in lead discovery" }).click();
  const locality = page.getByLabel("City or neighborhood");
  await expect(locality).toHaveValue("Indiranagar, Bengaluru");
  await expect(page.getByText("Example results use fictional business and contact details.")).toBeVisible();
  await page.route("**/api/leads?*", async (route) => {
    if (new URL(route.request().url()).searchParams.get("locality") !== "Pune") return route.continue();
    return route.fulfill({ json: { leads: [], source: "OpenStreetMap", resolvedLocality: "Pune", fetchedAt: "2026-11-25T09:00:00.000Z" } });
  });
  await locality.fill("Pune");
  const liveSearch = page.waitForRequest((request) => new URL(request.url()).searchParams.get("locality") === "Pune");
  await page.getByRole("button", { name: "Find leads", exact: true }).click();
  expect(new URL((await liveSearch).url()).searchParams.has("mode")).toBeFalsy();
  await page.goBack();
  await page.getByRole("button", { name: "Remove watchlist" }).click();
  await page.getByRole("dialog").getByRole("button", { name: "Remove", exact: true }).click();
  await expect(page.getByRole("heading", { name: "No saved markets yet" })).toBeVisible();
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
  await page.goto("/jobs?query=accenture");
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

test("Growth and Career navigation follow the workspace routes", async ({ page, isMobile }) => {
  await login(page);
  if (isMobile) await page.getByRole("button", { name: "Open navigation" }).click();
  let nav = page.getByRole("navigation", { name: "Growth navigation" });
  await expect(nav.getByRole("link", { name: "Lead discovery" })).toBeVisible();
  await nav.getByRole("link", { name: "Open career workspace" }).click();
  await expect(page).toHaveURL(/\/jobs$/);
  if (isMobile) await page.getByRole("button", { name: "Open navigation" }).click();
  nav = page.getByRole("navigation", { name: "Career navigation" });
  await expect(nav.getByRole("link", { name: "Resume Builder" })).toBeVisible();
  await nav.getByRole("link", { name: "Open growth workspace" }).click();
  await expect(page).toHaveURL(/\/leads$/);
});

test("forgotten password can be recovered with the registration code", async ({ page }) => {
  const email = `recover-ui-${crypto.randomUUID()}@example.com`;
  await page.goto("/auth");
  await page.getByRole("button", { name: "Create a new account" }).click();
  await page.getByLabel("Name", { exact: true }).fill("Recovery User");
  await page.getByLabel("Email", { exact: true }).fill(email);
  await page.getByLabel("Password", { exact: true }).fill("First-password-123");
  await page.getByRole("button", { name: "Create account", exact: true }).click();
  await expect(page.getByRole("heading", { name: "Save your recovery code" })).toBeVisible();
  const code = await page.locator("code").textContent();
  await page.getByRole("button", { name: "Skip for now" }).click();
  await expect(page).toHaveURL(/\/dashboard$/);
  await page.goto("/settings");
  await page.getByRole("button", { name: "Sign out", exact: true }).last().click();
  await expect(page).toHaveURL(/\/auth$/);
  await page.getByRole("button", { name: "Forgot password?" }).click();
  await page.getByLabel("Email", { exact: true }).fill(email);
  await page.getByLabel("Recovery code", { exact: true }).fill(code!);
  await page.getByLabel("Password", { exact: true }).fill("Second-password-123");
  await page.getByRole("button", { name: "Reset password", exact: true }).click();
  await expect(page.getByText("Password reset. Sign in with your new password.")).toBeVisible();
  await page.getByLabel("Password", { exact: true }).fill("Second-password-123");
  await page.getByRole("button", { name: "Sign in", exact: true }).click();
  await expect(page.getByRole("heading", { name: "Hi Recovery User" })).toBeVisible();
});
