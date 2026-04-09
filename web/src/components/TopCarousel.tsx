"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";

type CarouselItem = {
  slug: string;
  title: string;
  excerpt: string;
  sectionLabel: string;
};

function clampIndex(idx: number, len: number) {
  if (len <= 0) return 0;
  return ((idx % len) + len) % len;
}

export function TopCarousel({
  items,
  autoplayMs = 5500,
}: {
  items: CarouselItem[];
  autoplayMs?: number;
}) {
  const safeItems = useMemo(
    () => items.filter((i) => i?.slug && i?.title),
    [items],
  );
  const len = safeItems.length;
  const [index, setIndex] = useState(0);
  const [paused, setPaused] = useState(false);
  const reducedMotionRef = useRef(false);
  const dragStartXRef = useRef<number | null>(null);

  useEffect(() => {
    if (typeof window === "undefined") return;
    reducedMotionRef.current = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    ).matches;
  }, []);

  useEffect(() => {
    if (len <= 1) return;
    if (paused) return;
    if (reducedMotionRef.current) return;

    const t = window.setInterval(() => {
      setIndex((prev) => clampIndex(prev + 1, len));
    }, autoplayMs);

    return () => window.clearInterval(t);
  }, [autoplayMs, len, paused]);

  if (len === 0) return null;

  const safeIndex = clampIndex(index, len);
  const active = safeItems[safeIndex];
  const canSwipe = len > 1;

  return (
    <section
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      onKeyDown={(e) => {
        if (len <= 1) return;
        if (e.key === "ArrowLeft") setIndex((i) => clampIndex(i - 1, len));
        if (e.key === "ArrowRight") setIndex((i) => clampIndex(i + 1, len));
      }}
      onPointerDown={(e) => {
        if (!canSwipe) return;
        dragStartXRef.current = e.clientX;
      }}
      onPointerUp={(e) => {
        if (!canSwipe) return;
        const startX = dragStartXRef.current;
        dragStartXRef.current = null;
        if (startX === null) return;
        const delta = e.clientX - startX;
        if (Math.abs(delta) < 50) return;
        if (delta > 0) setIndex((i) => clampIndex(i - 1, len));
        else setIndex((i) => clampIndex(i + 1, len));
      }}
      onPointerCancel={() => {
        dragStartXRef.current = null;
      }}
      tabIndex={0}
      role="region"
      aria-roledescription="Carrusel"
      aria-label="Top del día"
      className="rounded-3xl border border-zinc-200/70 bg-white/75 shadow-sm backdrop-blur"
    >
      <div className="flex items-center justify-between gap-4 px-5 pt-5">
        <div className="flex items-center gap-3">
          <span className="rounded-full bg-gradient-to-r from-sky-500 via-emerald-500 to-red-500 px-3 py-1 text-xs font-semibold tracking-wide text-white">
            TOP DEL DÍA
          </span>
          <span className="text-xs text-zinc-500">
            {paused ? "Pausado" : "Autoplay"}
          </span>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setIndex((i) => clampIndex(i - 1, len))}
            className="rounded-full border border-zinc-200 bg-white/70 px-3 py-1.5 text-sm text-zinc-800 shadow-sm hover:bg-white"
            aria-label="Anterior"
          >
            ‹
          </button>
          <button
            type="button"
            onClick={() => setIndex((i) => clampIndex(i + 1, len))}
            className="rounded-full border border-zinc-200 bg-white/70 px-3 py-1.5 text-sm text-zinc-800 shadow-sm hover:bg-white"
            aria-label="Siguiente"
          >
            ›
          </button>
        </div>
      </div>

      <div className="px-5 pb-5 pt-4">
        <div className="grid grid-cols-1 gap-5 lg:grid-cols-3">
          <div className="lg:col-span-2">
            <div
              key={active.slug}
              className="fade-up rounded-2xl border border-zinc-200/70 bg-white/70 p-5"
            >
              <div className="flex items-center justify-between gap-3">
                <span className="rounded-full bg-zinc-100/80 px-3 py-1 text-xs font-medium text-zinc-700">
                  {active.sectionLabel}
                </span>
                <Link
                  href={`/noticias/${active.slug}`}
                  className="text-sm text-zinc-700 hover:underline"
                >
                  Leer
                </Link>
              </div>
              <h2 className="mt-3 text-xl font-semibold leading-tight tracking-tight text-zinc-950 sm:text-2xl">
                <Link href={`/noticias/${active.slug}`} className="hover:underline">
                  {active.title}
                </Link>
              </h2>
              <p className="mt-3 line-clamp-3 text-sm leading-7 text-zinc-700">
                {active.excerpt}
              </p>
              <div className="mt-5 flex flex-wrap items-center gap-3">
                <Link
                  href={`/noticias/${active.slug}`}
                  className="rounded-full bg-zinc-900 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-zinc-800"
                >
                  Abrir nota
                </Link>
                <button
                  type="button"
                  onClick={() => setPaused((p) => !p)}
                  className="rounded-full border border-zinc-200 bg-white/70 px-4 py-2 text-sm text-zinc-800 shadow-sm hover:bg-white"
                >
                  {paused ? "Reanudar" : "Pausar"}
                </button>
              </div>
            </div>
          </div>

          <div className="lg:col-span-1">
            <div className="rounded-2xl border border-zinc-200/70 bg-white/70 p-4">
              <div className="text-sm font-semibold text-zinc-950">
                Ranking rápido
              </div>
              <ol className="mt-3 space-y-3">
                {safeItems.slice(0, 5).map((i, idx) => {
                  const activeRow = idx === safeIndex;
                  return (
                    <li key={i.slug} className="flex items-start gap-3">
                      <button
                        type="button"
                        onClick={() => setIndex(idx)}
                        className="flex min-w-0 flex-1 items-start gap-3 text-left"
                      >
                        <span className="mt-0.5 w-6 shrink-0 text-right text-xs font-semibold text-zinc-400">
                          {idx + 1}
                        </span>
                        <span
                          className={[
                            "line-clamp-2 text-sm font-medium",
                            activeRow
                              ? "text-zinc-950 underline decoration-zinc-300 underline-offset-2"
                              : "text-zinc-800 hover:underline",
                          ].join(" ")}
                        >
                          {i.title}
                        </span>
                      </button>
                    </li>
                  );
                })}
              </ol>
              <div className="mt-4 flex items-center justify-center gap-2">
                {safeItems.slice(0, Math.min(7, len)).map((_, i) => (
                  <button
                    key={i}
                    type="button"
                    onClick={() => setIndex(i)}
                    className={[
                      "h-2.5 w-2.5 rounded-full",
                      i === safeIndex ? "bg-zinc-900" : "bg-zinc-300",
                    ].join(" ")}
                    aria-label={`Ir a ${i + 1}`}
                  />
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
