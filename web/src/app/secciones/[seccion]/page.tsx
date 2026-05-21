import Link from "next/link";
import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { FixtureWidget } from "@/components/FixtureWidget";
import { NewsCard } from "@/components/NewsCard";
import { getAllNews, getNewsBySection } from "@/lib/content";
import { SAMPLE_FIXTURE } from "@/lib/sample-data";
import { getSectionLabel, SECTIONS } from "@/lib/sections";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ seccion: string }> | { seccion: string };
}): Promise<Metadata> {
  const { seccion } = await params;
  const label = getSectionLabel(seccion);
  return {
    title: label,
    description: `Ultimas noticias de ${label} del Mundial 2026.`,
  };
}

export default async function SectionPage({
  params,
}: {
  params: Promise<{ seccion: string }> | { seccion: string };
}) {
  const { seccion } = await params;
  const isKnown =
    seccion === "ultima-hora" ||
    SECTIONS.some((s) => s.key === seccion && s.href.startsWith("/secciones/"));

  if (!isKnown) notFound();

  const label = getSectionLabel(seccion);
  const items = await getNewsBySection(seccion);
  const mostRead = (await getAllNews()).slice(0, 5);

  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
      <div className="lg:col-span-2 space-y-6">
        <div className="rounded-2xl border border-zinc-200/70 bg-white p-5 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="h-6 w-1 rounded-full bg-[#ff6d00]" />
            <h1 className="text-2xl font-bold tracking-tight text-zinc-950">{label}</h1>
          </div>
          <p className="mt-2 text-sm leading-6 text-zinc-500">
            Ultimas noticias de {label} para el Mundial 2026.
          </p>
        </div>

        {items.length > 0 ? (
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
            {items.map((item) => (
              <NewsCard key={item.id} item={item} />
            ))}
          </div>
        ) : (
          <div className="rounded-2xl border border-zinc-200/70 bg-white p-10 text-center shadow-sm">
            <p className="text-zinc-500 font-medium">Sin articulos en esta seccion todavia.</p>
            <p className="mt-1 text-sm text-zinc-400">
              El cron de noticias se ejecuta diariamente y pronto habra contenido aqui.
            </p>
          </div>
        )}
      </div>

      <aside className="space-y-6 lg:col-span-1">
        <FixtureWidget title="Proximos partidos" items={SAMPLE_FIXTURE.slice(0, 3)} />
        <div className="rounded-xl border border-zinc-200/70 bg-white p-4 shadow-sm">
          <h2 className="mb-4 text-sm font-bold uppercase tracking-wider text-zinc-500">Lo mas leido</h2>
          <ol className="space-y-3">
            {mostRead.map((item, idx) => (
              <li key={item.id} className="flex gap-3">
                <span className="mt-0.5 w-6 shrink-0 text-right text-xs font-black text-zinc-200">
                  {idx + 1}
                </span>
                <Link
                  href={`/noticias/${item.slug}`}
                  className="line-clamp-2 text-sm font-semibold text-zinc-900 hover:text-[#1a237e] transition-colors"
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
