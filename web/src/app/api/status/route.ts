import { NextResponse } from "next/server";

import { listRunLogs } from "@/lib/local-store";

// Endpoint público (sin auth) para diagnosticar el estado del sistema
export async function GET() {
  const hasDb = Boolean(
    process.env.DATABASE_URL ||
    process.env.POSTGRES_URL ||
    process.env.POSTGRES_PRISMA_URL,
  );
  const hasOpenRouter = Boolean(process.env.OPENROUTER_API_KEY);
  const hasExa = Boolean(process.env.EXA_API_KEY);
  const hasCronSecret = Boolean(process.env.CRON_SECRET);

  let lastRun: { startedAt: string; draftsGenerated: number; storedCount: number; errors: number } | null = null;
  let dbError: string | null = null;

  if (hasDb) {
    try {
      const logs = await listRunLogs(1);
      const last = logs[0];
      if (last) {
        lastRun = {
          startedAt: last.startedAtIso,
          draftsGenerated: last.draftsGenerated,
          storedCount: last.storedCount,
          errors: last.errorsCount,
        };
      }
    } catch (e) {
      dbError = e instanceof Error ? e.message : "DB error";
    }
  }

  const ready = hasDb && hasOpenRouter && (hasExa || true /* RSS always available */);

  return NextResponse.json({
    ready,
    config: {
      hasDb,
      hasOpenRouter,
      hasExa,
      hasCronSecret,
      rssAlwaysAvailable: true,
    },
    lastCronRun: lastRun,
    dbError,
    cronSchedule: "0 12 * * * (12:00 UTC diario)",
    tip: !hasDb
      ? "Configurá DATABASE_URL en Vercel (Vercel Postgres o Supabase)"
      : !hasOpenRouter
        ? "Configurá OPENROUTER_API_KEY en Vercel"
        : lastRun === null
          ? "El cron no ha corrido todavía. Disparalo manualmente: POST /api/automation/daily/run con OPS_TOKEN"
          : "Sistema operativo",
  });
}
