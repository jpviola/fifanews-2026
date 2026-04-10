import { NextResponse } from "next/server";

import type { DraftStatus } from "@/lib/local-store";
import { readDraftBySourceUrl, updateDraftStatus, writeDraftBySourceUrl } from "@/lib/local-store";
import { getOgImageUrlForUrl } from "@/lib/exa";
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

    if (status === "published") {
      const current = await readDraftBySourceUrl(body.sourceUrl);
      if (current.ok && current.draft && !current.draft.image?.url) {
        const imageUrl = await getOgImageUrlForUrl(body.sourceUrl).catch(() => undefined);
        if (imageUrl) {
          const domain =
            current.draft.source.domain ??
            (() => {
              try {
                return new URL(body.sourceUrl).hostname.replace(/^www\./, "");
              } catch {
                return undefined;
              }
            })();

          await writeDraftBySourceUrl({
            sourceUrl: body.sourceUrl,
            draft: {
              ...current.draft,
              image: { url: imageUrl, sourceUrl: body.sourceUrl, sourceLabel: domain },
            },
          });
        }
      }
    }

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
