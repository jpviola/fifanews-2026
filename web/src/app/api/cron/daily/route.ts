import { NextResponse } from "next/server";

import { runDailyAutomation } from "@/lib/automation";
import { listRunLogs, withCronLock } from "@/lib/local-store";

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
    count: Number.isFinite(count) ? count : undefined,
    onlyNew: true,
    force: false,
    concurrency: 3,
  };

  const lockKey = `cron_daily_${websetId ?? "default"}`;
  const locked = await withCronLock(lockKey, async () => {
    return await runDailyAutomation(automationParams);
  });

  if (!locked.ok) {
    if (locked.reason === "no_db") {
      // Sin DB configurada: ejecutar sin lock distribuido (el almacenamiento en archivo es seguro en Vercel)
      try {
        const result = await runDailyAutomation(automationParams);
        return NextResponse.json(result);
      } catch (e) {
        const message = e instanceof Error ? e.message : "Unknown error";
        return NextResponse.json({ error: message }, { status: 500 });
      }
    }
    return NextResponse.json({
      skipped: true,
      reason: locked.reason,
      websetId,
    });
  }

  return NextResponse.json(locked.result);
}
