import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";

import { getExaClient } from "@/lib/exa";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ websetId: string }> },
) {
  const exa = getExaClient();
  const { websetId } = await params;
  const webset = await exa.websets.get(websetId);
  return NextResponse.json(webset);
}
