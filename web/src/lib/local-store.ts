import { mkdir, readFile, writeFile } from "fs/promises";
import { createHash } from "crypto";
import { setDefaultResultOrder } from "dns";
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

function isValidPostgresConnectionString(raw: string): boolean {
  const trimmed = raw.trim();
  if (!trimmed) return false;
  if (!/^postgres(ql)?:\/\//i.test(trimmed)) return false;
  try {
    const u = new URL(trimmed);
    return Boolean(u.hostname);
  } catch {
    return false;
  }
}

function hasDatabase() {
  return Boolean(
    isValidPostgresConnectionString(process.env.DATABASE_URL ?? "") ||
      isValidPostgresConnectionString(process.env.POSTGRES_URL ?? "") ||
      isValidPostgresConnectionString(process.env.POSTGRES_PRISMA_URL ?? "") ||
      isValidPostgresConnectionString(process.env.POSTGRES_URL_NON_POOLING ?? ""),
  );
}

try {
  setDefaultResultOrder("ipv4first");
} catch {
}

function getDatabaseUrlFromEnv(): { url: string; source: string } {
  const candidates: Array<{ key: string; value: string }> = [
    { key: "DATABASE_URL", value: process.env.DATABASE_URL ?? "" },
    { key: "POSTGRES_URL", value: process.env.POSTGRES_URL ?? "" },
    { key: "POSTGRES_PRISMA_URL", value: process.env.POSTGRES_PRISMA_URL ?? "" },
    { key: "POSTGRES_URL_NON_POOLING", value: process.env.POSTGRES_URL_NON_POOLING ?? "" },
  ];

  for (const c of candidates) {
    const v = c.value.trim();
    if (isValidPostgresConnectionString(v)) return { url: v, source: c.key };
  }

  for (const c of candidates) {
    const v = c.value.trim();
    if (v) return { url: v, source: c.key };
  }

  return { url: "", source: "DATABASE_URL" };
}

function lockParts(lockKey: string): [number, number] {
  const digest = createHash("sha1").update(lockKey).digest();
  const a = digest.readInt32BE(0);
  const b = digest.readInt32BE(4);
  return [a, b];
}

async function getPool(): Promise<Pool> {
  const { Pool } = await import("pg");
  const { url: databaseUrl, source } = getDatabaseUrlFromEnv();
  if (!databaseUrl) {
    throw new Error(
      "Missing database connection string (set DATABASE_URL or Vercel Supabase integration vars like POSTGRES_URL)",
    );
  }

  if (!/^postgres(ql)?:\/\//i.test(databaseUrl.trim())) {
    throw new Error(
      `Invalid ${source}: expected a postgres:// or postgresql:// connection string`,
    );
  }

  let parsed: URL;
  try {
    parsed = new URL(databaseUrl.trim());
  } catch {
    throw new Error(`Invalid ${source}: could not parse connection string`);
  }

  if (!parsed.hostname) {
    throw new Error(`Invalid ${source}: missing host`);
  }

  const isLocal =
    databaseUrl.includes("localhost") ||
    databaseUrl.includes("127.0.0.1") ||
    databaseUrl.includes("::1");

  const g = globalThis as unknown as {
    __draftsPool?: Pool;
  };

  if (!g.__draftsPool) {
    g.__draftsPool = new Pool({
      connectionString: databaseUrl,
      ssl: isLocal ? undefined : { rejectUnauthorized: false },
      max: 5,
      connectionTimeoutMillis: 8000,
    });
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
    create table if not exists automation_runs (
      id bigserial primary key,
      started_at timestamptz not null,
      finished_at timestamptz not null,
      source_mode text not null,
      webset_id text,
      query text,
      count_requested int,
      urls_found int not null,
      urls_to_process int not null,
      drafts_generated int not null,
      errors_count int not null,
      stored_count int not null,
      created_at timestamptz not null default now()
    )
  `);
  await pool.query(`
    create table if not exists article_drafts (
      source_url text primary key,
      slug text unique,
      section text,
      status text not null default 'draft',
      published_at timestamptz,
      reviewed_at timestamptz,
      draft jsonb not null,
      created_at timestamptz not null default now(),
      updated_at timestamptz not null default now()
    )
  `);
  await pool.query(`alter table article_drafts add column if not exists status text not null default 'draft'`);
  await pool.query(`alter table article_drafts add column if not exists published_at timestamptz`);
  await pool.query(`alter table article_drafts add column if not exists reviewed_at timestamptz`);

  await pool.query(
    `create index if not exists article_drafts_status_idx on article_drafts(status)`,
  );
  await pool.query(
    `create index if not exists article_drafts_published_at_idx on article_drafts(published_at desc)`,
  );
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
      insert into article_drafts (source_url, slug, section, status, draft, updated_at)
      values ($1, $2, $3, 'draft', $4::jsonb, now())
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

export type DraftStatus = "draft" | "approved" | "published" | "rejected";

export type DraftRecord = {
  sourceUrl: string;
  slug: string;
  section: string;
  status: DraftStatus;
  publishedAtIso?: string;
  reviewedAtIso?: string;
  createdAtIso: string;
  updatedAtIso: string;
  draft: ArticleDraft;
};

export async function listDraftRecords(params?: {
  status?: DraftStatus;
  limit?: number;
  offset?: number;
}): Promise<DraftRecord[]> {
  if (!hasDatabase()) {
    const drafts = await readDraftStoreFile();
    return drafts.map((d) => ({
      sourceUrl: d.source.url,
      slug: d.seo.slug,
      section: d.section,
      status: "published",
      createdAtIso: new Date().toISOString(),
      updatedAtIso: new Date().toISOString(),
      publishedAtIso: d.source.publishedDate,
      draft: d,
    }));
  }

  const pool = await ensureDb();
  const limit = Math.min(Math.max(params?.limit ?? 30, 1), 200);
  const offset = Math.max(params?.offset ?? 0, 0);

  const where = params?.status ? "where status = $3" : "";
  const values = params?.status
    ? [limit, offset, params.status]
    : [limit, offset];

  const res = await pool.query<{
    source_url: string;
    slug: string;
    section: string | null;
    status: string;
    published_at: string | null;
    reviewed_at: string | null;
    created_at: string;
    updated_at: string;
    draft: ArticleDraft;
  }>(
    `
    select
      source_url,
      slug,
      section,
      status,
      published_at,
      reviewed_at,
      created_at,
      updated_at,
      draft
    from article_drafts
    ${where}
    order by coalesce(published_at, updated_at) desc
    limit $1
    offset $2
    `,
    values,
  );

  return res.rows.map((r) => ({
    sourceUrl: r.source_url,
    slug: r.slug,
    section: r.section ?? "",
    status: (r.status as DraftStatus) ?? "draft",
    publishedAtIso: r.published_at ?? undefined,
    reviewedAtIso: r.reviewed_at ?? undefined,
    createdAtIso: r.created_at,
    updatedAtIso: r.updated_at,
    draft: r.draft,
  }));
}

export async function readPublishedDrafts(): Promise<ArticleDraft[]> {
  if (!hasDatabase()) return await readDraftStoreFile();
  const pool = await ensureDb();
  const res = await pool.query<{ draft: ArticleDraft }>(
    `
    select draft
    from article_drafts
    where status = 'published'
    order by coalesce(published_at, updated_at) desc
    `,
  );
  return res.rows.map((r) => r.draft);
}

export async function updateDraftStatus(params: {
  sourceUrl: string;
  status: DraftStatus;
}) {
  if (!hasDatabase()) return { ok: false as const, reason: "no_db" as const };
  const pool = await ensureDb();

  const reviewedAt =
    params.status === "draft" ? null : new Date().toISOString();
  const publishedAt =
    params.status === "published" ? new Date().toISOString() : null;

  await pool.query(
    `
    update article_drafts
    set
      status = $2,
      reviewed_at = coalesce($3::timestamptz, reviewed_at),
      published_at = case
        when $2 = 'published' then coalesce(published_at, $4::timestamptz)
        else null
      end,
      updated_at = now()
    where source_url = $1
    `,
    [params.sourceUrl, params.status, reviewedAt, publishedAt],
  );

  return { ok: true as const };
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

export type RunLog = {
  id: number;
  startedAtIso: string;
  finishedAtIso: string;
  sourceMode: "websets" | "search";
  websetId?: string;
  query?: string;
  countRequested?: number;
  urlsFound: number;
  urlsToProcess: number;
  draftsGenerated: number;
  errorsCount: number;
  storedCount: number;
};

export async function upsertRunLog(input: Omit<RunLog, "id">) {
  if (!hasDatabase()) return { ok: false as const, reason: "no_db" as const };

  const pool = await ensureDb();
  const res = await pool.query<{ id: string }>(
    `
    insert into automation_runs (
      started_at,
      finished_at,
      source_mode,
      webset_id,
      query,
      count_requested,
      urls_found,
      urls_to_process,
      drafts_generated,
      errors_count,
      stored_count
    ) values (
      $1::timestamptz,
      $2::timestamptz,
      $3,
      $4,
      $5,
      $6,
      $7,
      $8,
      $9,
      $10,
      $11
    )
    returning id::text as id
    `,
    [
      input.startedAtIso,
      input.finishedAtIso,
      input.sourceMode,
      input.websetId ?? null,
      input.query ?? null,
      input.countRequested ?? null,
      input.urlsFound,
      input.urlsToProcess,
      input.draftsGenerated,
      input.errorsCount,
      input.storedCount,
    ],
  );

  return { ok: true as const, id: Number(res.rows[0]?.id ?? 0) };
}

export async function listRunLogs(limit = 30): Promise<RunLog[]> {
  if (!hasDatabase()) return [];
  const pool = await ensureDb();

  const safeLimit = Math.min(Math.max(limit, 1), 200);
  const res = await pool.query<{
    id: number;
    started_at: string;
    finished_at: string;
    source_mode: string;
    webset_id: string | null;
    query: string | null;
    count_requested: number | null;
    urls_found: number;
    urls_to_process: number;
    drafts_generated: number;
    errors_count: number;
    stored_count: number;
  }>(
    `
    select
      id,
      started_at,
      finished_at,
      source_mode,
      webset_id,
      query,
      count_requested,
      urls_found,
      urls_to_process,
      drafts_generated,
      errors_count,
      stored_count
    from automation_runs
    order by id desc
    limit $1
    `,
    [safeLimit],
  );

  return res.rows.map((r) => ({
    id: r.id,
    startedAtIso: r.started_at,
    finishedAtIso: r.finished_at,
    sourceMode: (r.source_mode === "websets" ? "websets" : "search") as
      | "websets"
      | "search",
    websetId: r.webset_id ?? undefined,
    query: r.query ?? undefined,
    countRequested: r.count_requested ?? undefined,
    urlsFound: r.urls_found,
    urlsToProcess: r.urls_to_process,
    draftsGenerated: r.drafts_generated,
    errorsCount: r.errors_count,
    storedCount: r.stored_count,
  }));
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
