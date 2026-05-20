export type RssItem = {
  url: string;
  title?: string;
  publishedDate?: string;
};

function extractTag(xml: string, tag: string): string | undefined {
  const re = new RegExp(
    `<${tag}[^>]*>(?:<!\[CDATA\[)?([\s\S]*?)(?:\]\]>)?<\/${tag}>`,
    "i",
  );
  const m = re.exec(xml);
  return m?.[1]?.trim() || undefined;
}

function extractItems(xml: string): string[] {
  const items: string[] = [];
  const re = /<item>([\s\S]*?)<\/item>/g;
  let m: RegExpExecArray | null;
  while ((m = re.exec(xml)) !== null) {
    items.push(m[1]);
  }
  return items;
}

async function resolveRedirectUrl(url: string): Promise<string> {
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 6000);
    const res = await fetch(url, {
      method: "GET",
      redirect: "follow",
      headers: {
        "User-Agent":
          "Mozilla/5.0 (compatible; fifaWorldCup-news/1.0; +https://copamundial.today/)",
      },
      signal: controller.signal,
    });
    clearTimeout(timeout);
    return res.url || url;
  } catch {
    return url;
  }
}

export async function fetchRssNews(feedUrl: string, count: number): Promise<RssItem[]> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 12000);

  try {
    const res = await fetch(feedUrl, {
      headers: {
        "User-Agent":
          "Mozilla/5.0 (compatible; fifaWorldCup-news/1.0; +https://copamundial.today/)",
        Accept: "application/rss+xml, application/xml, text/xml, */*",
      },
      signal: controller.signal,
    });

    if (!res.ok) return [];
    const xml = await res.text();
    const itemsXml = extractItems(xml).slice(0, count);

    const results: RssItem[] = [];
    for (const item of itemsXml) {
      let link = extractTag(item, "link");
      if (!link) {
        const guidMatch = /<guid[^>]*>([\s\S]*?)<\/guid>/i.exec(item);
        link = guidMatch?.[1]?.trim();
      }
      if (!link || !(link.startsWith("http://") || link.startsWith("https://"))) continue;

      // Google News RSS usa URLs de redirección — resolver la URL real
      const resolvedUrl = link.includes("news.google.com")
        ? await resolveRedirectUrl(link)
        : link;

      if (!(resolvedUrl.startsWith("http://") || resolvedUrl.startsWith("https://"))) continue;

      results.push({
        url: resolvedUrl,
        title: extractTag(item, "title"),
        publishedDate: extractTag(item, "pubDate"),
      });
    }

    return results;
  } catch {
    return [];
  } finally {
    clearTimeout(timeout);
  }
}

export type RssFeed = {
  name: string;
  url: string;
};

export const RSS_FEEDS: RssFeed[] = [
  {
    name: "google-news-mundial-ar",
    url: "https://news.google.com/rss/search?q=mundial+2026+fifa&hl=es-419&gl=AR&ceid=AR:es-419",
  },
  {
    name: "google-news-mundial-es",
    url: "https://news.google.com/rss/search?q=copa+mundial+2026&hl=es&gl=ES&ceid=ES:es",
  },
  {
    name: "marca",
    url: "https://www.marca.com/rss/futbol/mundial.xml",
  },
  {
    name: "as-mundial",
    url: "https://as.com/rss/tags/mundial_2026.xml",
  },
  {
    name: "infobae-deportes",
    url: "https://www.infobae.com/feeds/rss/deportes/",
  },
  {
    name: "ole",
    url: "https://www.ole.com.ar/rss/exportacion/", 
  },
  {
    name: "clarin-deportes",
    url: "https://www.clarin.com/rss/deportes/",
  },
];

export async function fetchAllRssNews(count: number): Promise<RssItem[]> {
  const perFeed = Math.ceil(count / 2);
  const feedResults = await Promise.allSettled(
    RSS_FEEDS.map((feed) => fetchRssNews(feed.url, perFeed)),
  );

  const allItems: RssItem[] = [];
  for (const r of feedResults) {
    if (r.status === "fulfilled") allItems.push(...r.value);
  }

  // Deduplicar por URL
  const seen = new Set<string>();
  const deduped: RssItem[] = [];
  for (const item of allItems) {
    if (!seen.has(item.url)) {
      seen.add(item.url);
      deduped.push(item);
    }
  }

  return deduped.slice(0, count * 2);
}
