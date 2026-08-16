import http from "node:http";
import path from "node:path";
import { readFile } from "node:fs/promises";
import { pathToFileURL } from "node:url";
import * as sqlServerBackend from "./backends/sqlserver.js";
import * as demoBackend from "./backends/demo.js";
import type { IncomingMessage, ServerResponse } from "node:http";

const PORT = Number(process.env.MEG_FINANCE_API_PORT ?? 5000);
// Loopback by default so the dev API is not exposed on the network; container
// images set HOST=0.0.0.0 because they need to be reachable from outside.
const HOST = process.env.MEG_FINANCE_API_HOST ?? "127.0.0.1";
// Opt-in: when set, the API also serves the built frontend, so the demo runs as
// a single container. In development Vite serves the frontend instead.
const STATIC_DIR = process.env.STATIC_DIR ? path.resolve(process.env.STATIC_DIR) : null;
const PRIMAVERA_MODE: "sqlserver" | "demo" = process.env.PRIMAVERA_MODE === "sqlserver" ? "sqlserver" : "demo";
const backend = PRIMAVERA_MODE === "sqlserver" ? sqlServerBackend : demoBackend;
const NODE_ENV = process.env.NODE_ENV || "development";
const ALLOWED_ORIGINS = (process.env.ALLOWED_ORIGINS || "http://localhost:5173,http://127.0.0.1:5173").split(",");
const MAX_REQUEST_SIZE = 1024 * 100; // 100 KB
const RATE_LIMIT_WINDOW = 60 * 1000; // 1 minute
const RATE_LIMIT_MAX = 100; // requests per window

// ============ INPUT VALIDATION & SANITIZATION ============

function sanitizeString(input: string | null | undefined): string {
  if (!input) return "";
  return input.toString().substring(0, 255).replace(/[<>]/g, "");
}

function validateLimit(limit: string | null | undefined): number {
  const parsed = limit ? parseInt(limit, 10) : 10;
  if (isNaN(parsed) || parsed < 1) return 10;
  return Math.min(parsed, 100); // Cap at 100
}

// Validation functions reserved for future use (limit, order, metric filters)
// function validateOffset(offset: string | null | undefined): number {
//   const parsed = offset ? parseInt(offset, 10) : 0;
//   if (isNaN(parsed) || parsed < 0) return 0;
//   return parsed;
// }
//
// function validateSort(sort: string | null | undefined): string | undefined {
//   if (!sort) return undefined;
//   const sanitized = sanitizeString(sort);
//   if (!/^[a-zA-Z0-9_-]+$/.test(sanitized)) return undefined;
//   return sanitized;
// }

function validateMetric(metric: string | null | undefined): string | undefined {
  if (!metric) return undefined;
  const sanitized = sanitizeString(metric);
  if (!/^[a-zA-Z0-9_-]+$/.test(sanitized)) return undefined;
  return sanitized;
}

function validateOrder(order: string | null | undefined): "asc" | "desc" | undefined {
  if (!order) return undefined;
  const sanitized = sanitizeString(order).toLowerCase();
  return sanitized === "asc" || sanitized === "desc" ? sanitized : undefined;
}

// ============ STATIC FILE SERVING ============

const MIME_TYPES: Record<string, string> = {
  ".html": "text/html; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".svg": "image/svg+xml",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".ico": "image/x-icon",
  ".woff2": "font/woff2",
};

// Serves the built frontend with an SPA fallback. Returns false when STATIC_DIR
// is unset so the caller can fall through to the JSON 404.
async function serveStatic(request: IncomingMessage, response: ServerResponse): Promise<boolean> {
  if (!STATIC_DIR) return false;

  const urlPath = decodeURIComponent((request.url ?? "/").split("?")[0]);
  const candidate = path.resolve(STATIC_DIR, "." + path.posix.normalize(urlPath));

  // Reject anything that escapes STATIC_DIR, then fall back to the SPA entry
  // point so client-side routes resolve on a hard refresh.
  const target = candidate.startsWith(STATIC_DIR) && path.extname(candidate)
    ? candidate
    : path.join(STATIC_DIR, "index.html");

  try {
    const body = await readFile(target);
    response.writeHead(200, {
      "Content-Type": MIME_TYPES[path.extname(target)] ?? "application/octet-stream",
      "X-Content-Type-Options": "nosniff",
    });
    response.end(body);
    return true;
  } catch {
    return false;
  }
}

// ============ SECURITY HEADERS ============

function getCorsOrigin(request: IncomingMessage): string {
  const origin = request.headers.origin || "";
  return ALLOWED_ORIGINS.includes(origin) ? origin : "";
}

function sendJson(response: ServerResponse, statusCode: number, data: unknown, origin: string = ""): void {
  const corsOrigin = origin || "http://localhost:5173";
  const headers: Record<string, string> = {
    "Content-Type": "application/json; charset=utf-8",
    "X-Content-Type-Options": "nosniff",
    "X-Frame-Options": "DENY",
    "Referrer-Policy": "strict-origin-when-cross-origin",
  };

  if (corsOrigin && ALLOWED_ORIGINS.includes(corsOrigin)) {
    headers["Access-Control-Allow-Origin"] = corsOrigin;
    headers["Access-Control-Allow-Methods"] = "GET, POST, OPTIONS";
    headers["Access-Control-Allow-Headers"] = "Content-Type";
    headers["Access-Control-Max-Age"] = "86400";
  }

  // CSP: Restrict to self and Gemini API only
  headers["Content-Security-Policy"] = "default-src 'self'; connect-src 'self' https://generativelanguage.googleapis.com";

  // HSTS: Prepare for HTTPS
  if (NODE_ENV === "production") {
    headers["Strict-Transport-Security"] = "max-age=31536000; includeSubDomains; preload";
  }

  response.writeHead(statusCode, headers);

  // Sanitize error responses in production
  if (statusCode >= 400 && NODE_ENV === "production" && typeof data === "object" && data !== null) {
    const obj = data as Record<string, unknown>;
    if (obj.message && typeof obj.message === "string") {
      obj.message = obj.message.substring(0, 255);
    }
    if (obj.detail) {
      delete obj.detail; // Remove stack trace details in production
    }
  }

  response.end(JSON.stringify(data));
}

// ============ RATE LIMITING ============

const rateLimitStore = new Map<string, { count: number; resetTime: number }>();

function getClientIp(request: IncomingMessage): string {
  const forwarded = request.headers["x-forwarded-for"];
  if (typeof forwarded === "string") {
    return forwarded.split(",")[0].trim();
  }
  return request.socket.remoteAddress || "unknown";
}

function checkRateLimit(ip: string): boolean {
  const now = Date.now();
  const record = rateLimitStore.get(ip);

  if (!record || now > record.resetTime) {
    rateLimitStore.set(ip, { count: 1, resetTime: now + RATE_LIMIT_WINDOW });
    return true;
  }

  if (record.count >= RATE_LIMIT_MAX) {
    return false;
  }

  record.count++;
  return true;
}

// Cleanup old entries every 5 minutes
setInterval(() => {
  const now = Date.now();
  for (const [ip, record] of rateLimitStore.entries()) {
    if (now > record.resetTime) {
      rateLimitStore.delete(ip);
    }
  }
}, 5 * 60 * 1000);

export const handler: (request: IncomingMessage, response: ServerResponse) => Promise<void> = async (request, response) => {
  const clientIp = getClientIp(request);
  const origin = getCorsOrigin(request);

  // ============ SECURITY: Rate Limiting ============
  if (!checkRateLimit(clientIp)) {
    response.writeHead(429, { "Content-Type": "application/json" });
    response.end(JSON.stringify({ error: "Too many requests. Max 100 requests per minute." }));
    return;
  }

  // ============ SECURITY: Request Size Limit ============
  const contentLength = request.headers["content-length"];
  if (contentLength && parseInt(contentLength, 10) > MAX_REQUEST_SIZE) {
    sendJson(response, 413, { error: "Request body too large" }, origin);
    return;
  }

  // ============ SECURITY: Content-Type validation for POST ============
  if (request.method === "POST") {
    const contentType = request.headers["content-type"];
    if (!contentType?.includes("application/json")) {
      sendJson(response, 415, { error: "Content-Type must be application/json" }, origin);
      return;
    }
  }

  if (request.method === "OPTIONS") {
    const headers: Record<string, string> = {
      "X-Content-Type-Options": "nosniff",
      "X-Frame-Options": "DENY",
    };
    if (origin && ALLOWED_ORIGINS.includes(origin)) {
      headers["Access-Control-Allow-Origin"] = origin;
      headers["Access-Control-Allow-Methods"] = "GET, POST, OPTIONS";
      headers["Access-Control-Allow-Headers"] = "Content-Type";
      headers["Access-Control-Max-Age"] = "86400";
    }
    response.writeHead(204, headers);
    response.end();
    return;
  }

  try {
    if (request.url === "/api/health") {
      sendJson(response, 200, { ok: true, mode: PRIMAVERA_MODE, ...backend.meta }, origin);
      return;
    }

    if (request.url === "/api/receivables") {
      const receivables = await backend.getReceivables();
      sendJson(response, 200, { ...backend.meta, generatedAt: new Date().toISOString(), receivables }, origin);
      return;
    }

    if (request.url === "/api/modules") {
      const modules = await backend.getModules();
      sendJson(response, 200, { ...backend.meta, generatedAt: new Date().toISOString(), modules }, origin);
      return;
    }

    if (request.url === "/api/customers") {
      const customers = await backend.getCustomers();
      sendJson(response, 200, { ...backend.meta, generatedAt: new Date().toISOString(), customers }, origin);
      return;
    }

    if (request.url === "/api/dashboard") {
      const data = await backend.getDashboard();
      sendJson(response, 200, { ...backend.meta, generatedAt: new Date().toISOString(), ...data }, origin);
      return;
    }

    if (request.url === "/api/payables") {
      const payables = await backend.getPayables();
      sendJson(response, 200, { ...backend.meta, generatedAt: new Date().toISOString(), payables }, origin);
      return;
    }

    if (request.url === "/api/banks") {
      const data = await backend.getBanks();
      sendJson(response, 200, { ...backend.meta, generatedAt: new Date().toISOString(), ...data }, origin);
      return;
    }

    if (request.url === "/api/cashflow") {
      const cashflow = await backend.getCashFlow();
      sendJson(response, 200, { ...backend.meta, generatedAt: new Date().toISOString(), ...cashflow }, origin);
      return;
    }

    if (request.url?.startsWith("/api/dre")) {
      const dre = await backend.getDRE();
      sendJson(response, 200, { ...backend.meta, generatedAt: new Date().toISOString(), ...dre }, origin);
      return;
    }

    if (request.url === "/api/production-costs") {
      const data = await backend.getProductionCosts();
      sendJson(response, 200, { ...backend.meta, generatedAt: new Date().toISOString(), ...data }, origin);
      return;
    }

    if (request.url === "/api/cost-analysis") {
      const data = await backend.getCostAnalysis();
      sendJson(response, 200, { ...backend.meta, generatedAt: new Date().toISOString(), ...data }, origin);
      return;
    }

    if (request.url === "/api/alerts") {
      const data = await backend.getAlerts();
      sendJson(response, 200, { ...backend.meta, generatedAt: new Date().toISOString(), ...data }, origin);
      return;
    }

    if (request.url === "/api/hr-costs") {
      const hr = await backend.getHRCosts();
      sendJson(response, 200, { ...backend.meta, generatedAt: new Date().toISOString(), ...hr }, origin);
      return;
    }

    // ============ VALIDATED: /api/top-products ============
    if (request.url?.startsWith("/api/top-products")) {
      const url = new URL(`http://x${request.url}`);
      const limit = validateLimit(url.searchParams.get("limit"));
      const metric = validateMetric(url.searchParams.get("metric"));
      const order = validateOrder(url.searchParams.get("order"));
      const data = await backend.getTopProducts({
        limit: limit !== 10 ? limit : undefined, // only pass if non-default
        metric,
        order,
      });
      sendJson(response, 200, { ...backend.meta, generatedAt: new Date().toISOString(), ...data }, origin);
      return;
    }

    if (request.url === "/api/financial-kpis") {
      const data = await backend.getFinancialKPIs();
      sendJson(response, 200, { ...backend.meta, ...data }, origin);
      return;
    }

    if (request.url === "/api/open-erp") {
      if (PRIMAVERA_MODE === "sqlserver") {
        sqlServerBackend.launchErp();
        sendJson(response, 200, { launched: true }, origin);
      } else {
        sendJson(response, 200, await demoBackend.openErp(), origin);
      }
      return;
    }

    // ============ VALIDATED: /api/document-lines ============
    if (request.url?.startsWith("/api/document-lines?doc=")) {
      const doc = sanitizeString(decodeURIComponent(new URL(`http://x${request.url}`).searchParams.get("doc") ?? ""));
      if (!doc) {
        sendJson(response, 400, { error: "Invalid doc parameter" }, origin);
        return;
      }
      const lines = await backend.getDocumentLines(doc);
      sendJson(response, 200, { lines }, origin);
      return;
    }

    // ============ VALIDATED: /api/register-payment (POST) ============
    if (request.url === "/api/register-payment" && request.method === "POST") {
      let body = "";
      let bodySize = 0;

      request.on("data", (chunk) => {
        bodySize += chunk.length;
        if (bodySize > MAX_REQUEST_SIZE) {
          request.destroy();
          sendJson(response, 413, { error: "Request body too large" }, origin);
          return;
        }
        body += chunk;
      });

      request.on("end", () => {
        try {
          const data = JSON.parse(body);
          // Basic validation: expect object with payment details
          if (typeof data !== "object" || data === null) {
            sendJson(response, 400, { error: "Invalid request body" }, origin);
            return;
          }
          const result = backend.registerPayment(data);
          sendJson(response, 200, result, origin);
        } catch {
          sendJson(response, 400, { error: "Invalid JSON" }, origin);
        }
      });
      return;
    }

    // ============ VALIDATED: /api/ai/chat (POST) ============
    if (request.url === "/api/ai/chat" && request.method === "POST") {
      const apiKey = process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY;
      if (!apiKey) {
        sendJson(response, 503, { error: "Gemini não configurado. Defina a variável de ambiente GEMINI_API_KEY ou GOOGLE_API_KEY." }, origin);
        return;
      }

      let body = "";
      let bodySize = 0;

      request.on("data", (chunk) => {
        bodySize += chunk.length;
        if (bodySize > MAX_REQUEST_SIZE) {
          request.destroy();
          sendJson(response, 413, { error: "Request body too large" }, origin);
          return;
        }
        body += chunk;
      });

      request.on("end", async () => {
        try {
          const { message, history } = JSON.parse(body);
          if (!message || typeof message !== "string") {
            sendJson(response, 400, { error: "Campo 'message' é obrigatório." }, origin);
            return;
          }

          // Sanitize message length
          const sanitizedMessage = sanitizeString(message.substring(0, 5000));

          const model = process.env.GEMINI_MODEL || "gemini-2.0-flash-lite";
          const summary = await backend.buildFinancialSummary();

          const systemPrompt = `Tu és o assistente financeiro da ERP Finance, uma aplicação de gestão financeira industrial conectada ao PRIMAVERA Evolution. Responde em português de Portugal. Usa os dados financeiros reais fornecidos no contexto para responder. Seja conciso, prático e orientado à ação. Formatação: usa negrito para KPIs importantes e listas para ações recomendadas.`;

          const contextBlock = `\n\n--- CONTEXTO FINANCEIRO ATUAL ---\n${JSON.stringify(summary, null, 2)}\n--- FIM DO CONTEXTO ---`;

          const contents: Array<{ role: string; parts: Array<{ text: string }> }> = [];
          if (Array.isArray(history)) {
            for (const msg of history.slice(-10)) {
              if (msg.role && msg.content && typeof msg.content === "string") {
                contents.push({ role: msg.role === "user" ? "user" : "model", parts: [{ text: sanitizeString(msg.content).substring(0, 1000) }] });
              }
            }
          }
          contents.push({ role: "user", parts: [{ text: sanitizedMessage + contextBlock }] });

          const geminiUrl = `https://generativelanguage.googleapis.com/v1beta/models/${sanitizeString(model)}:generateContent?key=${apiKey}`;
          const geminiRes = await fetch(geminiUrl, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              system_instruction: { parts: [{ text: systemPrompt }] },
              contents,
            }),
          });

          if (!geminiRes.ok) {
            // Log error details but don't expose to client
            await geminiRes.text(); // consume response
            sendJson(response, geminiRes.status, { error: `Gemini API error ${geminiRes.status}` }, origin);
            return;
          }

          const geminiData = (await geminiRes.json()) as any;
          const reply = geminiData.candidates?.[0]?.content?.parts?.[0]?.text ?? "Sem resposta do Gemini.";
          sendJson(response, 200, { reply }, origin);
        } catch (err) {
          if (NODE_ENV === "production") {
            sendJson(response, 500, { error: "Erro ao processar pedido." }, origin);
          } else {
            sendJson(response, 500, { error: "Erro ao processar pedido.", detail: err instanceof Error ? err.message : String(err) }, origin);
          }
        }
      });
      return;
    }

    if (request.url === "/api/profitability" || request.url === "/api/profitability/product") {
      const products = await backend.getProfitability();
      sendJson(response, 200, { ...backend.meta, products }, origin);
      return;
    }

    if (request.url === "/api/breakeven") {
      const data = await backend.getBreakeven();
      sendJson(response, 200, data, origin);
      return;
    }

    // ============ VALIDATED: /api/compare-periods ============
    if (request.url?.startsWith("/api/compare-periods")) {
      const mesesStr = new URL(`http://x${request.url}`).searchParams.get("meses") ?? "6";
      const meses = sanitizeString(mesesStr);
      if (!/^\d+$/.test(meses)) {
        sendJson(response, 400, { error: "Invalid meses parameter" }, origin);
        return;
      }
      const periods = await backend.getComparePeriods(meses);
      sendJson(response, 200, { periods }, origin);
      return;
    }

    if (request.url === "/api/budget-vs-actual") {
      const data = await backend.getBudgetVsActual();
      sendJson(response, 200, data, origin);
      return;
    }

    if (request.url === "/api/collections") {
      const overdue = await backend.getCollections();
      sendJson(response, 200, { overdue }, origin);
      return;
    }

    if (request.url === "/api/crm") {
      const contacts = await backend.getCrm();
      sendJson(response, 200, { contacts }, origin);
      return;
    }

    if (request.url === "/api/inventory-detail") {
      const inventory = await backend.getInventoryDetail();
      sendJson(response, 200, { inventory }, origin);
      return;
    }

    if (request.url === "/api/vendors-analysis") {
      const vendors = await backend.getVendorsAnalysis();
      sendJson(response, 200, { vendors }, origin);
      return;
    }

    if (request.url === "/api/products-detail") {
      const products = await backend.getProductsDetail();
      sendJson(response, 200, { products }, origin);
      return;
    }

    if (request.url?.startsWith("/api/hr/monthly")) {
      const monthly = await backend.getHRMonthly();
      sendJson(response, 200, { ...backend.meta, generatedAt: new Date().toISOString(), monthly }, origin);
      return;
    }

    if (request.url === "/api/hr") {
      const hr = await backend.getHR();
      sendJson(response, 200, { ...backend.meta, generatedAt: new Date().toISOString(), ...hr }, origin);
      return;
    }

    if (await serveStatic(request, response)) return;

    sendJson(response, 404, { error: "Not found" }, origin);
  } catch (error) {
    if (NODE_ENV === "production") {
      sendJson(response, 500, { error: "Request failed. Please try again." }, origin);
    } else {
      sendJson(response, 500, {
        error: "Request failed",
        message: error instanceof Error ? error.message : String(error),
      }, origin);
    }
  }
};

const isMainModule = process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href;
if (isMainModule) {
  const server = http.createServer(handler);
  server.listen(PORT, HOST, () => {
    console.log(`ERP Finance API (mode: ${PRIMAVERA_MODE}) listening on http://${HOST}:${PORT}`);
    if (STATIC_DIR) console.log(`Serving frontend from ${STATIC_DIR}`);
  });
}
