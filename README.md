# ERP Finance

A financial operations dashboard for industrial companies, built on top of the **PRIMAVERA ERP** ecosystem — receivables, payables, cash flow, DRE, production costs, HR costs and risk alerts across 20+ pages.

**Live demo:** https://lowtechpt.github.io/ERP_Finance_Public/

The demo runs entirely on synthetic data generated from a small SQLite database committed to this repo — no backend, no database server, nothing to configure. Click the link above and it just works.

## Why this project exists

ERP Finance started as a real integration against a live PRIMAVERA Evolution / SQL Server instance, reading receivables, payables, production orders, HR payroll and general-ledger data through `sqlcmd`. That version only runs on Windows, next to a licensed PRIMAVERA install, on `localhost` — not something you can hand someone as a link.

This repo keeps that integration but adds a second, fully portable data layer so the same frontend and the same business logic can run anywhere:

| | Real mode | Demo mode (default) |
|---|---|---|
| Data source | SQL Server PRIMAVERA (`sqlcmd`) | Bundled SQLite database |
| Requires | Windows, PRIMAVERA license, SQL Server | Nothing — `npm install && npm run dev` |
| Selected via | `PRIMAVERA_MODE=sqlserver` | default |
| Public deploy | not possible (real business data) | static JSON snapshots on GitHub Pages |

Both modes implement the exact same set of backend functions (`getReceivables`, `getDashboard`, `getDRE`, `getHRCosts`, …) behind a single router, so every page, every KPI and every chart works identically regardless of which one is running.

## Architecture

```
src/                      React 19 + TypeScript + Tailwind, hash-based routing
server/
  primavera-api.mjs        thin router — picks a backend by PRIMAVERA_MODE
  backends/
    sqlserver.mjs           real PRIMAVERA integration (sqlcmd + T-SQL)
    demo.mjs                SQLite integration (same functions, same shapes)
  db/
    schema.sql               SQLite schema mirroring the PRIMAVERA tables used
    seed-data.mjs             deterministic synthetic dataset (25 clients, 10
                               employees, a year of sales/purchases/GL entries…)
    build-demo-db.mjs         builds erp-finance-demo.sqlite from the two above
    generate-static-snapshots.mjs   pre-renders every GET endpoint to JSON for
                                     the static (GitHub Pages) build
.github/workflows/
  deploy-pages.yml          builds the static demo and publishes it to Pages
```

The frontend always calls the same `/api/...` paths. A tiny helper (`src/lib/api.ts`) resolves them to a live request during development and to a pre-built `.json` file in the static production build — the components never know the difference.

## Running locally

```bash
npm install
npm run dev
```

Opens on `http://127.0.0.1:5173` with the API on port 5000, running in **demo mode** by default (the SQLite database is already committed at `server/db/erp-finance-demo.sqlite`; regenerate it any time with `npm run seed:demo`).

To point it at a real PRIMAVERA installation instead:

```bash
PRIMAVERA_MODE=sqlserver PRIMAVERA_SQL_SERVER=".\SQLEXPRESS" PRIMAVERA_SQL_DATABASE=PRIDEMO npm run dev
```

This requires `sqlcmd` on `PATH` and Windows-integrated authentication to the target SQL Server instance.

### Optional: AI chat

The `/api/ai/chat` endpoint calls Gemini for a natural-language assistant panel. Set `GEMINI_API_KEY` (or `GOOGLE_API_KEY`) before starting the server to enable it; without a key it degrades gracefully with a "not configured" message. The public demo deliberately ships without a key.

## Building for GitHub Pages

```bash
npm run seed:demo
npm run build:static
```

`build:static` builds the Vite frontend with `VITE_STATIC=true` and then runs `generate-static-snapshots.mjs`, which calls every read-only demo-backend function directly and writes its response to `dist/api/<endpoint>.json`. The result is a fully static site — the `.github/workflows/deploy-pages.yml` workflow runs this exact sequence on every push to `main` and publishes `dist/` to Pages.

## Tech stack

React 19 · TypeScript · Vite · Tailwind CSS 4 · Radix UI primitives · Node.js `http` (no framework) · `node:sqlite` · SQL Server / `sqlcmd` for the real-data path.

## License

MIT.
