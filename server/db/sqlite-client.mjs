import { DatabaseSync } from "node:sqlite";
import { fileURLToPath } from "node:url";
import path from "node:path";

const DB_PATH = path.join(path.dirname(fileURLToPath(import.meta.url)), "erp-finance-demo.sqlite");

let db = null;

function getDb() {
  if (!db) {
    db = new DatabaseSync(DB_PATH, { readOnly: true });
  }
  return db;
}

export function all(sql, params = []) {
  return getDb().prepare(sql).all(...params);
}

export function get(sql, params = []) {
  return getDb().prepare(sql).get(...params) ?? null;
}
