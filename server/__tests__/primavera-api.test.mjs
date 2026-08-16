// node:test suite for the compiled API handler (dist-server/primavera-api.js).
// Follows the project convention for server tests (see server/backends/demo.test.mjs):
// the server build is ESM and uses `import.meta`, so it cannot run under ts-jest
// (which emits CommonJS). Run via: npm run build:server && node --test server/__tests__/
import test from "node:test";
import assert from "node:assert/strict";
import { handler } from "../../dist-server/primavera-api.js";

function makeRequest({ url, method = "GET", headers = {}, body = "", ip = "127.0.0.1" }) {
  const req = {
    url,
    method,
    headers,
    socket: { remoteAddress: ip },
    destroy() {},
  };
  req.on = (event, cb) => {
    if (event === "data" && body) cb(Buffer.from(body));
    if (event === "end") cb();
  };
  return req;
}

function makeResponse() {
  const res = {
    statusCode: 0,
    headers: {},
    body: "",
    writeHead(code, headers) {
      this.statusCode = code;
      this.headers = headers || {};
    },
    end(body) {
      this.body = body || "";
    },
  };
  return res;
}

const ALLOWED_ORIGIN = "http://localhost:5173";

// POST routes register body listeners without awaiting them; give the end
// callback a chance to run before asserting on the response.
function tick() {
  return new Promise((resolve) => setImmediate(resolve));
}

test("GET /api/health returns demo metadata", async () => {
  const res = makeResponse();
  await handler(makeRequest({ url: "/api/health", ip: "10.0.0.1" }), res);

  assert.equal(res.statusCode, 200);
  const parsed = JSON.parse(res.body);
  assert.equal(parsed.ok, true);
  assert.equal(parsed.mode, "demo");
  assert.match(parsed.source, /Demo/);
});

test("GET /api/receivables returns the receivables array", async () => {
  const res = makeResponse();
  await handler(makeRequest({ url: "/api/receivables", ip: "10.0.0.2" }), res);

  assert.equal(res.statusCode, 200);
  const parsed = JSON.parse(res.body);
  assert.ok(Array.isArray(parsed.receivables));
});

test("unknown routes return 404", async () => {
  const res = makeResponse();
  await handler(makeRequest({ url: "/api/unknown", ip: "10.0.0.3" }), res);

  assert.equal(res.statusCode, 404);
  assert.equal(JSON.parse(res.body).error, "Not found");
});

test("OPTIONS preflight includes CORS headers for allowed origins", async () => {
  const res = makeResponse();
  await handler(
    makeRequest({ url: "/api/health", method: "OPTIONS", headers: { origin: ALLOWED_ORIGIN }, ip: "10.0.0.4" }),
    res,
  );

  assert.equal(res.statusCode, 204);
  assert.equal(res.headers["Access-Control-Allow-Origin"], ALLOWED_ORIGIN);
  assert.equal(res.headers["Access-Control-Allow-Methods"], "GET, POST, OPTIONS");
});

test("GET responses echo the CORS origin when allowed", async () => {
  const res = makeResponse();
  await handler(makeRequest({ url: "/api/health", headers: { origin: ALLOWED_ORIGIN }, ip: "10.0.0.5" }), res);

  assert.equal(res.statusCode, 200);
  assert.equal(res.headers["Access-Control-Allow-Origin"], ALLOWED_ORIGIN);
});

test("disallowed origins never get their origin echoed", async () => {
  const res = makeResponse();
  await handler(makeRequest({ url: "/api/health", headers: { origin: "http://evil.example.com" }, ip: "10.0.0.6" }), res);

  assert.equal(res.statusCode, 200);
  // sendJson falls back to the localhost default for unknown origins, so the
  // attacker origin is never reflected in Access-Control-Allow-Origin.
  assert.notEqual(res.headers["Access-Control-Allow-Origin"], "http://evil.example.com");
});

test("POST without application/json content type returns 415", async () => {
  const res = makeResponse();
  await handler(makeRequest({ url: "/api/register-payment", method: "POST", ip: "10.0.0.7" }), res);

  assert.equal(res.statusCode, 415);
});

test("oversized content-length returns 413", async () => {
  const res = makeResponse();
  await handler(
    makeRequest({ url: "/api/health", headers: { "content-length": String(1024 * 100 + 1) }, ip: "10.0.0.8" }),
    res,
  );

  assert.equal(res.statusCode, 413);
});

test("AI chat returns 503 when no Gemini key is configured", async () => {
  const originalGoogleKey = process.env.GOOGLE_API_KEY;
  const originalGeminiKey = process.env.GEMINI_API_KEY;
  delete process.env.GOOGLE_API_KEY;
  delete process.env.GEMINI_API_KEY;
  try {
    const res = makeResponse();
    await handler(
      makeRequest({
        url: "/api/ai/chat",
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ message: "Olá" }),
        ip: "10.0.0.9",
      }),
      res,
    );
    await tick();

    assert.equal(res.statusCode, 503);
  } finally {
    if (originalGoogleKey) process.env.GOOGLE_API_KEY = originalGoogleKey;
    if (originalGeminiKey) process.env.GEMINI_API_KEY = originalGeminiKey;
  }
});

test("AI chat proxies to Gemini and returns the reply", async () => {
  const originalGoogleKey = process.env.GOOGLE_API_KEY;
  const originalFetch = globalThis.fetch;
  globalThis.fetch = async () => ({
    ok: true,
    status: 200,
    json: async () => ({ candidates: [{ content: { parts: [{ text: "Resposta do teste" }] } }] }),
    text: async () => "",
  });
  process.env.GEMINI_API_KEY = "AIzaFAKE";
  delete process.env.GOOGLE_API_KEY;
  try {
    const res = makeResponse();
    await handler(
      makeRequest({
        url: "/api/ai/chat",
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ message: "Qual é a situação?" }),
        ip: "10.0.0.10",
      }),
      res,
    );
    await tick();

    assert.equal(res.statusCode, 200);
    assert.equal(JSON.parse(res.body).reply, "Resposta do teste");
  } finally {
    delete process.env.GEMINI_API_KEY;
    if (originalGoogleKey) process.env.GOOGLE_API_KEY = originalGoogleKey;
    globalThis.fetch = originalFetch;
  }
});

test("AI chat without a message field returns 400", async () => {
  const originalGoogleKey = process.env.GOOGLE_API_KEY;
  process.env.GEMINI_API_KEY = "AIzaFAKE";
  delete process.env.GOOGLE_API_KEY;
  try {
    const res = makeResponse();
    await handler(
      makeRequest({
        url: "/api/ai/chat",
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ history: [] }),
        ip: "10.0.0.11",
      }),
      res,
    );
    await tick();

    assert.equal(res.statusCode, 400);
  } finally {
    delete process.env.GEMINI_API_KEY;
    if (originalGoogleKey) process.env.GOOGLE_API_KEY = originalGoogleKey;
  }
});

test("malformed JSON on register-payment returns 400", async () => {
  const res = makeResponse();
  await handler(
    makeRequest({
      url: "/api/register-payment",
      method: "POST",
      headers: { "content-type": "application/json" },
      body: "{not-json",
      ip: "10.0.0.12",
    }),
    res,
  );

  assert.equal(res.statusCode, 400);
});

test("register-payment succeeds in demo mode", async () => {
  const res = makeResponse();
  await handler(
    makeRequest({
      url: "/api/register-payment",
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ document: "FT 100", amount: 100 }),
      ip: "10.0.0.13",
    }),
    res,
  );

  assert.equal(res.statusCode, 200);
  assert.equal(JSON.parse(res.body).ok, true);
});

test("invalid meses parameter on compare-periods returns 400", async () => {
  const res = makeResponse();
  await handler(makeRequest({ url: "/api/compare-periods?meses=abc", ip: "10.0.0.14" }), res);

  assert.equal(res.statusCode, 400);
});

test("valid compare-periods request returns periods", async () => {
  const res = makeResponse();
  await handler(makeRequest({ url: "/api/compare-periods?meses=6", ip: "10.0.0.15" }), res);

  assert.equal(res.statusCode, 200);
  assert.ok(Array.isArray(JSON.parse(res.body).periods));
});

test("document-lines without doc returns 400", async () => {
  const res = makeResponse();
  await handler(makeRequest({ url: "/api/document-lines?doc=", ip: "10.0.0.16" }), res);

  assert.equal(res.statusCode, 400);
});

test("invalid top-products params fall back to defaults", async () => {
  const res = makeResponse();
  await handler(makeRequest({ url: "/api/top-products?limit=abc&metric=bad&order=up", ip: "10.0.0.17" }), res);

  assert.equal(res.statusCode, 200);
});

test("rate limiting returns 429 after 100 requests per window", async () => {
  const ip = "192.168.99.99";
  for (let i = 0; i < 100; i++) {
    const res = makeResponse();
    await handler(makeRequest({ url: "/api/health", ip }), res);
    assert.equal(res.statusCode, 200);
  }

  const res = makeResponse();
  await handler(makeRequest({ url: "/api/health", ip }), res);
  assert.equal(res.statusCode, 429);
});