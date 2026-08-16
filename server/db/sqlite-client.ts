import { DatabaseSync } from "node:sqlite";
import path from "node:path";

// Resolved from the project root, not the module: the compiled output lives in
// dist/server/db while the database file stays in the repo.
const DB_PATH = process.env.DEMO_DB_PATH ?? path.resolve(process.cwd(), "server/db/erp-finance-demo.sqlite");

let db: DatabaseSync | null = null;

function getDb(): DatabaseSync {
  if (!db) {
    db = new DatabaseSync(DB_PATH, { readOnly: true });
  }
  return db;
}

export function all<T = Record<string, unknown>>(sql: string, params?: (string | number | boolean | null)[]): T[] {
  return getDb().prepare(sql).all(...(params ?? [] as any)) as T[];
}

export function get<T = Record<string, unknown>>(sql: string, params?: (string | number | boolean | null)[]): T | null {
  return (getDb().prepare(sql).get(...(params ?? [] as any)) as T | undefined) ?? null;
}
