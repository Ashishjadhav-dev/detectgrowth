import { NextResponse } from "next/server";
import type { WebsiteAudit } from "@/types/leads";

export async function GET(request: Request) {
  const value = new URL(request.url).searchParams.get("url")?.trim() ?? "";
  let target: URL;
  try { target = new URL(value); if (!["http:", "https:"].includes(target.protocol)) throw new Error("unsupported"); } catch { return NextResponse.json({ error: "A valid public website URL is required." }, { status: 400 }); }
  try {
    const response = await fetch(target, { headers: { "User-Agent": "DetectGrowth Website Audit/1.0" }, redirect: "follow", signal: AbortSignal.timeout(10_000) });
    const html = await response.text();
    const title = html.match(/<title[^>]*>([\s\S]*?)<\/title>/i)?.[1]?.replace(/\s+/g, " ").trim() ?? "";
    const mobileReady = /<meta[^>]+name=["']viewport["']/i.test(html);
    const changeSignals = [
      !mobileReady ? "No mobile viewport declaration detected" : "Mobile viewport detected",
      /<meta[^>]+(?:property|name)=["'](?:og:title|description)["']/i.test(html) ? "Social/SEO metadata detected" : "SEO description metadata is missing",
      response.headers.get("last-modified") ? `Last modified: ${response.headers.get("last-modified")}` : "No public Last-Modified header",
    ];
    const audit: WebsiteAudit = { checkedAt: new Date().toISOString(), status: response.status, hasWebsite: true, title, mobileReady, secure: target.protocol === "https:", lastModified: response.headers.get("last-modified"), changeSignals };
    return NextResponse.json(audit, { headers: { "Cache-Control": "private, max-age=300" } });
  } catch { return NextResponse.json({ error: "The website could not be audited." }, { status: 502 }); }
}
