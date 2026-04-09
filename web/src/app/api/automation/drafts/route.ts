import { NextResponse } from "next/server";

import { readDraftStore } from "@/lib/local-store";
import { requireOpsAuth } from "@/lib/ops-auth";

export async function GET(req: Request) {
  const auth = requireOpsAuth(req);
  if (!auth.ok) return auth.error;

  const drafts = await readDraftStore();
  return NextResponse.json({
    count: drafts.length,
    drafts,
  });
}

