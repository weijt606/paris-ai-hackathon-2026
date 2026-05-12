import "server-only";
import Database from "better-sqlite3";
import { drizzle } from "drizzle-orm/better-sqlite3";
import { mkdirSync } from "node:fs";
import { dirname } from "node:path";
import { env } from "@/lib/env";
import * as schema from "@/lib/db/schema";

function filePath(url: string): string {
  return url.startsWith("file:") ? url.slice("file:".length) : url;
}

const path = filePath(env.DATABASE_URL);
mkdirSync(dirname(path), { recursive: true });

const sqlite = new Database(path);
sqlite.pragma("journal_mode = WAL");

export const db = drizzle(sqlite, { schema });
export { schema };
