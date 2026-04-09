import { NextResponse } from "next/server";

import { generateArticleDraft } from "@/lib/agent";

type DraftRequestBody = {
  url: string;
  hintTitle?: string;
  hintPublishedDate?: string;
};

export async function POST(req: Request) {
  const body = (await req.json().catch(() => null)) as DraftRequestBody | null;

  if (!body?.url || typeof body.url !== "string") {
    return NextResponse.json({ error: "Missing url" }, { status: 400 });
  }

  try {
    const draft = await generateArticleDraft({
      url: body.url,
      hintTitle: body.hintTitle,
      hintPublishedDate: body.hintPublishedDate,
    });
    return NextResponse.json(draft);
  } catch (e) {
    const message = e instanceof Error ? e.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 502 });
  }
}
