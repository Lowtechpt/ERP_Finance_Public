import { DatabaseSync } from "node:sqlite";
import { readFileSync, existsSync, unlinkSync } from "node:fs";
import { fileURLToPath } from "node:url";
import path from "node:path";
import seedData from "./seed-data.mjs";

const DIR = path.dirname(fileURLToPath(import.meta.url));
const DB_PATH = path.join(DIR, "erp-finance-demo.sqlite");
const SCHEMA_PATH = path.join(DIR, "schema.sql");

if (existsSync(DB_PATH)) unlinkSync(DB_PATH);

const db = new DatabaseSync(DB_PATH);
db.exec(readFileSync(SCHEMA_PATH, "utf8"));

db.exec("BEGIN");
try {
  for (const [table, rows] of Object.entries(seedData)) {
    if (!Array.isArray(rows) || rows.length === 0) continue;

    const columns = Object.keys(rows[0]);

    if (columns.length === 0) {
      const stmt = db.prepare(`INSERT INTO ${table} DEFAULT VALUES`);
      for (let i = 0; i < rows.length; i++) stmt.run();
    } else {
      const placeholders = columns.map(() => "?").join(", ");
      const stmt = db.prepare(
        `INSERT INTO ${table} (${columns.join(", ")}) VALUES (${placeholders})`,
      );

      for (const row of rows) {
        stmt.run(...columns.map((col) => row[col] ?? null));
      }
    }

    console.log(`${table}: ${rows.length} rows`);
  }
  db.exec("COMMIT");
} catch (err) {
  db.exec("ROLLBACK");
  throw err;
}

db.close();
console.log(`\nDemo database built at ${DB_PATH}`);
