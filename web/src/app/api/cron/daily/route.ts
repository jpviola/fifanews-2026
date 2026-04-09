import { NextResponse } from "next/server";

import { runDailyAutomation } from "@/lib/automation";

export async function GET(req: Request) {
  const expected = process.env.CRON_SECRET ?? "";
  const auth = req.headers.get("authorization") ?? "";
  if (!expected || auth !== `Bearer ${expected}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const url = new URL(req.url);
  const websetId = url.searchParams.get("websetId") ?? undefined;
  const countParam = url.searchParams.get("count");
  const count = countParam ? Number(countParam) : undefined;

  const result = await runDailyAutomation({
    websetId,
    count: Number.isFinite(count) ? count : undefined,
    onlyNew: true,
    force: false,
    concurrency: 3,
  });

  return NextResponse.json(result);
}
