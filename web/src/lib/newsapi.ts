export type NewsApiItem = {
  url: string;
  title?: string;
  publishedDate?: string;
};

type NewsApiArticle = {
  url?: string;
  title?: string;
  publishedAt?: string;
  source?: { name?: string };
};

type NewsApiResponse = {
  status?: string;
  articles?: NewsApiArticle[];
};

export async function newsApiSearch(query: string, count: number): Promise<NewsApiItem[]> {
  const apiKey = (process.env.NEWS_API_KEY ?? "").trim();
  if (!apiKey) return [];

  const params = new URLSearchParams({
    q: query,
    language: "es",
    sortBy: "publishedAt",
    pageSize: String(Math.min(count, 100)),
    apiKey,
  });

  try {
    const res = await fetch(`https://newsapi.org/v2/everything?${params.toString()}`, {
      headers: {
        "User-Agent": "fifaWorldCup-news/1.0 (+https://copamundial.today/)",
      },
    });

    if (!res.ok) return [];

    const data = (await res.json()) as NewsApiResponse;
    if (data.status !== "ok" || !Array.isArray(data.articles)) return [];

    return data.articles
      .filter(
        (a): a is NewsApiArticle & { url: string } =>
          typeof a.url === "string" &&
          (a.url.startsWith("http://") || a.url.startsWith("https://")) &&
          a.url !== "https://removed.com",
      )
      .map((a) => ({
        url: a.url,
        title: a.title ?? undefined,
        publishedDate: a.publishedAt ?? undefined,
      }))
      .slice(0, count);
  } catch {
    return [];
  }
}

// GNews es otra API gratuita (100 req/día en el plan free)
export async function gnewsSearch(query: string, count: number): Promise<NewsApiItem[]> {
  const apiKey = (process.env.GNEWS_API_KEY ?? "").trim();
  if (!apiKey) return [];

  const params = new URLSearchParams({
    q: query,
    lang: "es",
    max: String(Math.min(count, 10)),
    apikey: apiKey,
  });

  try {
    const res = await fetch(`https://gnews.io/api/v4/search?${params.toString()}`);
    if (!res.ok) return [];

    const data = (await res.json()) as {
      articles?: Array<{ url?: string; title?: string; publishedAt?: string }>;
    };

    return (data.articles ?? [])
      .filter(
        (a): a is { url: string; title?: string; publishedAt?: string } =>
          typeof a.url === "string" &&
          (a.url.startsWith("http://") || a.url.startsWith("https://")),
      )
      .map((a) => ({
        url: a.url,
        title: a.title ?? undefined,
        publishedDate: a.publishedAt ?? undefined,
      }))
      .slice(0, count);
  } catch {
    return [];
  }
}

export async function fetchAllNewsApiResults(query: string, count: number): Promise<NewsApiItem[]> {
  const [newsapi, gnews] = await Promise.allSettled([
    newsApiSearch(query, count),
    gnewsSearch(query, Math.min(count, 10)),
  ]);

  const all: NewsApiItem[] = [
    ...(newsapi.status === "fulfilled" ? newsapi.value : []),
    ...(gnews.status === "fulfilled" ? gnews.value : []),
  ];

  const seen = new Set<string>();
  const deduped: NewsApiItem[] = [];
  for (const item of all) {
    if (!seen.has(item.url)) {
      seen.add(item.url);
      deduped.push(item);
    }
  }

  return deduped.slice(0, count);
}
