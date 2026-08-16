# ERP Finance — Security Audit

Scope: `server/primavera-api.ts` (the API surface), `server/backends/*.ts` (data access),
frontend secret handling (`GeminiChatPanel`), CI/CD, and container configuration. Written
against the current `main` branch — check `git log -1` for the exact commit this reflects.
Findings are graded ✅ (in place), ⚠️ (gap, with a concrete fix), or 🔲 (not applicable /
not attempted, stated honestly).

---

## 1. Input Validation

**✅ Query-string parameters are allow-listed, not blindly interpolated.**
`server/primavera-api.ts` validates every parameter that can influence a SQL Server query
run through `sqlcmd`:

```ts
function validateLimit(limit: string | null | undefined): number {
  const parsed = limit ? parseInt(limit, 10) : 10;
  if (isNaN(parsed) || parsed < 1) return 10;
  return Math.min(parsed, 100);              // hard cap, prevents unbounded result sets
}

function validateMetric(metric: string | null | undefined): string | undefined {
  if (!metric) return undefined;
  const sanitized = sanitizeString(metric);
  if (!/^[a-zA-Z0-9_-]+$/.test(sanitized)) return undefined;   // allow-list regex
  return sanitized;
}

function validateOrder(order): "asc" | "desc" | undefined {   // closed enum, no free text
  ...
}
```

Applied to `/api/top-products` (`limit`, `metric`, `order`), `/api/compare-periods`
(`meses` — digits-only regex), and `/api/document-lines` (`doc` — sanitized + non-empty
check before it reaches `backend.getDocumentLines(doc)`).

**✅ `sanitizeString()` bounds every free-text input.**
```ts
function sanitizeString(input: string | null | undefined): string {
  if (!input) return "";
  return input.toString().substring(0, 255).replace(/[<>]/g, "");
}
```
Truncates to 255 chars and strips `<`/`>` — a minimal but real defense against reflected
payloads landing in a JSON response that a future HTML-rendering consumer might trust.

**✅ POST bodies are size- and type-gated before parsing.**
`/api/register-payment` and `/api/ai/chat` both cap the accumulated body at 100 KB
(destroying the connection if exceeded) and require `Content-Type: application/json`
(415 otherwise) — before `JSON.parse` ever runs, closing off unbounded-body DoS and
content-sniffing surprises.

**✅ AI chat input is length-capped both directions.**
`message.substring(0, 5000)`, chat history capped to the last 10 turns, each turn's
content capped to 1000 chars before being forwarded to the Gemini API — bounds both the
attack surface and the token cost of a runaway conversation.

**⚠️ Gap: the SQL Server backend still shells out via `sqlcmd`.**
`sqlserver.ts` builds a query string and passes it to a spawned `sqlcmd` process rather
than using a parameterized driver call. Every *endpoint-facing* input that reaches a query
is validated (above), so there is currently no known injection path from an HTTP request —
but the underlying mechanism (string-built SQL text handed to a subprocess) is inherently
riskier than parameterized queries, and any *new* endpoint added without equally careful
validation would reopen the class of bug.
**Fix**: migrate query construction to a parameterized SQL Server driver (e.g., `mssql`,
using `request.input()` calls), retiring the `sqlcmd` subprocess path entirely. An earlier
attempt at this via TypeORM was removed from the project (it was never actually wired
into the running app and broke the build) — this remains open future work, not a
solved problem.

**✅ SQLite demo path is fully parameterized.**
`server/db/sqlite-client.ts`'s `all(sql, params)` / `get(sql, params)` always bind
parameters through `node:sqlite`'s prepared statements — no string concatenation.

---

## 2. Authentication & Authorization

**🔲 There is no authentication layer today — stated plainly, not hidden.**
Every `/api/*` endpoint is open to any client that can reach the port. This is acceptable
for the current deployment shape (localhost-only dev, a single-tenant demo instance, or a
static public snapshot with no mutation endpoints reachable) but is the single largest gap
before this could sit on an open network with real ERP credentials behind it.

**✅ CORS is an explicit allow-list, not `*`.**
```ts
const ALLOWED_ORIGINS = (process.env.ALLOWED_ORIGINS ||
  "http://localhost:5173,http://127.0.0.1:5173").split(",");
...
if (corsOrigin && ALLOWED_ORIGINS.includes(corsOrigin)) {
  headers["Access-Control-Allow-Origin"] = corsOrigin;
  ...
}
```
An origin not on the list gets no `Access-Control-Allow-Origin` header at all — the browser
enforces the block. OPTIONS preflights are handled the same way, with a 204 and the same
allow-list check, rather than a blanket "allow everything on preflight" shortcut.

**✅ Session/token handling: none needed today, correctly.**
There is no session state (no cookies, no bearer tokens) because there is no user identity
concept yet — consistent with the no-auth posture above rather than a half-implemented
auth layer with holes in it.

**⚠️ Gap: `/api/register-payment` and `/api/open-erp` are mutating/privileged actions
with no authorization check beyond "reachable and rate-limited."**
`/api/open-erp` launches the desktop PRIMAVERA client process on the server host in
`sqlserver` mode; `/api/register-payment` accepts a JSON payload as a payment record with
only a type check (`typeof data === "object"`).
**Fix (recommended, ordered by effort)**:
1. Short-term: gate both behind a shared-secret header (`X-Api-Key`) checked against an
   env var — a few lines, closes the "anyone on the network can trigger these" gap
   immediately.
2. Medium-term: JWT-based auth (issue a token after a login step, verify on every
   mutating route) once there's a real user directory to authenticate against.
3. Longer-term: OAuth2/OIDC against the company's existing identity provider if this
   moves beyond a single-tenant deployment, so PRIMAVERA access rights and app access
   rights stay in sync instead of diverging.

---

## 3. Data Protection

**✅ Secrets live in environment variables, never in source.**
`GEMINI_API_KEY` / `GOOGLE_API_KEY` and `ALLOWED_ORIGINS` are read from `process.env` in
`primavera-api.ts`; there is no `DB_PASSWORD` or any other credential variable, because
the SQL Server backend authenticates via `sqlcmd`'s trusted (Windows-integrated)
connection rather than a username/password pair — never hardcoded.
`.env.example` documents every variable with **placeholder, non-functional values**
(`Strong@Password123` is the well-known SQL Server CI test password, not a real secret);
`.env.local` (gitignored) is where real values go.

**✅ The Gemini key has a second, deliberately separate path: user-supplied, client-side.**
`GeminiChatPanel` lets a visitor paste their *own* Gemini API key into up to 3 named slots,
stored in `localStorage` in the browser — never sent to or stored by the ERP Finance
backend. This matters specifically for the public GitHub Pages demo: there is no backend
at all to hold a shared key, so the only honest option is "bring your own key, it stays on
your machine." The backend-side `/api/ai/chat` path (used in `sqlserver`/`demo`/Docker
modes) is the *other* option — a server-held key via `GEMINI_API_KEY`, never exposed to
the client.

**✅ XSS: React's default JSX escaping is the primary defense, and nothing bypasses it.**
No `dangerouslySetInnerHTML` is used for user- or API-derived content anywhere in
`src/pages/` or `src/components/`; the Markdown-lite rendering in the AI chat
(`FormattedAiMessage`) parses into React elements rather than injecting raw HTML.

**⚠️ Gap: no CSRF protection.**
`/api/register-payment` is a POST endpoint reachable cross-origin in principle (the CORS
check blocks the *browser* from reading the response for a disallowed origin, but does not
by itself stop a form-based CSRF POST from being *sent* and processed, since CORS is a
read-side protection, not a request-side one). Currently low severity because: (a) there is
no session/cookie-based auth for a forged request to piggyback on, and (b) the demo backend
treats it as a no-op acknowledgement. It becomes a real issue the moment auth is added.
**Fix**: once §2's auth work lands, add a CSRF token (double-submit cookie or
`SameSite=Strict` session cookie) on all mutating routes, or require the `X-Api-Key`
header from §2 as a de facto anti-CSRF token (a plain `<form>` POST cannot set a custom
header).

**✅ HTTPS: HSTS is wired for production, actual TLS termination is left to the platform.**
```ts
if (NODE_ENV === "production") {
  headers["Strict-Transport-Security"] = "max-age=31536000; includeSubDomains; preload";
}
```
The app doesn't terminate TLS itself (correct — that's a reverse proxy/hosting platform's
job), but it does tell browsers to *only* use HTTPS for a year once it's served over
HTTPS once, which is the right posture for a Node process sitting behind nginx/a cloud
load balancer.

---

## 4. Dependency Security

**✅ `npm audit` reports 0 vulnerabilities** (verify with `npm audit`; no `--force` or
`--legacy-peer-deps` used to get there). The stack uses current major versions: React 19,
Vite 8, TypeScript 6, Node ≥22.5 (enforced via `engines` in `package.json`).

**Dependency footprint** (from `package.json`): production dependencies are deliberately
small — Radix primitives, `class-variance-authority`, `clsx`/`tailwind-merge`, React. The
compiled backend (`server/**/*.ts` → `dist-server/`) has **zero runtime dependencies** —
it imports only Node built-ins (`node:http`, `node:sqlite`, `node:child_process`, etc.), so
the production Docker image installs no `node_modules` at all. No general-purpose HTTP
framework, no ORM — an earlier TypeORM + `mssql` dependency pair was removed because it
was never actually wired into the running app and broke the build; there is no ORM
anywhere in this codebase today.

**⚠️ Gap: no automated `npm audit` (or equivalent) gate in CI.**
`.github/workflows/ci.yml` runs typecheck, build, and tests, but does not currently fail
the build on a high/critical advisory in the dependency tree.
**Fix**: add `npm audit --audit-level=high` (or `npm audit signatures` for supply-chain
provenance) as a CI step, non-blocking at first (report-only) to establish a baseline
without breaking unrelated PRs, then promote to blocking once the baseline is clean.

**🔲 No Dependabot/Renovate configuration found in the repo.**
**Fix**: enable GitHub's built-in Dependabot version updates (a `.github/dependabot.yml`
with `package-ecosystem: npm`, weekly interval) — zero-infrastructure way to get automated
PRs for outdated/vulnerable packages, appropriate for a project this size before
justifying a dedicated Renovate config.

**Update strategy today**: manual, ad hoc (dependencies bumped when a feature needs a
newer API — e.g., the React 19 / Vite 8 / TypeScript 6 upgrades visible in `package.json`).
Reasonable for a single-maintainer project; the Dependabot addition above is the natural
next step once there's more than one contributor relying on timely updates.

---

## 5. Deployment Security

**✅ Docker: non-root, zero-dependency final image.**
`Dockerfile` uses `node:22-alpine` (small attack surface vs. `node:22`), a three-stage
build (`builder` → `demo` → `development`) so the final `demo` image contains only
`dist/`, `dist-server/`, and the baked-in SQLite file — no `npm install` at all in that
stage, since the compiled API has zero runtime dependencies, and no source maps, dev
dependencies, or build tooling ship to production. The `demo` stage explicitly runs as
`USER node` (the unprivileged user the base image ships), not root.

**✅ Network security: rate limiting is real, not cosmetic.**
100 requests/minute per IP (§ Rate Limiting middleware, `ARCHITECTURE.md` §3.3), swept
every 5 minutes, applied *before* any route logic runs — the cheapest possible DoS
mitigation and correctly placed first in the middleware order.
**🔲 No dedicated firewall/WAF configuration** — appropriate to note as out of scope for
an application-layer codebase; that responsibility sits with whatever platform (cloud load
balancer, reverse proxy) fronts the container in a real deployment, and isn't something
`primavera-api.ts` should own.

**⚠️ Gap: secret rotation has no defined process.**
`GEMINI_API_KEY` and any future API keys are static env vars with no documented
rotation cadence or revocation runbook.
**Fix**: document a rotation runbook in `docs/` (which env vars exist, where they're set
per environment, how to rotate without downtime — e.g., dual-key overlap window for
Gemini) even before automating it; automation (e.g., a secrets manager with scheduled
rotation) is reasonable to defer until there's a production deployment with real
uptime requirements.

**✅ Access control on the repo itself**: `.env.local` is gitignored (never committed);
`.env.example` is explicitly kept free of real credentials per project convention
(documented in the project's own working rules) — the placeholder `SA_PASSWORD` in
`ci.yml` is a throwaway value scoped to an ephemeral CI service container, not a shared
secret.

---

## 6. Monitoring & Incident Response

**🔲 No error tracking service (Sentry or equivalent) is integrated today.**
**Fix — concrete integration sketch**:
```ts
// server/primavera-api.ts, top-level catch:
} catch (error) {
  Sentry.captureException(error, { extra: { url: request.url, ip: clientIp } });
  if (NODE_ENV === "production") {
    sendJson(response, 500, { error: "Request failed. Please try again." }, origin);
  } else { ... }
}
```
Frontend equivalent: wrap `App()` in a Sentry `ErrorBoundary` and initialize
`Sentry.init({ dsn, environment })` in `main.tsx`. Both are additive — no change to
existing error-handling logic, just an extra reporting call alongside it.

**✅ CI logs double as a lightweight audit trail today.**
Every `typecheck`/`build`/`test` run in `.github/workflows/ci.yml` is timestamped and
retained by GitHub Actions — sufficient for "what changed and when did it start failing,"
though not a substitute for runtime observability once the app is actually serving
traffic outside CI.

**🔲 No structured application logging.**
The backend currently logs only a single startup line (`console.log` in
`primavera-api.ts`'s `isMainModule` block) — no per-request access log, no structured
(JSON) log output.
**Fix**: add a minimal request logger (method, URL, status, latency, client IP) as the
first middleware step, written as JSON lines to stdout — trivially aggregable by any log
platform (CloudWatch, Datadog, or even `docker logs` piped to `jq`) without adding a
logging framework dependency.

**Security incident response plan — currently informal, should be formalized as:**
1. **Detect**: rate-limit 429s and repeated 4xx from a single IP are the only current
   signal (visible only by reading logs manually today — motivates the logging fix above).
2. **Contain**: `ALLOWED_ORIGINS` and `GEMINI_API_KEY` can be rotated/tightened via env
   var without a code change, so the fastest containment lever (revoke a leaked key,
   narrow CORS) doesn't require a deploy.
3. **Eradicate/Recover**: the demo backend's read-only SQLite file means "an attacker
   corrupted data" isn't a risk in that mode; the SQL Server path inherits PRIMAVERA's own
   backup/restore posture, which is outside this codebase's control.
4. **Review**: no postmortem template exists yet — a one-page `docs/INCIDENT_TEMPLATE.md`
   (what happened, blast radius, root cause, fix, prevention) is a cheap thing to add
   before it's needed.

**Regular security audits**: this document is the first formal one. Recommended cadence
going forward: re-run this checklist whenever a new mutating endpoint is added, and at
minimum before any move from "single-tenant/demo" to "networked production" deployment.

---

## Summary

| Area | Posture |
|---|---|
| Input validation | ✅ Strong on the HTTP boundary; ⚠️ `sqlcmd` subprocess is a latent risk class |
| Auth/authorization | 🔲 None today (deliberate, documented); ⚠️ mutating routes need a gate before going public |
| Data protection | ✅ Secrets in env vars, dual Gemini-key strategy, no XSS bypasses; ⚠️ no CSRF token |
| Dependency security | ✅ Small, current dependency set; ⚠️ no automated audit gate or Dependabot yet |
| Deployment security | ✅ Multi-stage minimal Docker image, non-root container, real rate limiting; ⚠️ no secret rotation runbook |
| Monitoring & IR | ⚠️ No error tracking or structured logs yet; plan above is a concrete, low-effort next sprint |

None of the ⚠️ items are blocking for the project's current shape (local dev / self-hosted
demo / static public portfolio). They are the explicit punch list for the day this app
handles a real, networked, multi-user deployment against a live PRIMAVERA instance.
