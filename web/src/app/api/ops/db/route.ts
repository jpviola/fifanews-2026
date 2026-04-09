import { NextResponse } from "next/server";

import { requireOpsAuth } from "@/lib/ops-auth";
import { listRunLogs } from "@/lib/local-store";

function getDbTarget() {
  const candidates: Array<{ key: string; value: string }> = [
    { key: "DATABASE_URL", value: process.env.DATABASE_URL ?? "" },
    { key: "POSTGRES_URL", value: process.env.POSTGRES_URL ?? "" },
    { key: "POSTGRES_PRISMA_URL", value: process.env.POSTGRES_PRISMA_URL ?? "" },
    { key: "POSTGRES_URL_NON_POOLING", value: process.env.POSTGRES_URL_NON_POOLING ?? "" },
  ];

  let source = "";
  let raw = "";
  for (const c of candidates) {
    const v = c.value.trim();
    if (v) {
      source = c.key;
      raw = v;
      break;
    }
  }

  if (!raw) return { hasDatabaseUrl: false as const };

  try {
    const u = new URL(raw);
    return {
      hasDatabaseUrl: true as const,
      source,
      host: u.hostname,
      port: u.port ? Number(u.port) : undefined,
      database: u.pathname?.replace(/^\//, "") || undefined,
      sslmode: u.searchParams.get("sslmode") ?? undefined,
    };
  } catch {
    return { hasDatabaseUrl: true as const, source, parseError: true as const };
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
