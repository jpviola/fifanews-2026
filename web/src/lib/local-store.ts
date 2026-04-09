import { mkdir, readFile, writeFile } from "fs/promises";
import { join } from "path";

import type { ArticleDraft } from "@/lib/draft";

type StoredDrafts = {
  version: 1;
  updatedAtIso: string;
  drafts: ArticleDraft[];
};

function getStorePath() {
  return join(process.cwd(), ".local-data", "drafts.json");
}

export async function readDraftStore(): Promise<ArticleDraft[]> {
  const path = getStorePath();
  try {
    const raw = await readFile(path, "utf8");
    const parsed = JSON.parse(raw) as StoredDrafts;
    if (parsed?.version !== 1 || !Array.isArray(parsed.drafts)) return [];
    return parsed.drafts;
  } catch {
    return [];
  }
}

export async function getDraftUrlSet() {
  const drafts = await readDraftStore();
  return new Set(drafts.map((d) => d.source.url));
}

export async function upsertDraftStore(drafts: ArticleDraft[]) {
  const existing = await readDraftStore();
  const byUrl = new Map<string, ArticleDraft>();
  for (const d of existing) byUrl.set(d.source.url, d);
  for (const d of drafts) byUrl.set(d.source.url, d);

  const merged = [...byUrl.values()].sort((a, b) => {
    const aDate = a.source.publishedDate ?? "";
    const bDate = b.source.publishedDate ?? "";
    return bDate.localeCompare(aDate);
  });

  const payload: StoredDrafts = {
    version: 1,
    updatedAtIso: new Date().toISOString(),
    drafts: merged,
  };

  const path = getStorePath();
  await mkdir(join(process.cwd(), ".local-data"), { recursive: true });
  await writeFile(path, JSON.stringify(payload, null, 2), "utf8");

  return { count: merged.length };
}
