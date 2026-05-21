export type RssItem = {
  url: string;
  title?: string;
  publishedDate?: string;
};

function extractTag(xml: string, tag: string): string | undefined {
  const re = new RegExp(
    `<${tag}[^>]*>(?:<!\\[CDATA\\[)?([\\s\\S]*?)(?:\\]\\]>)?</${tag}>`,
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

export type RssFeed = { name: string; url: string; sections?: string[] };

function gnewsRss(query: string, lang = "es-419", country = "AR") {
  const q = encodeURIComponent(query);
  return `https://news.google.com/rss/search?q=${q}&hl=${lang}&gl=${country}&ceid=${country}:${lang}`;
}

// Topic IDs de Google News (mismos que usa la libreria ranahaani/GNews)
const GNEWS_TOPIC_SPORTS =
  "https://news.google.com/rss/topics/CAAqJggKIiBDQkFTRWdvSUwyMHZNRFp1ZEdvU0FtVnpHZ0pCVWlnQVAB?hl=es-419&gl=AR&ceid=AR:es-419";

export const RSS_FEEDS: RssFeed[] = [
  // General Mundial 2026
  { name: "gnews-mundial-ar",   url: gnewsRss("mundial 2026 fifa"),                          sections: ["ultima-hora"] },
  { name: "gnews-mundial-es",   url: gnewsRss("copa mundial 2026", "es", "ES"),              sections: ["ultima-hora"] },
  { name: "gnews-sports-topic", url: GNEWS_TOPIC_SPORTS,                                     sections: ["ultima-hora", "selecciones"] },

  // Selecciones
  { name: "gnews-selecciones",  url: gnewsRss("selecciones mundial 2026 convocatoria"),      sections: ["selecciones"] },
  { name: "gnews-argentina",    url: gnewsRss("argentina seleccion mundial 2026"),           sections: ["selecciones"] },
  { name: "gnews-brasil",       url: gnewsRss("brasil seleccion mundial 2026"),              sections: ["selecciones"] },

  // Jugadores
  { name: "gnews-messi",        url: gnewsRss("messi mundial 2026"),                         sections: ["jugadores"] },
  { name: "gnews-mbappe",       url: gnewsRss("mbappe mundial 2026"),                        sections: ["jugadores"] },
  { name: "gnews-jugadores",    url: gnewsRss("jugadores estrellas mundial 2026 goles"),     sections: ["jugadores"] },

  // Estadios
  { name: "gnews-estadios",     url: gnewsRss("estadios mundial 2026 sedes"),                sections: ["estadios"] },
  { name: "gnews-metlife",      url: gnewsRss("MetLife stadium Azteca mundial 2026"),        sections: ["estadios"] },

  // Paises anfitriones
  { name: "gnews-anfitriones",  url: gnewsRss("estados unidos mexico canada mundial 2026 sede"), sections: ["paises-anfitriones"] },

  // Entradas
  { name: "gnews-entradas",     url: gnewsRss("entradas tickets mundial 2026 fifa venta"),   sections: ["entradas"] },

  // Fuentes editoriales (sin filtro de seccion, sirven para cualquier tema)
  { name: "marca",              url: "https://www.marca.com/rss/futbol/mundial.xml" },
  { name: "as-mundial",         url: "https://as.com/rss/tags/mundial_2026.xml" },
  { name: "infobae-deportes",   url: "https://www.infobae.com/feeds/rss/deportes/" },
  { name: "ole",                url: "https://www.ole.com.ar/rss/exportacion/" },
  { name: "clarin-deportes",    url: "https://www.clarin.com/rss/deportes/" },
];

/**
 * Feeds relevantes para una seccion especifica.
 * Sin seccion: devuelve todos los feeds (para recoleccion general).
 */
function feedsForSection(section?: string): RssFeed[] {
  if (!section) return RSS_FEEDS; // todos los feeds
  return RSS_FEEDS.filter(
    (f) => !f.sections || f.sections.includes(section) || f.sections.includes("ultima-hora"),
  );
}

export async function fetchAllRssNews(count: number, section?: string): Promise<RssItem[]> {
  const feeds = feedsForSection(section);
  const perFeed = Math.max(3, Math.ceil(count / Math.max(feeds.length / 2, 1)));

  const feedResults = await Promise.allSettled(
    feeds.map((feed) => fetchRssNews(feed.url, perFeed)),
  );

  const allItems: RssItem[] = [];
  for (const r of feedResults) {
    if (r.status === "fulfilled") allItems.push(...r.value);
  }

  const seen = new Set<string>();
  const deduped: RssItem[] = [];
  for (const item of allItems) {
    if (!seen.has(item.url)) {
      seen.add(item.url);
      deduped.push(item);
    }
  }

  return deduped.slice(0, count * 3);
}
