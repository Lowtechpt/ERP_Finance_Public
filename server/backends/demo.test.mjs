import test from "node:test";
import assert from "node:assert/strict";
import {
  getReceivables,
  getModules,
  getCustomers,
  getCashFlow,
  getDashboard,
  getPayables,
  getBanks,
  getDRE,
  getProductionCosts,
  getCostAnalysis,
  getAlerts,
  getHRCosts,
  buildFinancialSummary,
  getTopProducts,
  getProfitability,
  getBreakeven,
  getComparePeriods,
  getBudgetVsActual,
  getCollections,
  getCrm,
  getInventoryDetail,
  getVendorsAnalysis,
  getProductsDetail,
  getHRMonthly,
  getHR,
} from "../../dist-server/backends/demo.js";

test("getReceivables() returns array with valid structure", async () => {
  const result = await getReceivables();
  assert(Array.isArray(result), "result should be an array");
  assert(result.length <= 25, "result length should be <= 25");

  for (const item of result) {
    assert(typeof item.clientName === "string", "clientName should be string");
    assert(typeof item.totalAmount === "number", "totalAmount should be number");
    assert(!isNaN(item.totalAmount), "totalAmount should not be NaN");
    assert(["Vencido", "Pendente"].includes(item.status), `status should be "Vencido" or "Pendente", got ${item.status}`);
  }
});

test("getModules() returns array of modules with code, name, tableName, records", async () => {
  const result = await getModules();
  assert(Array.isArray(result), "result should be an array");

  for (const module of result) {
    assert(typeof module.code === "string", "code should be string");
    assert(typeof module.name === "string", "name should be string");
    assert(typeof module.tableName === "string", "tableName should be string");
    assert(typeof module.records === "number", "records should be number");
    assert(module.records >= 0, "records should be >= 0");
  }
});

test("getCustomers() returns array with valid structure", async () => {
  const result = await getCustomers();
  assert(Array.isArray(result), "result should be an array");
  assert(result.length <= 25, "result length should be <= 25");

  for (const customer of result) {
    assert(typeof customer.code === "string", "code should be string");
    assert(typeof customer.name === "string", "name should be string");
    assert(typeof customer.salesAmount === "number", "salesAmount should be number");
    assert(!isNaN(customer.salesAmount), "salesAmount should not be NaN");
  }
});

test("getCashFlow() returns object with receivablesByMonth, payablesByMonth, bankAccounts, treasuryMovements, summary", async () => {
  const result = await getCashFlow();
  assert(typeof result === "object" && result !== null, "result should be an object");
  assert(Array.isArray(result.receivablesByMonth), "receivablesByMonth should be array");
  assert(Array.isArray(result.payablesByMonth), "payablesByMonth should be array");
  assert(Array.isArray(result.bankAccounts), "bankAccounts should be array");
  assert(Array.isArray(result.treasuryMovements), "treasuryMovements should be array");
  assert(typeof result.summary === "object", "summary should be an object");
  assert(typeof result.summary.totalIncoming === "number", "summary.totalIncoming should be number");
  assert(typeof result.summary.totalOutgoing === "number", "summary.totalOutgoing should be number");
});

test("getDashboard() returns object with kpis, topClients, salesTrend, payablesAlert", async () => {
  const result = await getDashboard();
  assert(typeof result === "object" && result !== null, "result should be an object");
  assert(typeof result.kpis === "object", "kpis should be an object");
  assert(typeof result.kpis.totalOpen === "number", "kpis.totalOpen should be number");
  assert(typeof result.kpis.totalOverdue === "number", "kpis.totalOverdue should be number");
  assert(result.kpis.totalOpen >= 0, "totalOpen should be >= 0");
  assert(result.kpis.totalOverdue >= 0, "totalOverdue should be >= 0");
  assert(Array.isArray(result.topClients), "topClients should be array");
  assert(Array.isArray(result.salesTrend), "salesTrend should be array");
  assert(Array.isArray(result.payablesAlert), "payablesAlert should be array");
});

test("getPayables() returns array with valid structure", async () => {
  const result = await getPayables();
  assert(Array.isArray(result), "result should be an array");

  for (const payable of result) {
    assert(typeof payable.totalAmount === "number", "totalAmount should be number");
    assert(payable.totalAmount > 0, "totalAmount should be positive");
    assert(["Vencido", "Pendente"].includes(payable.status), `status should be "Vencido" or "Pendente", got ${payable.status}`);
  }
});

test("getBanks() returns object with accounts and movements arrays", async () => {
  const result = await getBanks();
  assert(typeof result === "object" && result !== null, "result should be an object");
  assert(Array.isArray(result.accounts), "accounts should be array");
  assert(Array.isArray(result.movements), "movements should be array");
});

test("getDRE() returns object with numeric financial fields", async () => {
  const result = await getDRE();
  assert(typeof result === "object" && result !== null, "result should be an object");

  const numericFields = [
    "vendasMercadorias", "descontos", "vendasLiquidas", "custoMercadoriasVendidas",
    "custoTotal", "margemBruta", "ebitda", "lucroLiquido"
  ];

  for (const field of numericFields) {
    assert(typeof result[field] === "number", `${field} should be number`);
    assert(!isNaN(result[field]), `${field} should not be NaN`);
  }
});

test("getProductionCosts() returns object with summary, orders, components, operations, articleCosts, stock, costing", async () => {
  const result = await getProductionCosts();
  assert(typeof result === "object" && result !== null, "result should be an object");
  assert(typeof result.summary === "object", "summary should be object");
  assert(Array.isArray(result.orders), "orders should be array");
  assert(Array.isArray(result.components), "components should be array");
  assert(Array.isArray(result.operations), "operations should be array");
  assert(Array.isArray(result.articleCosts), "articleCosts should be array");
  assert(Array.isArray(result.stock), "stock should be array");
  assert(Array.isArray(result.costing), "costing should be array");
});

test("getCostAnalysis() returns object with debitCosts, creditCosts, production, suppliers", async () => {
  const result = await getCostAnalysis();
  assert(typeof result === "object" && result !== null, "result should be an object");
  assert(Array.isArray(result.debitCosts), "debitCosts should be array");
  assert(Array.isArray(result.creditCosts), "creditCosts should be array");
  assert(typeof result.production === "object", "production should be object");
  assert(Array.isArray(result.suppliers), "suppliers should be array");
});

test("getAlerts() returns object with alerts array and counts object", async () => {
  const result = await getAlerts();
  assert(typeof result === "object" && result !== null, "result should be an object");
  assert(Array.isArray(result.alerts), "alerts should be array");
  assert(typeof result.counts === "object", "counts should be object");
  assert(typeof result.counts.total === "number", "counts.total should be number");
  assert(typeof result.counts.high === "number", "counts.high should be number");
  assert(typeof result.counts.medium === "number", "counts.medium should be number");
});

test("getHRCosts() returns object with contabilidade, funcionarios, detalhe arrays", async () => {
  const result = await getHRCosts();
  assert(typeof result === "object" && result !== null, "result should be an object");
  assert(Array.isArray(result.contabilidade), "contabilidade should be array");
  assert(typeof result.totalContabilidade === "number", "totalContabilidade should be number");
  assert(typeof result.funcionarios === "object", "funcionarios should be object");
  assert(Array.isArray(result.detalhe), "detalhe should be array");
});

test("buildFinancialSummary() returns object with recebiveis, pagamentos, fluxoCaixa, bancos, dre, alertas", async () => {
  const result = await buildFinancialSummary();
  assert(typeof result === "object" && result !== null, "result should be an object");
  assert(typeof result.recebiveis === "object", "recebiveis should be object");
  assert(typeof result.pagamentos === "object", "pagamentos should be object");
  assert(typeof result.fluxoCaixa === "object", "fluxoCaixa should be object");
  assert(Array.isArray(result.bancos), "bancos should be array");
  assert(Array.isArray(result.alertas), "alertas should be array");
});

test("getTopProducts({limit: 5}) returns object with products array of length <= 5", async () => {
  const result = await getTopProducts({ limit: 5 });
  assert(typeof result === "object" && result !== null, "result should be an object");
  assert(Array.isArray(result.products), "products should be array");
  assert(result.products.length <= 5, "products length should be <= 5");
  assert(typeof result.totals === "object", "totals should be object");
  assert(typeof result.totals.revenue === "number", "totals.revenue should be number");
});

test("getProfitability() returns array of products with profitability data", async () => {
  const result = await getProfitability();
  assert(Array.isArray(result), "result should be an array");

  for (const item of result) {
    assert(typeof item.Artigo === "string", "Artigo should be string");
    assert(typeof item.revenue === "number" || typeof item.qty === "number", "should have revenue or qty");
  }
});

test("getBreakeven() returns object with breakeven, beUnidades, margemPct, custosFixos", async () => {
  const result = await getBreakeven();
  assert(typeof result === "object" && result !== null, "result should be an object");
  assert(typeof result.breakeven === "number", "breakeven should be number");
  assert(typeof result.margemPct === "number", "margemPct should be number");
  assert(!isNaN(result.breakeven), "breakeven should not be NaN");
  assert(!isNaN(result.margemPct), "margemPct should not be NaN");
});

test("getComparePeriods() returns array of periods with mes, vendas, compras", async () => {
  const result = await getComparePeriods("6");
  assert(Array.isArray(result), "result should be an array");

  for (const period of result) {
    assert(typeof period.mes === "string", "mes should be string");
    assert(typeof period.vendas === "number", "vendas should be number");
    assert(typeof period.compras === "number", "compras should be number");
  }
});

test("getBudgetVsActual() returns object with real, orcamento, desvios", async () => {
  const result = await getBudgetVsActual();
  assert(typeof result === "object" && result !== null, "result should be an object");
  assert(typeof result.real === "object", "real should be object");
  assert(typeof result.orcamento === "object", "orcamento should be object");
  assert(typeof result.desvios === "object", "desvios should be object");
});

test("getCollections() returns array with collection data", async () => {
  const result = await getCollections();
  assert(Array.isArray(result), "result should be an array");
});

test("getCrm() returns array", async () => {
  const result = await getCrm();
  assert(Array.isArray(result), "result should be an array");
});

test("getInventoryDetail() returns array with inventory items", async () => {
  const result = await getInventoryDetail();
  assert(Array.isArray(result), "result should be an array");
});

test("getVendorsAnalysis() returns array with vendor data", async () => {
  const result = await getVendorsAnalysis();
  assert(Array.isArray(result), "result should be an array");
});

test("getProductsDetail() returns array with product details", async () => {
  const result = await getProductsDetail();
  assert(Array.isArray(result), "result should be an array");
});

test("getHRMonthly() returns array with monthly HR data", async () => {
  const result = await getHRMonthly();
  assert(Array.isArray(result), "result should be an array");
});

test("getHR() returns object with summary, funcionarios, recibos, ferias, historico", async () => {
  const result = await getHR();
  assert(typeof result === "object" && result !== null, "result should be an object");
  assert(typeof result.summary === "object", "summary should be object");
  assert(typeof result.summary.totalFuncionarios === "number", "summary.totalFuncionarios should be number");
  assert(Array.isArray(result.funcionarios), "funcionarios should be array");
  assert(Array.isArray(result.recibos), "recibos should be array");
  assert(Array.isArray(result.ferias), "ferias should be array");
  assert(Array.isArray(result.historico), "historico should be array");
});
