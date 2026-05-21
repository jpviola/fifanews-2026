import { NextResponse } from "next/server";

import { runDailyAutomation } from "@/lib/automation";
import { listRunLogs, withCronLock } from "@/lib/local-store";

// Vercel Hobby: 60s max. Pro: hasta 300s.
export const maxDuration = 60;

export async function GET(req: Request) {
  const expected = (process.env.CRON_SECRET ?? "").trim();
  const auth = (req.headers.get("authorization") ?? "").trim();
  const vercelCron = (req.headers.get("x-vercel-cron") ?? "").trim();

  const hasSecretAuth = expected && auth === `Bearer ${expected}`;
  const hasVercelCronAuth = Boolean(process.env.VERCEL) && Boolean(vercelCron);

  if (!hasSecretAuth && !hasVercelCronAuth) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (hasVercelCronAuth && !hasSecretAuth) {
    try {
      const last = (await listRunLogs(1))[0];
      if (last) {
        const lastMs = Date.parse(last.startedAtIso);
        if (Number.isFinite(lastMs) && Date.now() - lastMs < 20 * 60 * 60 * 1000) {
          return NextResponse.json({
            skipped: true,
            reason: "recent_run",
            lastStartedAtIso: last.startedAtIso,
          });
        }
      }
    } catch {
    }
  }

  const url = new URL(req.url);
  const websetId = hasSecretAuth
    ? url.searchParams.get("websetId") ?? process.env.EXA_WEBSET_ID ?? undefined
    : process.env.EXA_WEBSET_ID ?? undefined;
  const countParam = hasSecretAuth ? url.searchParams.get("count") : null;
  const count = countParam ? Number(countParam) : undefined;

  const automationParams = {
    websetId,
    // Máximo 8 artículos por run para no exceder el timeout de 60s en Vercel Hobby
    count: Number.isFinite(count) && count! > 0 ? count : 8,
    onlyNew: true,
    force: false,
    concurrency: 2,
    autoPublish: true,
  };

  const lockKey = `cron_daily_${websetId ?? "default"}`;

  try {
    const locked = await withCronLock(lockKey, async () => {
      return await runDailyAutomation(automationParams);
    });

    if (!locked.ok) {
      if (locked.reason === "no_db") {
        const result = await runDailyAutomation(automationParams);
        return NextResponse.json(result);
      }
      return NextResponse.json({ skipped: true, reason: locked.reason, websetId });
    }

    return NextResponse.json(locked.result);
  } catch (e) {
    const message = e instanceof Error ? e.message : String(e);
    const stack = e instanceof Error ? e.stack?.split("\n").slice(0, 8) : undefined;
    console.error("[cron/daily] Error:", message, stack);
    return NextResponse.json({ error: message, stack }, { status: 500 });
  }
}
