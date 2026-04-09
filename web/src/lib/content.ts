import { createHash } from "crypto";
import { unstable_noStore as noStore } from "next/cache";

import type { NewsItem } from "@/lib/sample-data";
import { getNewsBySection as getSampleNewsBySection, getNewsBySlug as getSampleNewsBySlug, SAMPLE_NEWS } from "@/lib/sample-data";
import type { DraftSection, ArticleDraft } from "@/lib/draft";
import { readPublishedDrafts } from "@/lib/local-store";

function idFromUrl(url: string) {
  return createHash("sha1").update(url).digest("hex").slice(0, 12);
}

function draftToNewsItem(d: ArticleDraft): NewsItem {
  const domain = d.source.domain ?? "Fuente";
  const publishedAtIso = d.source.publishedDate ?? new Date().toISOString();

  return {
    id: `draft_${idFromUrl(d.source.url)}`,
    title: d.headline,
    excerpt: d.bajada,
    publishedAtIso,
    section: d.section as DraftSection,
    sourceLabel: domain,
    sourceUrl: d.source.url,
    slug: d.seo.slug,
  };
}

export async function getAllNews(): Promise<NewsItem[]> {
  noStore();
  const published = await readPublishedDrafts().catch(() => []);
  const fromDrafts = published.map(draftToNewsItem);

  const bySlug = new Map<string, NewsItem>();
  for (const n of [...fromDrafts, ...SAMPLE_NEWS]) bySlug.set(n.slug, n);

  return [...bySlug.values()].sort((a, b) =>
    b.publishedAtIso.localeCompare(a.publishedAtIso),
  );
}

export async function getNewsBySlug(slug: string): Promise<NewsItem | undefined> {
  noStore();
  const published = await readPublishedDrafts().catch(() => []);
  const match = published.find((d) => d.seo.slug === slug);
  if (match) return draftToNewsItem(match);
  return getSampleNewsBySlug(slug);
}

export async function getDraftBySlug(
  slug: string,
): Promise<ArticleDraft | undefined> {
  noStore();
  const published = await readPublishedDrafts().catch(() => []);
  return published.find((d) => d.seo.slug === slug);
}

export async function getNewsBySection(section: string): Promise<NewsItem[]> {
  noStore();
  const published = await readPublishedDrafts().catch(() => []);
  const fromDrafts = published
    .filter((d) => d.section === section)
    .map(draftToNewsItem);

  const sample = getSampleNewsBySection(section);
  const bySlug = new Map<string, NewsItem>();
  for (const n of [...fromDrafts, ...sample]) bySlug.set(n.slug, n);

  return [...bySlug.values()].sort((a, b) =>
    b.publishedAtIso.localeCompare(a.publishedAtIso),
  );
}
