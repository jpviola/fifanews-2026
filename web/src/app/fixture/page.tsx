import type { Metadata } from "next";
import Image from "next/image";

import { SAMPLE_FIXTURE } from "@/lib/sample-data";

export const metadata: Metadata = {
  title: "Fixture Mundial 2026",
  description: "Fixture completo del Mundial 2026: fase de grupos, horarios Argentina, estadios.",
};

function formatKickoff(kickoffIso: string) {
  try {
    const date = new Date(kickoffIso);
    if (isNaN(date.getTime())) return "";
    return new Intl.DateTimeFormat("es-AR", {
      weekday: "long",
      month: "long",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
    }).format(date);
  } catch { return ""; }
}

export default function FixturePage() {
  return (
    <div className="space-y-8">
      <div className="rounded-2xl border border-zinc-200/70 bg-white p-6 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="h-6 w-1 rounded-full bg-[#ff6d00]" />
          <h1 className="text-2xl font-bold tracking-tight text-zinc-950">Fixture Mundial 2026</h1>
        </div>
        <p className="mt-1 text-sm text-zinc-500">
          Fase de grupos · 11 jun - 25 jun 2026 · Estados Unidos, Canada y Mexico
        </p>
      </div>

      {/* Full fixture infographic */}
      <div className="overflow-hidden rounded-2xl border border-zinc-200/70 bg-white shadow-sm">
        <Image
          src="/fixture-grupos-2026.jpg"
          alt="Fixture fase de grupos Mundial 2026"
          width={1200}
          height={2400}
          className="w-full h-auto"
          priority
        />
      </div>

      {/* Upcoming matches list */}
      <div className="rounded-2xl border border-zinc-200/70 bg-white p-6 shadow-sm">
        <h2 className="mb-5 text-lg font-bold text-zinc-900">Proximos partidos (muestra)</h2>
        <div className="space-y-3">
          {SAMPLE_FIXTURE.slice(0, 8).map((m) => (
            <div
              key={m.id}
              className="flex flex-col gap-1 rounded-xl border border-zinc-100 bg-zinc-50 p-4 sm:flex-row sm:items-center sm:justify-between"
            >
              <div>
                <div className="font-semibold text-zinc-900">
                  {m.home} <span className="text-zinc-400">vs</span> {m.away}
                </div>
                <div className="mt-0.5 text-xs text-zinc-500">
                  {m.stageLabel} · {m.stadium} · {m.city}
                </div>
              </div>
              <time className="shrink-0 rounded-full bg-[#1a237e]/5 px-3 py-1 text-xs font-medium text-[#1a237e]">
                {formatKickoff(m.kickoffIso)}
              </time>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
