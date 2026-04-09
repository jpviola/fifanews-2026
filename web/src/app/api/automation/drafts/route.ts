import { NextResponse } from "next/server";

import { readDraftStore } from "@/lib/local-store";

export async function GET() {
  const drafts = await readDraftStore();
  return NextResponse.json({
    count: drafts.length,
    drafts,
  });
}

