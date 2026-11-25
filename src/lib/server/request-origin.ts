import type { NextRequest } from "next/server";

export function hasSameOrigin(request: NextRequest) {
  const origin = request.headers.get("origin");
  if (!origin) return false;
  if (origin === request.nextUrl.origin) return true;
  const host = request.headers.get("host");
  if (!host) return false;
  // Next normalizes loopback hosts when constructing nextUrl.
  return origin === `${request.nextUrl.protocol}//${host}`;
}
