import { DatabaseSync } from "node:sqlite";
import { readFileSync, existsSync, unlinkSync } from "node:fs";
import path from "node:path";
import seedData from "./seed-data.js";

// Resolved from the project root, not the module: the compiled output lives in
// dist/server/db while the schema and database file stay in the repo.
const DIR = path.resolve(process.cwd(), "server/db");
const DB_PATH = process.env.DEMO_DB_PATH ?? path.join(DIR, "erp-finance-demo.sqlite");
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
        const values = columns.map((col) => {
          const val = (row as Record<string, unknown>)[col];
          if (val === null || val === undefined) return null as any;
          if (typeof val === "string" || typeof val === "number" || typeof val === "boolean") return val as any;
          return String(val) as any;
        });
        stmt.run(...values);
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
