import { NextResponse } from "next/server";

import { requireOpsAuth } from "@/lib/ops-auth";
import { listRunLogs } from "@/lib/local-store";

export async function GET(req: Request) {
  const auth = requireOpsAuth(req);
  if (!auth.ok) return auth.error;

  try {
    await listRunLogs(1);
    return NextResponse.json({ ok: true });
  } catch (e) {
    const message = e instanceof Error ? e.message : "Unknown error";
    return NextResponse.json({ ok: false, error: message }, { status: 500 });
  }
}

