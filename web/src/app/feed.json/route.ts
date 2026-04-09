import { NextResponse } from "next/server";

import { readPublishedDrafts } from "@/lib/local-store";
import { getSiteUrl } from "@/lib/site";

export async function GET() {
  const site = getSiteUrl();
  const drafts = await readPublishedDrafts().catch(() => []);

  const items = drafts.map((d) => ({
    id: d.source.url,
    url: `${site}/noticias/${d.seo.slug}`,
    title: d.headline,
    excerpt: d.bajada,
    publishedAt: d.source.publishedDate ?? null,
    section: d.section,
    sourceUrl: d.source.url,
    sourceDomain: d.source.domain ?? null,
  }));

  return NextResponse.json({
    version: 1,
    generatedAt: new Date().toISOString(),
    items,
  });
}

