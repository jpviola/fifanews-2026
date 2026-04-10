import Link from "next/link";
import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";

import { NewsCard } from "@/components/NewsCard";
import { getAllNews, getDraftBySlug, getNewsBySlug } from "@/lib/content";
import { normalizeSlug } from "@/lib/draft";
import { getSectionLabel } from "@/lib/sections";

function formatDateTime(publishedAtIso: string) {
  const date = new Date(publishedAtIso);
  return new Intl.DateTimeFormat("es-AR", {
    dateStyle: "full",
    timeStyle: "short",
  }).format(date);
}

export async function generateMetadata({
  params,
}: {
  params: { slug: string };
}): Promise<Metadata> {
  const normalized = normalizeSlug(params.slug);
  const item = await getNewsBySlug(normalized);
  if (!item) return { title: "Nota" };
  return { title: item.title, description: item.excerpt };
}

export default async function ArticlePage({
  params,
}: {
  params: { slug: string };
}) {
  const normalized = normalizeSlug(params.slug);
  if (normalized !== params.slug) {
    redirect(`/noticias/${normalized}`);
  }

  const draft = await getDraftBySlug(normalized);
  const item = await getNewsBySlug(normalized);
  if (!item) notFound();

  const all = await getAllNews();
  const related = all
    .filter((n) => n.section === item.section && n.id !== item.id)
    .slice(0, 4);

  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
      <article className="rounded-2xl border border-zinc-200/70 bg-white/75 p-6 shadow-sm backdrop-blur lg:col-span-2">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <Link
            href={`/secciones/${item.section}`}
            className="rounded-full bg-zinc-100 px-3 py-1 text-xs font-medium text-zinc-700"
          >
            {getSectionLabel(item.section)}
          </Link>
          <time className="text-xs text-zinc-500">
            {formatDateTime(item.publishedAtIso)}
          </time>
        </div>

        <h1 className="mt-4 text-2xl font-semibold leading-tight tracking-tight text-zinc-950 sm:text-3xl">
          {item.title}
        </h1>

        <p className="mt-3 text-base leading-7 text-zinc-700">{item.excerpt}</p>

        {draft ? (
          <>
            <div className="mt-6 rounded-xl border border-zinc-200/70 bg-white/70 p-4">
              <div className="text-sm font-semibold text-zinc-950">
                Claves de la nota
              </div>
              <ul className="mt-2 list-disc space-y-2 pl-5 text-sm leading-7 text-zinc-700">
                {draft.bullets_hechos.map((b) => (
                  <li key={b}>{b}</li>
                ))}
              </ul>
            </div>
            <div className="mt-6 space-y-4 text-sm leading-7 text-zinc-700">
              {draft.cuerpo
                .split("\n")
                .map((p) => p.trim())
                .filter(Boolean)
                .map((p) => (
                  <p key={p}>{p}</p>
                ))}
            </div>
          </>
        ) : null}

        <div className="mt-6 rounded-xl border border-zinc-200 bg-zinc-50 p-4">
          <div className="text-sm font-semibold text-zinc-950">Módulo contextual</div>
          <div className="mt-1 text-sm leading-6 text-zinc-700">
            Acá va la ficha según el tipo de nota (partido, estadio, selección,
            entradas). Para el wireframe dejamos el bloque fijo.
          </div>
        </div>

        <div className="mt-6 space-y-4 text-sm leading-7 text-zinc-700">
          <p>
            Este contenido se genera a partir de la ingestión diaria (EXA Websets) y
            luego se edita/enriquece con criterios SEO y relevancia. En producción,
            se sugiere publicar extractos y sumar valor editorial propio.
          </p>
          <p>
            Fuente original:{" "}
            <a
              href={item.sourceUrl}
              target="_blank"
              rel="noreferrer"
              className="text-zinc-900 underline decoration-zinc-300 underline-offset-2 hover:decoration-zinc-500"
            >
              {item.sourceLabel}
            </a>
            .
          </p>
        </div>

        <div className="mt-8 flex items-center justify-between gap-3">
          <Link href="/" className="text-sm text-zinc-700 hover:underline">
            Volver a portada
          </Link>
          <a
            href={item.sourceUrl}
            target="_blank"
            rel="noreferrer"
            className="rounded-full bg-zinc-900 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-zinc-800"
          >
            Ver fuente
          </a>
        </div>
      </article>

      <aside className="space-y-6 lg:col-span-1">
        <div className="rounded-xl border border-zinc-200/70 bg-white/75 p-4 shadow-sm backdrop-blur">
          <div className="text-sm font-semibold text-zinc-950">
            Publicidad (slot)
          </div>
          <div className="mt-1 text-sm leading-6 text-zinc-700">
            Espacio reservado para evitar CLS. En web: AdSense. En iOS: AdMob.
          </div>
          <div className="mt-3 h-40 rounded-lg border border-dashed border-zinc-300 bg-zinc-50" />
        </div>

        <div className="rounded-xl border border-zinc-200/70 bg-white/75 p-4 shadow-sm backdrop-blur">
          <div className="flex items-center justify-between gap-3">
            <h2 className="text-sm font-semibold text-zinc-950">Relacionado</h2>
            <Link
              href={`/secciones/${item.section}`}
              className="text-sm text-zinc-700 hover:underline"
            >
              Ver más
            </Link>
          </div>
          <div className="mt-3 grid grid-cols-1 gap-3">
            {related.map((r) => (
              <NewsCard key={r.id} item={r} />
            ))}
          </div>
        </div>
      </aside>
    </div>
  );
}
