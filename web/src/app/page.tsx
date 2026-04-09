import Link from "next/link";

import { BreakingBanner } from "@/components/BreakingBanner";
import { FixtureWidget } from "@/components/FixtureWidget";
import { HotTicker } from "@/components/HotTicker";
import { NewsCard } from "@/components/NewsCard";
import { TopCarousel } from "@/components/TopCarousel";
import { getAllNews } from "@/lib/content";
import { SAMPLE_FIXTURE } from "@/lib/sample-data";
import { getSectionLabel } from "@/lib/sections";

export default async function Home() {
  const sorted = await getAllNews();
  const hero = sorted[0];
  const rest = sorted.slice(1);
  const hotItems = sorted
    .filter((n) => n.section === "ultima-hora")
    .slice(0, 8)
    .map((n) => ({ slug: n.slug, title: n.title }));
  const breaking = hotItems[0] ?? null;
  const topItems = sorted.slice(0, 6).map((n) => ({
    slug: n.slug,
    title: n.title,
    excerpt: n.excerpt,
    sectionLabel: getSectionLabel(n.section),
  }));

  const bySection = (section: string, limit: number) =>
    sorted.filter((n) => n.section === section).slice(0, limit);

  return (
    <div className="flex flex-col gap-8">
      <BreakingBanner item={breaking} />
      <HotTicker items={hotItems} label="ÚLTIMA" />
      <TopCarousel items={topItems} autoplayMs={5500} />
      <section className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <article className="rounded-2xl border border-zinc-200/70 bg-white/75 p-5 shadow-sm backdrop-blur">
            <div className="flex items-center justify-between gap-3">
              {hero.section === "ultima-hora" ? (
                <span className="rounded-full bg-red-500 px-3 py-1 text-xs font-semibold text-white">
                  ÚLTIMA
                </span>
              ) : (
                <span className="rounded-full bg-zinc-100 px-3 py-1 text-xs font-medium text-zinc-700">
                  {getSectionLabel(hero.section)}
                </span>
              )}
              <Link
                href={`/noticias/${hero.slug}`}
                className="text-sm text-zinc-700 hover:underline"
              >
                Abrir nota
              </Link>
            </div>
            <h1 className="mt-3 text-2xl font-semibold leading-tight tracking-tight text-zinc-950 sm:text-3xl">
              <Link href={`/noticias/${hero.slug}`} className="hover:underline">
                {hero.title}
              </Link>
            </h1>
            <p className="mt-3 text-base leading-7 text-zinc-700">
              {hero.excerpt}
            </p>
            <div className="mt-5 flex flex-wrap items-center gap-3 text-sm">
              <Link
                href={`/secciones/${hero.section}`}
                className="rounded-full border border-zinc-200 bg-white/70 px-4 py-2 text-zinc-800 shadow-sm hover:bg-white"
              >
                Más de {getSectionLabel(hero.section)}
              </Link>
              <a
                href={hero.sourceUrl}
                target="_blank"
                rel="noreferrer"
                className="rounded-full bg-zinc-900 px-4 py-2 text-white shadow-sm hover:bg-zinc-800"
              >
                Ver fuente
              </a>
            </div>
          </article>
          <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2">
            {rest.slice(0, 4).map((item) => (
              <NewsCard key={item.id} item={item} />
            ))}
          </div>
        </div>
        <div className="lg:col-span-1">
          <FixtureWidget title="Agenda" items={SAMPLE_FIXTURE.slice(0, 3)} />
          <div className="mt-6 rounded-xl border border-zinc-200/70 bg-white/75 p-4 shadow-sm backdrop-blur">
            <div className="flex items-center justify-between gap-3">
              <h2 className="text-sm font-semibold text-zinc-950">Lo más leído</h2>
              <Link
                href="/secciones/ultima-hora"
                className="text-sm text-zinc-700 hover:underline"
              >
                Ver más
              </Link>
            </div>
            <ol className="mt-3 space-y-3">
              {sorted.slice(0, 5).map((item, idx) => (
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
        </div>
      </section>

      <section className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="rounded-2xl border border-zinc-200/70 bg-white/75 p-5 shadow-sm backdrop-blur lg:col-span-2">
          <div className="flex items-center justify-between gap-3">
            <h2 className="text-base font-semibold text-zinc-950">Últimas noticias</h2>
            <Link
              href="/secciones/ultima-hora"
              className="text-sm text-zinc-700 hover:underline"
            >
              Ver todo
            </Link>
          </div>
          <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
            {sorted.slice(0, 6).map((item) => (
              <NewsCard key={item.id} item={item} />
            ))}
          </div>
        </div>

        <div className="rounded-2xl border border-zinc-200/70 bg-white/75 p-5 shadow-sm backdrop-blur">
          <h2 className="text-base font-semibold text-zinc-950">Entradas</h2>
          <p className="mt-2 text-sm leading-6 text-zinc-700">
            Alertas, fechas clave y guías rápidas para comprar de forma segura.
          </p>
          <div className="mt-4 space-y-4">
            {bySection("entradas", 3).map((item) => (
              <div key={item.id}>
                <Link
                  href={`/noticias/${item.slug}`}
                  className="line-clamp-2 text-sm font-medium text-zinc-900 hover:underline"
                >
                  {item.title}
                </Link>
                <p className="mt-1 line-clamp-2 text-xs leading-5 text-zinc-600">
                  {item.excerpt}
                </p>
              </div>
            ))}
          </div>
          <Link
            href="/secciones/entradas"
            className="mt-5 inline-flex rounded-full border border-zinc-200 bg-white px-4 py-2 text-sm text-zinc-800 hover:bg-zinc-50"
          >
            Ver más de Entradas
          </Link>
        </div>
      </section>

      <section className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {[
          { key: "selecciones", limit: 4 },
          { key: "estadios", limit: 4 },
          { key: "jugadores", limit: 4 },
        ].map((block) => (
          <div
            key={block.key}
            className="rounded-2xl border border-zinc-200/70 bg-white/75 p-5 shadow-sm backdrop-blur"
          >
            <div className="flex items-center justify-between gap-3">
              <h2 className="text-base font-semibold text-zinc-950">
                {getSectionLabel(block.key)}
              </h2>
              <Link
                href={`/secciones/${block.key}`}
                className="text-sm text-zinc-700 hover:underline"
              >
                Ver más
              </Link>
            </div>
            <div className="mt-4 space-y-4">
              {bySection(block.key, block.limit).map((item) => (
                <div key={item.id}>
                  <Link
                    href={`/noticias/${item.slug}`}
                    className="line-clamp-2 text-sm font-medium text-zinc-900 hover:underline"
                  >
                    {item.title}
                  </Link>
                  <p className="mt-1 line-clamp-2 text-xs leading-5 text-zinc-600">
                    {item.excerpt}
                  </p>
                </div>
              ))}
            </div>
          </div>
        ))}
      </section>
    </div>
  );
}
