import type { SectionKey } from "@/lib/sections";

export type DraftSection = Exclude<SectionKey, "partidos-y-fixture">;

export type ArticleDraft = {
  headline: string;
  bajada: string;
  bullets_hechos: string[];
  cuerpo: string;
  section: DraftSection;
  tags: string[];
  entities: {
    selecciones?: string[];
    jugadores?: string[];
    estadios?: string[];
    paises?: string[];
  };
  seo: {
    title: string;
    description: string;
    slug: string;
  };
  source: {
    url: string;
    domain?: string;
    publishedDate?: string;
    title?: string;
  };
};

export function tryParseJsonObject(input: string): unknown {
  try {
    return JSON.parse(input);
  } catch {
    return null;
  }
}

function isRecord(v: unknown): v is Record<string, unknown> {
  return typeof v === "object" && v !== null;
}

export function isArticleDraft(v: unknown): v is ArticleDraft {
  if (!isRecord(v)) return false;
  if (typeof v.headline !== "string") return false;
  if (typeof v.bajada !== "string") return false;
  if (!Array.isArray(v.bullets_hechos)) return false;
  if (typeof v.cuerpo !== "string") return false;
  if (typeof v.section !== "string") return false;
  if (!Array.isArray(v.tags)) return false;
  if (!isRecord(v.entities)) return false;
  if (!isRecord(v.seo)) return false;
  if (typeof v.seo.title !== "string") return false;
  if (typeof v.seo.description !== "string") return false;
  if (typeof v.seo.slug !== "string") return false;
  if (!isRecord(v.source)) return false;
  if (typeof v.source.url !== "string") return false;
  return true;
}

export function normalizeSlug(slug: string): string {
  const normalized = slug
    .toLowerCase()
    .normalize("NFKD")
    .replaceAll(/[\u0300-\u036f]/g, "")
    .replaceAll(/[^a-z0-9]+/g, "-")
    .replaceAll(/(^-|-$)/g, "");

  return normalized.slice(0, 80) || "nota";
}

