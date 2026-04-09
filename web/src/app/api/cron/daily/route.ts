import { NextResponse } from "next/server";

import { runDailyAutomation } from "@/lib/automation";
import { withCronLock } from "@/lib/local-store";

export async function GET(req: Request) {
  const expected = process.env.CRON_SECRET ?? "";
  const auth = req.headers.get("authorization") ?? "";
  if (!expected || auth !== `Bearer ${expected}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const url = new URL(req.url);
  const websetId =
    url.searchParams.get("websetId") ??
    process.env.EXA_WEBSET_ID ??
    undefined;
  const countParam = url.searchParams.get("count");
  const count = countParam ? Number(countParam) : undefined;

  const lockKey = `cron_daily_${websetId ?? "default"}`;
  const locked = await withCronLock(lockKey, async () => {
    return await runDailyAutomation({
      websetId,
      count: Number.isFinite(count) ? count : undefined,
      onlyNew: true,
      force: false,
      concurrency: 3,
    });
  });

  if (!locked.ok) {
    return NextResponse.json({
      skipped: true,
      reason: locked.reason,
      websetId,
    });
  }

  return NextResponse.json(locked.result);
}
