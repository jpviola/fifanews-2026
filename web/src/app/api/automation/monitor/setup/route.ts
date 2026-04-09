import { NextResponse } from "next/server";

import { createExaMonitor, getExaClient } from "@/lib/exa";

type SetupBody = {
  query?: string;
  count?: number;
  criteria?: Array<{ description: string }>;
  cron?: string;
  timezone?: string;
};

export async function POST(req: Request) {
  const body = (await req.json().catch(() => null)) as SetupBody | null;

  const query = body?.query ?? "mundial 2026 fifa noticias";
  const count = body?.count ?? 25;
  const criteria = body?.criteria ?? [
    { description: "La página es una nota/artículo sobre el Mundial de Fútbol 2026" },
  ];

  const cron = body?.cron ?? "0 9 * * *";
  const timezone = body?.timezone ?? "America/Argentina/Buenos_Aires";

  const exa = getExaClient();
  const webset = await exa.websets.create({
    search: {
      query,
      count,
      criteria,
      entity: { type: "article" },
    },
    enrichments: [],
  });

  const monitor = await createExaMonitor({
    websetId: webset.id,
    cron,
    timezone,
    query,
    count,
    criteria,
  });

  return NextResponse.json({
    websetId: webset.id,
    dashboardUrl: webset.dashboardUrl,
    monitorId: monitor.id,
    monitorStatus: monitor.status,
    nextRunAt: monitor.nextRunAt,
    cron,
    timezone,
    query,
    count,
  });
}

