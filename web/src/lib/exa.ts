import Exa from "exa-js";

export function getExaClient() {
  const apiKey = process.env.EXA_API_KEY;
  if (!apiKey) {
    throw new Error("Missing EXA_API_KEY");
  }
  return new Exa(apiKey);
}

export type ExaSearchResult = {
  title?: string;
  url: string;
  publishedDate?: string;
  author?: string;
  score?: number;
};

function isRecord(v: unknown): v is Record<string, unknown> {
  return typeof v === "object" && v !== null;
}

export async function exaSearchNews(query: string, count: number) {
  const apiKey = process.env.EXA_API_KEY;
  if (!apiKey) throw new Error("Missing EXA_API_KEY");

  const res = await fetch("https://api.exa.ai/search", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": apiKey,
    },
    body: JSON.stringify({
      query,
      type: "auto",
      num_results: count,
      category: "news",
    }),
  });

  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(`Exa /search error (${res.status}): ${text}`);
  }

  const resp = (await res.json()) as unknown;
  const resultsRaw =
    isRecord(resp) && Array.isArray(resp.results) ? resp.results : [];

  const results: ExaSearchResult[] = [];
  for (const r of resultsRaw) {
    if (!isRecord(r)) continue;
    const url = typeof r.url === "string" ? r.url : typeof r.id === "string" ? r.id : null;
    if (!url || !(url.startsWith("http://") || url.startsWith("https://"))) continue;

    results.push({
      url,
      title: typeof r.title === "string" ? r.title : undefined,
      publishedDate: typeof r.publishedDate === "string" ? r.publishedDate : undefined,
      author: typeof r.author === "string" ? r.author : undefined,
      score: typeof r.score === "number" ? r.score : undefined,
    });
  }

  return results.slice(0, count);
}

export async function getExaTextForUrl(url: string) {
  const exa = getExaClient();
  const contents = await exa.getContents([url], {
    text: { maxCharacters: 12000 },
    maxAgeHours: 24,
  });

  const first = contents?.results?.[0];
  const text = first?.text ?? "";

  const imageUrl = await getOpenGraphImageUrl(url).catch(() => undefined);

  return {
    title: first?.title as string | undefined,
    url: first?.url as string | undefined,
    publishedDate: first?.publishedDate as string | undefined,
    author: first?.author as string | undefined,
    imageUrl,
    text,
  };
}

export async function getOgImageUrlForUrl(url: string): Promise<string | undefined> {
  return await getOpenGraphImageUrl(url);
}

async function getOpenGraphImageUrl(pageUrl: string): Promise<string | undefined> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 8000);
  try {
    const res = await fetch(pageUrl, {
      method: "GET",
      headers: {
        "User-Agent":
          "Mozilla/5.0 (compatible; fifaWorldCup-news/1.0; +https://copamundial.today/)",
        Accept: "text/html,application/xhtml+xml",
      },
      signal: controller.signal,
      redirect: "follow",
    });

    if (!res.ok) return undefined;
    const html = await res.text();

    const candidates = [
      extractMetaContent(html, "property", "og:image"),
      extractMetaContent(html, "name", "twitter:image"),
      extractMetaContent(html, "property", "og:image:secure_url"),
      extractMetaContent(html, "name", "twitter:image:src"),
    ].filter((v): v is string => Boolean(v));

    for (const raw of candidates) {
      const normalized = normalizeImageUrl(raw, pageUrl);
      if (normalized) return normalized;
    }

    return undefined;
  } finally {
    clearTimeout(timeout);
  }
}

function extractMetaContent(html: string, attr: "property" | "name", value: string) {
  const re1 = new RegExp(
    `<meta[^>]*\\s${attr}=["']${escapeRegExp(value)}["'][^>]*\\scontent=["']([^"']+)["'][^>]*>`,
    "i",
  );
  const m1 = re1.exec(html);
  if (m1?.[1]) return m1[1].trim();

  const re2 = new RegExp(
    `<meta[^>]*\\scontent=["']([^"']+)["'][^>]*\\s${attr}=["']${escapeRegExp(value)}["'][^>]*>`,
    "i",
  );
  const m2 = re2.exec(html);
  if (m2?.[1]) return m2[1].trim();

  return undefined;
}

function normalizeImageUrl(raw: string, baseUrl: string): string | undefined {
  const v = raw.trim();
  if (!v) return undefined;
  if (v.startsWith("data:")) return undefined;
  if (v.startsWith("//")) return `https:${v}`;
  if (v.startsWith("http://") || v.startsWith("https://")) return v;
  try {
    return new URL(v, baseUrl).toString();
  } catch {
    return undefined;
  }
}

function escapeRegExp(input: string) {
  return input.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

export type ExaWebsetMonitor = {
  id: string;
  websetId: string;
  status?: string;
  nextRunAt?: string;
};

export async function createExaMonitor(params: {
  websetId: string;
  cron: string;
  timezone: string;
  query: string;
  count: number;
  criteria?: Array<{ description: string }>;
}) {
  const apiKey = process.env.EXA_API_KEY;
  if (!apiKey) throw new Error("Missing EXA_API_KEY");

  const res = await fetch("https://api.exa.ai/websets/v0/monitors", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": apiKey,
    },
    body: JSON.stringify({
      websetId: params.websetId,
      cadence: { cron: params.cron, timezone: params.timezone },
      behavior: {
        type: "search",
        config: {
          query: params.query,
          count: params.count,
          criteria: params.criteria ?? [],
          entity: { type: "article" },
          behavior: "append",
        },
      },
    }),
  });

  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(`Exa /websets/v0/monitors error (${res.status}): ${text}`);
  }

  return (await res.json()) as ExaWebsetMonitor;
}
