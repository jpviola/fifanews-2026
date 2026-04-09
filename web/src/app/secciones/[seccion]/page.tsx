import Link from "next/link";
import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { FixtureWidget } from "@/components/FixtureWidget";
import { NewsCard } from "@/components/NewsCard";
import { getAllNews, getNewsBySection } from "@/lib/content";
import { SAMPLE_FIXTURE } from "@/lib/sample-data";
import { getSectionLabel, SECTIONS } from "@/lib/sections";

export function generateMetadata({
  params,
}: {
  params: { seccion: string };
}): Metadata {
  const label = getSectionLabel(params.seccion);
  return {
    title: label,
    description: `Últimas noticias de ${label} del Mundial 2026.`,
  };
}

export default async function SectionPage({
  params,
}: {
  params: { seccion: string };
}) {
  const isKnown =
    params.seccion === "ultima-hora" ||
    SECTIONS.some((s) => s.key === params.seccion && s.href.startsWith("/secciones/"));

  if (!isKnown) notFound();

  const label = getSectionLabel(params.seccion);
  const items = await getNewsBySection(params.seccion);
  const mostRead = (await getAllNews()).slice(0, 5);

  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
      <div className="lg:col-span-2">
        <div className="rounded-2xl border border-zinc-200/70 bg-white/75 p-5 shadow-sm backdrop-blur">
          <div className="flex flex-wrap items-baseline justify-between gap-3">
            <h1 className="text-2xl font-semibold tracking-tight text-zinc-950">
              {label}
            </h1>
            <div className="flex items-center gap-2 text-sm">
              <span className="text-zinc-500">Orden:</span>
              <span className="rounded-full bg-zinc-100 px-3 py-1 text-zinc-700">
                Más reciente
              </span>
            </div>
          </div>
          <p className="mt-2 text-sm leading-6 text-zinc-700">
            Listado editorial con foco en Mundial 2026. Esta vista es el wireframe
            base; luego se conecta a EXA + base de datos.
          </p>
        </div>

        <div className="mt-6 grid grid-cols-1 gap-4">
          {items.map((item) => (
            <NewsCard key={item.id} item={item} />
          ))}
        </div>
      </div>

      <aside className="space-y-6 lg:col-span-1">
        <FixtureWidget title="Próximos partidos" items={SAMPLE_FIXTURE.slice(0, 3)} />
        <div className="rounded-xl border border-zinc-200/70 bg-white/75 p-4 shadow-sm backdrop-blur">
          <div className="flex items-center justify-between gap-3">
            <h2 className="text-sm font-semibold text-zinc-950">Lo más leído</h2>
            <Link href="/" className="text-sm text-zinc-700 hover:underline">
              Portada
            </Link>
          </div>
          <ol className="mt-3 space-y-3">
            {mostRead.map((item, idx) => (
              <li key={item.id} className="flex gap-3">
                <span className="mt-0.5 w-6 shrink-0 text-right text-xs font-semibold text-zinc-400">
                  {idx + 1}
                </span>
                <Link
                  href={`/noticias/${item.slug}`}
                  className="line-clamp-2 text-sm font-medium text-zinc-900 hover:underline"
                >
                  {item.title}
                </Link>
              </li>
            ))}
          </ol>
        </div>
      </aside>
    </div>
  );
}
