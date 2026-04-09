"use client";

import Link from "next/link";
import { useSyncExternalStore } from "react";

type BreakingItem = {
  slug: string;
  title: string;
};

const DISMISS_KEY = "breakingBannerDismissed";
const DISMISS_EVENT = "breaking-banner-dismissed";

function subscribe(callback: () => void) {
  if (typeof window === "undefined") return () => {};

  const onStorage = (e: StorageEvent) => {
    if (e.key === DISMISS_KEY) callback();
  };
  const onCustom = () => callback();

  window.addEventListener("storage", onStorage);
  window.addEventListener(DISMISS_EVENT, onCustom);
  return () => {
    window.removeEventListener("storage", onStorage);
    window.removeEventListener(DISMISS_EVENT, onCustom);
  };
}

function getSnapshot() {
  if (typeof window === "undefined") return false;
  return window.localStorage.getItem(DISMISS_KEY) === "1";
}

export function BreakingBanner({ item }: { item: BreakingItem | null }) {
  const hidden = useSyncExternalStore(subscribe, getSnapshot, () => false);

  if (!item || hidden) return null;

  return (
    <section className="rounded-2xl border border-red-200/60 bg-white/75 shadow-sm backdrop-blur">
      <div className="flex items-center justify-between gap-3 px-4 py-3">
        <div className="flex min-w-0 items-center gap-3">
          <span className="flex items-center gap-2 rounded-full bg-red-500 px-3 py-1 text-xs font-semibold tracking-wide text-white">
            <span className="pulse-dot h-2 w-2 rounded-full bg-white" />
            EN VIVO
          </span>
          <Link
            href={`/noticias/${item.slug}`}
            className="min-w-0 truncate text-sm font-medium text-zinc-900 hover:underline"
          >
            {item.title}
          </Link>
        </div>
        <button
          type="button"
          onClick={() => {
            if (typeof window !== "undefined") {
              window.localStorage.setItem(DISMISS_KEY, "1");
              window.dispatchEvent(new Event(DISMISS_EVENT));
            }
          }}
          className="shrink-0 rounded-full border border-zinc-200 bg-white/70 px-3 py-1 text-xs text-zinc-700 shadow-sm hover:bg-white"
          aria-label="Cerrar"
        >
          Cerrar
        </button>
      </div>
    </section>
  );
}
