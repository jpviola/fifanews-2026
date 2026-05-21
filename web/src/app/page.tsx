import Link from "next/link";

import { BreakingBanner } from "@/components/BreakingBanner";
import { AdSlot } from "@/components/AdSlot";
import { FixtureWidget } from "@/components/FixtureWidget";
import { HotTicker } from "@/components/HotTicker";
import { NewsCard } from "@/components/NewsCard";
import { TopCarousel } from "@/components/TopCarousel";
import { getAllNews } from "@/lib/content";
import { NewsImage } from "@/components/NewsImage";
import { SAMPLE_FIXTURE } from "@/lib/sample-data";
import { getSectionLabel } from "@/lib/sections";

function toProxyImageUrl(url: string) {
  return `/api/img?url=${encodeURIComponent(url)}`;
}

export default async function Home() {
  const adsensePostHeroSlot = process.env.NEXT_PUBLIC_ADSENSE_SLOT_POST_HERO ?? "";
  const adsenseSidebarSlot = process.env.NEXT_PUBLIC_ADSENSE_SLOT_SIDEBAR ?? "";
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
    imageUrl: n.imageUrl ? toProxyImageUrl(n.imageUrl) : undefined,
  }));

  const bySection = (section: string, limit: number) =>
    sorted.filter((n) => n.section === section).slice(0, limit);

  const heroImage = hero?.imageUrl;

if (!hero) {    return (      <div className="flex flex-col gap-8">        <BreakingBanner item={breaking} />        <div className="rounded-2xl border border-zinc-200/70 bg-white/75 p-10 text-center shadow-sm backdrop-blur">          <h1 className="text-2xl font-semibold text-[#1a237e]">Cargando las últimas noticias…</h1>          <p className="mt-3 text-zinc-600">El equipo está preparando el contenido. Volvé en unos minutos.</p>        </div>      </div>    );  }
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
            <h1 className="mt-3 text-2xl font-semibold leading-tight tracking-tight text-[#1a237e] sm:text-3xl">
              <Link href={`/noticias/${hero.slug}`} className="hover:underline">
                {hero.title}
              </Link>
            </h1>
            {adsensePostHeroSlot ? (
              <div className="mt-4 rounded-2xl border border-zinc-200/70 bg-white/70 p-3">
                <AdSlot provider="adsense" slot={adsensePostHeroSlot} />
              </div>
            ) : null}
            <p className="mt-3 text-base leading-7 text-zinc-700">
              {hero.excerpt}
            </p>
            <div className="mt-4 overflow-hidden rounded-2xl border border-zinc-200/70 bg-gradient-to-br from-zinc-50 via-white to-zinc-100">
              {heroImage ? (
                <NewsImage
                  src={heroImage}
                  alt=""
                  containerClassName="h-56 w-full sm:h-64"
                  imgClassName="h-full w-full object-cover"
                />
              ) : (
                <div className="h-56 w-full sm:h-64" />
              )}
            </div>
            <div className="mt-5 flex flex-wrap items-center gap-3 text-sm">
              <Link
                href={`/secciones/${hero.section}`}
                className="rounded-full border border-zinc-200 bg-white/70 px-4 py-2 text-zinc-800 shadow-sm hover:bg-white"
              >
                Más de {getSectionLabel(hero.section)}
              </Link>
              {hero.sourceUrl ? (
                <a
                  href={hero.sourceUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="rounded-full bg-[#ff6d00] px-4 py-2 text-white shadow-sm hover:bg-[#e65f00]"
                >
                  Ver fuente
                </a>
              ) : null}
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
          {adsenseSidebarSlot ? (
            <div className="mt-6 rounded-xl border border-zinc-200/70 bg-white/75 p-4 shadow-sm backdrop-blur">
              <AdSlot provider="adsense" slot={adsenseSidebarSlot} />
            </div>
          ) : null}
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
