import { NextResponse } from "next/server";

import { runDailyAutomation } from "@/lib/automation";
import { requireOpsAuth } from "@/lib/ops-auth";

type RunBody = {
  websetId?: string;
  query?: string;
  count?: number;
  criteria?: Array<{ description: string }>;
  concurrency?: number;
  dryRun?: boolean;
  onlyNew?: boolean;
  force?: boolean;
};

export async function POST(req: Request) {
  const auth = requireOpsAuth(req);
  if (!auth.ok) return auth.error;

  const body = (await req.json().catch(() => null)) as RunBody | null;
  try {
    const result = await runDailyAutomation(body ?? {});
    return NextResponse.json(result);
  } catch (e) {
    const message = e instanceof Error ? e.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
