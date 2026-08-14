// Pre-computes one JSON file per read-only demo endpoint into dist/api/*.json,
// so the GitHub Pages build can serve them as static files (no backend at runtime).
// Mirrors the response shapes built by server/primavera-api.mjs's router for demo mode.
import { mkdirSync, writeFileSync } from "node:fs";
import path from "node:path";
import * as backend from "../backends/demo.mjs";

const OUT_DIR = path.resolve(process.cwd(), "dist", "api");
mkdirSync(OUT_DIR, { recursive: true });
mkdirSync(path.join(OUT_DIR, "profitability"), { recursive: true });
mkdirSync(path.join(OUT_DIR, "hr"), { recursive: true });

function write(name, data) {
  writeFileSync(path.join(OUT_DIR, `${name}.json`), JSON.stringify(data));
  console.log(`api/${name}.json`);
}

const now = () => new Date().toISOString();

async function main() {
  write("health", { ok: true, mode: "demo", ...backend.meta });

  write("receivables", { ...backend.meta, generatedAt: now(), receivables: await backend.getReceivables() });
  write("modules", { ...backend.meta, generatedAt: now(), modules: await backend.getModules() });
  write("customers", { ...backend.meta, generatedAt: now(), customers: await backend.getCustomers() });
  write("dashboard", { ...backend.meta, generatedAt: now(), ...(await backend.getDashboard()) });
  write("payables", { ...backend.meta, generatedAt: now(), payables: await backend.getPayables() });
  write("banks", { ...backend.meta, generatedAt: now(), ...(await backend.getBanks()) });
  write("cashflow", { ...backend.meta, generatedAt: now(), ...(await backend.getCashFlow()) });
  write("dre", { ...backend.meta, generatedAt: now(), ...(await backend.getDRE()) });
  write("production-costs", { ...backend.meta, generatedAt: now(), ...(await backend.getProductionCosts()) });
  write("cost-analysis", { ...backend.meta, generatedAt: now(), ...(await backend.getCostAnalysis()) });
  write("alerts", { ...backend.meta, generatedAt: now(), ...(await backend.getAlerts()) });
  write("hr-costs", { ...backend.meta, generatedAt: now(), ...(await backend.getHRCosts()) });
  write("top-products", { ...backend.meta, generatedAt: now(), ...(await backend.getTopProducts({ limit: 20, metric: "margin", order: "DESC" })) });
  write("financial-kpis", { ...backend.meta, ...(await backend.getFinancialKPIs()) });

  const profitability = { ...backend.meta, products: await backend.getProfitability() };
  write("profitability", profitability);
  write("profitability/product", profitability);

  write("breakeven", await backend.getBreakeven());
  write("compare-periods", { periods: await backend.getComparePeriods("12") });
  write("budget-vs-actual", await backend.getBudgetVsActual());
  write("collections", { overdue: await backend.getCollections() });
  write("crm", { contacts: await backend.getCrm() });
  write("inventory-detail", { inventory: await backend.getInventoryDetail() });
  write("vendors-analysis", { vendors: await backend.getVendorsAnalysis() });
  write("products-detail", { products: await backend.getProductsDetail() });
  write("hr/monthly", { ...backend.meta, generatedAt: now(), monthly: await backend.getHRMonthly() });
  write("hr", { ...backend.meta, generatedAt: now(), ...(await backend.getHR()) });

  console.log(`\nStatic API snapshots written to ${OUT_DIR}`);
}

main();
