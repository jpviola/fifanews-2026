import Link from "next/link";

import { BreakingBanner } from "@/components/BreakingBanner";
import { FixtureWidget } from "@/components/FixtureWidget";
import { HotTicker } from "@/components/HotTicker";
import { NewsCard, NewsCardHorizontal } from "@/components/NewsCard";
import { getAllNews } from "@/lib/content";
import { SAMPLE_FIXTURE } from "@/lib/sample-data";
import { getSectionLabel, SECTIONS } from "@/lib/sections";

function proxyUrl(src: string) {
  return `/api/img?url=${encodeURIComponent(src)}`;
}

function formatDate(iso: string) {
  try {
    const d = new Date(iso);
    if (isNaN(d.getTime())) return "";
    return new Intl.DateTimeFormat("es-AR", { day: "2-digit", month: "long", year: "numeric" }).format(d);
  } catch { return ""; }
}

export default async function Home() {
  const sorted = await getAllNews();
  const hero = sorted[0];
  const rest = sorted.slice(1);

  const hotItems = sorted
    .filter((n) => n.section === "ultima-hora")
    .slice(0, 10)
    .map((n) => ({ slug: n.slug, title: n.title }));
  const breaking = hotItems[0] ?? null;

  const bySection = (section: string, limit: number) =>
    sorted.filter((n) => n.section === section).slice(0, limit);

  const contentSections = SECTIONS.filter(
    (s) => s.key !== "partidos-y-fixture" && s.key !== "ultima-hora"
  );

  if (!hero) {
    return (
      <div className="space-y-6">
        <BreakingBanner item={breaking} />
        <div className="rounded-2xl border bg-white p-12 text-center shadow-sm">
          <p className="text-xl font-semibold text-zinc-400">Preparando las noticias del Mundial 2026...</p>
          <p className="mt-2 text-sm text-zinc-400">El cron se ejecuta diariamente. Volvé pronto.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <BreakingBanner item={breaking} />
      <HotTicker items={hotItems} label="ULTIMA" />

      {/* === HERO === */}
      <section>
        <Link
          href={`/noticias/${hero.slug}`}
          className="group relative block w-full overflow-hidden rounded-2xl bg-zinc-900 shadow-lg"
          style={{ minHeight: "420px" }}
        >
          {hero.imageUrl && (
            <img
              src={proxyUrl(hero.imageUrl)}
              alt={hero.title}
              className="absolute inset-0 h-full w-full object-cover opacity-60 transition-transform duration-700 group-hover:scale-105"
            />
          )}
          {!hero.imageUrl && (
            <div className="absolute inset-0 bg-gradient-to-br from-[#1a237e] to-[#283593]" />
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent" />
          <div className="relative flex h-full min-h-[420px] flex-col justify-end p-6 sm:p-8">
            <span className={`mb-3 inline-block self-start rounded-full px-3 py-1 text-xs font-bold uppercase tracking-wider ${
              hero.section === "ultima-hora" ? "bg-red-500 text-white" : "bg-[#ff6d00] text-white"
            }`}>
              {hero.section === "ultima-hora" ? "Ultima hora" : getSectionLabel(hero.section)}
            </span>
            <h1 className="text-2xl font-extrabold leading-tight text-white drop-shadow sm:text-4xl">
              {hero.title}
            </h1>
            <p className="mt-3 line-clamp-2 text-sm leading-relaxed text-zinc-200 sm:text-base">
              {hero.excerpt}
            </p>
            <div className="mt-4 flex items-center gap-3 text-xs text-zinc-300">
              <span>{hero.sourceLabel}</span>
              <span>·</span>
              <time>{formatDate(hero.publishedAtIso)}</time>
              <span className="ml-auto rounded-full bg-white/20 px-3 py-1 text-white backdrop-blur-sm group-hover:bg-white/30">
                Leer nota →
              </span>
            </div>
          </div>
        </Link>
      </section>

      {/* === MAIN GRID + SIDEBAR === */}
      <section className="grid grid-cols-1 gap-6 lg:grid-cols-3">

        {/* Left: 2-col card grid */}
        <div className="lg:col-span-2 space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-bold text-zinc-900">Ultimas noticias</h2>
            <Link href="/secciones/ultima-hora" className="text-sm text-[#1a237e] hover:underline">Ver todo →</Link>
          </div>
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
            {rest.slice(0, 4).map((item) => (
              <NewsCard key={item.id} item={item} />
            ))}
          </div>
        </div>

        {/* Right sidebar */}
        <aside className="space-y-6 lg:col-span-1">
          <FixtureWidget title="Proximos partidos" items={SAMPLE_FIXTURE.slice(0, 3)} />

          {/* Most read */}
          <div className="rounded-2xl border border-zinc-200/70 bg-white p-4 shadow-sm">
            <h2 className="mb-4 text-sm font-bold uppercase tracking-wider text-zinc-500">Lo mas leido</h2>
            <ol className="space-y-4">
              {sorted.slice(0, 6).map((item, idx) => (
                <li key={item.id} className="flex items-start gap-3">
                  <span className="mt-0.5 text-2xl font-black leading-none text-zinc-100 select-none w-7 shrink-0 text-right">
                    {idx + 1}
                  </span>
                  <Link
                    href={`/noticias/${item.slug}`}
                    className="text-sm font-semibold leading-snug text-zinc-800 hover:text-[#1a237e] transition-colors line-clamp-3"
                  >
                    {item.title}
                  </Link>
                </li>
              ))}
            </ol>
          </div>
        </aside>
      </section>

      {/* === SECTION ROWS === */}
      {contentSections.map((sec) => {
        const items = bySection(sec.key, 4);
        if (items.length === 0) return null;
        return (
          <section key={sec.key} className="space-y-4">
            <div className="flex items-center gap-3">
              <div className="h-6 w-1 rounded-full bg-[#ff6d00]" />
              <h2 className="text-lg font-bold text-zinc-900">{sec.label}</h2>
              <Link href={sec.href} className="ml-auto text-sm text-[#1a237e] hover:underline">
                Ver todo →
              </Link>
            </div>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {items.map((item) => (
                <NewsCard key={item.id} item={item} />
              ))}
            </div>
          </section>
        );
      })}

      {/* === HORIZONTAL LIST (more latest) === */}
      {rest.length > 4 && (
        <section className="space-y-4">
          <div className="flex items-center gap-3">
            <div className="h-6 w-1 rounded-full bg-[#1a237e]" />
            <h2 className="text-lg font-bold text-zinc-900">Mas noticias</h2>
          </div>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {rest.slice(4).map((item) => (
              <NewsCardHorizontal key={item.id} item={item} />
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
