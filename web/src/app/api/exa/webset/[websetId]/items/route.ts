import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";

import { getExaClient } from "@/lib/exa";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ websetId: string }> },
) {
  const { websetId } = await params;
  const url = new URL(_req.url);

  const limitParam = url.searchParams.get("limit");
  const cursor = url.searchParams.get("cursor") ?? undefined;
  const wait = url.searchParams.get("wait") === "1";
  const timeout = Number(url.searchParams.get("timeout") ?? "60000");
  const pollInterval = Number(url.searchParams.get("pollInterval") ?? "2000");

  const limit = limitParam ? Number(limitParam) : 25;

  const exa = getExaClient();

  if (wait) {
    await exa.websets.waitUntilIdle(websetId, {
      timeout: Number.isFinite(timeout) ? timeout : 60000,
      pollInterval: Number.isFinite(pollInterval) ? pollInterval : 2000,
    });
  }

  const items = await exa.websets.items.list(websetId, {
    limit,
    cursor,
  });

  return NextResponse.json(items);
}
