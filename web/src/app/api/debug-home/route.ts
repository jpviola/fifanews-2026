import { NextResponse } from "next/server";
import { getAllNews } from "@/lib/content";
import { getSectionLabel } from "@/lib/sections";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const token = new URL(request.url).searchParams.get("token");
  if (!token || token !== (process.env.OPS_TOKEN ?? "")) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const sorted = await getAllNews();
    const hero = sorted[0];
    return NextResponse.json({
      ok: true,
      count: sorted.length,
      hero: hero
        ? {
            id: hero.id,
            title: hero.title,
            slug: hero.slug,
            section: hero.section,
            sectionLabel: getSectionLabel(hero.section),
            publishedAtIso: hero.publishedAtIso,
            imageUrl: hero.imageUrl,
            sourceUrl: hero.sourceUrl,
          }
        : null,
      first3slugs: sorted.slice(0, 3).map((n) => n.slug),
    });
  } catch (e) {
    return NextResponse.json({
      ok: false,
      error: String(e),
      stack: e instanceof Error ? e.stack : undefined,
    });
  }
}
