import { generateArticleDraft } from "@/lib/agent";
import { exaSearchNews, getExaClient } from "@/lib/exa";
import { fetchAllRssNews } from "@/lib/rss";
import { fetchAllNewsApiResults } from "@/lib/newsapi";
import { getDraftUrlSet, upsertDraftStore, upsertRunLog } from "@/lib/local-store";

export type DailyRunInput = {
  websetId?: string;
  query?: string;
  count?: number;
  criteria?: Array<{ description: string }>;
  concurrency?: number;
  dryRun?: boolean;
  onlyNew?: boolean;
  force?: boolean;
};

function asUrl(input: unknown): string | undefined {
  if (typeof input !== "string") return undefined;
  if (input.startsWith("http://") || input.startsWith("https://")) return input;
  return undefined;
}

function isRecord(v: unknown): v is Record<string, unknown> {
  return typeof v === "object" && v !== null;
}

function getPath(obj: unknown, path: string[]): unknown {
  let cur: unknown = obj;
  for (const key of path) {
    if (!isRecord(cur)) return undefined;
    cur = cur[key];
  }
  return cur;
}

function extractUrlFromItem(item: unknown): string | undefined {
  const candidates: unknown[] = [
    getPath(item, ["properties", "url"]),
    getPath(item, ["properties", "article", "url"]),
    getPath(item, ["properties", "article", "canonicalUrl"]),
    getPath(item, ["url"]),
    getPath(item, ["id"]),
  ];
  for (const c of candidates) {
    const u = asUrl(c);
    if (u) return u;
  }
  return undefined;
}

async function runWithConcurrency<T, R>(
  items: T[],
  concurrency: number,
  fn: (item: T, index: number) => Promise<R>,
) {
  const results: Array<{ ok: true; value: R } | { ok: false; error: string }> =
    new Array(items.length);
  let cursor = 0;

  async function worker() {
    while (true) {
      const idx = cursor++;
      if (idx >= items.length) return;
      try {
        const value = await fn(items[idx], idx);
        results[idx] = { ok: true, value };
      } catch (e) {
        const message = e instanceof Error ? e.message : "Unknown error";
        results[idx] = { ok: false, error: message };
      }
    }
  }

  await Promise.all(
    Array.from({ length: Math.max(1, concurrency) }, () => worker()),
  );

  return results;
}

function dedupeUrls(urls: string[]): string[] {
  const seen = new Set<string>();
  const result: string[] = [];
  for (const u of urls) {
    if (!seen.has(u)) {
      seen.add(u);
      result.push(u);
    }
  }
  return result;
}

export async function runDailyAutomation(input: DailyRunInput) {
  const startedAt = Date.now();
  const query = input.query ?? "mundial 2026 fifa noticias";
  const count = input.count ?? 25;
  const criteria = input.criteria ?? [
    { description: "La página es una nota/artículo sobre el Mundial de Fútbol 2026" },
  ];
  const concurrency = Math.min(Math.max(input.concurrency ?? 3, 1), 6);
  const dryRun = input.dryRun === true;
  const onlyNew = input.onlyNew ?? true;
  const force = input.force ?? false;

  const configuredWebsetId = input.websetId ?? process.env.EXA_WEBSET_ID ?? undefined;
  const mode =
    configuredWebsetId ? "websets" : (process.env.EXA_MODE ?? "auto").toLowerCase();

  let uniqueUrls: string[] = [];
  let dashboardUrl: string | undefined;
  let websetId: string | undefined = configuredWebsetId;
  let sourceMode: "websets" | "search" = "search";

  // 1. Intentar con EXA Websets
  if (mode !== "search") {
    try {
      const exa = getExaClient();
      if (!websetId) {
        const webset = await exa.websets.create({
          search: {
            query,
            count,
            criteria,
            entity: { type: "article" },
          },
          enrichments: [],
        });
        websetId = webset.id;
        dashboardUrl = webset.dashboardUrl;
      }

      await exa.websets.waitUntilIdle(websetId, {
        timeout: 120000,
        pollInterval: 2000,
      });

      const itemsResp = await exa.websets.items.list(websetId, { limit: count });
      const urls = (itemsResp?.data ?? [])
        .map(extractUrlFromItem)
        .filter((u): u is string => Boolean(u));

      uniqueUrls = dedupeUrls(urls).slice(0, count);
      sourceMode = "websets";
    } catch (e) {
      const statusCode =
        isRecord(e) && typeof e.statusCode === "number" ? e.statusCode : undefined;
      if (mode === "websets" || statusCode !== 401) throw e;
    }
  }

  // 2. Si no hay resultados de Websets, usar fuentes múltiples en paralelo
  if (!uniqueUrls.length) {
    if (mode === "websets") {
      throw new Error("Websets required but no URLs were retrieved");
    }

    // Recolectar de todas las fuentes disponibles en paralelo
    const [exaResults, rssResults, newsApiResults] = await Promise.allSettled([
      exaSearchNews(query, count).catch(() => []),
      fetchAllRssNews(count),
      fetchAllNewsApiResults(query, count),
    ]);

    const allUrls: string[] = [];

    if (exaResults.status === "fulfilled") {
      allUrls.push(...exaResults.value.map((r) => r.url));
    }
    if (rssResults.status === "fulfilled") {
      allUrls.push(...rssResults.value.map((r) => r.url));
    }
    if (newsApiResults.status === "fulfilled") {
      allUrls.push(...newsApiResults.value.map((r) => r.url));
    }

    uniqueUrls = dedupeUrls(allUrls).slice(0, count);
    sourceMode = "search";
  }

  const knownUrls = force ? new Set<string>() : await getDraftUrlSet();
  const urlsToProcess =
    onlyNew && !force
      ? uniqueUrls.filter((u) => !knownUrls.has(u))
      : uniqueUrls;

  const draftResults = await runWithConcurrency(
    urlsToProcess,
    concurrency,
    async (url) => {
      return await generateArticleDraft({ url });
    },
  );

  type Draft = Awaited<ReturnType<typeof generateArticleDraft>>;
  const drafts = draftResults.reduce<Draft[]>((acc, r) => {
    if (r.ok) acc.push(r.value);
    return acc;
  }, []);
  const errors = draftResults
    .map((r, idx) => (r.ok ? null : { url: urlsToProcess[idx], error: r.error }))
    .filter(Boolean);

  const stored = dryRun ? { count: 0 } : await upsertDraftStore(drafts);

  const result = {
    sourceMode,
    websetId,
    dashboardUrl,
    query,
    countRequested: count,
    urlsFound: uniqueUrls.length,
    urlsToProcess: urlsToProcess.length,
    draftsGenerated: drafts.length,
    errors,
    storedCount: stored.count,
    dryRun,
    onlyNew,
    force,
  };

  await upsertRunLog({
    startedAtIso: new Date(startedAt).toISOString(),
    finishedAtIso: new Date().toISOString(),
    sourceMode,
    websetId,
    query,
    countRequested: count,
    urlsFound: uniqueUrls.length,
    urlsToProcess: urlsToProcess.length,
    draftsGenerated: drafts.length,
    errorsCount: errors.length,
    storedCount: stored.count,
  });

  return result;
}
