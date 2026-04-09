import { NextResponse } from "next/server";

import { listRunLogs } from "@/lib/local-store";
import { requireOpsAuth } from "@/lib/ops-auth";

export async function GET(req: Request) {
  const auth = requireOpsAuth(req);
  if (!auth.ok) return auth.error;

  try {
    const url = new URL(req.url);
    const limitParam = url.searchParams.get("limit");
    const limit = limitParam ? Number(limitParam) : 30;

    const runs = await listRunLogs(Number.isFinite(limit) ? limit : 30);
    return NextResponse.json({ count: runs.length, runs });
  } catch (e) {
    const message = e instanceof Error ? e.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
