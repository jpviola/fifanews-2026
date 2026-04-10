import Link from "next/link";

import type { NewsItem } from "@/lib/sample-data";

function formatDateTime(publishedAtIso: string) {
  const date = new Date(publishedAtIso);
  return new Intl.DateTimeFormat("es-AR", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(date);
}

export function NewsCard({ item }: { item: NewsItem }) {
  const isHot = item.section === "ultima-hora";
  return (
    <article className="group rounded-xl border border-zinc-200/70 bg-white/75 p-4 shadow-sm backdrop-blur hover:border-zinc-300">
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0 flex-1">
          <Link
            href={`/noticias/${item.slug}`}
            className="line-clamp-2 text-base font-semibold leading-snug text-zinc-950 hover:underline"
          >
            {item.title}
          </Link>
          <p className="mt-2 line-clamp-2 text-sm leading-6 text-zinc-600">
            {item.excerpt}
          </p>
        </div>
        <div className="hidden shrink-0 sm:block">
          <div className="h-16 w-24 overflow-hidden rounded-lg border border-zinc-200/70 bg-gradient-to-br from-zinc-50 via-white to-zinc-100">
            {item.imageUrl ? (
              <img
                src={item.imageUrl}
                alt=""
                className="h-full w-full object-cover"
                loading="lazy"
              />
            ) : null}
          </div>
        </div>
        <div className="hidden shrink-0 flex-col items-end gap-1 sm:flex">
          {isHot ? (
            <span className="rounded-full bg-red-500 px-2 py-0.5 text-xs font-semibold text-white">
              hot
            </span>
          ) : (
            <span className="rounded-full bg-zinc-100 px-2 py-0.5 text-xs text-zinc-700">
              {item.section.replaceAll("-", " ")}
            </span>
          )}
          <time className="text-xs text-zinc-500">
            {formatDateTime(item.publishedAtIso)}
          </time>
        </div>
      </div>
      <div className="mt-3 flex items-center justify-between gap-3 text-xs text-zinc-500">
        <span className="truncate">
          Fuente:{" "}
          <a
            href={item.sourceUrl}
            target="_blank"
            rel="noreferrer"
            className="text-zinc-700 hover:underline"
          >
            {item.sourceLabel}
          </a>
        </span>
        <time className="sm:hidden">{formatDateTime(item.publishedAtIso)}</time>
      </div>
    </article>
  );
}
