import http from "node:http";
import { pathToFileURL } from "node:url";
import * as sqlServerBackend from "./backends/sqlserver.mjs";
import * as demoBackend from "./backends/demo.mjs";

const PORT = Number(process.env.MEG_FINANCE_API_PORT ?? 5000);
const PRIMAVERA_MODE = process.env.PRIMAVERA_MODE === "sqlserver" ? "sqlserver" : "demo";
const backend = PRIMAVERA_MODE === "sqlserver" ? sqlServerBackend : demoBackend;

function sendJson(response, statusCode, data) {
  response.writeHead(statusCode, {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type",
    "Content-Type": "application/json; charset=utf-8",
  });
  response.end(JSON.stringify(data));
}

export const handler = async (request, response) => {
  if (request.method === "OPTIONS") {
    sendJson(response, 204, {});
    return;
  }

  try {
    if (request.url === "/api/health") {
      sendJson(response, 200, { ok: true, mode: PRIMAVERA_MODE, ...backend.meta });
      return;
    }

    if (request.url === "/api/receivables") {
      const receivables = await backend.getReceivables();
      sendJson(response, 200, { ...backend.meta, generatedAt: new Date().toISOString(), receivables });
      return;
    }

    if (request.url === "/api/modules") {
      const modules = await backend.getModules();
      sendJson(response, 200, { ...backend.meta, generatedAt: new Date().toISOString(), modules });
      return;
    }

    if (request.url === "/api/customers") {
      const customers = await backend.getCustomers();
      sendJson(response, 200, { ...backend.meta, generatedAt: new Date().toISOString(), customers });
      return;
    }

    if (request.url === "/api/dashboard") {
      const data = await backend.getDashboard();
      sendJson(response, 200, { ...backend.meta, generatedAt: new Date().toISOString(), ...data });
      return;
    }

    if (request.url === "/api/payables") {
      const payables = await backend.getPayables();
      sendJson(response, 200, { ...backend.meta, generatedAt: new Date().toISOString(), payables });
      return;
    }

    if (request.url === "/api/banks") {
      const data = await backend.getBanks();
      sendJson(response, 200, { ...backend.meta, generatedAt: new Date().toISOString(), ...data });
      return;
    }

    if (request.url === "/api/cashflow") {
      const cashflow = await backend.getCashFlow();
      sendJson(response, 200, { ...backend.meta, generatedAt: new Date().toISOString(), ...cashflow });
      return;
    }

    if (request.url?.startsWith("/api/dre")) {
      const dre = await backend.getDRE();
      sendJson(response, 200, { ...backend.meta, generatedAt: new Date().toISOString(), ...dre });
      return;
    }

    if (request.url === "/api/production-costs") {
      const data = await backend.getProductionCosts();
      sendJson(response, 200, { ...backend.meta, generatedAt: new Date().toISOString(), ...data });
      return;
    }

    if (request.url === "/api/cost-analysis") {
      const data = await backend.getCostAnalysis();
      sendJson(response, 200, { ...backend.meta, generatedAt: new Date().toISOString(), ...data });
      return;
    }

    if (request.url === "/api/alerts") {
      const data = await backend.getAlerts();
      sendJson(response, 200, { ...backend.meta, generatedAt: new Date().toISOString(), ...data });
      return;
    }

    if (request.url === "/api/hr-costs") {
      const hr = await backend.getHRCosts();
      sendJson(response, 200, { ...backend.meta, generatedAt: new Date().toISOString(), ...hr });
      return;
    }

    if (request.url?.startsWith("/api/top-products")) {
      const url = new URL(`http://x${request.url}`);
      const data = await backend.getTopProducts({
        limit: url.searchParams.get("limit"),
        metric: url.searchParams.get("metric"),
        order: url.searchParams.get("order"),
      });
      sendJson(response, 200, { ...backend.meta, generatedAt: new Date().toISOString(), ...data });
      return;
    }

    if (request.url === "/api/financial-kpis") {
      const data = await backend.getFinancialKPIs();
      sendJson(response, 200, { ...backend.meta, ...data });
      return;
    }

    if (request.url === "/api/open-erp") {
      if (PRIMAVERA_MODE === "sqlserver") {
        sqlServerBackend.launchErp();
        sendJson(response, 200, { launched: true });
      } else {
        sendJson(response, 200, await demoBackend.openErp());
      }
      return;
    }

    if (request.url?.startsWith("/api/document-lines?doc=")) {
      const doc = decodeURIComponent(new URL(`http://x${request.url}`).searchParams.get("doc") ?? "");
      if (!doc) { sendJson(response, 400, { error: "doc param required" }); return; }
      const lines = await backend.getDocumentLines(doc);
      sendJson(response, 200, { lines });
      return;
    }

    if (request.url === "/api/register-payment" && request.method === "POST") {
      let body = "";
      request.on("data", (chunk) => { body += chunk; });
      request.on("end", () => {
        try {
          const data = JSON.parse(body);
          const result = backend.registerPayment(data);
          sendJson(response, 200, result);
        } catch {
          sendJson(response, 400, { error: "Invalid JSON" });
        }
      });
      return;
    }

    if (request.url === "/api/ai/chat" && request.method === "POST") {
      const apiKey = process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY;
      if (!apiKey) {
        sendJson(response, 503, { error: "Gemini não configurado. Defina a variável de ambiente GEMINI_API_KEY ou GOOGLE_API_KEY." });
        return;
      }

      let body = "";
      request.on("data", (chunk) => { body += chunk; });
      request.on("end", async () => {
        try {
          const { message, history } = JSON.parse(body);
          if (!message || typeof message !== "string") {
            sendJson(response, 400, { error: "Campo 'message' é obrigatório." });
            return;
          }

          const model = process.env.GEMINI_MODEL || "gemini-2.0-flash-lite";
          const summary = await backend.buildFinancialSummary();

          const systemPrompt = `Tu és o assistente financeiro da Meg-Finance, uma aplicação de gestão financeira industrial conectada ao PRIMAVERA Evolution. Responde em português de Portugal. Usa os dados financeiros reais fornecidos no contexto para responder. Seja conciso, prático e orientado à ação. Formatação: usa negrito para KPIs importantes e listas para ações recomendadas.`;

          const contextBlock = `\n\n--- CONTEXTO FINANCEIRO ATUAL ---\n${JSON.stringify(summary, null, 2)}\n--- FIM DO CONTEXTO ---`;

          const contents = [];
          if (Array.isArray(history)) {
            for (const msg of history.slice(-10)) {
              contents.push({ role: msg.role === "user" ? "user" : "model", parts: [{ text: msg.content }] });
            }
          }
          contents.push({ role: "user", parts: [{ text: message + contextBlock }] });

          const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;
          const geminiRes = await fetch(url, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              system_instruction: { parts: [{ text: systemPrompt }] },
              contents,
            }),
          });

          if (!geminiRes.ok) {
            const errText = await geminiRes.text();
            sendJson(response, geminiRes.status, { error: `Gemini API erro ${geminiRes.status}`, detail: errText });
            return;
          }

          const geminiData = await geminiRes.json();
          const reply = geminiData.candidates?.[0]?.content?.parts?.[0]?.text ?? "Sem resposta do Gemini.";
          sendJson(response, 200, { reply });
        } catch (err) {
          sendJson(response, 500, { error: "Erro ao processar pedido.", detail: err instanceof Error ? err.message : String(err) });
        }
      });
      return;
    }

    if (request.url === "/api/profitability" || request.url === "/api/profitability/product") {
      const products = await backend.getProfitability();
      sendJson(response, 200, { ...backend.meta, products });
      return;
    }

    if (request.url === "/api/breakeven") {
      const data = await backend.getBreakeven();
      sendJson(response, 200, data);
      return;
    }

    if (request.url?.startsWith("/api/compare-periods")) {
      const meses = new URL(`http://x${request.url}`).searchParams.get("meses") ?? "6";
      const periods = await backend.getComparePeriods(meses);
      sendJson(response, 200, { periods });
      return;
    }

    if (request.url === "/api/budget-vs-actual") {
      const data = await backend.getBudgetVsActual();
      sendJson(response, 200, data);
      return;
    }

    if (request.url === "/api/collections") {
      const overdue = await backend.getCollections();
      sendJson(response, 200, { overdue });
      return;
    }

    if (request.url === "/api/crm") {
      const contacts = await backend.getCrm();
      sendJson(response, 200, { contacts });
      return;
    }

    if (request.url === "/api/inventory-detail") {
      const inventory = await backend.getInventoryDetail();
      sendJson(response, 200, { inventory });
      return;
    }

    if (request.url === "/api/vendors-analysis") {
      const vendors = await backend.getVendorsAnalysis();
      sendJson(response, 200, { vendors });
      return;
    }

    if (request.url === "/api/products-detail") {
      const products = await backend.getProductsDetail();
      sendJson(response, 200, { products });
      return;
    }

    if (request.url?.startsWith("/api/hr/monthly")) {
      const monthly = await backend.getHRMonthly();
      sendJson(response, 200, { ...backend.meta, generatedAt: new Date().toISOString(), monthly });
      return;
    }

    if (request.url === "/api/hr") {
      const hr = await backend.getHR();
      sendJson(response, 200, { ...backend.meta, generatedAt: new Date().toISOString(), ...hr });
      return;
    }

    sendJson(response, 404, { error: "Not found" });
  } catch (error) {
    sendJson(response, 500, {
      error: "Primavera SQL query failed",
      message: error instanceof Error ? error.message : String(error),
    });
  }
};

const isMainModule = process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href;
if (isMainModule) {
  const server = http.createServer(handler);
  server.listen(PORT, "127.0.0.1", () => {
    console.log(`Meg-Finance API (mode: ${PRIMAVERA_MODE}) listening on http://127.0.0.1:${PORT}`);
  });
}
