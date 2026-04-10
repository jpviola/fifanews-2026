import { NextResponse } from "next/server";

import { requireOpsAuth } from "@/lib/ops-auth";
import { listRunLogs } from "@/lib/local-store";

function isValidPostgresConnectionString(raw: string): boolean {
  const trimmed = raw.trim();
  if (!trimmed) return false;
  if (!/^postgres(ql)?:\/\//i.test(trimmed)) return false;
  try {
    const u = new URL(trimmed);
    return Boolean(u.hostname);
  } catch {
    return false;
  }
}

function getSupabaseProjectRefFromEnv(): string {
  const raw = (process.env.SUPABASE_URL ?? process.env.NEXT_PUBLIC_SUPABASE_URL ?? "").trim();
  if (!raw) return "";
  try {
    const u = new URL(raw);
    const host = u.hostname;
    if (!host.endsWith(".supabase.co")) return "";
    const first = host.split(".")[0] ?? "";
    if (!first || first === "db") return "";
    return first;
  } catch {
    return "";
  }
}

function getDbTarget() {
  const candidates: Array<{ key: string; value: string }> = [
    { key: "DATABASE_URL", value: process.env.DATABASE_URL ?? "" },
    { key: "POSTGRES_URL", value: process.env.POSTGRES_URL ?? "" },
    { key: "POSTGRES_PRISMA_URL", value: process.env.POSTGRES_PRISMA_URL ?? "" },
    { key: "POSTGRES_URL_NON_POOLING", value: process.env.POSTGRES_URL_NON_POOLING ?? "" },
  ];
  const parts = {
    hasPostgresHost: Boolean((process.env.POSTGRES_HOST ?? "").trim()),
    hasPostgresUser: Boolean((process.env.POSTGRES_USER ?? "").trim()),
    hasPostgresPassword: Boolean((process.env.POSTGRES_PASSWORD ?? "").trim()),
    hasPostgresDatabase: Boolean((process.env.POSTGRES_DATABASE ?? "").trim()),
    hasPostgresPort: Boolean((process.env.POSTGRES_PORT ?? "").trim()),
  };

  let source = "";
  let raw = "";
  for (const c of candidates) {
    const v = c.value.trim();
    if (isValidPostgresConnectionString(v)) {
      source = c.key;
      raw = v;
      break;
    }
  }

  if (!raw) {
    for (const c of candidates) {
      const v = c.value.trim();
      if (v) {
        source = c.key;
        raw = v;
        break;
      }
    }
  }

  if (!raw) return { hasDatabaseUrl: false as const };

  try {
    const u = new URL(raw);
    const urlUser = (u.username || "").trim();
    const envUser = (process.env.POSTGRES_USER ?? "").trim();
    const projectRef = getSupabaseProjectRefFromEnv();
    const effectiveUserRaw = envUser || urlUser;
    const effectiveUser =
      u.hostname.includes(".pooler.supabase.com") && projectRef && effectiveUserRaw && !effectiveUserRaw.includes(".")
        ? `${effectiveUserRaw}.${projectRef}`
        : effectiveUserRaw;

    const userParts = effectiveUser ? effectiveUser.split(".") : [];
    return {
      hasDatabaseUrl: true as const,
      source,
      host: u.hostname,
      port: u.port ? Number(u.port) : undefined,
      database: u.pathname?.replace(/^\//, "") || undefined,
      sslmode: u.searchParams.get("sslmode") ?? undefined,
      parts,
      userFormat: effectiveUser ? (effectiveUser.includes(".") ? "tenant" : "plain") : "missing",
      projectRef,
      effectiveUser,
      userPartsCount: userParts.length,
    };
  } catch {
    return { hasDatabaseUrl: true as const, source, parseError: true as const, parts };
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
