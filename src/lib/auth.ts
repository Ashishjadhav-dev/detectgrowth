export const DEMO_EMAIL = "demo@detectgrowth.com";
export const DEMO_PASSWORD = "detectgrowth123";
export const DEMO_USER = { name: "Demo User", email: DEMO_EMAIL };
export const AUTH_STORAGE_KEY = "detectgrowth-demo-session";

export function isDemoLogin(email: string, password: string) {
  return email.trim().toLowerCase() === DEMO_EMAIL && password === DEMO_PASSWORD;
}

export function saveDemoSession() {
  window.localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify({ ...DEMO_USER, loggedInAt: new Date().toISOString() }));
}

export function hasDemoSession() {
  return window.localStorage.getItem(AUTH_STORAGE_KEY) !== null;
}

export function clearDemoSession() {
  window.localStorage.removeItem(AUTH_STORAGE_KEY);
}
