import { mkdir, readFile, writeFile } from "fs/promises";
import { createHash } from "crypto";
import { join } from "path";
import type { Pool } from "pg";

import type { ArticleDraft } from "@/lib/draft";

type StoredDrafts = {
  version: 1;
  updatedAtIso: string;
  drafts: ArticleDraft[];
};

function getStorePath() {
  return join(process.cwd(), ".local-data", "drafts.json");
}

function hasDatabase() {
  return Boolean(process.env.DATABASE_URL);
}

function lockParts(lockKey: string): [number, number] {
  const digest = createHash("sha1").update(lockKey).digest();
  const a = digest.readInt32BE(0);
  const b = digest.readInt32BE(4);
  return [a, b];
}

async function getPool(): Promise<Pool> {
  const { Pool } = await import("pg");
  const databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl) throw new Error("Missing DATABASE_URL");

  const g = globalThis as unknown as {
    __draftsPool?: Pool;
  };

  if (!g.__draftsPool) {
    g.__draftsPool = new Pool({ connectionString: databaseUrl });
  }

  return g.__draftsPool;
}

async function ensureDb() {
  const pool = await getPool();
  await pool.query(`
    create table if not exists app_locks (
      lock_key text primary key,
      created_at timestamptz not null default now()
    )
  `);
  await pool.query(`
    create table if not exists article_drafts (
      source_url text primary key,
      slug text unique,
      section text,
      draft jsonb not null,
      created_at timestamptz not null default now(),
      updated_at timestamptz not null default now()
    )
  `);
  return pool;
}

async function readDraftStoreFile(): Promise<ArticleDraft[]> {
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

async function upsertDraftStoreFile(drafts: ArticleDraft[]) {
  const existing = await readDraftStoreFile();
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

async function readDraftStoreDb(): Promise<ArticleDraft[]> {
  const pool = await ensureDb();
  const res = await pool.query<{
    draft: ArticleDraft;
  }>(`select draft from article_drafts`);

  const drafts = res.rows.map((r) => r.draft);
  drafts.sort((a, b) => {
    const aDate = a.source.publishedDate ?? "";
    const bDate = b.source.publishedDate ?? "";
    const cmp = bDate.localeCompare(aDate);
    if (cmp !== 0) return cmp;
    return b.seo.slug.localeCompare(a.seo.slug);
  });

  return drafts;
}

async function upsertDraftStoreDb(drafts: ArticleDraft[]) {
  const pool = await ensureDb();
  for (const d of drafts) {
    await pool.query(
      `
      insert into article_drafts (source_url, slug, section, draft, updated_at)
      values ($1, $2, $3, $4::jsonb, now())
      on conflict (source_url)
      do update set
        slug = excluded.slug,
        section = excluded.section,
        draft = excluded.draft,
        updated_at = now()
      `,
      [d.source.url, d.seo.slug, d.section, JSON.stringify(d)],
    );
  }

  const countRes = await pool.query<{ count: string }>(
    "select count(*)::text as count from article_drafts",
  );
  return { count: Number(countRes.rows[0]?.count ?? 0) };
}

export async function readDraftStore(): Promise<ArticleDraft[]> {
  if (hasDatabase()) return await readDraftStoreDb();
  return await readDraftStoreFile();
}

export async function getDraftUrlSet() {
  if (hasDatabase()) {
    const pool = await ensureDb();
    const res = await pool.query<{ source_url: string }>(
      "select source_url from article_drafts",
    );
    return new Set(res.rows.map((r) => r.source_url));
  }

  const drafts = await readDraftStoreFile();
  return new Set(drafts.map((d) => d.source.url));
}

export async function upsertDraftStore(drafts: ArticleDraft[]) {
  if (hasDatabase()) return await upsertDraftStoreDb(drafts);
  return await upsertDraftStoreFile(drafts);
}

export async function withCronLock<T>(
  lockKey: string,
  fn: () => Promise<T>,
): Promise<{ ok: true; result: T } | { ok: false; reason: "locked" | "no_db" }> {
  if (!hasDatabase()) return { ok: false, reason: "no_db" };

  const pool = await ensureDb();
  const client = await pool.connect();
  try {
    const [a, b] = lockParts(lockKey);
    const lockRes = await client.query<{ locked: boolean }>(
      "select pg_try_advisory_lock($1, $2) as locked",
      [a, b],
    );

    if (!lockRes.rows[0]?.locked) return { ok: false, reason: "locked" };

    await client.query(
      "insert into app_locks (lock_key) values ($1) on conflict do nothing",
      [lockKey],
    );

    const result = await fn();
    return { ok: true, result };
  } finally {
    try {
      const [a, b] = lockParts(lockKey);
      await client.query("select pg_advisory_unlock($1, $2)", [a, b]);
    } catch {
    } finally {
      client.release();
    }
  }
}
