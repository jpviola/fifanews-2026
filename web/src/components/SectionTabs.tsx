"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

import { SECTIONS } from "@/lib/sections";

function isActive(pathname: string, href: string) {
  if (href === "/") return pathname === "/";
  return pathname === href || pathname.startsWith(`${href}/`);
}

export function SectionTabs() {
  const pathname = usePathname();

  return (
    <nav aria-label="Secciones" className="flex gap-2 overflow-x-auto">
      {SECTIONS.map((s) => {
        const active = isActive(pathname, s.href);
        return (
          <Link
            key={s.key}
            href={s.href}
            className={[
              "whitespace-nowrap rounded-full px-3 py-1.5 text-sm",
              active
                ? "bg-zinc-900 text-white shadow-sm"
                : "bg-zinc-100/80 text-zinc-700 hover:bg-zinc-200",
            ].join(" ")}
          >
            {s.label}
          </Link>
        );
      })}
    </nav>
  );
}
