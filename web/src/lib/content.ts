import { createHash } from "crypto";
import { unstable_noStore as noStore } from "next/cache";

import type { NewsItem } from "@/lib/sample-data";
import {
  getNewsBySection as getSampleNewsBySection,
  getNewsBySlug as getSampleNewsBySlug,
  SAMPLE_NEWS,
} from "@/lib/sample-data";
import type { DraftSection, ArticleDraft } from "@/lib/draft";
import { readPublishedDrafts } from "@/lib/local-store";

function idFromUrl(url: string) {
  return createHash("sha1").update(url).digest("hex").slice(0, 12);
}

function draftToNewsItem(d: ArticleDraft): NewsItem | null {
  try {
    if (!d || !d.source?.url || !d.seo?.slug || !d.headline) return null;
    const domain = d.source.domain ?? "Fuente";
    const publishedAtIso = d.source.publishedDate ?? new Date().toISOString();
    return {
      id: `draft_${idFromUrl(d.source.url)}`,
      title: d.headline,
      excerpt: d.bajada ?? "",
      publishedAtIso,
      section: d.section as DraftSection,
      sourceLabel: domain,
      sourceUrl: d.source.url,
      slug: d.seo.slug,
      imageUrl: d.image?.url,
    };
  } catch {
    return null;
  }
}

// Lee los artículos publicados una vez y los cachea en la misma request
async function fetchPublished(): Promise<ArticleDraft[]> {
  return await readPublishedDrafts().catch(() => []);
}

export async function getAllNews(): Promise<NewsItem[]> {
  noStore();
  const published = await fetchPublished();
  const fromDrafts = published.map(draftToNewsItem).filter((x): x is NewsItem => x !== null);

  // Mostrar sample data solo si no hay ningún artículo real publicado todavía
  const fallback = fromDrafts.length === 0 ? SAMPLE_NEWS : [];

  const bySlug = new Map<string, NewsItem>();
  for (const n of [...fromDrafts, ...fallback]) bySlug.set(n.slug, n);

  return [...bySlug.values()].sort((a, b) =>
    b.publishedAtIso.localeCompare(a.publishedAtIso),
  );
}

export async function getNewsBySlug(slug: string): Promise<NewsItem | undefined> {
  noStore();
  const published = await fetchPublished();
  const match = published.find((d) => d.seo.slug === slug);
  if (match) return draftToNewsItem(match) ?? undefined;

  // Fallback a sample solo si no hay artículos reales
  if (published.length === 0) return getSampleNewsBySlug(slug);
  return undefined;
}

export async function getDraftBySlug(
  slug: string,
): Promise<ArticleDraft | undefined> {
  noStore();
  const published = await fetchPublished();
  return published.find((d) => d.seo.slug === slug);
}

export async function getNewsBySection(section: string): Promise<NewsItem[]> {
  noStore();
  const published = await fetchPublished();
  const fromDrafts = published
    .filter((d) => d.section === section)
    .map(draftToNewsItem)
    .filter((x): x is NewsItem => x !== null);

  // Mostrar sample de esta sección solo si no hay artículos reales en absoluto
  const fallback = published.length === 0 ? getSampleNewsBySection(section) : [];

  const bySlug = new Map<string, NewsItem>();
  for (const n of [...fromDrafts, ...fallback]) bySlug.set(n.slug, n);

  return [...bySlug.values()].sort((a, b) =>
    b.publishedAtIso.localeCompare(a.publishedAtIso),
  );
}
