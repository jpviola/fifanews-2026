"use client";

import Link from "next/link";
import { useState } from "react";

import type { NewsItem } from "@/lib/sample-data";
import { getSectionLabel } from "@/lib/sections";

function proxyUrl(src: string) {
  return `/api/img?url=${encodeURIComponent(src)}`;
}

function formatDate(iso: string) {
  try {
    const d = new Date(iso);
    if (isNaN(d.getTime())) return "";
    return new Intl.DateTimeFormat("es-AR", { day: "2-digit", month: "short" }).format(d);
  } catch { return ""; }
}

function CardImage({ src, alt }: { src: string; alt: string }) {
  const [failed, setFailed] = useState(false);
  if (failed || !src) {
    return (
      <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-[#1a237e]/10 via-zinc-100 to-zinc-200">
        <span className="text-4xl opacity-20">MX2026</span>
      </div>
    );
  }
  return (
    <img
      src={proxyUrl(src)}
      alt={alt}
      className="absolute inset-0 h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
      loading="lazy"
      onError={() => setFailed(true)}
    />
  );
}

/** Tarjeta grande: imagen arriba, texto abajo */
export function NewsCard({ item }: { item: NewsItem }) {
  const label = getSectionLabel(item.section);
  const date = formatDate(item.publishedAtIso);
  const isHot = item.section === "ultima-hora";

  return (
    <article className="group flex flex-col overflow-hidden rounded-2xl border border-zinc-200/70 bg-white shadow-sm hover:shadow-md transition-shadow">
      <Link href={`/noticias/${item.slug}`} className="relative block aspect-video w-full overflow-hidden bg-zinc-100">
        <CardImage src={item.imageUrl ?? ""} alt={item.title} />
        <span
          className={`absolute left-3 top-3 rounded-full px-2.5 py-0.5 text-[11px] font-semibold tracking-wide ${
            isHot
              ? "bg-red-500 text-white"
              : "bg-white/90 text-zinc-700 backdrop-blur-sm"
          }`}
        >
          {isHot ? "ULTIMA" : label}
        </span>
      </Link>
      <div className="flex flex-1 flex-col p-4">
        <Link href={`/noticias/${item.slug}`}>
          <h3 className="text-base font-bold leading-snug text-zinc-950 hover:text-[#1a237e] transition-colors line-clamp-3">
            {item.title}
          </h3>
        </Link>
        <p className="mt-2 line-clamp-2 text-sm leading-relaxed text-zinc-500">
          {item.excerpt}
        </p>
        <div className="mt-3 flex items-center justify-between text-xs text-zinc-400">
          <span>{item.sourceLabel}</span>
          {date && <time>{date}</time>}
        </div>
      </div>
    </article>
  );
}

/** Tarjeta horizontal: imagen a la izquierda, texto a la derecha */
export function NewsCardHorizontal({ item }: { item: NewsItem }) {
  const label = getSectionLabel(item.section);
  const date = formatDate(item.publishedAtIso);
  const isHot = item.section === "ultima-hora";

  return (
    <article className="group flex gap-3 rounded-xl border border-zinc-200/70 bg-white p-3 shadow-sm hover:shadow-md transition-shadow">
      <Link href={`/noticias/${item.slug}`} className="relative h-20 w-28 shrink-0 overflow-hidden rounded-lg bg-zinc-100">
        <CardImage src={item.imageUrl ?? ""} alt={item.title} />
      </Link>
      <div className="flex min-w-0 flex-col justify-between">
        <div>
          <span className={`inline-block rounded-full px-2 py-0.5 text-[10px] font-semibold ${isHot ? "bg-red-100 text-red-600" : "bg-zinc-100 text-zinc-600"}`}>
            {isHot ? "ULTIMA" : label}
          </span>
          <Link href={`/noticias/${item.slug}`}>
            <h3 className="mt-1 text-sm font-bold leading-snug text-zinc-950 hover:text-[#1a237e] transition-colors line-clamp-3">
              {item.title}
            </h3>
          </Link>
        </div>
        {date && <time className="mt-1 text-[11px] text-zinc-400">{date}</time>}
      </div>
    </article>
  );
}
