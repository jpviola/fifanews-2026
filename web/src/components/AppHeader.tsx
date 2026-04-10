import Link from "next/link";

import { SectionTabs } from "@/components/SectionTabs";
import { LiveCountdown } from "@/components/LiveCountdown";
import { SAMPLE_FIXTURE } from "@/lib/sample-data";

export function AppHeader() {
  return (
    <header className="border-b border-zinc-200/70 bg-white/80 backdrop-blur">
      <div className="mx-auto w-full max-w-6xl px-4 pt-3">
        <div className="h-1 w-full rounded-full bg-gradient-to-r from-sky-500 via-emerald-500 to-red-500" />
      </div>
      <div className="mx-auto flex w-full max-w-6xl items-center justify-between gap-4 px-4 py-3">
        <Link href="/" className="flex items-baseline gap-2">
          <span className="text-lg font-semibold tracking-tight text-[#1a237e] sm:text-xl">
            Mundial 2026
          </span>
          <span className="hidden rounded-full bg-zinc-100 px-3 py-1 text-xs font-medium text-zinc-700 sm:inline">
            canal de noticias
          </span>
        </Link>
        <div className="flex flex-1 items-center justify-end gap-3">
          <div className="hidden w-full max-w-sm sm:block">
            <label className="sr-only" htmlFor="search">
              Buscar
            </label>
            <input
              id="search"
              placeholder="Buscar selecciones, jugadores, estadios…"
              className="w-full rounded-full border border-zinc-200 bg-white/70 px-4 py-2 text-sm text-zinc-900 shadow-sm outline-none ring-offset-2 placeholder:text-zinc-400 focus:ring-2 focus:ring-zinc-900/10"
            />
          </div>
          <LiveCountdown
            items={SAMPLE_FIXTURE.map((f) => ({
              title: `${f.home} vs ${f.away}`,
              when: f.kickoffIso,
            }))}
          />
          <Link
            href="/fixture"
            className="rounded-full bg-[#ff6d00] px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-[#e65f00]"
          >
            Fixture
          </Link>
        </div>
      </div>
      <div className="mx-auto w-full max-w-6xl px-2 pb-2 sm:px-4">
        <SectionTabs />
      </div>
    </header>
  );
}
