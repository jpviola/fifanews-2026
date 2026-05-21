import { NextResponse } from "next/server";

import { requireOpsAuth } from "@/lib/ops-auth";
import { listDraftRecords, updateDraftStatus } from "@/lib/local-store";

// Publica todos los drafts pendientes de una sola vez
export async function POST(req: Request) {
  const auth = requireOpsAuth(req);
  if (!auth.ok) return auth.error;

  try {
    const drafts = await listDraftRecords({ status: "draft", limit: 200 });
    let published = 0;
    for (const d of drafts) {
      const res = await updateDraftStatus({ sourceUrl: d.sourceUrl, status: "published" });
      if (res.ok) published++;
    }
    return NextResponse.json({ ok: true, published, total: drafts.length });
  } catch (e) {
    const message = e instanceof Error ? e.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
