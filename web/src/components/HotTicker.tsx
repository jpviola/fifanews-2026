"use client";

import Link from "next/link";

type HotItem = {
  slug: string;
  title: string;
};

export function HotTicker({
  items,
  label = "HOT",
}: {
  items: HotItem[];
  label?: string;
}) {
  const safeItems = items.filter((i) => i?.slug && i?.title);
  if (safeItems.length === 0) return null;

  const doubled = [...safeItems, ...safeItems];

  return (
    <section className="hot-ticker relative overflow-hidden rounded-2xl border border-zinc-200/70 bg-white/70 shadow-sm backdrop-blur">
      <div className="absolute inset-y-0 left-0 w-16 bg-gradient-to-r from-white via-white/80 to-transparent" />
      <div className="absolute inset-y-0 right-0 w-16 bg-gradient-to-l from-white via-white/80 to-transparent" />
      <div className="flex items-center gap-3 px-4 py-3">
        <span className="shrink-0 rounded-full bg-red-500 px-3 py-1 text-xs font-semibold tracking-wide text-white">
          {label}
        </span>
        <div className="relative w-full overflow-hidden">
          <div className="hot-ticker-track flex w-max items-center gap-8 pr-8">
            {doubled.map((item, idx) => (
              <Link
                key={`${item.slug}_${idx}`}
                href={`/noticias/${item.slug}`}
                className="whitespace-nowrap text-sm font-medium text-zinc-900 hover:underline"
              >
                {item.title}
              </Link>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

