import { NextResponse } from "next/server";

import { listRunLogs } from "@/lib/local-store";

export async function GET() {
  const hasDb = Boolean(
    process.env.DATABASE_URL ||
    process.env.POSTGRES_URL ||
    process.env.POSTGRES_PRISMA_URL,
  );
  const hasOpenRouter = Boolean((process.env.OPENROUTER_API_KEY ?? "").trim());
  const hasGroq = Boolean((process.env.GROQ_API_KEY ?? "").trim());
  const hasExa = Boolean(process.env.EXA_API_KEY);
  const hasCronSecret = Boolean(process.env.CRON_SECRET);

  // Mostrar qué provider y modelo va a usar realmente el código
  let activeLLM: { provider: string; model: string; baseUrl: string } | null = null;
  try {
    const groqKey = (process.env.GROQ_API_KEY ?? "").trim();
    if (groqKey) {
      activeLLM = {
        provider: "groq",
        model: process.env.OPENROUTER_MODEL ?? "llama-3.3-70b-versatile",
        baseUrl: "https://api.groq.com/openai/v1",
      };
    } else if ((process.env.OPENROUTER_API_KEY ?? "").trim()) {
      activeLLM = {
        provider: "openrouter",
        model: process.env.OPENROUTER_MODEL ?? "deepseek/deepseek-chat-v3-0324:free",
        baseUrl: "https://openrouter.ai/api/v1",
      };
    }
  } catch {
    activeLLM = null;
  }

  let lastRun: {
    startedAt: string;
    draftsGenerated: number;
    storedCount: number;
    errors: number;
  } | null = null;
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

  const ready = hasDb && (hasGroq || hasOpenRouter);

  return NextResponse.json({
    ready,
    activeLLM,
    config: {
      hasDb,
      hasGroq,
      hasOpenRouter,
      hasExa,
      hasCronSecret,
      rssAlwaysAvailable: true,
    },
    lastCronRun: lastRun,
    dbError,
    cronSchedule: "0 12 * * * (12:00 UTC diario)",
  });
}
