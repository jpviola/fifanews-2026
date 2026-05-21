import { NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const token = new URL(request.url).searchParams.get("token");
  if (!token || token !== (process.env.OPS_TOKEN ?? "")) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { Pool } = await import("pg");
    const url = (process.env.DATABASE_URL ?? process.env.POSTGRES_URL ?? "").trim();
    if (!url) return NextResponse.json({ error: "No DB URL" });

    const pool = new Pool({ connectionString: url, ssl: { rejectUnauthorized: false }, max: 1 });
    const res = await pool.query(
      `SELECT source_url, status, slug,
        draft->>'headline' as headline,
        draft->>'section' as section,
        draft->'seo'->>'slug' as seo_slug,
        draft->'source'->>'url' as source_url_draft,
        draft->'image'->>'url' as image_url,
        updated_at
       FROM article_drafts ORDER BY updated_at DESC LIMIT 20`
    );
    await pool.end();
    return NextResponse.json({ count: res.rowCount, rows: res.rows });
  } catch (e) {
    return NextResponse.json({ error: String(e), stack: e instanceof Error ? e.stack : undefined });
  }
}
