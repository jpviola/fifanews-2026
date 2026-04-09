import Link from "next/link";

import type { FixtureItem } from "@/lib/sample-data";

function formatKickoff(kickoffIso: string) {
  const date = new Date(kickoffIso);
  return new Intl.DateTimeFormat("es-AR", {
    weekday: "short",
    month: "short",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
}

export function FixtureWidget({
  title,
  items,
}: {
  title: string;
  items: FixtureItem[];
}) {
  return (
    <section className="rounded-xl border border-zinc-200/70 bg-white/75 p-4 shadow-sm backdrop-blur">
      <div className="flex items-center justify-between gap-4">
        <h2 className="text-sm font-semibold text-zinc-950">{title}</h2>
        <Link href="/fixture" className="text-sm text-zinc-700 hover:underline">
          Ver todo
        </Link>
      </div>
      <ul className="mt-3 divide-y divide-zinc-100">
        {items.map((m) => (
          <li key={m.id} className="py-3">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <div className="truncate text-sm font-medium text-zinc-950">
                  {m.home} vs {m.away}
                </div>
                <div className="mt-1 truncate text-xs text-zinc-600">
                  {m.stageLabel} · {m.city} · {m.stadium}
                </div>
              </div>
              <time className="shrink-0 text-xs text-zinc-500">
                {formatKickoff(m.kickoffIso)}
              </time>
            </div>
          </li>
        ))}
      </ul>
    </section>
  );
}
