import { NextResponse } from "next/server";

function isPrivateHostname(hostname: string) {
  const h = hostname.toLowerCase();
  if (h === "localhost" || h.endsWith(".localhost")) return true;
  if (h === "0.0.0.0") return true;
  if (h === "127.0.0.1" || h.startsWith("127.")) return true;
  if (h === "::1") return true;
  if (h.startsWith("10.")) return true;
  if (h.startsWith("192.168.")) return true;
  if (h.startsWith("169.254.")) return true;
  const m = /^172\.(\d+)\./.exec(h);
  if (m) {
    const n = Number(m[1]);
    if (n >= 16 && n <= 31) return true;
  }
  return false;
}

export async function GET(req: Request) {
  const url = new URL(req.url);
  const target = url.searchParams.get("url") ?? "";
  if (!target) {
    return NextResponse.json({ error: "Missing url" }, { status: 400 });
  }

  let u: URL;
  try {
    u = new URL(target);
  } catch {
    return NextResponse.json({ error: "Invalid url" }, { status: 400 });
  }

  if (u.protocol !== "http:" && u.protocol !== "https:") {
    return NextResponse.json({ error: "Invalid protocol" }, { status: 400 });
  }

  if (isPrivateHostname(u.hostname)) {
    return NextResponse.json({ error: "Blocked host" }, { status: 400 });
  }

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 15000);
  try {
    const res = await fetch(u.toString(), {
      method: "GET",
      headers: {
        Accept: "image/avif,image/webp,image/apng,image/*,*/*;q=0.8",
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0.0.0 Safari/537.36",
        // No Referer — many CDNs block hotlinking when the referer comes from a different origin
      },
      redirect: "follow",
      signal: controller.signal,
    });

    if (!res.ok) {
      return NextResponse.json({ error: `Upstream ${res.status}` }, { status: 502 });
    }

    const contentType = res.headers.get("content-type") ?? "application/octet-stream";
    const body = await res.arrayBuffer();
    return new NextResponse(body, {
      status: 200,
      headers: {
        "content-type": contentType,
        "cache-control": "public, max-age=3600, s-maxage=86400, stale-while-revalidate=604800",
      },
    });
  } catch {
    return NextResponse.json({ error: "Fetch failed" }, { status: 502 });
  } finally {
    clearTimeout(timeout);
  }
}

