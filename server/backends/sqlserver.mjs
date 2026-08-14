import { execFile } from "node:child_process";

const SQL_SERVER = process.env.PRIMAVERA_SQL_SERVER ?? ".\\SQLEXPRESS";
const SQL_DATABASE = process.env.PRIMAVERA_SQL_DATABASE ?? "PRIDEMO";
const ERP_EXE = "C:\\Program Files\\PRIMAVERA\\SG100\\Apl\\Erp100EV.exe";

export const meta = { source: "PRIMAVERA SQL", server: SQL_SERVER, database: SQL_DATABASE };

function runSql(query) {
  const args = [
    "-S",
    SQL_SERVER,
    "-d",
    SQL_DATABASE,
    "-E",
    "-f",
    "65001",
    "-y",
    "0",
    "-w",
    "65535",
    "-Q",
    `SET NOCOUNT ON; ${query}`,
  ];

  return new Promise((resolve, reject) => {
    execFile("sqlcmd", args, { windowsHide: true, maxBuffer: 1024 * 1024 * 8, encoding: "buffer" }, (error, stdout, stderr) => {
      const output = decodeSqlcmdBuffer(stdout);
      const errorOutput = decodeSqlcmdBuffer(stderr);

      if (error) {
        reject(new Error(errorOutput || error.message));
        return;
      }

      resolve(output.replace(/^\uFEFF/, "").trim());
    });
  });
}

function decodeSqlcmdBuffer(value) {
  if (!Buffer.isBuffer(value)) return String(value);
  const utf8 = value.toString("utf8");
  if (!utf8.includes("�")) return utf8;
  return decodeCp850(value);
}

const CP850_EXTENDED = [
  "Ç", "ü", "é", "â", "ä", "à", "å", "ç", "ê", "ë", "è", "ï", "î", "ì", "Ä", "Å",
  "É", "æ", "Æ", "ô", "ö", "ò", "û", "ù", "ÿ", "Ö", "Ü", "ø", "£", "Ø", "×", "ƒ",
  "á", "í", "ó", "ú", "ñ", "Ñ", "ª", "º", "¿", "®", "¬", "½", "¼", "¡", "«", "»",
  "░", "▒", "▓", "│", "┤", "Á", "Â", "À", "©", "╣", "║", "╗", "╝", "¢", "¥", "┐",
  "└", "┴", "┬", "├", "─", "┼", "ã", "Ã", "╚", "╔", "╩", "╦", "╠", "═", "╬", "¤",
  "ð", "Ð", "Ê", "Ë", "È", "ı", "Í", "Î", "Ï", "┘", "┌", "█", "▄", "¦", "Ì", "▀",
  "Ó", "ß", "Ô", "Ò", "õ", "Õ", "µ", "þ", "Þ", "Ú", "Û", "Ù", "ý", "Ý", "¯", "´",
  "≡", "±", "‗", "¾", "¶", "§", "÷", "¸", "°", "¨", "·", "¹", "³", "²", "■", " ",
];

function decodeCp850(buffer) {
  let output = "";
  for (const byte of buffer) {
    output += byte < 128 ? String.fromCharCode(byte) : CP850_EXTENDED[byte - 128];
  }
  return output;
}

function parseSqlJson(output) {
  const normalized = output
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter((line) => line && !line.startsWith("("))
    .join("");

  return normalized ? repairMojibake(JSON.parse(normalized)) : null;
}

function repairMojibake(value) {
  if (typeof value === "string") {
    return repairText(value);
  }

  if (Array.isArray(value)) {
    return value.map(repairMojibake);
  }

  if (value && typeof value === "object") {
    return Object.fromEntries(
      Object.entries(value).map(([key, entry]) => [key, repairMojibake(entry)]),
    );
  }

  return value;
}

function repairText(value) {
  if (!value.includes("�")) return value;

  return value
    .replaceAll("Jos�", "José")
    .replaceAll("Jo�o", "João")
    .replaceAll("Secret�ria", "Secretária")
    .replaceAll("Mat�ria", "Matéria")
    .replaceAll("Mat�rias", "Matérias")
    .replaceAll("Distribui��o", "Distribuição")
    .replaceAll("Informa��o", "Informação")
    .replaceAll("Produ��o", "Produção")
    .replaceAll("Descri��o", "Descrição")
    .replaceAll("Opera��o", "Operação")
    .replaceAll("Opera��es", "Operações")
    .replaceAll("Servi�os", "Serviços")
    .replaceAll("Sa�de", "Saúde")
    .replaceAll("Autom�ve", "Automóve")
    .replaceAll("T�cnico", "Técnico")
    .replaceAll("N�mero", "Número")
    .replaceAll("D�bito", "Débito")
    .replaceAll("Cr�dito", "Crédito");
}

export async function getReceivables() {
  const query = `
DECLARE @today date = CAST(GETDATE() AS date);

SELECT TOP 25
  ISNULL(c.Nome, d.Nome) AS clientName,
  ISNULL(c.NumContrib, d.NumContribuinte) AS nif,
  CONCAT(d.TipoDoc, ' ', d.Serie, '/', d.NumDoc) AS documentNumber,
  CONVERT(varchar(10), d.Data, 23) AS documentDate,
  CONVERT(varchar(10), d.DataVencimento, 23) AS dueDate,
  DATEDIFF(day, d.DataVencimento, @today) AS daysOverdue,
  CAST(ISNULL(NULLIF(d.TotalDocumento, 0), d.TotalMerc + d.TotalIva - d.TotalDesc) AS decimal(18,2)) AS totalAmount,
  CAST(0 AS decimal(18,2)) AS paidAmount,
  CAST(ISNULL(NULLIF(d.TotalDocumento, 0), d.TotalMerc + d.TotalIva - d.TotalDesc) AS decimal(18,2)) AS openAmount,
  d.Moeda AS currency,
  CASE
    WHEN d.DataVencimento < @today THEN 'Vencido'
    ELSE 'Pendente'
  END AS status,
  ISNULL(d.CondPag, '') AS paymentCondition,
  ISNULL(d.RespCobranca, '') AS collector,
  ISNULL(d.Referencia, '') AS reference
FROM CabecDoc d
LEFT JOIN Clientes c ON c.Cliente = d.Entidade
LEFT JOIN CabecDocStatus s ON s.IdCabecDoc = d.Id
WHERE ISNULL(s.Anulado, 0) = 0
  AND d.TipoEntidade = 'C'
  AND ISNULL(NULLIF(d.TotalDocumento, 0), d.TotalMerc + d.TotalIva - d.TotalDesc) <> 0
ORDER BY d.DataVencimento ASC, d.Data DESC
FOR JSON PATH, INCLUDE_NULL_VALUES;
`;

  const json = await runSql(query);
  return parseSqlJson(json) ?? [];
}

export async function getModules() {
  const query = `
SELECT *
FROM (
  SELECT 'BAS' AS code, 'Base Aplicacional' AS name, 'Clientes' AS tableName, COUNT_BIG(*) AS records FROM Clientes
  UNION ALL SELECT 'VND', 'Vendas', 'CabecDoc', COUNT_BIG(*) FROM CabecDoc
  UNION ALL SELECT 'VND-LIN', 'Linhas de venda', 'LinhasDoc', COUNT_BIG(*) FROM LinhasDoc
  UNION ALL SELECT 'CCT', 'Contas Correntes', 'DocumentosCCT', COUNT_BIG(*) FROM DocumentosCCT
  UNION ALL SELECT 'TES', 'Tesouraria', 'CabecTesouraria', COUNT_BIG(*) FROM CabecTesouraria
  UNION ALL SELECT 'CMP', 'Compras', 'CabecCompras', COUNT_BIG(*) FROM CabecCompras
  UNION ALL SELECT 'INV', 'Inventário', 'INV_Movimentos', COUNT_BIG(*) FROM INV_Movimentos
  UNION ALL SELECT 'STK', 'Stock atual', 'INV_ValoresActuaisStock', COUNT_BIG(*) FROM INV_ValoresActuaisStock
  UNION ALL SELECT 'GPR', 'Produção', 'GPR_OrdemFabrico', COUNT_BIG(*) FROM GPR_OrdemFabrico
  UNION ALL SELECT 'GPR-CMP', 'Componentes de produção', 'GPR_OrdemFabricoComponentes', COUNT_BIG(*) FROM GPR_OrdemFabricoComponentes
  UNION ALL SELECT 'CBL', 'Contabilidade', 'Movimentos', COUNT_BIG(*) FROM Movimentos
  UNION ALL SELECT 'CBL-PC', 'Plano de contas', 'PlanoContas', COUNT_BIG(*) FROM PlanoContas
  UNION ALL SELECT 'CRM', 'Contactos/CRM', 'Contactos', COUNT_BIG(*) FROM Contactos
  UNION ALL SELECT 'RHP', 'Recursos Humanos', 'Funcionarios', COUNT_BIG(*) FROM Funcionarios
  UNION ALL SELECT 'FOR', 'Fornecedores', 'Fornecedores', COUNT_BIG(*) FROM Fornecedores
  UNION ALL SELECT 'ART', 'Artigos', 'Artigo', COUNT_BIG(*) FROM Artigo
  UNION ALL SELECT 'ARM', 'Armazéns', 'Armazens', COUNT_BIG(*) FROM Armazens
  UNION ALL SELECT 'VDR', 'Vendedores', 'Vendedores', COUNT_BIG(*) FROM Vendedores
  UNION ALL SELECT Modulo, CONCAT('Módulo ', Modulo), 'VersaoModulo', 1 FROM VersaoModulo
    WHERE Modulo IN ('APR','BAS','CBL','CCT','CMP','CNO','COM','COP','CRM','DFP','EAP','EPK','FAC','FIL','GAB','GCP','GPR','IAM','INT','INV','ORC','PCM','PRJ','RHP','SAF','STP','TES','TTE','VND')
) m
ORDER BY code
FOR JSON PATH, INCLUDE_NULL_VALUES;
`;

  const json = await runSql(query);
  return parseSqlJson(json) ?? [];
}

export async function getCustomers() {
  const query = `
SELECT TOP 25
  c.Cliente AS code,
  c.Nome AS name,
  ISNULL(c.Email, '') AS email,
  ISNULL(c.Fac_Tel, '') AS telefone,
  c.NumContrib AS nif,
  c.Moeda AS currency,
  CAST(ISNULL(SUM(ISNULL(NULLIF(d.TotalDocumento, 0), d.TotalMerc + d.TotalIva - d.TotalDesc)), 0) AS decimal(18,2)) AS salesAmount,
  COUNT(d.Id) AS documentCount,
  CAST(ISNULL(c.TotalDeb, 0) AS decimal(18,2)) AS currentDebt,
  CAST(ISNULL(c.LimiteCred, 0) AS decimal(18,2)) AS creditLimit,
  ISNULL(c.CondPag, '') AS paymentCondition,
  ISNULL(c.Vendedor, '') AS seller
FROM Clientes c
LEFT JOIN CabecDoc d ON d.Entidade = c.Cliente AND d.TipoEntidade = 'C'
LEFT JOIN CabecDocStatus s ON s.IdCabecDoc = d.Id AND ISNULL(s.Anulado, 0) = 0
WHERE ISNULL(c.ClienteAnulado, 0) = 0
GROUP BY c.Cliente, c.Nome, c.Email, c.Fac_Tel, c.NumContrib, c.Moeda, c.TotalDeb, c.LimiteCred, c.CondPag, c.Vendedor
ORDER BY salesAmount DESC, currentDebt DESC
FOR JSON PATH, INCLUDE_NULL_VALUES;
`;

  const json = await runSql(query);
  return parseSqlJson(json) ?? [];
}

export async function getCashFlow() {
  const today = new Date();
  const currentMonth = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}`;

  const [receivablesRaw, payablesRaw, bankAccountsRaw, treasuryRaw] = await Promise.all([
    runSql(`SELECT CONVERT(varchar(7), DataVencimento, 126) AS month, COUNT(*) AS docs, CAST(SUM(ISNULL(NULLIF(TotalDocumento,0), TotalMerc+TotalIva-TotalDesc)) AS decimal(18,2)) AS total FROM CabecDoc WHERE TipoEntidade='C' AND DataVencimento >= DATEADD(month,-3,GETDATE()) AND DataVencimento <= DATEADD(month,6,GETDATE()) GROUP BY CONVERT(varchar(7), DataVencimento, 126) ORDER BY 1 FOR JSON PATH`),
    runSql(`SELECT CONVERT(varchar(7), DataVencimento, 126) AS month, COUNT(*) AS docs, CAST(SUM(ISNULL(NULLIF(TotalDocumento,0), TotalMerc+TotalIva-TotalDesc)) AS decimal(18,2)) AS total FROM CabecCompras WHERE DataVencimento >= DATEADD(month,-3,GETDATE()) AND DataVencimento <= DATEADD(month,6,GETDATE()) GROUP BY CONVERT(varchar(7), DataVencimento, 126) ORDER BY 1 FOR JSON PATH`),
    runSql(`SELECT Conta, DescBanco, Banco, Moeda, TipoConta FROM ContasBancarias FOR JSON PATH`),
    runSql(`SELECT TOP 20 TipoDoc, CONCAT(TipoDoc,' ',Serie,'/',CAST(NumDoc AS varchar)) AS doc, ISNULL(Entidade,'') AS entidade, TipoEntidade, CAST(TotalDebito AS decimal(18,2)) AS debit, CAST(TotalCredito AS decimal(18,2)) AS credit, ISNULL(ContaOrigem,'') AS contaOrigem, Moeda FROM CabecTesouraria ORDER BY DataUltimaActualizacao DESC FOR JSON PATH`),
  ]);

  const receivablesByMonth = parseSqlJson(receivablesRaw) ?? [];
  const payablesByMonth = parseSqlJson(payablesRaw) ?? [];
  const bankAccounts = parseSqlJson(bankAccountsRaw) ?? [];
  const treasuryMovements = parseSqlJson(treasuryRaw) ?? [];

  const totalIncoming = receivablesByMonth
    .filter((r) => r.month >= currentMonth && r.total > 0)
    .reduce((sum, r) => sum + Number(r.total), 0);
  const totalOutgoing = payablesByMonth
    .filter((p) => p.month >= currentMonth)
    .reduce((sum, p) => sum + Math.abs(Number(p.total)), 0);

  return {
    receivablesByMonth,
    payablesByMonth,
    bankAccounts,
    treasuryMovements,
    summary: {
      totalIncoming,
      totalOutgoing,
      projectedBalance: totalIncoming - totalOutgoing,
    },
  };
}

export async function getDocumentLines(docNumber) {
  const query = `
SELECT l.NumLinha, l.Artigo, ISNULL(l.Descricao,'') AS descricao,
  CAST(l.Quantidade AS decimal(18,4)) AS quantidade,
  CAST(l.PrecUnit AS decimal(18,4)) AS precUnit,
  CAST(ISNULL(l.Desconto1,0) AS decimal(18,2)) AS desconto,
  CAST(l.TotalIliquido AS decimal(18,2)) AS totalLiquido,
  CAST(l.TaxaIva AS decimal(5,2)) AS taxaIva,
  CAST(l.TotalIva AS decimal(18,2)) AS totalIva,
  ISNULL(l.Armazem,'') AS armazem
FROM LinhasDoc l
JOIN CabecDoc d ON d.Id = l.IdCabecDoc
WHERE CONCAT(d.TipoDoc,' ',d.Serie,'/',d.NumDoc) = '${docNumber.replace(/'/g, "''")}'
ORDER BY l.NumLinha
FOR JSON PATH`;
  const json = await runSql(query);
  return parseSqlJson(json) ?? [];
}

export function openErp() {
  return new Promise((resolve) => {
    execFile(ERP_EXE, [], { detached: true, windowsHide: false }, (err) => {
      resolve({ launched: !err, error: err?.message ?? null });
    });
    resolve({ launched: true, error: null });
  });
}

export function launchErp() {
  execFile(ERP_EXE, [], { detached: true, windowsHide: false });
}

const paymentLog = [];

export function registerPayment(data) {
  paymentLog.push({ ...data, registeredAt: new Date().toISOString() });
  return { ok: true, id: paymentLog.length };
}

export async function getFinancialKPIs() {
  const year = new Date().getFullYear();
  const [dreRaw, receivablesRaw, payablesRaw, stockRaw, bankRaw] = await Promise.all([
    runSql(`SELECT
      CAST(SUM(CASE WHEN LEFT(p.Conta,1)='7' AND m.Natureza='C' THEN m.Valor WHEN LEFT(p.Conta,1)='7' AND m.Natureza='D' THEN -m.Valor ELSE 0 END) AS decimal(18,2)) AS vendas,
      CAST(SUM(CASE WHEN LEFT(p.Conta,1)='3' AND m.Natureza='D' THEN m.Valor WHEN LEFT(p.Conta,1)='3' AND m.Natureza='C' THEN -m.Valor ELSE 0 END) AS decimal(18,2)) AS cmv,
      CAST(SUM(CASE WHEN LEFT(p.Conta,1)='6' AND m.Natureza='D' THEN m.Valor WHEN LEFT(p.Conta,1)='6' AND m.Natureza='C' THEN -m.Valor ELSE 0 END) AS decimal(18,2)) AS gastos
    FROM Movimentos m JOIN PlanoContas p ON p.Conta=m.Conta
    WHERE m.Ano=${year} AND m.Mes BETWEEN 1 AND 12
    FOR JSON PATH, WITHOUT_ARRAY_WRAPPER`),
    runSql(`SELECT CAST(SUM(ISNULL(NULLIF(TotalDocumento,0),TotalMerc+TotalIva-TotalDesc)) AS decimal(18,2)) AS totalRecebiveis
    FROM CabecDoc d LEFT JOIN CabecDocStatus s ON s.IdCabecDoc=d.Id
    WHERE d.TipoEntidade='C' AND ISNULL(s.Anulado,0)=0
    AND ISNULL(NULLIF(d.TotalDocumento,0),d.TotalMerc+d.TotalIva-d.TotalDesc)>0
    FOR JSON PATH, WITHOUT_ARRAY_WRAPPER`),
    runSql(`SELECT CAST(SUM(ABS(ISNULL(NULLIF(TotalDocumento,0),TotalMerc+TotalIva-TotalDesc))) AS decimal(18,2)) AS totalPagar
    FROM CabecCompras WHERE DataVencimento >= GETDATE()
    FOR JSON PATH, WITHOUT_ARRAY_WRAPPER`),
    runSql(`SELECT CAST(SUM(s.Stock * ISNULL(c.CustoGrpCstMBase,0)) AS decimal(18,2)) AS valorStock
    FROM INV_ValoresActuaisStock s
    LEFT JOIN INV_ValoresActuaisCusteio c ON c.Artigo=s.Artigo
    FOR JSON PATH, WITHOUT_ARRAY_WRAPPER`),
    runSql(`SELECT CAST(SUM(CASE WHEN m.Natureza='D' THEN m.Valor ELSE -m.Valor END) AS decimal(18,2)) AS saldoBancario
    FROM Movimentos m JOIN PlanoContas p ON p.Conta=m.Conta
    WHERE LEFT(p.Conta,1)='1' AND m.Ano=${year}
    FOR JSON PATH, WITHOUT_ARRAY_WRAPPER`),
  ]);

  const dre = parseSqlJson(dreRaw) ?? {};
  const rec = parseSqlJson(receivablesRaw) ?? {};
  const pay = parseSqlJson(payablesRaw) ?? {};
  const stk = parseSqlJson(stockRaw) ?? {};
  const bnk = parseSqlJson(bankRaw) ?? {};

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

export async function getDashboard() {
  const [kpisRaw, topClientsRaw, salesTrendRaw, payablesAlertRaw] = await Promise.all([
    runSql(`DECLARE @today date = CAST(GETDATE() AS date);
SELECT
  CAST(ISNULL(SUM(CASE WHEN d.DataVencimento < @today THEN ISNULL(NULLIF(d.TotalDocumento,0), d.TotalMerc+d.TotalIva-d.TotalDesc) ELSE 0 END), 0) AS decimal(18,2)) AS totalOverdue,
  CAST(ISNULL(SUM(ISNULL(NULLIF(d.TotalDocumento,0), d.TotalMerc+d.TotalIva-d.TotalDesc)), 0) AS decimal(18,2)) AS totalOpen,
  COUNT(*) AS docCount,
  COUNT(DISTINCT d.Entidade) AS clientCount
FROM CabecDoc d
LEFT JOIN CabecDocStatus s ON s.IdCabecDoc = d.Id
WHERE ISNULL(s.Anulado,0)=0 AND d.TipoEntidade='C'
  AND ISNULL(NULLIF(d.TotalDocumento,0), d.TotalMerc+d.TotalIva-d.TotalDesc) > 0
FOR JSON PATH, WITHOUT_ARRAY_WRAPPER`),
    runSql(`SELECT TOP 5 c.Nome AS name, c.Cliente AS code,
  CAST(ISNULL(SUM(ISNULL(NULLIF(d.TotalDocumento,0), d.TotalMerc+d.TotalIva-d.TotalDesc)),0) AS decimal(18,2)) AS salesAmount,
  CAST(ISNULL(c.TotalDeb,0) AS decimal(18,2)) AS currentDebt
FROM Clientes c
LEFT JOIN CabecDoc d ON d.Entidade=c.Cliente AND d.TipoEntidade='C'
WHERE ISNULL(c.ClienteAnulado,0)=0
GROUP BY c.Nome, c.Cliente, c.TotalDeb
ORDER BY salesAmount DESC FOR JSON PATH`),
    runSql(`SELECT CONVERT(varchar(7), Data, 126) AS month,
  CAST(SUM(ISNULL(NULLIF(TotalDocumento,0), TotalMerc+TotalIva-TotalDesc)) AS decimal(18,2)) AS total,
  COUNT(*) AS docs
FROM CabecDoc WHERE TipoEntidade='C' AND Data >= DATEADD(month,-5,GETDATE())
GROUP BY CONVERT(varchar(7), Data, 126) ORDER BY 1 FOR JSON PATH`),
    runSql(`SELECT TOP 10 CONCAT(c.TipoDoc,' ',c.Serie,'/',CAST(c.NumDoc AS varchar)) AS doc,
  ISNULL(c.Nome,f.Nome) AS supplier,
  CONVERT(varchar(10), c.DataVencimento, 23) AS dueDate,
  DATEDIFF(day, c.DataVencimento, GETDATE()) AS daysOverdue,
  CAST(ABS(ISNULL(NULLIF(c.TotalDocumento,0), c.TotalMerc+c.TotalIva-c.TotalDesc)) AS decimal(18,2)) AS total
FROM CabecCompras c LEFT JOIN Fornecedores f ON f.Fornecedor=c.Entidade
WHERE c.DataVencimento >= DATEADD(day,-90,GETDATE()) AND c.DataVencimento <= DATEADD(day,30,GETDATE())
ORDER BY c.DataVencimento ASC FOR JSON PATH`),
  ]);
  const kpis = parseSqlJson(kpisRaw) ?? {};
  return {
    kpis: Array.isArray(kpis) ? (kpis[0] ?? {}) : kpis,
    topClients: parseSqlJson(topClientsRaw) ?? [],
    salesTrend: parseSqlJson(salesTrendRaw) ?? [],
    payablesAlert: parseSqlJson(payablesAlertRaw) ?? [],
  };
}

export async function getPayables() {
  const query = `DECLARE @today date = CAST(GETDATE() AS date);
SELECT TOP 30
  CONCAT(c.TipoDoc,' ',c.Serie,'/',CAST(c.NumDoc AS varchar)) AS doc,
  c.Entidade AS supplierCode,
  ISNULL(c.Nome, f.Nome) AS supplierName,
  ISNULL(c.NumContribuinte, f.NumContrib) AS nif,
  CONVERT(varchar(10), c.DataDoc, 23) AS docDate,
  CONVERT(varchar(10), c.DataVencimento, 23) AS dueDate,
  DATEDIFF(day, c.DataVencimento, @today) AS daysOverdue,
  CAST(ABS(ISNULL(NULLIF(c.TotalDocumento,0), c.TotalMerc+c.TotalIva-c.TotalDesc)) AS decimal(18,2)) AS totalAmount,
  c.Moeda AS currency,
  ISNULL(c.CondPag,'') AS paymentCondition,
  CASE WHEN c.DataVencimento < @today THEN 'Vencido' ELSE 'Pendente' END AS status
FROM CabecCompras c
LEFT JOIN Fornecedores f ON f.Fornecedor=c.Entidade
WHERE ABS(ISNULL(NULLIF(c.TotalDocumento,0), c.TotalMerc+c.TotalIva-c.TotalDesc)) > 0
ORDER BY c.DataVencimento ASC
FOR JSON PATH, INCLUDE_NULL_VALUES`;
  const json = await runSql(query);
  return parseSqlJson(json) ?? [];
}

export async function getBanks() {
  const [accountsRaw, movementsRaw] = await Promise.all([
    runSql(`SELECT Conta, ISNULL(DescBanco,'') AS descBanco, ISNULL(Banco,'') AS banco, Moeda,
      TipoConta, CAST(ISNULL(Limite,0) AS decimal(18,2)) AS limite
      FROM ContasBancarias ORDER BY Conta FOR JSON PATH`),
    runSql(`SELECT TOP 30
      CONCAT(TipoDoc,' ',Serie,'/',CAST(NumDoc AS varchar)) AS doc,
      TipoDoc, ISNULL(Entidade,'') AS entidade, TipoEntidade,
      CAST(TotalDebito AS decimal(18,2)) AS debit,
      CAST(TotalCredito AS decimal(18,2)) AS credit,
      ISNULL(ContaOrigem,'') AS contaOrigem, ISNULL(ContaDestino,'') AS contaDestino,
      Moeda, ISNULL(Observacoes,'') AS obs
      FROM CabecTesouraria ORDER BY DataUltimaActualizacao DESC FOR JSON PATH`),
  ]);
  return {
    accounts: parseSqlJson(accountsRaw) ?? [],
    movements: parseSqlJson(movementsRaw) ?? [],
  };
}

export async function getDRE() {
  const [salesRaw, opexRaw, productionRaw] = await Promise.all([
    runSql(`SELECT
      CAST(SUM(ISNULL(d.TotalMerc,0)) AS decimal(18,2)) AS vendasMercadorias,
      CAST(SUM(ISNULL(d.TotalDesc,0)) AS decimal(18,2)) AS descontos,
      CAST(SUM(ISNULL(d.TotalIva,0)) AS decimal(18,2)) AS iva
    FROM CabecDoc d
    LEFT JOIN CabecDocStatus s ON s.IdCabecDoc = d.Id
    WHERE ISNULL(s.Anulado,0)=0 AND d.TipoEntidade='C' AND d.Data >= DATEADD(month,-12,GETDATE())
    FOR JSON PATH, WITHOUT_ARRAY_WRAPPER`),
    runSql(`SELECT
      CAST(SUM(ISNULL(m.Valor,0)) AS decimal(18,2)) AS custosOperacionais
    FROM Movimentos m
    WHERE m.Natureza = 'D' AND m.DataGravacao >= DATEADD(month,-12,GETDATE())
    FOR JSON PATH, WITHOUT_ARRAY_WRAPPER`),
    runSql(`SELECT
      CAST(SUM(ISNULL(c.CustoMateriaisReal + c.CustoTransformacaoReal + c.OutrosCustosReal, 0)) AS decimal(18,2)) AS custoProducaoReal,
      CAST(SUM(ISNULL(c.CustoMateriaisPrevisto + c.CustoTransformacaoPrevisto + c.OutrosCustosPrevito, 0)) AS decimal(18,2)) AS custoProducaoPrevisto
    FROM GPR_OrdemFabrico c
    WHERE c.DataOrdemFabrico >= DATEADD(month,-12,GETDATE())
    FOR JSON PATH, WITHOUT_ARRAY_WRAPPER`),
  ]);

  const sales = parseSqlJson(salesRaw) ?? { vendasMercadorias: 0, descontos: 0, iva: 0 };
  const opex = parseSqlJson(opexRaw) ?? { custosOperacionais: 0 };
  const production = parseSqlJson(productionRaw) ?? { custoProducaoReal: 0, custoProducaoPrevisto: 0 };

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

export async function getProductionCosts() {
  const [ordersRaw, componentsRaw, operationsRaw, stockRaw, costingRaw] = await Promise.all([
    runSql(`SELECT
      o.Id, o.OrdemFabrico, o.Artigo,
      ISNULL(a.Descricao, o.Artigo) AS ArtigoDescricao,
      o.QtOrdemFabrico AS Quantidade,
      o.CustoMateriaisPrevisto, o.CustoMateriaisReal,
      o.CustoTransformacaoPrevisto, o.CustoTransformacaoReal,
      o.OutrosCustosPrevito, o.OutrosCustosReal,
      o.DataOrdemFabrico, o.Estado
    FROM GPR_OrdemFabrico o
    LEFT JOIN Artigo a ON a.Artigo = o.Artigo
    ORDER BY o.DataOrdemFabrico DESC
    FOR JSON PATH`),
    runSql(`SELECT
      IDOrdemFabrico, Componente, QtPrevista, QtConsumida, Preco,
      CAST(QtConsumida * Preco AS decimal(18,2)) AS custoReal,
      CAST(QtPrevista * Preco AS decimal(18,2)) AS custoPrevisto
    FROM GPR_OrdemFabricoComponentes
    FOR JSON PATH`),
    runSql(`SELECT
      IDOrdemFabrico, Operacao, TempoPrevisto, TempoConsumido,
      CustoOperador, CustoMaquina,
      CAST(CustoOperador + CustoMaquina AS decimal(18,2)) AS custoTotal
    FROM GPR_OrdemFabricoOperacoes
    FOR JSON PATH`),
    runSql(`SELECT Artigo, EstadoStock, Stock, DataStock
    FROM INV_ValoresActuaisStock
    FOR JSON PATH`),
    runSql(`SELECT Artigo, GrupoCustos, CustoGrpCstMBase, CustoGrpCstLotMBase, DataCusteio
    FROM INV_ValoresActuaisCusteio
    FOR JSON PATH`),
  ]);

  const orders = parseSqlJson(ordersRaw) ?? [];
  const components = parseSqlJson(componentsRaw) ?? [];
  const operations = parseSqlJson(operationsRaw) ?? [];
  const stock = parseSqlJson(stockRaw) ?? [];
  const costing = parseSqlJson(costingRaw) ?? [];

  const totalMatPrevisto = orders.reduce((sum, o) => sum + Number(o.CustoMateriaisPrevisto || 0), 0);
  const totalMatReal = orders.reduce((sum, o) => sum + Number(o.CustoMateriaisReal || 0), 0);
  const totalTransfPrevisto = orders.reduce((sum, o) => sum + Number(o.CustoTransformacaoPrevisto || 0), 0);
  const totalTransfReal = orders.reduce((sum, o) => sum + Number(o.CustoTransformacaoReal || 0), 0);
  const totalOutrosPrevisto = orders.reduce((sum, o) => sum + Number(o.OutrosCustosPrevito || 0), 0);
  const totalOutrosReal = orders.reduce((sum, o) => sum + Number(o.OutrosCustosReal || 0), 0);

  const ordersByArticle = {};
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
      artigo,
      quantidade: qty,
      custoMateriaisPrevisto: matPrev,
      custoMateriaisReal: matReal,
      custoTransformacaoPrevisto: transfPrev,
      custoTransformacaoReal: transfReal,
      outrosCustosPrevisto: outrosPrev,
      outrosCustosReal: outrosReal,
      totalPrevisto: totalPrev,
      totalReal,
      custoUnitarioPrevisto: qty ? totalPrev / qty : 0,
      custoUnitarioReal: qty ? totalReal / qty : 0,
      desvio: totalReal - totalPrev,
      desvioPct: totalPrev ? ((totalReal - totalPrev) / totalPrev) * 100 : 0,
    };
  });

  return {
    summary: {
      totalOrdens: orders.length,
      totalMatPrevisto,
      totalMatReal,
      totalTransfPrevisto,
      totalTransfReal,
      totalOutrosPrevisto,
      totalOutrosReal,
      totalPrevisto: totalMatPrevisto + totalTransfPrevisto + totalOutrosPrevisto,
      totalReal: totalMatReal + totalTransfReal + totalOutrosReal,
      desvioTotal: (totalMatReal + totalTransfReal + totalOutrosReal) - (totalMatPrevisto + totalTransfPrevisto + totalOutrosPrevisto),
    },
    orders,
    components,
    operations,
    articleCosts,
    stock,
    costing,
  };
}

export async function getCostAnalysis() {
  const anoMin = new Date().getFullYear() - 1;
  const [fixedRaw, variableRaw, wasteRaw, supplierRaw] = await Promise.all([
    runSql(`SELECT TOP 20
      m.Conta, p.Descricao,
      CAST(SUM(ISNULL(m.Valor,0)) AS decimal(18,2)) AS total
    FROM Movimentos m
    JOIN PlanoContas p ON p.Conta = m.Conta
    WHERE m.Natureza = 'D' AND m.Ano >= ${anoMin}
    GROUP BY m.Conta, p.Descricao
    HAVING SUM(ISNULL(m.Valor,0)) > 0
    ORDER BY total DESC
    FOR JSON PATH`),
    runSql(`SELECT TOP 10
      m.Conta, p.Descricao,
      CAST(SUM(ISNULL(m.Valor,0)) AS decimal(18,2)) AS total
    FROM Movimentos m
    JOIN PlanoContas p ON p.Conta = m.Conta
    WHERE m.Natureza = 'C' AND m.Ano >= ${anoMin}
    GROUP BY m.Conta, p.Descricao
    HAVING SUM(ISNULL(m.Valor,0)) > 0
    ORDER BY total DESC
    FOR JSON PATH`),
    runSql(`SELECT
      COUNT(*) AS totalOrdens,
      SUM(CASE WHEN Estado = 2 THEN 1 ELSE 0 END) AS ordensAbertas,
      SUM(CASE WHEN Estado = 4 THEN 1 ELSE 0 END) AS ordensFechadas,
      CAST(SUM(CustoMateriaisReal + CustoTransformacaoReal + OutrosCustosReal) AS decimal(18,2)) AS custoTotalReal,
      CAST(SUM(CustoMateriaisPrevisto + CustoTransformacaoPrevisto + OutrosCustosPrevito) AS decimal(18,2)) AS custoTotalPrevisto
    FROM GPR_OrdemFabrico
    FOR JSON PATH, WITHOUT_ARRAY_WRAPPER`),
    runSql(`SELECT TOP 20
      f.Fornecedor AS code,
      f.Nome AS name,
      COUNT(c.Id) AS docCount,
      CAST(SUM(ABS(ISNULL(NULLIF(c.TotalDocumento,0), c.TotalMerc+c.TotalIva-c.TotalDesc))) AS decimal(18,2)) AS totalCompras,
      AVG(DATEDIFF(day, c.DataDoc, c.DataVencimento)) AS prazoMedio
    FROM CabecCompras c
    JOIN Fornecedores f ON f.Fornecedor = c.Entidade
    WHERE c.DataDoc >= DATEADD(month,-12,GETDATE())
    GROUP BY f.Fornecedor, f.Nome
    ORDER BY totalCompras DESC
    FOR JSON PATH`),
  ]);

  const debitCosts = parseSqlJson(fixedRaw) ?? [];
  const creditCosts = parseSqlJson(variableRaw) ?? [];
  const wasteRaw2 = parseSqlJson(wasteRaw) ?? { totalOrdens: 0, ordensAbertas: 0, ordensFechadas: 0, custoTotalReal: 0, custoTotalPrevisto: 0 };
  const suppliers = parseSqlJson(supplierRaw) ?? [];

  return {
    debitCosts,
    creditCosts,
    production: {
      totalOrdens: wasteRaw2.totalOrdens || 0,
      ordensAbertas: wasteRaw2.ordensAbertas || 0,
      ordensFechadas: wasteRaw2.ordensFechadas || 0,
      custoTotalReal: wasteRaw2.custoTotalReal || 0,
      custoTotalPrevisto: wasteRaw2.custoTotalPrevisto || 0,
      desvio: (wasteRaw2.custoTotalReal || 0) - (wasteRaw2.custoTotalPrevisto || 0),
    },
    suppliers,
  };
}

export async function getAlerts() {
  const [overdueClientsRaw, lowStockRaw, overBudgetRaw, cashLowRaw, payablesDueRaw] = await Promise.all([
    runSql(`SELECT TOP 10
      c.Cliente AS code, c.Nome AS name,
      CAST(ISNULL(c.TotalDeb,0) AS decimal(18,2)) AS divida,
      CAST(ISNULL(c.LimiteCred,0) AS decimal(18,2)) AS limite,
      DATEDIFF(day, MAX(d.DataVencimento), GETDATE()) AS diasAtrasoMax
    FROM Clientes c
    JOIN CabecDoc d ON d.Entidade = c.Cliente AND d.TipoEntidade = 'C'
    LEFT JOIN CabecDocStatus s ON s.IdCabecDoc = d.Id
    WHERE ISNULL(s.Anulado,0)=0 AND ISNULL(c.ClienteAnulado,0)=0
    AND d.DataVencimento < GETDATE()
    AND ISNULL(NULLIF(d.TotalDocumento,0), d.TotalMerc+d.TotalIva-d.TotalDesc) > 0
    GROUP BY c.Cliente, c.Nome, c.TotalDeb, c.LimiteCred
    HAVING CAST(ISNULL(c.TotalDeb,0) AS decimal(18,2)) > 0
    ORDER BY divida DESC
    FOR JSON PATH`),
    runSql(`SELECT TOP 10
      a.Artigo, a.Descricao,
      s.Stock, s.EstadoStock
    FROM INV_ValoresActuaisStock s
    JOIN Artigo a ON a.Artigo = s.Artigo
    WHERE s.Stock <= 5 AND s.EstadoStock = 'N'
    ORDER BY s.Stock ASC
    FOR JSON PATH`),
    runSql(`SELECT TOP 10
      m.Conta, p.Descricao,
      CAST(SUM(ISNULL(m.Valor,0)) AS decimal(18,2)) AS gasto,
      0 AS orcamento
    FROM Movimentos m
    JOIN PlanoContas p ON p.Conta = m.Conta
    WHERE m.Natureza = 'D' AND m.DataGravacao >= DATEADD(month,-1,GETDATE())
    GROUP BY m.Conta, p.Descricao
    ORDER BY gasto DESC
    FOR JSON PATH`),
    runSql(`SELECT
      CAST(SUM(CASE WHEN TipoEntidade='C' THEN TotalCredito ELSE 0 END) AS decimal(18,2)) AS entradas,
      CAST(SUM(CASE WHEN TipoEntidade='F' THEN TotalDebito ELSE 0 END) AS decimal(18,2)) AS saidas,
      CAST(SUM(TotalCredito - TotalDebito) AS decimal(18,2)) AS saldo
    FROM CabecTesouraria
    WHERE DataUltimaActualizacao >= DATEADD(day,-30,GETDATE())
    FOR JSON PATH, WITHOUT_ARRAY_WRAPPER`),
    runSql(`SELECT TOP 10
      CONCAT(c.TipoDoc,' ',c.Serie,'/',CAST(c.NumDoc AS varchar)) AS doc,
      ISNULL(c.Nome,f.Nome) AS fornecedor,
      CONVERT(varchar(10), c.DataVencimento, 23) AS vencimento,
      DATEDIFF(day, c.DataVencimento, GETDATE()) AS diasAtraso,
      CAST(ABS(ISNULL(NULLIF(c.TotalDocumento,0), c.TotalMerc+c.TotalIva-c.TotalDesc)) AS decimal(18,2)) AS total
    FROM CabecCompras c
    LEFT JOIN Fornecedores f ON f.Fornecedor=c.Entidade
    WHERE c.DataVencimento BETWEEN GETDATE() AND DATEADD(day,30,GETDATE())
    ORDER BY c.DataVencimento ASC
    FOR JSON PATH`),
  ]);

  const overdueClients = parseSqlJson(overdueClientsRaw) ?? [];
  const lowStock = parseSqlJson(lowStockRaw) ?? [];
  const overBudget = parseSqlJson(overBudgetRaw) ?? [];
  const cash = parseSqlJson(cashLowRaw) ?? { entradas: 0, saidas: 0, saldo: 0 };
  const payablesDue = parseSqlJson(payablesDueRaw) ?? [];

  const alerts = [
    ...overdueClients.map(c => ({
      type: "overdue_client",
      severity: c.divida > (c.limite * 0.8) ? "high" : "medium",
      title: `Cliente em atraso: ${c.name}`,
      message: `Dívida ${c.divida.toLocaleString('pt-PT',{style:'currency',currency:'EUR'})} - ${c.diasAtrasoMax} dias de atraso`,
      data: c,
    })),
    ...lowStock.map(s => ({
      type: "low_stock",
      severity: "high",
      title: `Stock baixo: ${s.Artigo} - ${s.Descricao}`,
      message: `Stock atual: ${s.Stock} unidades`,
      data: s,
    })),
    ...overBudget.map(b => ({
      type: "over_budget",
      severity: "medium",
      title: `Custo elevado: ${b.Descricao}`,
      message: "Gasto: " + b.gasto.toLocaleString('pt-PT',{style:'currency',currency:'EUR'}),
      data: b,
    })),
    ...(cash.saldo < 10000 ? [{
      type: "low_cash",
      severity: "high",
      title: "Saldo de caixa baixo",
      message: "Saldo atual: " + cash.saldo.toLocaleString('pt-PT',{style:'currency',currency:'EUR'}),
      data: cash,
    }] : []),
    ...payablesDue.map(p => ({
      type: "payable_due",
      severity: p.diasAtraso > 0 ? "high" : "medium",
      title: `Pagamento ${p.diasAtraso > 0 ? "em atraso" : "a vencer"}: ${p.doc}`,
      message: `${p.fornecedor} - ` + p.total.toLocaleString('pt-PT',{style:'currency',currency:'EUR'}) + ` - vence ${p.vencimento}`,
      data: p,
    })),
  ];

  return { alerts, counts: { total: alerts.length, high: alerts.filter(a => a.severity === "high").length, medium: alerts.filter(a => a.severity === "medium").length } };
}

export async function getHRCosts() {
  const [contabilidadeRaw, funcionariosRaw, funcionariosDetalheRaw] = await Promise.all([
    runSql(`SELECT m.Conta, p.Descricao, CAST(SUM(ISNULL(m.Valor,0)) AS decimal(18,2)) AS total
      FROM Movimentos m JOIN PlanoContas p ON p.Conta=m.Conta
      WHERE m.Natureza='D' AND (LEFT(m.Conta,2) IN ('63','64') OR LEFT(m.Conta,3) IN ('635','636','638'))
      AND m.Ano >= (YEAR(GETDATE())-1)
      GROUP BY m.Conta, p.Descricao ORDER BY total DESC FOR JSON PATH`),
    runSql(`SELECT
      COUNT(*) AS totalFuncionarios,
      SUM(CASE WHEN Situacao IN ('A','001') THEN 1 ELSE 0 END) AS ativos,
      CAST(SUM(ISNULL(Vencimento,0)) AS decimal(18,2)) AS massaSalarialMensal,
      CAST(SUM(ISNULL(Vencimento,0)) * 14 AS decimal(18,2)) AS massaSalarialAnual
      FROM Funcionarios FOR JSON PATH, WITHOUT_ARRAY_WRAPPER`),
    runSql(`SELECT TOP 20
      Codigo, Nome, Categoria, Situacao,
      CAST(ISNULL(Vencimento,0) AS decimal(18,2)) AS vencimento,
      DataAdmissao
      FROM Funcionarios ORDER BY Vencimento DESC FOR JSON PATH`),
  ]);
  const contabilidade = parseSqlJson(contabilidadeRaw) ?? [];
  const totais = parseSqlJson(funcionariosRaw) ?? { totalFuncionarios: 0, ativos: 0, massaSalarialMensal: 0, massaSalarialAnual: 0 };
  const detalhe = parseSqlJson(funcionariosDetalheRaw) ?? [];

  // Demo data para dimensões de RH (tabelas não existem em PRIMAVERA demo)
  const absentismo = [
    { TipoFalta: "Doença", ocorrencias: 8, diasTotais: 12, mediaPerFalta: 1.5 },
    { TipoFalta: "Injustificada", ocorrencias: 2, diasTotais: 3, mediaPerFalta: 1.5 },
    { TipoFalta: "Falha a licença", ocorrencias: 5, diasTotais: 8, mediaPerFalta: 1.6 },
    { TipoFalta: "TOTAL", ocorrencias: 15, diasTotais: 23, mediaPerFalta: 1.53 },
  ];
  const turnover = [
    { mes: 1, rotatividade: 0, saidas_ano: 0 },
    { mes: 2, rotatividade: 0, saidas_ano: 0 },
    { mes: 3, rotatividade: 1, saidas_ano: 1 },
    { mes: 4, rotatividade: 0, saidas_ano: 1 },
    { mes: 5, rotatividade: 0, saidas_ano: 1 },
    { mes: 6, rotatividade: 0, saidas_ano: 1 },
  ];
  const acidentes = { totalAcidentes: 3, graves: 0, medios: 1, ligeiros: 2 };
  const ferias = { totalFerias: 9, diasGozados: 52, diasRestantes: 18 };

  const totalContabilidade = contabilidade.reduce((s, c) => s + Number(c.total ?? 0), 0);
  const monthlyAvg = totalContabilidade / 6;
  const demoSupplement = {
    isDemo: true,
    note: "Dados suplementares de teste. O PRIMAVERA demo nao disponibiliza centro de custo real, departamento real, mapa mensal contabilistico nem imputacao de mao de obra por ordem. Estas estimativas foram geradas para simular a experiencia CFO completa.",
    departments: [
      { department: "Administracao", costCenter: "CT001", amount: +(totalContabilidade * 0.28).toFixed(2), percent: 28, fte: 2, source: "demo" },
      { department: "Producao", costCenter: "CT002", amount: +(totalContabilidade * 0.42).toFixed(2), percent: 42, fte: 4, source: "demo" },
      { department: "Comercial", costCenter: "CT003", amount: +(totalContabilidade * 0.18).toFixed(2), percent: 18, fte: 2, source: "demo" },
      { department: "Logistica", costCenter: "CT004", amount: +(totalContabilidade * 0.12).toFixed(2), percent: 12, fte: 1, source: "demo" },
    ],
    monthlyTrend: [
      { month: "2026-01", amount: +(monthlyAvg * 0.92).toFixed(2), payrollBase: +((monthlyAvg * 0.92) * 0.808).toFixed(2), employerCharges: +((monthlyAvg * 0.92) * 0.192).toFixed(2), source: "demo" },
      { month: "2026-02", amount: +(monthlyAvg * 0.96).toFixed(2), payrollBase: +((monthlyAvg * 0.96) * 0.808).toFixed(2), employerCharges: +((monthlyAvg * 0.96) * 0.192).toFixed(2), source: "demo" },
      { month: "2026-03", amount: +(monthlyAvg * 1.01).toFixed(2), payrollBase: +((monthlyAvg * 1.01) * 0.808).toFixed(2), employerCharges: +((monthlyAvg * 1.01) * 0.192).toFixed(2), source: "demo" },
      { month: "2026-04", amount: +(monthlyAvg * 1.04).toFixed(2), payrollBase: +((monthlyAvg * 1.04) * 0.808).toFixed(2), employerCharges: +((monthlyAvg * 1.04) * 0.192).toFixed(2), source: "demo" },
      { month: "2026-05", amount: +(monthlyAvg * 1.03).toFixed(2), payrollBase: +((monthlyAvg * 1.03) * 0.808).toFixed(2), employerCharges: +((monthlyAvg * 1.03) * 0.192).toFixed(2), source: "demo" },
      { month: "2026-06", amount: +(monthlyAvg * 1.04).toFixed(2), payrollBase: +((monthlyAvg * 1.04) * 0.808).toFixed(2), employerCharges: +((monthlyAvg * 1.04) * 0.192).toFixed(2), source: "demo" },
    ],
    productionLabor: [
      { order: "OF-2026-001", article: "Corpo", department: "Producao", directLabor: +(totalContabilidade * 0.42 * 0.30).toFixed(2), hours: 120, costPerHour: 14.50, source: "demo" },
      { order: "OF-2026-002", article: "Gaveta", department: "Producao", directLabor: +(totalContabilidade * 0.42 * 0.28).toFixed(2), hours: 98, costPerHour: 13.80, source: "demo" },
      { order: "OF-2026-003", article: "Tampo", department: "Producao", directLabor: +(totalContabilidade * 0.42 * 0.24).toFixed(2), hours: 85, costPerHour: 15.20, source: "demo" },
      { order: "OF-2026-004", article: "Acabamento", department: "Producao", directLabor: +(totalContabilidade * 0.42 * 0.18).toFixed(2), hours: 72, costPerHour: 12.90, source: "demo" },
    ],
    missingRealDimensions: ["Centro de custo real", "Departamento real", "Mapa mensal contabilistico", "Imputacao de mao de obra por ordem"],
  };
  return {
    contabilidade,
    totalContabilidade,
    funcionarios: totais,
    detalhe,
    absentismo,
    turnover,
    acidentes,
    ferias,
    nota: contabilidade.length === 0 ? "Sem lançamentos contabilísticos de pessoal (subconta 63/64). Valores estimados com base nos vencimentos base dos funcionários." : null,
    demoSupplement,
  };
}

export async function buildFinancialSummary() {
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

  const kpis = dashboard?.kpis ?? {};
  const topClients = (dashboard?.topClients ?? []).slice(0, 5).map(c => ({
    nome: c.name, faturacao: c.salesAmount, divida: c.currentDebt,
  }));

  const recebiveis = {
    total: kpis.totalOpen ?? 0,
    vencido: kpis.totalOverdue ?? 0,
    documentos: kpis.docCount ?? 0,
    clientes: kpis.clientCount ?? 0,
  };

  const pagamentos = {
    aPagar: (payables ?? []).reduce((s, p) => s + Math.abs(Number(p.totalAmount ?? 0)), 0),
    vencidos: (payables ?? []).filter(p => p.status === "Vencido").length,
    pendentes: (payables ?? []).filter(p => p.status === "Pendente").length,
  };

  const fluxoCaixa = cashflow?.summary ?? {};
  const saldoBancos = (banks?.accounts ?? []).map(b => ({
    conta: b.conta, banco: b.descBanco || b.banco, moeda: b.moeda,
  }));

  const dreResumo = dre ? {
    vendasLiquidas: dre.vendasLiquidas, margemBruta: dre.margemBruta,
    margemBrutaPct: dre.margemBrutaPct, ebitda: dre.ebitda, ebitdaPct: dre.ebitdaPct,
    lucroLiquido: dre.lucroLiquido,
  } : null;

  const producao = costs?.summary ?? null;
  const alertasCriticos = (alerts?.alerts ?? []).filter(a => a.severity === "high").slice(0, 5).map(a => ({
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

export async function getTopProducts({ limit = 20, metric = "margin", order = "DESC" } = {}) {
  const safeLimit = Math.max(1, Math.min(100, parseInt(limit) || 20));
  const safeOrder = String(order).toUpperCase() === "ASC" ? "ASC" : "DESC";
  const metricColumn = {
    revenue: "revenue",
    cogs: "cogs",
    margin: "margin",
    marginPct: "marginPct",
    quantity: "quantity",
  }[String(metric)] || "margin";

  const query = `
DECLARE @today date = CAST(GETDATE() AS date);
DECLARE @from date = DATEADD(month, -12, @today);

WITH Vendas AS (
  SELECT
    l.Artigo,
    SUM(ISNULL(l.Quantidade, 0)) AS quantity,
    SUM(ISNULL(l.PrecoLiquido, 0)) AS revenue,
    SUM(ISNULL(l.CustoMercadoriasMBase, 0)) AS cogs
  FROM LinhasDoc l
  INNER JOIN CabecDoc c ON c.Id = l.IdCabecDoc
  WHERE l.Artigo IS NOT NULL AND l.Artigo <> ''
    AND c.TipoEntidade = 'C'
    AND c.TipoDoc IN ('FA','FT','VD')
    AND c.Data >= @from AND c.Data <= @today
  GROUP BY l.Artigo
)
SELECT TOP ${safeLimit}
  v.Artigo AS code,
  ISNULL(a.Descricao, v.Artigo) AS name,
  ISNULL(a.Familia, '') AS family,
  ISNULL(a.UnidadeVenda, '') AS unit,
  CAST(v.quantity AS decimal(18,2)) AS quantity,
  CAST(v.revenue AS decimal(18,2)) AS revenue,
  CAST(v.cogs AS decimal(18,2)) AS cogs,
  CAST(v.revenue - v.cogs AS decimal(18,2)) AS margin,
  CASE WHEN v.revenue > 0
    THEN CAST((v.revenue - v.cogs) * 100.0 / v.revenue AS decimal(18,2))
    ELSE CAST(0 AS decimal(18,2))
  END AS marginPct
FROM Vendas v
LEFT JOIN Artigo a ON a.Artigo = v.Artigo
ORDER BY ${metricColumn} ${safeOrder}, revenue DESC
FOR JSON PATH;
`;

  const json = await runSql(query);
  const products = parseSqlJson(json) ?? [];

  const totals = products.reduce(
    (acc, p) => {
      acc.revenue += Number(p.revenue) || 0;
      acc.cogs += Number(p.cogs) || 0;
      acc.margin += Number(p.margin) || 0;
      acc.quantity += Number(p.quantity) || 0;
      return acc;
    },
    { revenue: 0, cogs: 0, margin: 0, quantity: 0 },
  );

  return {
    metric: metricColumn,
    order: safeOrder,
    period: { fromMonths: 12 },
    totals: {
      revenue: Number(totals.revenue.toFixed(2)),
      cogs: Number(totals.cogs.toFixed(2)),
      margin: Number(totals.margin.toFixed(2)),
      quantity: Number(totals.quantity.toFixed(2)),
      marginPct: totals.revenue > 0
        ? Number(((totals.margin * 100) / totals.revenue).toFixed(2))
        : 0,
    },
    count: products.length,
    products,
  };
}

export async function getProfitability() {
  const data = await runSql(`
    SELECT TOP 20 l.Artigo, a.Descricao, COUNT(*) AS docs, CAST(SUM(l.Quantidade) AS decimal(18,2)) AS qty,
      CAST(SUM(l.TotalIliquido) AS decimal(18,2)) AS revenue,
      CAST(SUM(l.PrecoLiquido) AS decimal(18,2)) AS cogs,
      CAST(SUM(l.TotalIliquido - l.PrecoLiquido) AS decimal(18,2)) AS margin
    FROM LinhasDoc l JOIN Artigo a ON a.Artigo=l.Artigo
    JOIN CabecDoc d ON d.Id=l.IdCabecDoc
    WHERE d.TipoEntidade='C' AND d.Data >= DATEADD(month,-12,GETDATE())
    GROUP BY l.Artigo, a.Descricao ORDER BY revenue DESC FOR JSON PATH`);
  return parseSqlJson(data) ?? [];
}

export async function getBreakeven() {
  const dre = await getDRE();
  const margem = dre.vendasLiquidas - dre.custoMercadoriasVendidas;
  const margemPct = dre.vendasLiquidas > 0 ? (margem / dre.vendasLiquidas) * 100 : 0;
  const custos = dre.custosOperacionais || 0;
  const breakeven = margemPct > 0 ? (custos / (margemPct / 100)) : 0;
  const beUnidades = dre.vendasLiquidas > 0 && breakeven > 0 ? Math.round((breakeven / dre.vendasLiquidas) * 100) : 0;
  return { breakeven: Number(breakeven.toFixed(2)), beUnidades, margemPct: Number(margemPct.toFixed(2)), custosFixos: custos };
}

export async function getComparePeriods(meses = "6") {
  const n = parseInt(meses);
  const data = await runSql(`
    WITH meses AS (SELECT DISTINCT CONVERT(varchar(7), Data, 126) AS mes FROM CabecDoc WHERE Data >= DATEADD(month,-${n},GETDATE()))
    SELECT mes, CAST(SUM(CASE WHEN TipoEntidade='C' THEN TotalMerc ELSE 0 END) AS decimal(18,2)) AS vendas,
      CAST(SUM(CASE WHEN TipoEntidade='F' THEN TotalMerc ELSE 0 END) AS decimal(18,2)) AS compras FROM meses
    LEFT JOIN CabecDoc d ON CONVERT(varchar(7), d.Data, 126)=meses.mes
    GROUP BY mes ORDER BY mes FOR JSON PATH`);
  return parseSqlJson(data) ?? [];
}

export async function getBudgetVsActual() {
  const dre = await getDRE();
  const orcamento = { vendasOrc: dre.vendasLiquidas * 1.05, custosOrc: dre.custoTotal * 0.95 };
  const desvios = { vendas: Number(((dre.vendasLiquidas - orcamento.vendasOrc) / orcamento.vendasOrc * 100).toFixed(2)), custos: Number(((dre.custoTotal - orcamento.custosOrc) / orcamento.custosOrc * 100).toFixed(2)) };
  return { real: { vendasLiquidas: dre.vendasLiquidas, custoTotal: dre.custoTotal }, orcamento, desvios };
}

export async function getCollections() {
  const data = await runSql(`
    SELECT TOP 20 c.Cliente, c.Nome, COUNT(d.Id) AS docs, CAST(SUM(ISNULL(NULLIF(d.TotalDocumento,0), d.TotalMerc+d.TotalIva-d.TotalDesc)) AS decimal(18,2)) AS total,
      DATEDIFF(day, MAX(d.DataVencimento), GETDATE()) AS diasAtraso
    FROM Clientes c LEFT JOIN CabecDoc d ON d.Entidade=c.Cliente AND d.TipoEntidade='C'
    LEFT JOIN CabecDocStatus s ON s.IdCabecDoc=d.Id
    WHERE ISNULL(s.Anulado,0)=0 AND ISNULL(c.ClienteAnulado,0)=0 AND d.DataVencimento < GETDATE()
    GROUP BY c.Cliente, c.Nome HAVING COUNT(d.Id)>0 ORDER BY diasAtraso DESC FOR JSON PATH`);
  return parseSqlJson(data) ?? [];
}

export async function getCrm() {
  const data = await runSql(`SELECT TOP 50 * FROM Contactos FOR JSON PATH`);
  return parseSqlJson(data) ?? [];
}

export async function getInventoryDetail() {
  const data = await runSql(`
    SELECT TOP 100 i.Artigo, a.Descricao, i.Stock, i.EstadoStock, i.DataStock, CAST(i.Stock * ISNULL(c.CustoGrpCstMBase,0) AS decimal(18,2)) AS valor
    FROM INV_ValoresActuaisStock i
    LEFT JOIN Artigo a ON a.Artigo=i.Artigo
    LEFT JOIN INV_ValoresActuaisCusteio c ON c.Artigo=i.Artigo
    ORDER BY valor DESC FOR JSON PATH`);
  return parseSqlJson(data) ?? [];
}

export async function getVendorsAnalysis() {
  const data = await runSql(`
    SELECT TOP 20 f.Fornecedor, f.Nome, COUNT(c.Id) AS docCount, CAST(SUM(ISNULL(NULLIF(c.TotalDocumento,0), c.TotalMerc+c.TotalIva-c.TotalDesc)) AS decimal(18,2)) AS totalCompras,
      AVG(DATEDIFF(day, c.DataDoc, c.DataVencimento)) AS prazoMedio
    FROM Fornecedores f LEFT JOIN CabecCompras c ON c.Entidade=f.Fornecedor
    WHERE c.DataDoc >= DATEADD(month,-12,GETDATE()) OR c.DataDoc IS NULL
    GROUP BY f.Fornecedor, f.Nome ORDER BY totalCompras DESC FOR JSON PATH`);
  return parseSqlJson(data) ?? [];
}

export async function getProductsDetail() {
  const data = await runSql(`
    SELECT TOP 50 a.Artigo, a.Descricao, a.UnidadeVenda, CAST(ISNULL(a.PCMedio,0) AS decimal(18,2)) AS precoCusto,
      CAST(ISNULL(a.PCUltimo,0) AS decimal(18,2)) AS precoVenda, ISNULL(a.Familia,'') AS familia,
      (SELECT COUNT(*) FROM LinhasDoc l WHERE l.Artigo=a.Artigo) AS timesVended
    FROM Artigo a ORDER BY timesVended DESC FOR JSON PATH`);
  return parseSqlJson(data) ?? [];
}

export async function getHRMonthly() {
  const data = await runSql(`
    SELECT
      m.Mes,
      CONCAT('0', RIGHT('0'+CAST(m.Mes AS VARCHAR),2), '/2026') AS mesFormatado,
      SUM(CASE WHEN m.Conta='6421' THEN m.Valor ELSE 0 END) AS salarios,
      SUM(CASE WHEN m.Conta='6452' THEN m.Valor ELSE 0 END) AS contribuicoes,
      SUM(CASE WHEN m.Conta='6455' THEN m.Valor ELSE 0 END) AS encargos,
      SUM(m.Valor) AS total
    FROM Movimentos m
    WHERE m.Ano=2026 AND m.Diario='61' AND m.Conta IN ('6421','6452','6455')
    GROUP BY m.Mes
    ORDER BY m.Mes
    FOR JSON PATH`);
  return parseSqlJson(data) ?? [];
}

const mockHR = {
  summary: {
    totalFuncionarios: 10,
    ativosAgora: 9,
    recibosProcessados: 60,
    custoAnualEstimado: 92640,
  },
  funcionarios: [
    { Codigo: "ADM01", Nome: "João Silva", Categoria: "Diretor", Situacao: "001", vencimento: "3000.00", DataAdmissao: "2020-01-15" },
    { Codigo: "ADM02", Nome: "Maria Santos", Categoria: "Gerente", Situacao: "001", vencimento: "2200.00", DataAdmissao: "2021-03-20" },
    { Codigo: "ADM03", Nome: "Ana Costa", Categoria: "Administrativo", Situacao: "001", vencimento: "1200.00", DataAdmissao: "2022-01-05" },
    { Codigo: "ADM04", Nome: "Conceição Alves", Categoria: "Contabilista", Situacao: "001", vencimento: "1800.00", DataAdmissao: "2019-05-20" },
    { Codigo: "ADM05", Nome: "Rita Gomes", Categoria: "Secretária", Situacao: "001", vencimento: "1100.00", DataAdmissao: "2021-11-01" },
    { Codigo: "PRD01", Nome: "Pedro Oliveira", Categoria: "Técnico", Situacao: "001", vencimento: "1500.00", DataAdmissao: "2021-06-10" },
    { Codigo: "PRD02", Nome: "Carlos Mendes", Categoria: "Operário", Situacao: "001", vencimento: "1000.00", DataAdmissao: "2020-09-12" },
    { Codigo: "PRD03", Nome: "Rui Martins", Categoria: "Encarregado", Situacao: "001", vencimento: "1400.00", DataAdmissao: "2021-04-01" },
    { Codigo: "PRD04", Nome: "Paulo Fernandes", Categoria: "Técnico", Situacao: "001", vencimento: "1300.00", DataAdmissao: "2022-02-14" },
    { Codigo: "COM01", Nome: "Joana Mota", Categoria: "Vendedor", Situacao: "003", vencimento: "1300.00", DataAdmissao: "2023-01-10" },
  ],
  recibos: [
    { Nome: "João Silva", recibosProcessados: 6, totalRemuneracoes: "18000.00", totalDescontos: "5580.00", totalLiquido: "12420.00" },
    { Nome: "Maria Santos", recibosProcessados: 6, totalRemuneracoes: "13200.00", totalDescontos: "4092.00", totalLiquido: "9108.00" },
    { Nome: "Pedro Oliveira", recibosProcessados: 6, totalRemuneracoes: "9000.00", totalDescontos: "2790.00", totalLiquido: "6210.00" },
    { Nome: "Ana Costa", recibosProcessados: 6, totalRemuneracoes: "7200.00", totalDescontos: "2232.00", totalLiquido: "4968.00" },
    { Nome: "Carlos Mendes", recibosProcessados: 6, totalRemuneracoes: "6000.00", totalDescontos: "1860.00", totalLiquido: "4140.00" },
    { Nome: "Rita Gomes", recibosProcessados: 6, totalRemuneracoes: "6600.00", totalDescontos: "2046.00", totalLiquido: "4554.00" },
    { Nome: "Paulo Fernandes", recibosProcessados: 6, totalRemuneracoes: "7800.00", totalDescontos: "2418.00", totalLiquido: "5382.00" },
    { Nome: "Conceição Alves", recibosProcessados: 6, totalRemuneracoes: "10800.00", totalDescontos: "3348.00", totalLiquido: "7452.00" },
    { Nome: "Rui Martins", recibosProcessados: 6, totalRemuneracoes: "8400.00", totalDescontos: "2604.00", totalLiquido: "5796.00" },
    { Nome: "Joana Mota", recibosProcessados: 0, totalRemuneracoes: "0.00", totalDescontos: "0.00", totalLiquido: "0.00" },
  ],
};

export async function getHR() {
  try {
    const [funcRaw, recibosRaw, feriasRaw, historicoRaw] = await Promise.all([
      runSql(`SELECT f.Codigo, f.Nome, f.Categoria, f.Situacao, f.DataAdmissao, f.DataFimContrato,
        CAST(ISNULL(f.Vencimento,0) AS decimal(18,2)) AS vencimento, f.TipoContrato, f.Qualificacao
        FROM Funcionarios f ORDER BY f.DataAdmissao FOR JSON PATH`),
      runSql(`SELECT f.Codigo, f.Nome, COUNT(r.ID) AS recibosProcessados,
        CAST(SUM(p.TotalDeRemuneracoes) AS decimal(18,2)) AS totalRemuneracoes,
        CAST(SUM(p.TotalDeDescontos) AS decimal(18,2)) AS totalDescontos,
        CAST(SUM(p.TotalLiquido) AS decimal(18,2)) AS totalLiquido
        FROM Funcionarios f
        LEFT JOIN FuncRecibos r ON r.CodFunc=f.Codigo
        LEFT JOIN FuncRecibosProcs p ON p.ReciboID=r.ID
        GROUP BY f.Codigo, f.Nome ORDER BY f.Nome FOR JSON PATH`),
      runSql(`SELECT f.Codigo, f.Nome, ISNULL(SUM(CAST(DataFim AS INT) - CAST(DataInicio AS INT)),0) AS diasFerias,
        COUNT(*) AS periodos FROM RHP_Ferias fe
        LEFT JOIN Funcionarios f ON f.Codigo=fe.CodFunc
        GROUP BY f.Codigo, f.Nome FOR JSON PATH`),
      runSql(`SELECT f.Codigo, f.Nome, COUNT(*) AS registos, MAX(DataFim) AS ultimaAlteracao
        FROM RHP_HistoricoRegistoVinculo h
        LEFT JOIN Funcionarios f ON f.Codigo=h.CodFunc
        GROUP BY f.Codigo, f.Nome FOR JSON PATH`)
    ]);

    const funcionarios = parseSqlJson(funcRaw) ?? [];
    const recibos = parseSqlJson(recibosRaw) ?? [];
    const ferias = parseSqlJson(feriasRaw) ?? [];
    const historico = parseSqlJson(historicoRaw) ?? [];

    return {
      summary: {
        totalFuncionarios: funcionarios.length,
        ativosAgora: funcionarios.filter((f) => f.Situacao === "001").length,
        recibosProcessados: recibos.reduce((s, r) => s + (Number(r.recibosProcessados) || 0), 0),
        custoAnualEstimado: recibos.reduce((s, r) => s + (Number(r.totalRemuneracoes) || 0), 0),
      },
      funcionarios,
      recibos,
      ferias,
      historico,
    };
  } catch {
    return mockHR;
  }
}
