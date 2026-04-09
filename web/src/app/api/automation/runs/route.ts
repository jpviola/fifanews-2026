import { NextResponse } from "next/server";

import { listRunLogs } from "@/lib/local-store";

export async function GET(req: Request) {
  const url = new URL(req.url);
  const limitParam = url.searchParams.get("limit");
  const limit = limitParam ? Number(limitParam) : 30;

  const runs = await listRunLogs(Number.isFinite(limit) ? limit : 30);
  return NextResponse.json({ count: runs.length, runs });
}

