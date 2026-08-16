import { all, get } from "../db/sqlite-client.js";

export const meta = { source: "ERP Finance Demo (SQLite)", server: "sqlite", database: "erp-finance-demo.sqlite" };

function today(): string {
  return new Date().toISOString().slice(0, 10);
}

export async function getReceivables(): Promise<any[]> {
  return all<any>(`
    SELECT
      COALESCE(c.Nome, '') AS clientName,
      COALESCE(c.NumContrib, '') AS nif,
      (d.TipoDoc || ' ' || d.Serie || '/' || d.NumDoc) AS documentNumber,
      d.Data AS documentDate,
      d.DataVencimento AS dueDate,
      CAST(julianday(?) - julianday(d.DataVencimento) AS INTEGER) AS daysOverdue,
      ROUND(COALESCE(NULLIF(d.TotalDocumento,0), d.TotalMerc + d.TotalIva - d.TotalDesc), 2) AS totalAmount,
      0 AS paidAmount,
      ROUND(COALESCE(NULLIF(d.TotalDocumento,0), d.TotalMerc + d.TotalIva - d.TotalDesc), 2) AS openAmount,
      d.Moeda AS currency,
      CASE WHEN d.DataVencimento < ? THEN 'Vencido' ELSE 'Pendente' END AS status,
      COALESCE(d.CondPag, '') AS paymentCondition,
      COALESCE(d.RespCobranca, '') AS collector,
      COALESCE(d.Referencia, '') AS reference
    FROM CabecDoc d
    LEFT JOIN Clientes c ON c.Cliente = d.Entidade
    LEFT JOIN CabecDocStatus s ON s.IdCabecDoc = d.Id
    WHERE COALESCE(s.Anulado, 0) = 0
      AND d.TipoEntidade = 'C'
      AND COALESCE(NULLIF(d.TotalDocumento, 0), d.TotalMerc + d.TotalIva - d.TotalDesc) <> 0
    ORDER BY d.DataVencimento ASC, d.Data DESC
    LIMIT 25
  `, [today(), today()]);
}

const MODULE_TABLES: [string, string, string][] = [
  ["BAS", "Base Aplicacional", "Clientes"],
  ["VND", "Vendas", "CabecDoc"],
  ["VND-LIN", "Linhas de venda", "LinhasDoc"],
  ["CCT", "Contas Correntes", "DocumentosCCT"],
  ["TES", "Tesouraria", "CabecTesouraria"],
  ["CMP", "Compras", "CabecCompras"],
  ["INV", "Inventário", "INV_Movimentos"],
  ["STK", "Stock atual", "INV_ValoresActuaisStock"],
  ["GPR", "Produção", "GPR_OrdemFabrico"],
  ["GPR-CMP", "Componentes de produção", "GPR_OrdemFabricoComponentes"],
  ["CBL", "Contabilidade", "Movimentos"],
  ["CBL-PC", "Plano de contas", "PlanoContas"],
  ["CRM", "Contactos/CRM", "Contactos"],
  ["RHP", "Recursos Humanos", "Funcionarios"],
  ["FOR", "Fornecedores", "Fornecedores"],
  ["ART", "Artigos", "Artigo"],
  ["ARM", "Armazéns", "Armazens"],
  ["VDR", "Vendedores", "Vendedores"],
];

export async function getModules(): Promise<any[]> {
  const modules: any[] = MODULE_TABLES.map(([code, name, tableName]) => ({
    code, name, tableName,
    records: get<any>(`SELECT COUNT(*) AS n FROM ${tableName}`)?.n,
  }));
  const versionRows = all<any>(`SELECT DISTINCT Modulo FROM VersaoModulo ORDER BY Modulo`);
  for (const { Modulo } of versionRows) {
    modules.push({ code: Modulo, name: `Módulo ${Modulo}`, tableName: "VersaoModulo", records: 1 });
  }
  modules.sort((a, b) => (a.code > b.code ? 1 : -1));
  return modules;
}

export async function getCustomers(): Promise<any[]> {
  return all<any>(`
    SELECT
      c.Cliente AS code, c.Nome AS name,
      COALESCE(c.Email, '') AS email, COALESCE(c.Fac_Tel, '') AS telefone,
      c.NumContrib AS nif, c.Moeda AS currency,
      ROUND(COALESCE(SUM(COALESCE(NULLIF(d.TotalDocumento,0), d.TotalMerc + d.TotalIva - d.TotalDesc)), 0), 2) AS salesAmount,
      COUNT(d.Id) AS documentCount,
      ROUND(COALESCE(c.TotalDeb, 0), 2) AS currentDebt,
      ROUND(COALESCE(c.LimiteCred, 0), 2) AS creditLimit,
      COALESCE(c.CondPag, '') AS paymentCondition,
      COALESCE(c.Vendedor, '') AS seller
    FROM Clientes c
    LEFT JOIN CabecDoc d ON d.Entidade = c.Cliente AND d.TipoEntidade = 'C'
    LEFT JOIN CabecDocStatus s ON s.IdCabecDoc = d.Id AND COALESCE(s.Anulado, 0) = 0
    WHERE COALESCE(c.ClienteAnulado, 0) = 0
    GROUP BY c.Cliente
    ORDER BY salesAmount DESC, currentDebt DESC
    LIMIT 25
  `);
}

export async function getCashFlow(): Promise<any> {
  const now = new Date();
  const currentMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;

  const receivablesByMonth = all<any>(`
    SELECT strftime('%Y-%m', DataVencimento) AS month, COUNT(*) AS docs,
      ROUND(SUM(COALESCE(NULLIF(TotalDocumento,0), TotalMerc+TotalIva-TotalDesc)), 2) AS total
    FROM CabecDoc
    WHERE TipoEntidade='C' AND DataVencimento >= date('now','-3 months') AND DataVencimento <= date('now','+6 months')
    GROUP BY month ORDER BY month
  `);
  const payablesByMonth = all<any>(`
    SELECT strftime('%Y-%m', DataVencimento) AS month, COUNT(*) AS docs,
      ROUND(SUM(COALESCE(NULLIF(TotalDocumento,0), TotalMerc+TotalIva-TotalDesc)), 2) AS total
    FROM CabecCompras
    WHERE DataVencimento >= date('now','-3 months') AND DataVencimento <= date('now','+6 months')
    GROUP BY month ORDER BY month
  `);
  const bankAccounts = all<any>(`SELECT Conta, DescBanco, Banco, Moeda, TipoConta FROM ContasBancarias`);
  const treasuryMovements = all<any>(`
    SELECT TipoDoc, (TipoDoc || ' ' || Serie || '/' || NumDoc) AS doc,
      COALESCE(Entidade,'') AS entidade, TipoEntidade,
      ROUND(TotalDebito, 2) AS debit, ROUND(TotalCredito, 2) AS credit,
      COALESCE(ContaOrigem,'') AS contaOrigem, Moeda
    FROM CabecTesouraria ORDER BY DataUltimaActualizacao DESC LIMIT 20
  `);

  const totalIncoming = receivablesByMonth
    .filter((r) => r.month >= currentMonth && r.total > 0)
    .reduce((sum, r) => sum + Number(r.total), 0);
  const totalOutgoing = payablesByMonth
    .filter((p) => p.month >= currentMonth)
    .reduce((sum, p) => sum + Math.abs(Number(p.total)), 0);

  return {
    receivablesByMonth, payablesByMonth, bankAccounts, treasuryMovements,
    summary: { totalIncoming, totalOutgoing, projectedBalance: totalIncoming - totalOutgoing },
  };
}

export async function getDocumentLines(docNumber: string): Promise<any[]> {
  return all<any>(`
    SELECT l.NumLinha, l.Artigo, COALESCE(l.Descricao,'') AS descricao,
      ROUND(l.Quantidade, 4) AS quantidade, ROUND(l.PrecUnit, 4) AS precUnit,
      ROUND(COALESCE(l.Desconto1,0), 2) AS desconto,
      ROUND(l.TotalIliquido, 2) AS totalLiquido, ROUND(l.TaxaIva, 2) AS taxaIva,
      ROUND(l.TotalIva, 2) AS totalIva, COALESCE(l.Armazem,'') AS armazem
    FROM LinhasDoc l
    JOIN CabecDoc d ON d.Id = l.IdCabecDoc
    WHERE (d.TipoDoc || ' ' || d.Serie || '/' || d.NumDoc) = ?
    ORDER BY l.NumLinha
  `, [docNumber]);
}

export async function openErp(): Promise<{ launched: boolean; error: string }> {
  return { launched: false, error: "Não disponível em modo demo" };
}

export function launchErp(): void {
  // no-op in demo mode: there is no local PRIMAVERA install to open
}

const paymentLog: any[] = [];

export function registerPayment(data: any): { ok: boolean; id: number } {
  paymentLog.push({ ...data, registeredAt: new Date().toISOString() });
  return { ok: true, id: paymentLog.length };
}

export async function getFinancialKPIs(): Promise<any> {
  const dre = get<any>(`
    SELECT
      ROUND(COALESCE(SUM(CASE WHEN Conta='711' AND Natureza='C' THEN Valor WHEN Conta='711' AND Natureza='D' THEN -Valor ELSE 0 END), 0), 2) AS vendas,
      ROUND(COALESCE(SUM(CASE WHEN Conta='611' AND Natureza='D' THEN Valor WHEN Conta='611' AND Natureza='C' THEN -Valor ELSE 0 END), 0), 2) AS cmv,
      ROUND(COALESCE(SUM(CASE WHEN substr(Conta,1,1)='6' AND Conta<>'611' AND Natureza='D' THEN Valor ELSE 0 END), 0), 2) AS gastos
    FROM Movimentos WHERE DataGravacao >= date('now','-12 months')
  `) ?? {};
  // Recent-documents proxy only: the demo dataset never marks a sales
  // document as "paid" (no settlement tracking), so summing every document
  // ever issued would overstate outstanding AR far beyond a realistic DSO.
  // Approximate the current AR balance from the most recently issued
  // documents (by position, not by real-world date, so this stays correct
  // regardless of how long ago the seed dataset's fixed date range was
  // generated relative to the real clock).
  const rec = get<any>(`
    SELECT ROUND(COALESCE(SUM(COALESCE(NULLIF(TotalDocumento,0),TotalMerc+TotalIva-TotalDesc)),0),2) AS totalRecebiveis
    FROM (
      SELECT d.TotalDocumento, d.TotalMerc, d.TotalIva, d.TotalDesc
      FROM CabecDoc d LEFT JOIN CabecDocStatus s ON s.IdCabecDoc=d.Id
      WHERE d.TipoEntidade='C' AND COALESCE(s.Anulado,0)=0
        AND COALESCE(NULLIF(d.TotalDocumento,0),d.TotalMerc+d.TotalIva-d.TotalDesc) > 0
      ORDER BY d.Data DESC
      LIMIT 10
    ) d
  `) ?? {};
  const pay = get<any>(`
    SELECT ROUND(COALESCE(SUM(ABS(COALESCE(NULLIF(TotalDocumento,0),TotalMerc+TotalIva-TotalDesc))),0),2) AS totalPagar
    FROM (SELECT TotalDocumento, TotalMerc, TotalIva, TotalDesc FROM CabecCompras ORDER BY DataVencimento DESC LIMIT 10)
  `) ?? {};
  const stk = get<any>(`
    SELECT ROUND(COALESCE(SUM(s.Stock * COALESCE(c.CustoGrpCstMBase,0)),0),2) AS valorStock
    FROM INV_ValoresActuaisStock s LEFT JOIN INV_ValoresActuaisCusteio c ON c.Artigo=s.Artigo
  `) ?? {};
  const bnk = get<any>(`
    SELECT ROUND(COALESCE(SUM(CASE WHEN Natureza='D' THEN Valor ELSE -Valor END),0),2) AS saldoBancario
    FROM Movimentos WHERE Conta='12' AND DataGravacao >= date('now','-12 months')
  `) ?? {};

  const vendas = Number(dre.vendas ?? 0);
  const cmv = Number(dre.cmv ?? 0);
  const gastos = Number(dre.gastos ?? 0);
  const margem = vendas - cmv;
  const recebiveis = Number(rec.totalRecebiveis ?? 0);
  const aPagar = Number(pay.totalPagar ?? 0);
  const stock = Number(stk.valorStock ?? 0);
  const saldoBancario = Number(bnk.saldoBancario ?? 0);
  const capitalCirculante = recebiveis + stock - aPagar;
  const dso = vendas > 0 ? (recebiveis / (vendas / 365)) : 0;

  return {
    vendas, cmv, margem,
    margemPct: vendas ? (margem / vendas) * 100 : 0,
    ebitda: margem - gastos,
    ebitdaPct: vendas ? ((margem - gastos) / vendas) * 100 : 0,
    recebiveis, aPagar, stock, saldoBancario,
    capitalCirculante, dso: Math.round(dso),
  };
}

export async function getDashboard(): Promise<any> {
  const kpis = get<any>(`
    SELECT
      ROUND(COALESCE(SUM(CASE WHEN d.DataVencimento < ? THEN COALESCE(NULLIF(d.TotalDocumento,0), d.TotalMerc+d.TotalIva-d.TotalDesc) ELSE 0 END), 0), 2) AS totalOverdue,
      ROUND(COALESCE(SUM(COALESCE(NULLIF(d.TotalDocumento,0), d.TotalMerc+d.TotalIva-d.TotalDesc)), 0), 2) AS totalOpen,
      COUNT(*) AS docCount,
      COUNT(DISTINCT d.Entidade) AS clientCount
    FROM CabecDoc d
    LEFT JOIN CabecDocStatus s ON s.IdCabecDoc = d.Id
    WHERE COALESCE(s.Anulado,0)=0 AND d.TipoEntidade='C'
      AND COALESCE(NULLIF(d.TotalDocumento,0), d.TotalMerc+d.TotalIva-d.TotalDesc) > 0
  `, [today()]);

  const topClients = all<any>(`
    SELECT c.Nome AS name, c.Cliente AS code,
      ROUND(COALESCE(SUM(COALESCE(NULLIF(d.TotalDocumento,0), d.TotalMerc+d.TotalIva-d.TotalDesc)),0), 2) AS salesAmount,
      ROUND(COALESCE(c.TotalDeb,0), 2) AS currentDebt
    FROM Clientes c
    LEFT JOIN CabecDoc d ON d.Entidade=c.Cliente AND d.TipoEntidade='C'
    WHERE COALESCE(c.ClienteAnulado,0)=0
    GROUP BY c.Cliente
    ORDER BY salesAmount DESC LIMIT 5
  `);

  const salesTrend = all<any>(`
    SELECT strftime('%Y-%m', Data) AS month,
      ROUND(SUM(COALESCE(NULLIF(TotalDocumento,0), TotalMerc+TotalIva-TotalDesc)), 2) AS total,
      COUNT(*) AS docs
    FROM CabecDoc WHERE TipoEntidade='C' AND Data >= date('now','-5 months')
    GROUP BY month ORDER BY month
  `);

  const payablesAlert = all<any>(`
    SELECT (c.TipoDoc || ' ' || c.Serie || '/' || c.NumDoc) AS doc,
      COALESCE(NULLIF(c.Nome,''), f.Nome) AS supplier,
      c.DataVencimento AS dueDate,
      CAST(julianday(c.DataVencimento) - julianday(?) AS INTEGER) AS daysOverdue,
      ROUND(ABS(COALESCE(NULLIF(c.TotalDocumento,0), c.TotalMerc+c.TotalIva-c.TotalDesc)), 2) AS total
    FROM CabecCompras c LEFT JOIN Fornecedores f ON f.Fornecedor=c.Entidade
    WHERE c.DataVencimento >= date('now','-90 days') AND c.DataVencimento <= date('now','+30 days')
    ORDER BY c.DataVencimento ASC LIMIT 10
  `, [today()]);

  return { kpis: kpis ?? {}, topClients, salesTrend, payablesAlert };
}

export async function getPayables(): Promise<any[]> {
  return all<any>(`
    SELECT
      (c.TipoDoc || ' ' || c.Serie || '/' || c.NumDoc) AS doc,
      c.Entidade AS supplierCode,
      COALESCE(NULLIF(c.Nome,''), f.Nome) AS supplierName,
      COALESCE(NULLIF(c.NumContribuinte,''), f.NumContrib) AS nif,
      c.DataDoc AS docDate,
      c.DataVencimento AS dueDate,
      CAST(julianday(?) - julianday(c.DataVencimento) AS INTEGER) AS daysOverdue,
      ROUND(ABS(COALESCE(NULLIF(c.TotalDocumento,0), c.TotalMerc+c.TotalIva-c.TotalDesc)), 2) AS totalAmount,
      c.Moeda AS currency,
      COALESCE(c.CondPag,'') AS paymentCondition,
      CASE WHEN c.DataVencimento < ? THEN 'Vencido' ELSE 'Pendente' END AS status
    FROM CabecCompras c
    LEFT JOIN Fornecedores f ON f.Fornecedor=c.Entidade
    WHERE ABS(COALESCE(NULLIF(c.TotalDocumento,0), c.TotalMerc+c.TotalIva-c.TotalDesc)) > 0
    ORDER BY c.DataVencimento ASC LIMIT 30
  `, [today(), today()]);
}

export async function getBanks(): Promise<any> {
  const accounts = all<any>(`
    SELECT Conta, COALESCE(DescBanco,'') AS descBanco, COALESCE(Banco,'') AS banco, Moeda,
      TipoConta, ROUND(COALESCE(Limite,0), 2) AS limite
    FROM ContasBancarias ORDER BY Conta
  `);
  const movements = all<any>(`
    SELECT (TipoDoc || ' ' || Serie || '/' || NumDoc) AS doc,
      TipoDoc, COALESCE(Entidade,'') AS entidade, TipoEntidade,
      ROUND(TotalDebito, 2) AS debit, ROUND(TotalCredito, 2) AS credit,
      COALESCE(ContaOrigem,'') AS contaOrigem, COALESCE(ContaDestino,'') AS contaDestino,
      Moeda, COALESCE(Observacoes,'') AS obs
    FROM CabecTesouraria ORDER BY DataUltimaActualizacao DESC LIMIT 30
  `);
  return { accounts, movements };
}

export async function getDRE(): Promise<any> {
  const sales = get<any>(`
    SELECT ROUND(COALESCE(SUM(TotalMerc),0), 2) AS vendasMercadorias,
      ROUND(COALESCE(SUM(TotalDesc),0), 2) AS descontos,
      ROUND(COALESCE(SUM(TotalIva),0), 2) AS iva
    FROM CabecDoc d LEFT JOIN CabecDocStatus s ON s.IdCabecDoc=d.Id
    WHERE COALESCE(s.Anulado,0)=0 AND d.TipoEntidade='C' AND d.Data >= date('now','-12 months')
  `) ?? { vendasMercadorias: 0, descontos: 0, iva: 0 };
  const opex = get<any>(`
    SELECT ROUND(COALESCE(SUM(Valor),0), 2) AS custosOperacionais
    FROM Movimentos WHERE Natureza='D' AND DataGravacao >= date('now','-12 months')
  `) ?? { custosOperacionais: 0 };
  const production = get<any>(`
    SELECT
      ROUND(COALESCE(SUM(CustoMateriaisReal + CustoTransformacaoReal + OutrosCustosReal),0), 2) AS custoProducaoReal,
      ROUND(COALESCE(SUM(CustoMateriaisPrevisto + CustoTransformacaoPrevisto + OutrosCustosPrevito),0), 2) AS custoProducaoPrevisto
    FROM GPR_OrdemFabrico WHERE DataOrdemFabrico >= date('now','-12 months')
  `) ?? { custoProducaoReal: 0, custoProducaoPrevisto: 0 };

  const vendasLiquidas = (sales.vendasMercadorias || 0) - (sales.descontos || 0);
  const custoMercadoriasVendidas = vendasLiquidas * 0.65;
  const custoTotal = custoMercadoriasVendidas + (production.custoProducaoReal || 0);
  const margemBruta = vendasLiquidas - custoTotal;
  const ebitda = margemBruta - (opex.custosOperacionais || 0);
  const lucroLiquido = ebitda;

  return {
    period: "Últimos 12 meses",
    vendasMercadorias: sales.vendasMercadorias || 0,
    descontos: sales.descontos || 0,
    vendasLiquidas,
    custoMercadoriasVendidas,
    custoProducaoReal: production.custoProducaoReal || 0,
    custoProducaoPrevisto: production.custoProducaoPrevisto || 0,
    custoTotal,
    margemBruta,
    margemBrutaPct: vendasLiquidas ? (margemBruta / vendasLiquidas) * 100 : 0,
    custosOperacionais: opex.custosOperacionais || 0,
    ebitda,
    ebitdaPct: vendasLiquidas ? (ebitda / vendasLiquidas) * 100 : 0,
    lucroLiquido,
    lucroLiquidoPct: vendasLiquidas ? (lucroLiquido / vendasLiquidas) * 100 : 0,
  };
}

export async function getProductionCosts(): Promise<any> {
  const orders = all<any>(`
    SELECT o.Id, o.OrdemFabrico, o.Artigo, COALESCE(a.Descricao, o.Artigo) AS ArtigoDescricao,
      o.QtOrdemFabrico AS Quantidade,
      o.CustoMateriaisPrevisto, o.CustoMateriaisReal,
      o.CustoTransformacaoPrevisto, o.CustoTransformacaoReal,
      o.OutrosCustosPrevito, o.OutrosCustosReal,
      o.DataOrdemFabrico, o.Estado
    FROM GPR_OrdemFabrico o LEFT JOIN Artigo a ON a.Artigo = o.Artigo
    ORDER BY o.DataOrdemFabrico DESC
  `);
  const components = all<any>(`
    SELECT IDOrdemFabrico, Componente, QtPrevista, QtConsumida, Preco,
      ROUND(QtConsumida * Preco, 2) AS custoReal, ROUND(QtPrevista * Preco, 2) AS custoPrevisto
    FROM GPR_OrdemFabricoComponentes
  `);
  const operations = all<any>(`
    SELECT IDOrdemFabrico, Operacao, TempoPrevisto, TempoConsumido, CustoOperador, CustoMaquina,
      ROUND(CustoOperador + CustoMaquina, 2) AS custoTotal
    FROM GPR_OrdemFabricoOperacoes
  `);
  const stock = all<any>(`SELECT Artigo, EstadoStock, Stock, DataStock FROM INV_ValoresActuaisStock`);
  const costing = all<any>(`SELECT Artigo, GrupoCustos, CustoGrpCstMBase, CustoGrpCstLotMBase, DataCusteio FROM INV_ValoresActuaisCusteio`);

  const totalMatPrevisto = orders.reduce((sum, o) => sum + Number(o.CustoMateriaisPrevisto || 0), 0);
  const totalMatReal = orders.reduce((sum, o) => sum + Number(o.CustoMateriaisReal || 0), 0);
  const totalTransfPrevisto = orders.reduce((sum, o) => sum + Number(o.CustoTransformacaoPrevisto || 0), 0);
  const totalTransfReal = orders.reduce((sum, o) => sum + Number(o.CustoTransformacaoReal || 0), 0);
  const totalOutrosPrevisto = orders.reduce((sum, o) => sum + Number(o.OutrosCustosPrevito || 0), 0);
  const totalOutrosReal = orders.reduce((sum, o) => sum + Number(o.OutrosCustosReal || 0), 0);

  const ordersByArticle: Record<string, any[]> = {};
  for (const o of orders) {
    if (!ordersByArticle[o.Artigo]) ordersByArticle[o.Artigo] = [];
    ordersByArticle[o.Artigo].push(o);
  }

  const articleCosts = Object.entries(ordersByArticle).map(([artigo, ords]) => {
    const qty = ords.reduce((s, o) => s + Number(o.Quantidade || 0), 0);
    const matReal = ords.reduce((s, o) => s + Number(o.CustoMateriaisReal || 0), 0);
    const transfReal = ords.reduce((s, o) => s + Number(o.CustoTransformacaoReal || 0), 0);
    const outrosReal = ords.reduce((s, o) => s + Number(o.OutrosCustosReal || 0), 0);
    const totalReal = matReal + transfReal + outrosReal;
    const matPrev = ords.reduce((s, o) => s + Number(o.CustoMateriaisPrevisto || 0), 0);
    const transfPrev = ords.reduce((s, o) => s + Number(o.CustoTransformacaoPrevisto || 0), 0);
    const outrosPrev = ords.reduce((s, o) => s + Number(o.OutrosCustosPrevito || 0), 0);
    const totalPrev = matPrev + transfPrev + outrosPrev;
    return {
      artigo, quantidade: qty,
      custoMateriaisPrevisto: matPrev, custoMateriaisReal: matReal,
      custoTransformacaoPrevisto: transfPrev, custoTransformacaoReal: transfReal,
      outrosCustosPrevisto: outrosPrev, outrosCustosReal: outrosReal,
      totalPrevisto: totalPrev, totalReal,
      custoUnitarioPrevisto: qty ? totalPrev / qty : 0,
      custoUnitarioReal: qty ? totalReal / qty : 0,
      desvio: totalReal - totalPrev,
      desvioPct: totalPrev ? ((totalReal - totalPrev) / totalPrev) * 100 : 0,
    };
  });

  return {
    summary: {
      totalOrdens: orders.length,
      totalMatPrevisto, totalMatReal, totalTransfPrevisto, totalTransfReal, totalOutrosPrevisto, totalOutrosReal,
      totalPrevisto: totalMatPrevisto + totalTransfPrevisto + totalOutrosPrevisto,
      totalReal: totalMatReal + totalTransfReal + totalOutrosReal,
      desvioTotal: (totalMatReal + totalTransfReal + totalOutrosReal) - (totalMatPrevisto + totalTransfPrevisto + totalOutrosPrevisto),
    },
    orders, components, operations, articleCosts, stock, costing,
  };
}

export async function getCostAnalysis(): Promise<any> {
  const anoMin = new Date().getFullYear() - 1;
  const debitCosts = all<any>(`
    SELECT m.Conta, p.Descricao, ROUND(SUM(COALESCE(m.Valor,0)),2) AS total
    FROM Movimentos m JOIN PlanoContas p ON p.Conta = m.Conta
    WHERE m.Natureza = 'D' AND m.Ano >= ?
    GROUP BY m.Conta, p.Descricao
    HAVING SUM(COALESCE(m.Valor,0)) > 0
    ORDER BY total DESC LIMIT 20
  `, [anoMin]);
  const creditCosts = all<any>(`
    SELECT m.Conta, p.Descricao, ROUND(SUM(COALESCE(m.Valor,0)),2) AS total
    FROM Movimentos m JOIN PlanoContas p ON p.Conta = m.Conta
    WHERE m.Natureza = 'C' AND m.Ano >= ?
    GROUP BY m.Conta, p.Descricao
    HAVING SUM(COALESCE(m.Valor,0)) > 0
    ORDER BY total DESC LIMIT 10
  `, [anoMin]);
  const production = get<any>(`
    SELECT
      COUNT(*) AS totalOrdens,
      SUM(CASE WHEN Estado = 2 THEN 1 ELSE 0 END) AS ordensAbertas,
      SUM(CASE WHEN Estado = 4 THEN 1 ELSE 0 END) AS ordensFechadas,
      ROUND(SUM(CustoMateriaisReal + CustoTransformacaoReal + OutrosCustosReal),2) AS custoTotalReal,
      ROUND(SUM(CustoMateriaisPrevisto + CustoTransformacaoPrevisto + OutrosCustosPrevito),2) AS custoTotalPrevisto
    FROM GPR_OrdemFabrico
  `) ?? { totalOrdens: 0, ordensAbertas: 0, ordensFechadas: 0, custoTotalReal: 0, custoTotalPrevisto: 0 };
  const suppliers = all<any>(`
    SELECT f.Fornecedor AS code, f.Nome AS name, COUNT(c.Id) AS docCount,
      ROUND(SUM(ABS(COALESCE(NULLIF(c.TotalDocumento,0), c.TotalMerc+c.TotalIva-c.TotalDesc))),2) AS totalCompras,
      ROUND(AVG(julianday(c.DataVencimento) - julianday(c.DataDoc))) AS prazoMedio
    FROM CabecCompras c JOIN Fornecedores f ON f.Fornecedor = c.Entidade
    WHERE c.DataDoc >= date('now','-12 months')
    GROUP BY f.Fornecedor, f.Nome
    ORDER BY totalCompras DESC LIMIT 20
  `);

  return {
    debitCosts, creditCosts,
    production: {
      totalOrdens: production.totalOrdens || 0,
      ordensAbertas: production.ordensAbertas || 0,
      ordensFechadas: production.ordensFechadas || 0,
      custoTotalReal: production.custoTotalReal || 0,
      custoTotalPrevisto: production.custoTotalPrevisto || 0,
      desvio: (production.custoTotalReal || 0) - (production.custoTotalPrevisto || 0),
    },
    suppliers,
  };
}

export async function getAlerts(): Promise<any> {
  const overdueClients = all<any>(`
    SELECT c.Cliente AS code, c.Nome AS name,
      ROUND(COALESCE(c.TotalDeb,0),2) AS divida, ROUND(COALESCE(c.LimiteCred,0),2) AS limite,
      CAST(julianday(?) - julianday(MAX(d.DataVencimento)) AS INTEGER) AS diasAtrasoMax
    FROM Clientes c
    JOIN CabecDoc d ON d.Entidade = c.Cliente AND d.TipoEntidade = 'C'
    LEFT JOIN CabecDocStatus s ON s.IdCabecDoc = d.Id
    WHERE COALESCE(s.Anulado,0)=0 AND COALESCE(c.ClienteAnulado,0)=0
      AND d.DataVencimento < ?
      AND COALESCE(NULLIF(d.TotalDocumento,0), d.TotalMerc+d.TotalIva-d.TotalDesc) > 0
    GROUP BY c.Cliente, c.Nome
    HAVING ROUND(COALESCE(c.TotalDeb,0),2) > 0
    ORDER BY divida DESC LIMIT 10
  `, [today(), today()]);

  const lowStock = all<any>(`
    SELECT a.Artigo, a.Descricao, s.Stock, s.EstadoStock
    FROM INV_ValoresActuaisStock s JOIN Artigo a ON a.Artigo = s.Artigo
    WHERE s.Stock <= 5 AND s.EstadoStock = 'N'
    ORDER BY s.Stock ASC LIMIT 10
  `);

  const overBudget = all<any>(`
    SELECT m.Conta, p.Descricao, ROUND(SUM(COALESCE(m.Valor,0)),2) AS gasto, 0 AS orcamento
    FROM Movimentos m JOIN PlanoContas p ON p.Conta = m.Conta
    WHERE m.Natureza = 'D' AND m.DataGravacao >= date('now','-1 months')
    GROUP BY m.Conta, p.Descricao
    ORDER BY gasto DESC LIMIT 10
  `);

  const cash = get<any>(`
    SELECT
      ROUND(COALESCE(SUM(CASE WHEN TipoEntidade='C' THEN TotalCredito ELSE 0 END),0),2) AS entradas,
      ROUND(COALESCE(SUM(CASE WHEN TipoEntidade='F' THEN TotalDebito ELSE 0 END),0),2) AS saidas,
      ROUND(COALESCE(SUM(TotalCredito - TotalDebito),0),2) AS saldo
    FROM CabecTesouraria WHERE DataUltimaActualizacao >= date('now','-30 days')
  `) ?? { entradas: 0, saidas: 0, saldo: 0 };

  const payablesDue = all<any>(`
    SELECT (c.TipoDoc || ' ' || c.Serie || '/' || c.NumDoc) AS doc,
      COALESCE(NULLIF(c.Nome,''), f.Nome) AS fornecedor,
      c.DataVencimento AS vencimento,
      CAST(julianday(c.DataVencimento) - julianday(?) AS INTEGER) AS diasAtraso,
      ROUND(ABS(COALESCE(NULLIF(c.TotalDocumento,0), c.TotalMerc+c.TotalIva-c.TotalDesc)),2) AS total
    FROM CabecCompras c LEFT JOIN Fornecedores f ON f.Fornecedor=c.Entidade
    WHERE c.DataVencimento BETWEEN ? AND date('now','+30 days')
    ORDER BY c.DataVencimento ASC LIMIT 10
  `, [today(), today()]);

  const alerts = [
    ...overdueClients.map((c) => ({
      type: "overdue_client",
      severity: c.divida > c.limite * 0.8 ? "high" : "medium",
      title: `Cliente em atraso: ${c.name}`,
      message: `Dívida ${c.divida.toLocaleString("pt-PT", { style: "currency", currency: "EUR" })} - ${c.diasAtrasoMax} dias de atraso`,
      data: c,
    })),
    ...lowStock.map((s) => ({
      type: "low_stock", severity: "high",
      title: `Stock baixo: ${s.Artigo} - ${s.Descricao}`,
      message: `Stock atual: ${s.Stock} unidades`,
      data: s,
    })),
    ...overBudget.map((b) => ({
      type: "over_budget", severity: "medium",
      title: `Custo elevado: ${b.Descricao}`,
      message: "Gasto: " + b.gasto.toLocaleString("pt-PT", { style: "currency", currency: "EUR" }),
      data: b,
    })),
    ...(cash.saldo < 10000 ? [{
      type: "low_cash", severity: "high",
      title: "Saldo de caixa baixo",
      message: "Saldo atual: " + cash.saldo.toLocaleString("pt-PT", { style: "currency", currency: "EUR" }),
      data: cash,
    }] : []),
    ...payablesDue.map((p) => ({
      type: "payable_due",
      severity: p.diasAtraso > 0 ? "high" : "medium",
      title: `Pagamento ${p.diasAtraso > 0 ? "em atraso" : "a vencer"}: ${p.doc}`,
      message: `${p.fornecedor} - ` + p.total.toLocaleString("pt-PT", { style: "currency", currency: "EUR" }) + ` - vence ${p.vencimento}`,
      data: p,
    })),
  ];

  return {
    alerts,
    counts: {
      total: alerts.length,
      high: alerts.filter((a) => a.severity === "high").length,
      medium: alerts.filter((a) => a.severity === "medium").length,
    },
  };
}

export async function getHRCosts(): Promise<any> {
  const anoMin = new Date().getFullYear() - 1;
  const contabilidade = all<any>(`
    SELECT m.Conta, p.Descricao, ROUND(SUM(COALESCE(m.Valor,0)),2) AS total
    FROM Movimentos m JOIN PlanoContas p ON p.Conta=m.Conta
    WHERE m.Natureza='D' AND m.Conta IN ('6421','6452','6455') AND m.Ano >= ?
    GROUP BY m.Conta, p.Descricao ORDER BY total DESC
  `, [anoMin]);

  const totais = get<any>(`
    SELECT
      COUNT(*) AS totalFuncionarios,
      SUM(CASE WHEN Situacao='A' THEN 1 ELSE 0 END) AS ativos,
      ROUND(COALESCE(SUM(Vencimento),0),2) AS massaSalarialMensal,
      ROUND(COALESCE(SUM(Vencimento),0) * 14,2) AS massaSalarialAnual
    FROM Funcionarios
  `) ?? { totalFuncionarios: 0, ativos: 0, massaSalarialMensal: 0, massaSalarialAnual: 0 };

  const detalhe = all<any>(`
    SELECT Codigo, Nome, Categoria, Situacao, ROUND(COALESCE(Vencimento,0),2) AS vencimento, DataAdmissao
    FROM Funcionarios ORDER BY Vencimento DESC LIMIT 20
  `);

  // Dimensões de RH demonstrativas (sem tabelas RHP equivalentes na demo)
  const absentismo = [
    { TipoFalta: "Doença", ocorrencias: 8, diasTotais: 12, mediaPerFalta: 1.5 },
    { TipoFalta: "Injustificada", ocorrencias: 2, diasTotais: 3, mediaPerFalta: 1.5 },
    { TipoFalta: "Falha a licença", ocorrencias: 5, diasTotais: 8, mediaPerFalta: 1.6 },
    { TipoFalta: "TOTAL", ocorrencias: 15, diasTotais: 23, mediaPerFalta: 1.53 },
  ];
  const turnover = [
    { mes: 1, rotatividade: 0, saidas_ano: 0 },
    { mes: 2, rotatividade: 0, saidas_ano: 0 },
    { mes: 3, rotatividade: 0, saidas_ano: 0 },
    { mes: 4, rotatividade: 0, saidas_ano: 0 },
    { mes: 5, rotatividade: 0, saidas_ano: 0 },
    { mes: 6, rotatividade: 1, saidas_ano: 1 },
  ];
  const acidentes = { totalAcidentes: 3, graves: 0, medios: 1, ligeiros: 2 };
  const ferias = { totalFerias: 9, diasGozados: 52, diasRestantes: 18 };

  const totalContabilidade = contabilidade.reduce((s, c) => s + Number(c.total ?? 0), 0);
  const monthlyAvg = totalContabilidade / 6;
  const demoSupplement = {
    isDemo: true,
    note: "Dados suplementares de demonstração. Centro de custo, mapa mensal e imputação de mão de obra por ordem são estimativas geradas para simular a experiência CFO completa.",
    departments: [
      { department: "Administracao", costCenter: "CT001", amount: +(totalContabilidade * 0.28).toFixed(2), percent: 28, fte: 4, source: "demo" },
      { department: "Producao", costCenter: "CT002", amount: +(totalContabilidade * 0.42).toFixed(2), percent: 42, fte: 4, source: "demo" },
      { department: "Comercial", costCenter: "CT003", amount: +(totalContabilidade * 0.30).toFixed(2), percent: 30, fte: 2, source: "demo" },
    ],
    monthlyTrend: [1, 2, 3, 4, 5, 6].map((mes) => ({
      month: `2026-${String(mes).padStart(2, "0")}`,
      amount: +monthlyAvg.toFixed(2),
      payrollBase: +(monthlyAvg * 0.808).toFixed(2),
      employerCharges: +(monthlyAvg * 0.192).toFixed(2),
      source: "demo",
    })),
    productionLabor: [
      { order: "OF2026001", article: "Produto Acabado 1", department: "Producao", directLabor: +(totalContabilidade * 0.42 * 0.30).toFixed(2), hours: 120, costPerHour: 14.5, source: "demo" },
      { order: "OF2026002", article: "Produto Acabado 2", department: "Producao", directLabor: +(totalContabilidade * 0.42 * 0.28).toFixed(2), hours: 98, costPerHour: 13.8, source: "demo" },
    ],
    missingRealDimensions: ["Centro de custo real", "Departamento real", "Mapa mensal contabilistico", "Imputacao de mao de obra por ordem"],
  };

  return {
    contabilidade, totalContabilidade, funcionarios: totais, detalhe,
    absentismo, turnover, acidentes, ferias,
    nota: null,
    demoSupplement,
  };
}

export async function buildFinancialSummary(): Promise<any> {
  const [dashboard, cashflow, payables, banks, dre, costs, alerts, hrCosts, costAnalysis] = await Promise.all([
    getDashboard().catch(() => null),
    getCashFlow().catch(() => null),
    getPayables().catch(() => null),
    getBanks().catch(() => null),
    getDRE().catch(() => null),
    getProductionCosts().catch(() => null),
    getAlerts().catch(() => null),
    getHRCosts().catch(() => null),
    getCostAnalysis().catch(() => null),
  ]);

  const kpis: any = dashboard?.kpis ?? {};
  const topClients = (dashboard?.topClients ?? []).slice(0, 5).map((c: any) => ({
    nome: c.name, faturacao: c.salesAmount, divida: c.currentDebt,
  }));

  const recebiveis = {
    total: kpis.totalOpen ?? 0, vencido: kpis.totalOverdue ?? 0,
    documentos: kpis.docCount ?? 0, clientes: kpis.clientCount ?? 0,
  };

  const pagamentos = {
    aPagar: (payables ?? []).reduce((s: number, p: any) => s + Math.abs(Number(p.totalAmount ?? 0)), 0),
    vencidos: (payables ?? []).filter((p: any) => p.status === "Vencido").length,
    pendentes: (payables ?? []).filter((p: any) => p.status === "Pendente").length,
  };

  const fluxoCaixa: any = cashflow?.summary ?? {};
  const saldoBancos = (banks?.accounts ?? []).map((b: any) => ({
    conta: b.Conta, banco: b.descBanco || b.banco, moeda: b.Moeda,
  }));

  const dreResumo = dre ? {
    vendasLiquidas: dre.vendasLiquidas, margemBruta: dre.margemBruta,
    margemBrutaPct: dre.margemBrutaPct, ebitda: dre.ebitda, ebitdaPct: dre.ebitdaPct,
    lucroLiquido: dre.lucroLiquido,
  } : null;

  const producao = costs?.summary ?? null;
  const alertasCriticos = (alerts?.alerts ?? []).filter((a: any) => a.severity === "high").slice(0, 5).map((a: any) => ({
    tipo: a.type, titulo: a.title, mensagem: a.message,
  }));

  return {
    recebiveis, topClientes: topClients, pagamentos,
    fluxoCaixa: { entradas: fluxoCaixa.totalIncoming, saidas: fluxoCaixa.totalOutgoing, saldoProjetado: fluxoCaixa.projectedBalance },
    bancos: saldoBancos, dre: dreResumo, producao,
    alertas: alertasCriticos, totalAlertas: alerts?.counts?.total ?? 0,
    pessoal: hrCosts ? {
      totalContabilidade: hrCosts.totalContabilidade,
      massaSalarialMensal: hrCosts.funcionarios?.massaSalarialMensal ?? 0,
      massaSalarialAnual: hrCosts.funcionarios?.massaSalarialAnual ?? 0,
      totalFuncionarios: hrCosts.funcionarios?.totalFuncionarios ?? 0,
      ativos: hrCosts.funcionarios?.ativos ?? 0,
      detalheContas: hrCosts.contabilidade,
      top5Funcionarios: (hrCosts.detalhe ?? []).slice(0, 5),
      nota: hrCosts.nota,
    } : null,
    analiseCustos: {
      custosPorConta: costAnalysis?.debitCosts?.slice(0, 15) ?? [],
      fornecedores: costAnalysis?.suppliers?.slice(0, 10) ?? [],
    },
  };
}

export interface TopProductsParams {
  limit?: number | string | null;
  metric?: string | null;
  order?: string | null;
}

export async function getTopProducts({ limit = 20, metric = "margin", order = "DESC" }: TopProductsParams = {}): Promise<any> {
  const safeLimit = Math.max(1, Math.min(100, parseInt(String(limit)) || 20));
  const safeOrder = String(order).toUpperCase() === "ASC" ? "ASC" : "DESC";
  const metricColumn = ({
    revenue: "revenue", cogs: "cogs", margin: "margin", marginPct: "marginPct", quantity: "quantity",
  } as Record<string, string>)[String(metric)] || "margin";

  const products = all<any>(`
    WITH Vendas AS (
      SELECT l.Artigo,
        SUM(COALESCE(l.Quantidade, 0)) AS quantity,
        SUM(COALESCE(l.PrecoLiquido, 0)) AS revenue,
        SUM(COALESCE(l.CustoMercadoriasMBase, 0)) AS cogs
      FROM LinhasDoc l
      INNER JOIN CabecDoc c ON c.Id = l.IdCabecDoc
      WHERE l.Artigo IS NOT NULL AND l.Artigo <> ''
        AND c.TipoEntidade = 'C' AND c.TipoDoc IN ('FA','FT','VD')
        AND c.Data >= date('now','-12 months') AND c.Data <= date('now')
      GROUP BY l.Artigo
    )
    SELECT
      v.Artigo AS code, COALESCE(a.Descricao, v.Artigo) AS name,
      COALESCE(a.Familia, '') AS family, COALESCE(a.UnidadeVenda, '') AS unit,
      ROUND(v.quantity, 2) AS quantity, ROUND(v.revenue, 2) AS revenue, ROUND(v.cogs, 2) AS cogs,
      ROUND(v.revenue - v.cogs, 2) AS margin,
      CASE WHEN v.revenue > 0 THEN ROUND((v.revenue - v.cogs) * 100.0 / v.revenue, 2) ELSE 0 END AS marginPct
    FROM Vendas v LEFT JOIN Artigo a ON a.Artigo = v.Artigo
    ORDER BY ${metricColumn} ${safeOrder}, revenue DESC
    LIMIT ${safeLimit}
  `);

  const totals = products.reduce((acc, p) => {
    acc.revenue += Number(p.revenue) || 0;
    acc.cogs += Number(p.cogs) || 0;
    acc.margin += Number(p.margin) || 0;
    acc.quantity += Number(p.quantity) || 0;
    return acc;
  }, { revenue: 0, cogs: 0, margin: 0, quantity: 0 });

  return {
    metric: metricColumn, order: safeOrder, period: { fromMonths: 12 },
    totals: {
      revenue: Number(totals.revenue.toFixed(2)), cogs: Number(totals.cogs.toFixed(2)),
      margin: Number(totals.margin.toFixed(2)), quantity: Number(totals.quantity.toFixed(2)),
      marginPct: totals.revenue > 0 ? Number(((totals.margin * 100) / totals.revenue).toFixed(2)) : 0,
    },
    count: products.length, products,
  };
}

export async function getProfitability(): Promise<any[]> {
  return all<any>(`
    SELECT l.Artigo, a.Descricao, COUNT(*) AS docs, ROUND(SUM(l.Quantidade),2) AS qty,
      ROUND(SUM(l.TotalIliquido),2) AS revenue, ROUND(SUM(l.PrecoLiquido),2) AS cogs,
      ROUND(SUM(l.TotalIliquido - l.PrecoLiquido),2) AS margin
    FROM LinhasDoc l JOIN Artigo a ON a.Artigo=l.Artigo
    JOIN CabecDoc d ON d.Id=l.IdCabecDoc
    WHERE d.TipoEntidade='C' AND d.Data >= date('now','-12 months')
    GROUP BY l.Artigo, a.Descricao ORDER BY revenue DESC LIMIT 20
  `);
}

export async function getBreakeven(): Promise<any> {
  const dre = await getDRE();
  const margem = dre.vendasLiquidas - dre.custoMercadoriasVendidas;
  const margemPct = dre.vendasLiquidas > 0 ? (margem / dre.vendasLiquidas) * 100 : 0;
  const custos = dre.custosOperacionais || 0;
  const breakeven = margemPct > 0 ? (custos / (margemPct / 100)) : 0;
  const beUnidades = dre.vendasLiquidas > 0 && breakeven > 0 ? Math.round((breakeven / dre.vendasLiquidas) * 100) : 0;
  return { breakeven: Number(breakeven.toFixed(2)), beUnidades, margemPct: Number(margemPct.toFixed(2)), custosFixos: custos };
}

export async function getComparePeriods(meses: string = "6"): Promise<any[]> {
  const n = parseInt(meses) || 6;
  const now = new Date();
  const periods: any[] = [];
  for (let i = n - 1; i >= 0; i--) {
    const d = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() - i, 1));
    const mes = `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, "0")}`;
    const vendas = get<any>(`SELECT COALESCE(SUM(TotalMerc),0) AS v FROM CabecDoc WHERE TipoEntidade='C' AND strftime('%Y-%m',Data)=?`, [mes])?.v;
    const compras = get<any>(`SELECT COALESCE(SUM(TotalMerc),0) AS v FROM CabecCompras WHERE strftime('%Y-%m',DataDoc)=?`, [mes])?.v;
    periods.push({ mes, vendas: Number(Number(vendas).toFixed(2)), compras: Number(Number(compras).toFixed(2)) });
  }
  return periods;
}

export async function getBudgetVsActual(): Promise<any> {
  const dre = await getDRE();
  const orcamento = { vendasOrc: dre.vendasLiquidas * 1.05, custosOrc: dre.custoTotal * 0.95 };
  const desvios = {
    vendas: Number((((dre.vendasLiquidas - orcamento.vendasOrc) / orcamento.vendasOrc) * 100).toFixed(2)),
    custos: Number((((dre.custoTotal - orcamento.custosOrc) / orcamento.custosOrc) * 100).toFixed(2)),
  };
  return { real: { vendasLiquidas: dre.vendasLiquidas, custoTotal: dre.custoTotal }, orcamento, desvios };
}

export async function getCollections(): Promise<any[]> {
  return all<any>(`
    SELECT c.Cliente, c.Nome, COUNT(d.Id) AS docs,
      ROUND(SUM(COALESCE(NULLIF(d.TotalDocumento,0), d.TotalMerc+d.TotalIva-d.TotalDesc)),2) AS total,
      CAST(julianday(?) - julianday(MAX(d.DataVencimento)) AS INTEGER) AS diasAtraso
    FROM Clientes c LEFT JOIN CabecDoc d ON d.Entidade=c.Cliente AND d.TipoEntidade='C'
    LEFT JOIN CabecDocStatus s ON s.IdCabecDoc=d.Id
    WHERE COALESCE(s.Anulado,0)=0 AND COALESCE(c.ClienteAnulado,0)=0 AND d.DataVencimento < ?
    GROUP BY c.Cliente, c.Nome HAVING COUNT(d.Id) > 0 ORDER BY diasAtraso DESC LIMIT 20
  `, [today(), today()]);
}

export async function getCrm(): Promise<any[]> {
  return all<any>(`SELECT * FROM Contactos LIMIT 50`);
}

export async function getInventoryDetail(): Promise<any[]> {
  return all<any>(`
    SELECT i.Artigo, a.Descricao, i.Stock, i.EstadoStock, i.DataStock,
      ROUND(i.Stock * COALESCE(c.CustoGrpCstMBase,0), 2) AS valor
    FROM INV_ValoresActuaisStock i
    LEFT JOIN Artigo a ON a.Artigo=i.Artigo
    LEFT JOIN INV_ValoresActuaisCusteio c ON c.Artigo=i.Artigo
    ORDER BY valor DESC LIMIT 100
  `);
}

export async function getVendorsAnalysis(): Promise<any[]> {
  return all<any>(`
    SELECT f.Fornecedor, f.Nome, COUNT(c.Id) AS docCount,
      ROUND(COALESCE(SUM(COALESCE(NULLIF(c.TotalDocumento,0), c.TotalMerc+c.TotalIva-c.TotalDesc)),0),2) AS totalCompras,
      ROUND(AVG(julianday(c.DataVencimento) - julianday(c.DataDoc))) AS prazoMedio
    FROM Fornecedores f LEFT JOIN CabecCompras c ON c.Entidade=f.Fornecedor
      AND (c.DataDoc >= date('now','-12 months'))
    GROUP BY f.Fornecedor, f.Nome ORDER BY totalCompras DESC LIMIT 20
  `);
}

export async function getProductsDetail(): Promise<any[]> {
  return all<any>(`
    SELECT a.Artigo, a.Descricao, a.UnidadeVenda,
      ROUND(COALESCE(a.PCMedio,0),2) AS precoCusto, ROUND(COALESCE(a.PCUltimo,0),2) AS precoVenda,
      COALESCE(a.Familia,'') AS familia,
      (SELECT COUNT(*) FROM LinhasDoc l WHERE l.Artigo=a.Artigo) AS timesVended
    FROM Artigo a ORDER BY timesVended DESC LIMIT 50
  `);
}

export async function getHRMonthly(): Promise<any[]> {
  return all<any>(`
    SELECT Mes,
      ('0' || printf('%02d', Mes) || '/2026') AS mesFormatado,
      SUM(CASE WHEN Conta='6421' THEN Valor ELSE 0 END) AS salarios,
      SUM(CASE WHEN Conta='6452' THEN Valor ELSE 0 END) AS contribuicoes,
      SUM(CASE WHEN Conta='6455' THEN Valor ELSE 0 END) AS encargos,
      SUM(Valor) AS total
    FROM Movimentos
    WHERE Ano=2026 AND Diario='61' AND Conta IN ('6421','6452','6455')
    GROUP BY Mes ORDER BY Mes
  `);
}

const mockHR = {
  summary: { totalFuncionarios: 10, ativosAgora: 9, recibosProcessados: 59, custoAnualEstimado: 90600 },
  funcionarios: [] as any[],
  recibos: [] as any[],
};

export async function getHR(): Promise<any> {
  try {
    const funcionarios = all<any>(`
      SELECT Codigo, Nome, Categoria, Situacao, DataAdmissao, DataFimContrato,
        ROUND(COALESCE(Vencimento,0),2) AS vencimento, TipoContrato, Qualificacao
      FROM Funcionarios ORDER BY DataAdmissao
    `);
    const recibos = all<any>(`
      SELECT f.Codigo, f.Nome, COUNT(r.Id) AS recibosProcessados,
        ROUND(COALESCE(SUM(p.TotalDeRemuneracoes),0),2) AS totalRemuneracoes,
        ROUND(COALESCE(SUM(p.TotalDeDescontos),0),2) AS totalDescontos,
        ROUND(COALESCE(SUM(p.TotalLiquido),0),2) AS totalLiquido
      FROM Funcionarios f
      LEFT JOIN FuncRecibos r ON r.CodFunc=f.Codigo
      LEFT JOIN FuncRecibosProcs p ON p.ReciboID=r.Id
      GROUP BY f.Codigo, f.Nome ORDER BY f.Nome
    `);
    const ferias = all<any>(`
      SELECT f.Codigo, f.Nome,
        COALESCE(SUM(julianday(fe.DataFim) - julianday(fe.DataInicio)),0) AS diasFerias,
        COUNT(*) AS periodos
      FROM RHP_Ferias fe LEFT JOIN Funcionarios f ON f.Codigo=fe.CodFunc
      GROUP BY f.Codigo, f.Nome
    `);
    const historico = all<any>(`
      SELECT f.Codigo, f.Nome, COUNT(*) AS registos, MAX(h.DataFim) AS ultimaAlteracao
      FROM RHP_HistoricoRegistoVinculo h LEFT JOIN Funcionarios f ON f.Codigo=h.CodFunc
      GROUP BY f.Codigo, f.Nome
    `);

    return {
      summary: {
        totalFuncionarios: funcionarios.length,
        ativosAgora: funcionarios.filter((f) => f.Situacao === "A").length,
        recibosProcessados: recibos.reduce((s, r) => s + (Number(r.recibosProcessados) || 0), 0),
        custoAnualEstimado: recibos.reduce((s, r) => s + (Number(r.totalRemuneracoes) || 0), 0),
      },
      funcionarios, recibos, ferias, historico,
    };
  } catch {
    return mockHR;
  }
}
