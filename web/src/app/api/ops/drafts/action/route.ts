import { NextResponse } from "next/server";

import type { DraftStatus } from "@/lib/local-store";
import { updateDraftStatus } from "@/lib/local-store";
import { requireOpsAuth } from "@/lib/ops-auth";

type Body = {
  sourceUrl: string;
  action: "approve" | "reject" | "publish" | "unpublish" | "draft";
};

function mapActionToStatus(action: Body["action"]): DraftStatus {
  if (action === "approve") return "approved";
  if (action === "reject") return "rejected";
  if (action === "publish") return "published";
  if (action === "unpublish") return "approved";
  return "draft";
}

export async function POST(req: Request) {
  const auth = requireOpsAuth(req);
  if (!auth.ok) return auth.error;

  try {
    const body = (await req.json().catch(() => null)) as Body | null;
    if (!body?.sourceUrl || typeof body.sourceUrl !== "string") {
      return NextResponse.json({ error: "Missing sourceUrl" }, { status: 400 });
    }

    const status = mapActionToStatus(body.action ?? "draft");
    const res = await updateDraftStatus({ sourceUrl: body.sourceUrl, status });
    if (!res.ok) {
      return NextResponse.json(
        { error: "No database configured" },
        { status: 500 },
      );
    }

    return NextResponse.json({ ok: true, status });
  } catch (e) {
    const message = e instanceof Error ? e.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
