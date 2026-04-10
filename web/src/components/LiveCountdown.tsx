"use client";

import { useEffect, useMemo, useState } from "react";

type Item = {
  title: string;
  when: string; // ISO
};

function getNext(items: Item[]) {
  const now = Date.now();
  return items
    .map((i) => ({ ...i, t: Date.parse(i.when) }))
    .filter((i) => Number.isFinite(i.t) && i.t! > now)
    .sort((a, b) => a.t! - b.t!)[0];
}

function fmt(ms: number) {
  const s = Math.max(0, Math.floor(ms / 1000));
  const d = Math.floor(s / 86400);
  const h = Math.floor((s % 86400) / 3600);
  const m = Math.floor((s % 3600) / 60);
  return `${d}d ${h}h ${m}m`;
}

export function LiveCountdown({ items }: { items: Item[] }) {
  const next = useMemo(() => getNext(items), [items]);
  const [now, setNow] = useState<number | null>(() =>
    typeof window !== "undefined" ? Date.now() : null,
  );

  useEffect(() => {
    const t = window.setInterval(() => setNow(Date.now()), 30000);
    return () => window.clearInterval(t);
  }, []);

  if (!next) return null;
  if (now === null) return null;
  const remain = Math.max(0, next.t! - now);

  return (
    <div className="hidden items-center gap-2 rounded-full bg-[#e3f2fd] px-3 py-1 text-xs text-[#1a237e] sm:flex">
      <span>⚽</span>
      <span>
        Quedan <strong>{fmt(remain)}</strong> para {next.title}
      </span>
    </div>
  );
}
