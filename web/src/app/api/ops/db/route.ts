import { NextResponse } from "next/server";

import { requireOpsAuth } from "@/lib/ops-auth";
import { listRunLogs } from "@/lib/local-store";

function getDbTarget() {
  const raw = process.env.DATABASE_URL ?? "";
  if (!raw) return { hasDatabaseUrl: false as const };

  try {
    const u = new URL(raw);
    return {
      hasDatabaseUrl: true as const,
      host: u.hostname,
      port: u.port ? Number(u.port) : undefined,
      database: u.pathname?.replace(/^\//, "") || undefined,
      sslmode: u.searchParams.get("sslmode") ?? undefined,
    };
  } catch {
    return { hasDatabaseUrl: true as const, parseError: true as const };
  }
}

export async function GET(req: Request) {
  const auth = requireOpsAuth(req);
  if (!auth.ok) return auth.error;

  const dbTarget = getDbTarget();
  try {
    await listRunLogs(1);
    return NextResponse.json({ ok: true, dbTarget });
  } catch (e) {
    const message = e instanceof Error ? e.message : "Unknown error";
    return NextResponse.json({ ok: false, error: message, dbTarget }, { status: 500 });
  }
}
