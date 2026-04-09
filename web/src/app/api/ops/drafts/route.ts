import { NextResponse } from "next/server";

import type { DraftStatus } from "@/lib/local-store";
import { listDraftRecords } from "@/lib/local-store";
import { requireOpsAuth } from "@/lib/ops-auth";

function asStatus(input: string | null): DraftStatus | undefined {
  if (!input) return undefined;
  if (input === "draft") return "draft";
  if (input === "approved") return "approved";
  if (input === "published") return "published";
  if (input === "rejected") return "rejected";
  return undefined;
}

export async function GET(req: Request) {
  const auth = requireOpsAuth(req);
  if (!auth.ok) return auth.error;

  const url = new URL(req.url);
  const status = asStatus(url.searchParams.get("status"));
  const limitParam = url.searchParams.get("limit");
  const offsetParam = url.searchParams.get("offset");
  const limit = limitParam ? Number(limitParam) : 30;
  const offset = offsetParam ? Number(offsetParam) : 0;

  const records = await listDraftRecords({
    status,
    limit: Number.isFinite(limit) ? limit : 30,
    offset: Number.isFinite(offset) ? offset : 0,
  });

  return NextResponse.json({ count: records.length, records });
}
