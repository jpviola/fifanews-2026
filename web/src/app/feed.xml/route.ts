import { readPublishedDrafts } from "@/lib/local-store";
import { getSiteUrl } from "@/lib/site";

function escapeXml(input: string) {
  return input
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&apos;");
}

export async function GET() {
  const site = getSiteUrl();
  const drafts = await readPublishedDrafts().catch(() => []);

  const channelTitle = "Mundial 2026 — Noticias";
  const channelLink = site;
  const channelDescription =
    "Noticias del Mundial 2026 generadas diariamente, con atribución a fuentes.";

  const itemsXml = drafts
    .slice(0, 50)
    .map((d) => {
      const link = `${site}/noticias/${d.seo.slug}`;
      const pubDate = d.source.publishedDate
        ? new Date(d.source.publishedDate).toUTCString()
        : new Date().toUTCString();
      const title = escapeXml(d.headline);
      const description = escapeXml(d.bajada);
      const guid = escapeXml(d.source.url);

      return [
        "<item>",
        `<title>${title}</title>`,
        `<link>${escapeXml(link)}</link>`,
        `<guid isPermaLink="false">${guid}</guid>`,
        `<pubDate>${pubDate}</pubDate>`,
        `<description>${description}</description>`,
        "</item>",
      ].join("");
    })
    .join("");

  const rss = [
    '<?xml version="1.0" encoding="UTF-8"?>',
    '<rss version="2.0">',
    "<channel>",
    `<title>${escapeXml(channelTitle)}</title>`,
    `<link>${escapeXml(channelLink)}</link>`,
    `<description>${escapeXml(channelDescription)}</description>`,
    `<lastBuildDate>${new Date().toUTCString()}</lastBuildDate>`,
    itemsXml,
    "</channel>",
    "</rss>",
  ].join("");

  return new Response(rss, {
    headers: {
      "Content-Type": "application/rss+xml; charset=utf-8",
      "Cache-Control": "s-maxage=300, stale-while-revalidate=600",
    },
  });
}

