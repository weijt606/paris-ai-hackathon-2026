import "server-only";
import { mkdirSync } from "node:fs";
import { createHash } from "node:crypto";
import { join } from "node:path";

export const TAVILY_CACHE_TTL_MS = 7 * 24 * 60 * 60 * 1000;

export type TavilyCacheResult = {
  title?: string;
  url?: string;
  content?: string;
  score?: number;
};

type CacheKeyInput = {
  region: string;
  regionScope?: string;
  chateau?: string;
  year: number;
  sourceType: string;
  query: string;
  maxResultsPerQuery: number;
};

type CacheRow = {
  results_json: string;
  expires_at: number;
};

let database: import("node:sqlite").DatabaseSync | null | undefined;

export function buildTavilyCacheKey(input: CacheKeyInput): string {
  const stable = JSON.stringify({
    region: input.region.trim().toLowerCase(),
    regionScope: (input.regionScope ?? "").trim().toLowerCase(),
    chateau: (input.chateau ?? "").trim().toLowerCase(),
    year: input.year,
    sourceType: input.sourceType,
    query: input.query.trim().toLowerCase(),
    maxResultsPerQuery: input.maxResultsPerQuery,
  });
  return `tavily:v1:${createHash("sha256").update(stable).digest("hex")}`;
}

async function getDatabase(): Promise<import("node:sqlite").DatabaseSync | null> {
  if (database !== undefined) return database;
  try {
    const { DatabaseSync } = await import("node:sqlite");
    const cacheDir = join(process.cwd(), "data", ".cache");
    mkdirSync(cacheDir, { recursive: true });
    database = new DatabaseSync(join(cacheDir, "tavily-search.sqlite"));
    database.exec(`
      CREATE TABLE IF NOT EXISTS tavily_search_cache (
        cache_key TEXT PRIMARY KEY,
        region TEXT NOT NULL,
        region_scope TEXT NOT NULL DEFAULT '',
        chateau TEXT NOT NULL DEFAULT '',
        year INTEGER NOT NULL,
        source_type TEXT NOT NULL,
        query TEXT NOT NULL,
        max_results_per_query INTEGER NOT NULL,
        results_json TEXT NOT NULL,
        created_at INTEGER NOT NULL,
        expires_at INTEGER NOT NULL
      );
      CREATE INDEX IF NOT EXISTS tavily_search_cache_expires_idx
        ON tavily_search_cache(expires_at);
    `);
    // Backward-compatible migration for caches created before region_scope/chateau.
    try {
      database.exec("ALTER TABLE tavily_search_cache ADD COLUMN region_scope TEXT NOT NULL DEFAULT '';");
    } catch {}
    try {
      database.exec("ALTER TABLE tavily_search_cache ADD COLUMN chateau TEXT NOT NULL DEFAULT '';");
    } catch {}
    return database;
  } catch {
    database = null;
    return null;
  }
}

export async function readTavilyCache(cacheKey: string): Promise<TavilyCacheResult[] | null> {
  const db = await getDatabase();
  if (!db) return null;

  try {
    const row = db
      .prepare("SELECT results_json, expires_at FROM tavily_search_cache WHERE cache_key = ?")
      .get(cacheKey) as CacheRow | undefined;
    if (!row) return null;
    if (row.expires_at <= Date.now()) {
      db.prepare("DELETE FROM tavily_search_cache WHERE cache_key = ?").run(cacheKey);
      return null;
    }

    try {
      return JSON.parse(row.results_json) as TavilyCacheResult[];
    } catch {
      db.prepare("DELETE FROM tavily_search_cache WHERE cache_key = ?").run(cacheKey);
      return null;
    }
  } catch {
    return null;
  }
}

export async function writeTavilyCache(
  cacheKey: string,
  input: CacheKeyInput,
  results: TavilyCacheResult[],
  ttlMs = TAVILY_CACHE_TTL_MS,
): Promise<void> {
  const db = await getDatabase();
  if (!db) return;

  const now = Date.now();
  try {
    db.prepare(`
      INSERT OR REPLACE INTO tavily_search_cache (
        cache_key,
        region,
        region_scope,
        chateau,
        year,
        source_type,
        query,
        max_results_per_query,
        results_json,
        created_at,
        expires_at
      )
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      cacheKey,
      input.region,
      input.regionScope ?? "",
      input.chateau ?? "",
      input.year,
      input.sourceType,
      input.query,
      input.maxResultsPerQuery,
      JSON.stringify(results),
      now,
      now + ttlMs,
    );
  } catch {
    // Cache writes are opportunistic; live Tavily results should still flow.
  }
}
