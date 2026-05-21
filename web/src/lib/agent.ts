import { createHash } from "crypto";
import { getExaTextForUrl } from "@/lib/exa";
import { isArticleDraft, normalizeSlug, tryParseJsonObject } from "@/lib/draft";
import { getFirstAssistantContent, getLLMConfig, openRouterChatCompletion } from "@/lib/openrouter";
import { SECTIONS } from "@/lib/sections";

export type DraftInput = {
  url: string;
  hintTitle?: string;
  hintPublishedDate?: string;
  /** Si se especifica, el LLM debe asignar este section key al art�culo */
  targetSection?: string;
};

function getDomain(url: string): string | undefined {
  try {
    return new URL(url).hostname.replace(/^www\./, "");
  } catch {
    return undefined;
  }
}

export async function generateArticleDraft(input: DraftInput) {
  const sourceDomain = getDomain(input.url);
  const contents = await getExaTextForUrl(input.url);

  const sourceTitle = input.hintTitle ?? contents.title;
  const sourcePublishedDate = input.hintPublishedDate ?? contents.publishedDate;

  const sectionsForModel = SECTIONS.filter((s) => s.key !== "partidos-y-fixture")
    .map((s) => `${s.key}: ${s.label}`)
    .join("\n");

  const system = [
    "Sos editor deportivo argentino (es-AR), estilo periódico/canal de noticias.",
    "Objetivo: redactar una nota original sobre el Mundial 2026 a partir de una fuente, sin copiar texto literal.",
    "Reglas:",
    "- No inventes datos. Si un dato no está en la fuente, no lo afirmes.",
    "- No pegues párrafos de la fuente. Reescribí con tus palabras y sumá contexto útil.",
    "- Mantené atribución: siempre incluir la URL de la fuente en el objeto source.",
    "- Priorizá claridad, titulares informativos y SEO sin clickbait.",
    "Salida: SOLO un JSON válido (sin markdown) con la estructura pedida.",
  ].join("\n");

  const user = [
    "Generá un borrador para publicar en un sitio de noticias del Mundial 2026.",
    input.targetSection
      ? `IMPORTANTE: Esta nota DEBE tener section = "${input.targetSection}". Redactá el contenido enfocado en ese ángulo del Mundial 2026 usando la fuente como base.`
      : "Elegí la section más apropiada entre estas opciones (usar el key):",
    sectionsForModel,
    "",
    "Fuente:",
    `- url: ${input.url}`,
    sourceDomain ? `- domain: ${sourceDomain}` : "",
    sourceTitle ? `- title: ${sourceTitle}` : "",
    sourcePublishedDate ? `- publishedDate: ${sourcePublishedDate}` : "",
    "",
    "Texto extraído (puede venir truncado):",
    contents.text ? contents.text.slice(0, 12000) : "",
    "",
    "JSON schema esperado:",
    JSON.stringify(
      {
        headline: "string",
        bajada: "string",
        bullets_hechos: ["string"],
        cuerpo: "string",
        section: "ultima-hora | selecciones | paises-anfitriones | estadios | jugadores | entradas",
        tags: ["string"],
        entities: {
          selecciones: ["string"],
          jugadores: ["string"],
          estadios: ["string"],
          paises: ["string"],
        },
        seo: { title: "string", description: "string", slug: "string" },
        source: {
          url: "string",
          domain: "string",
          publishedDate: "string",
          title: "string",
        },
      },
      null,
      2,
    ),
    "",
    "Requisitos SEO:",
    "- headline <= 85 caracteres",
    "- seo.title <= 60 caracteres",
    "- seo.description 140-160 caracteres",
    "- cuerpo 4 a 7 párrafos cortos",
    "- bullets_hechos: 4 a 6 ítems",
  ]
    .filter(Boolean)
    .join("\n");

  const completion = await openRouterChatCompletion({
    model: process.env.OPENROUTER_MODEL ?? getLLMConfig().defaultModel,
    messages: [
      { role: "system", content: system },
      { role: "user", content: user },
    ],
    temperature: 0.35,
    maxTokens: 2500,
  });

  const content = getFirstAssistantContent(completion);
  const parsed = tryParseJsonObject(content);
  if (!isArticleDraft(parsed)) {
    throw new Error("Invalid draft from model");
  }

  return {
    ...parsed,
    seo: {
      ...parsed.seo,
      // Sufijo del hash de la URL garantiza unicidad aunque el LLM genere el mismo slug
      slug: `${normalizeSlug(parsed.seo.slug)}-${createHash("sha1").update(input.url).digest("hex").slice(0, 6)}`,
    },
    image: contents.imageUrl
      ? {
          url: contents.imageUrl,
          sourceUrl: input.url,
          sourceLabel: sourceDomain,
        }
      : undefined,
    source: {
      ...parsed.source,
      url: input.url,
      domain: parsed.source.domain ?? sourceDomain,
      publishedDate: parsed.source.publishedDate ?? sourcePublishedDate,
      title: parsed.source.title ?? sourceTitle,
    },
  };
}

