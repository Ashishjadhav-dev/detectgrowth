import { NextRequest } from "next/server";
import { leadAccess, leadError, leadJson, takeLeadBudget } from "@/lib/server/lead-access";
import { AuditTargetError, inspectWebsite } from "@/lib/server/website-audit";

export const runtime = "nodejs";
export const maxDuration = 15;

export async function GET(request: NextRequest) {
  const actor = await leadAccess(request);
  if (!actor) return leadError("Sign in to run a website audit.", 401);

  const value = request.nextUrl.searchParams.get("url")?.trim() ?? "";
  let target: URL;
  try {
    if (value.length > 2048) throw new Error();
    target = new URL(value);
  } catch {
    return leadError("Enter a valid public website URL.", 400);
  }

  if (!takeLeadBudget("audit", actor.id)) return leadError("Too many website audits. Try again in a minute.", 429);
  try {
    return leadJson(await inspectWebsite(target));
  } catch (error) {
    return error instanceof AuditTargetError
      ? leadError(error.message, 400)
      : leadError("The website didn’t respond to the audit. Open the source site to check it directly.", 502);
  }
}
