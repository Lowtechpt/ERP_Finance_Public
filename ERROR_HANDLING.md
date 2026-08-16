# Error Handling & Recovery — ERP Finance

Comprehensive error handling strategy, HTTP status codes, and recovery mechanisms.

## HTTP Status Codes

### 200 — OK
Successful request. Response body contains the requested data.

```bash
curl -i http://localhost:5000/api/health
# HTTP/1.1 200 OK
# {"status": "ok", "backend": "operational", "database": "demo"}
```

### 400 — Bad Request
Invalid input or malformed request. Common causes: malformed JSON body on a POST
endpoint, missing required field, invalid `doc` parameter.

Note: `limit` is **not** an example of a 400 — `validateLimit()` clamps
out-of-range values instead of rejecting them (a request with `limit=999`
silently gets `limit=100`, not an error). Invalid `metric`/`order` values are
similarly dropped to `undefined` rather than rejected. See `SECURITY_AUDIT.md`
§1 for the exact validation behavior per parameter.

```bash
curl -i -X POST http://localhost:5000/api/register-payment \
  -H "Content-Type: application/json" -d 'not-json'
# HTTP/1.1 400 Bad Request
# {"error": "Invalid JSON"}
```

### 404 — Not Found
Endpoint does not exist or resource not found.

```bash
curl -i http://localhost:5000/api/nonexistent
# HTTP/1.1 404 Not Found
# {"error": "Endpoint not found", "detail": "GET /api/nonexistent does not exist"}
```

### 429 — Too Many Requests
Rate limit exceeded. Server allows 100 requests per 60 seconds per IP.

```bash
# After 100+ rapid requests from same IP
curl -i http://localhost:5000/api/dashboard
# HTTP/1.1 429 Too Many Requests
# {"error": "Too many requests. Max 100 requests per minute."}
```

### 500 — Internal Server Error
Unexpected server error. Database connection failure, unhandled exception, or backend crash.

```bash
# When database is unavailable
curl -i http://localhost:5000/api/receivables
# HTTP/1.1 500 Internal Server Error
# {"error": "Internal server error", "detail": "..."}  # [production: no detail]
```

## Error Response Format

All error responses are JSON:

```json
{
  "error": "Error type (human-readable)",
  "detail": "Additional context (development only, omitted in production)"
}
```

**Production vs. Development**:
- Production (NODE_ENV=production): No detail, generic error message (max 255 chars), no stack traces
- Development: Full error details, stack trace, source context

## Backend Error Handling

### Input Validation

All query parameters are validated before processing:

```typescript
// Validates integer 1-100, default 10
function validateLimit(limit: string | null | undefined): number {
  const parsed = limit ? parseInt(limit, 10) : 10;
  if (isNaN(parsed) || parsed < 1) return 10;
  return Math.min(parsed, 100);
}

// Validates alphanumeric metric names
function validateMetric(metric: string | null | undefined): string | undefined {
  if (!metric) return undefined;
  const sanitized = sanitizeString(metric);
  if (!/^[a-zA-Z0-9_-]+$/.test(sanitized)) return undefined;
  return sanitized;
}
```

### Database Error Recovery

There is **no automatic failover** between backends — `PRIMAVERA_MODE` selects
one backend (`sqlserver` or `demo`) at process start, and that choice is
static for the life of the process. If the selected backend throws, the route
handler's `try/catch` returns a generic 500:

```typescript
try {
  const data = await backend.getReceivables();
  sendJson(response, 200, data);
} catch (error) {
  const errorMsg = error instanceof Error ? error.message : "Unknown error";
  sendJson(response, 500, { error: "Database error", detail: errorMsg });
}
```

Switching backends (e.g., moving from `sqlserver` to `demo` if SQL Server is
unreachable) requires restarting the process with a different `PRIMAVERA_MODE`
— it is an operator action, not something the app does automatically.

### Security Headers

Error responses include security headers to prevent information leakage:

```
X-Content-Type-Options: nosniff
X-Frame-Options: DENY
Content-Security-Policy: default-src 'self'; connect-src 'self' https://generativelanguage.googleapis.com
Referrer-Policy: strict-origin-when-cross-origin
```

## Client-Side Error Handling

### Try-Catch Pattern (actual current implementation)

Every one of the 23 pages fetches once on mount and follows the same, simpler
pattern described in `ARCHITECTURE.md` §2.4 — an `.ok` check, a typed
`.json()`, and a `catch` that sets a page-local error string rendered in place
of the data view:

```typescript
useEffect(() => {
  let ignore = false;
  fetch(apiUrl("/api/receivables"))
    .then((r) => r.json())
    .then((d) => !ignore && setData(d))
    .catch(() => !ignore && setError("Unable to load receivables."));
  return () => { ignore = true; };
}, []);
```

There is **no retry, no exponential backoff, and no client-side caching layer**
(no React Query/SWR, no `localStorage` response cache) today — each page
re-fetches on every mount, which is a deliberate trade-off (see
`ARCHITECTURE.md` §7.6: PRIMAVERA data changes through the day, so a stale
cache would be a correctness bug for a financial dashboard, not just a UX
nuance) rather than an oversight. Status-code-specific handling (429 vs. 400
vs. 500) is not differentiated per page; a failed fetch shows the same
page-local error state regardless of status code.

The one lightweight notification mechanism that does exist is a lift-and-set
toast (`notify()` in `src/App.tsx`) used by the hand-built receivables view for
transient confirmations — it is not a general-purpose error-handling system
wired into every page.

## Known Gaps (honestly stated, not hidden)

- **No retry/backoff on failed requests.** A failed fetch shows an error state
  and stops; the user has to navigate away and back (or reload) to retry.
- **No offline caching.** If the network drops mid-session, previously loaded
  data stays on screen (React state isn't cleared), but nothing is persisted
  for reload — a page refresh with no connection shows the error state.
- **No client-side error tracking service.** Errors are only visible in the
  browser console during development.

### Graceful Degradation (AI Workspace)

The AI Workspace and its chat panel are lazy-loaded (`React.lazy` +
`Suspense`); if the Gemini API key isn't configured, the backend's
`/api/ai/chat` returns a 503 with a clear error rather than crashing, and the
rest of the dashboard is unaffected — the data pages don't depend on AI
availability.

## Common Error Scenarios & Solutions

| Scenario | HTTP Code | Current behavior |
|---|---|---|
| Invalid limit parameter | 400 (or silently clamped) | Backend clamps `limit` to 1-100 rather than rejecting most out-of-range values; explicit `metric`/`order` validation failures are dropped to `undefined` |
| Rate limit exceeded | 429 | Client shows the page-local error state; no automatic retry |
| Database/backend error | 500 | Generic message in production, full detail in development; no automatic fallback to the other backend |
| CORS origin mismatch | (network error, no response readable) | Browser blocks reading the response; verify `ALLOWED_ORIGINS` |
| Gemini API key invalid/missing | 503 | AI chat shows an error; rest of the app is unaffected |
| Malformed JSON response | (JSON parse error) | Caught by the page's `.catch`, shown as a generic load error |

## Testing Error Scenarios

```bash
# limit is clamped, not rejected -- this returns 200 with limit effectively 100
curl "http://localhost:5000/api/receivables?limit=999"

# Test bad request (malformed JSON body)
curl -X POST http://localhost:5000/api/register-payment \
  -H "Content-Type: application/json" -d 'not-json'

# Test not found
curl http://localhost:5000/api/nonexistent

# Test rate limiting (100+ requests in 60s)
for i in {1..101}; do curl http://localhost:5000/api/health; done

# Test database error (kill SQL Server, try to fetch data)
# Expect 500 with generic "Internal server error" message
curl http://localhost:5000/api/receivables

# Test CORS (request from different origin)
curl -H "Origin: https://attacker.com" http://localhost:5000/api/health
# Expect no CORS headers in response
```

## Monitoring & Alerting

**Not implemented today.** Errors are only logged to `console` — there is no
error tracking service (Sentry, DataDog, or equivalent) wired in, and no
structured request logging. The sketch below is a suggested next step, not
current behavior:

```typescript
// Not yet implemented — example of what a future integration would look like
if (NODE_ENV === "production") {
  Sentry.captureException(error, {
    tags: { endpoint: "/api/receivables", status: 500 },
    extra: { request: req, response: res },
  });
}
```

---

See [API.md](./API.md) for endpoint specifications and [SECURITY_AUDIT.md](./SECURITY_AUDIT.md) for detailed security error handling.
