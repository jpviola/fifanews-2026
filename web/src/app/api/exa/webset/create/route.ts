import { NextResponse } from "next/server";

import { getExaClient } from "@/lib/exa";

type CreateWebsetBody = {
  query?: string;
  count?: number;
  criteria?: Array<{ description: string }>;
};

export async function POST(req: Request) {
  const body = (await req.json().catch(() => null)) as CreateWebsetBody | null;

  const query = body?.query ?? "mundial 2026 fifa noticias";
  const count = body?.count ?? 25;
  const criteria = body?.criteria ?? [
    { description: "La página es una nota/artículo sobre el Mundial de Fútbol 2026" },
  ];

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

  return NextResponse.json({
    id: webset.id,
    dashboardUrl: webset.dashboardUrl,
    status: webset.status,
  });
}

