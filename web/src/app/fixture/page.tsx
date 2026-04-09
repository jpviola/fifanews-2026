import type { Metadata } from "next";

import { SAMPLE_FIXTURE } from "@/lib/sample-data";

export const metadata: Metadata = {
  title: "Partidos y fixture",
  description: "Fixture del Mundial 2026 con horarios en Argentina.",
};

function formatKickoff(kickoffIso: string) {
  const date = new Date(kickoffIso);
  return new Intl.DateTimeFormat("es-AR", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
}

export default function FixturePage() {
  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
      <div className="rounded-2xl border border-zinc-200/70 bg-white/75 p-6 shadow-sm backdrop-blur lg:col-span-2">
        <h1 className="text-2xl font-semibold tracking-tight text-zinc-950">
          Partidos y fixture
        </h1>
        <p className="mt-2 text-sm leading-6 text-zinc-700">
          Vista base para navegar por día/fase/selección. Luego se conecta a la
          data oficial y a las noticias relacionadas.
        </p>

        <div className="mt-5 flex flex-wrap gap-2">
          {["Hoy", "Semana", "Fase de grupos", "Eliminatorias"].map((label) => (
            <button
              key={label}
              type="button"
              className="rounded-full border border-zinc-200 bg-white/70 px-4 py-2 text-sm text-zinc-800 shadow-sm hover:bg-white"
            >
              {label}
            </button>
          ))}
        </div>

        <div className="mt-6 divide-y divide-zinc-100">
          {SAMPLE_FIXTURE.map((m) => (
            <div key={m.id} className="py-5">
              <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                <div className="min-w-0">
                  <div className="text-base font-semibold text-zinc-950">
                    {m.home} vs {m.away}
                  </div>
                  <div className="mt-1 text-sm text-zinc-700">
                    {m.stageLabel} · {m.city} · {m.stadium}
                  </div>
                </div>
                <div className="shrink-0 text-sm text-zinc-600">
                  {formatKickoff(m.kickoffIso)}
                </div>
              </div>
              <div className="mt-4 rounded-xl border border-zinc-200 bg-zinc-50/70 p-4">
                <div className="text-sm font-semibold text-zinc-950">
                  Noticias relacionadas
                </div>
                <div className="mt-1 text-sm leading-6 text-zinc-700">
                  Este bloque lista notas del partido (previa, venta de entradas,
                  sede/estadio, planteles) y sirve para push notifications.
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      <aside className="space-y-6 lg:col-span-1">
        <div className="rounded-xl border border-zinc-200/70 bg-white/75 p-4 shadow-sm backdrop-blur">
          <div className="text-sm font-semibold text-zinc-950">Filtros</div>
          <div className="mt-2 space-y-3">
            <div className="rounded-lg border border-zinc-200 bg-white/70 p-3">
              <div className="text-xs font-semibold text-zinc-500">Selección</div>
              <div className="mt-1 text-sm text-zinc-800">Todas</div>
            </div>
            <div className="rounded-lg border border-zinc-200 bg-white/70 p-3">
              <div className="text-xs font-semibold text-zinc-500">Sede</div>
              <div className="mt-1 text-sm text-zinc-800">Todas</div>
            </div>
            <div className="rounded-lg border border-zinc-200 bg-white/70 p-3">
              <div className="text-xs font-semibold text-zinc-500">Fase</div>
              <div className="mt-1 text-sm text-zinc-800">Todas</div>
            </div>
          </div>
        </div>

        <div className="rounded-xl border border-zinc-200/70 bg-white/75 p-4 shadow-sm backdrop-blur">
          <div className="text-sm font-semibold text-zinc-950">
            Publicidad (slot)
          </div>
          <div className="mt-3 h-56 rounded-lg border border-dashed border-zinc-300 bg-zinc-50" />
        </div>
      </aside>
    </div>
  );
}
