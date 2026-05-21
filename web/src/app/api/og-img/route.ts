import { NextResponse } from "next/server";

/**
 * GET /api/og-img?page=<encoded-page-url>
 *
 * Fetches a web page, extracts its og:image / twitter:image,
 * then proxies that image back (same as /api/img).
 * Cached aggressively so subsequent requests are instant.
 */

function extractMetaContent(html: string, attr: "property" | "name", value: string) {
  const esc = value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const re1 = new RegExp(
    `<meta[^>]*\\s${attr}=["']${esc}["'][^>]*\\scontent=["']([^"']+)["'][^>]*>`,
    "i",
  );
  const m1 = re1.exec(html);
  if (m1?.[1]) return m1[1].trim();

  const re2 = new RegExp(
    `<meta[^>]*\\scontent=["']([^"']+)["'][^>]*\\s${attr}=["']${esc}["'][^>]*>`,
    "i",
  );
  const m2 = re2.exec(html);
  if (m2?.[1]) return m2[1].trim();

  return undefined;
}

export async function GET(req: Request) {
  const url = new URL(req.url);
  const pageUrl = url.searchParams.get("page") ?? "";
  if (!pageUrl) {
    return NextResponse.json({ error: "Missing page param" }, { status: 400 });
  }

  let parsedPage: URL;
  try {
    parsedPage = new URL(pageUrl);
  } catch {
    return NextResponse.json({ error: "Invalid page URL" }, { status: 400 });
  }

  if (parsedPage.protocol !== "http:" && parsedPage.protocol !== "https:") {
    return NextResponse.json({ error: "Invalid protocol" }, { status: 400 });
  }

  // Step 1: Fetch the page HTML to extract OG image
  const ctrl1 = new AbortController();
  const t1 = setTimeout(() => ctrl1.abort(), 8000);
  let imageUrl: string | undefined;
  try {
    const res = await fetch(pageUrl, {
      method: "GET",
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0.0.0 Safari/537.36",
        Accept: "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
      },
      redirect: "follow",
      signal: ctrl1.signal,
    });
    if (!res.ok) {
      return NextResponse.json({ error: `Page fetch ${res.status}` }, { status: 502 });
    }
    // Only read first 100KB to find meta tags
    const html = (await res.text()).slice(0, 100_000);

    const candidates = [
      extractMetaContent(html, "property", "og:image"),
      extractMetaContent(html, "name", "twitter:image"),
      extractMetaContent(html, "property", "og:image:secure_url"),
      extractMetaContent(html, "name", "twitter:image:src"),
    ].filter(Boolean);

    for (const raw of candidates) {
      if (!raw) continue;
      const v = raw.trim();
      if (v.startsWith("data:")) continue;
      if (v.startsWith("//")) { imageUrl = `https:${v}`; break; }
      if (v.startsWith("http://") || v.startsWith("https://")) { imageUrl = v; break; }
      try { imageUrl = new URL(v, pageUrl).toString(); break; } catch { /* skip */ }
    }
  } catch {
    return NextResponse.json({ error: "Page fetch failed" }, { status: 502 });
  } finally {
    clearTimeout(t1);
  }

  if (!imageUrl) {
    return NextResponse.json({ error: "No OG image found" }, { status: 404 });
  }

  // Step 2: Proxy the image
  const ctrl2 = new AbortController();
  const t2 = setTimeout(() => ctrl2.abort(), 12000);
  try {
    const res = await fetch(imageUrl, {
      method: "GET",
      headers: {
        Accept: "image/avif,image/webp,image/apng,image/*,*/*;q=0.8",
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0.0.0 Safari/537.36",
      },
      redirect: "follow",
      signal: ctrl2.signal,
    });

    if (!res.ok) {
      return NextResponse.json({ error: `Image fetch ${res.status}` }, { status: 502 });
    }

    const contentType = res.headers.get("content-type") ?? "application/octet-stream";
    const body = await res.arrayBuffer();
    return new NextResponse(body, {
      status: 200,
      headers: {
        "content-type": contentType,
        "cache-control": "public, max-age=86400, s-maxage=604800, stale-while-revalidate=2592000",
      },
    });
  } catch {
    return NextResponse.json({ error: "Image fetch failed" }, { status: 502 });
  } finally {
    clearTimeout(t2);
  }
}
