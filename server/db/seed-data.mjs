// Synthetic demo data for MEG-Finance's portable SQLite backend.
// Row shapes mirror server/db/schema.sql exactly (column names/order).
// Numbers are deterministic (seeded PRNG) so the demo dataset is reproducible.

function mulberry32(seed) {
  return function () {
    seed |= 0;
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
const rnd = mulberry32(20260614);
const randInt = (min, max) => Math.floor(rnd() * (max - min + 1)) + min;
const randFloat = (min, max, dec = 2) => Number((rnd() * (max - min) + min).toFixed(dec));
const pick = (arr) => arr[randInt(0, arr.length - 1)];

function addDaysStr(dateStr, days) {
  const [y, m, d] = dateStr.split("-").map(Number);
  const dt = new Date(Date.UTC(y, m - 1, d));
  dt.setUTCDate(dt.getUTCDate() + days);
  return dt.toISOString().slice(0, 10);
}
function monthStr(y, m) {
  return `${y}-${String(m).padStart(2, "0")}-15`;
}

// ---------------------------------------------------------------------------
// Clientes (25)
// ---------------------------------------------------------------------------
const clienteNomes = [
  "Sofrio", "Microavi", "Worten", "Metalúrgica Vale do Ave", "Ferragens Silva & Filhos",
  "Distribuidora Beira Alta", "Comercial Douro Sul", "Indústrias Reunidas do Norte",
  "Papelaria Central", "Construções Almeida", "Têxteis Minho", "Auto Peças Lusitânia",
  "Refrigeração Costa", "Mobiliário Atlântico", "Embalagens Ibéricas",
  "Electrodomésticos Nortenha", "Química Industrial Tejo", "Cerâmica Estrela",
  "Vidros do Cávado", "Plásticos Ribeiro", "Ferro & Aço Bragança", "Comercial Setúbal",
  "Distribuição Algarve", "Componentes Aveiro", "Soluções Industriais Coimbra",
];
const Clientes = clienteNomes.map((nome, i) => ({
  Cliente: `CL${String(i + 1).padStart(3, "0")}`,
  Nome: nome,
  Email: `geral@${nome.toLowerCase().replace(/[^a-z0-9]+/g, "")}.pt`,
  Fac_Tel: `2${randInt(10000000, 99999999)}`,
  NumContrib: String(randInt(500000000, 599999999)),
  Moeda: i === 24 ? "USD" : "EUR",
  TotalDeb: randFloat(0, 15000),
  LimiteCred: randFloat(5000, 50000),
  CondPag: pick(["30 dias", "60 dias", "Pronto pagamento", "45 dias"]),
  Vendedor: pick(["V01", "V02", "V03", "V04"]),
  ClienteAnulado: 0,
}));

// ---------------------------------------------------------------------------
// Fornecedores (9)
// ---------------------------------------------------------------------------
const fornecedorNomes = [
  "Metalomecânica Ferreira", "Plásticos do Norte", "Química Ibérica",
  "Embalagens Sul", "Transportes Rápido Lda", "Ferragens Industriais Costa",
  "Componentes Eletrónicos Braga", "Matérias-Primas Atlântico", "Logística Douro",
];
const Fornecedores = fornecedorNomes.map((nome, i) => ({
  Fornecedor: `FO${String(i + 1).padStart(3, "0")}`,
  Nome: nome,
  NumContrib: String(randInt(500000000, 599999999)),
}));

// ---------------------------------------------------------------------------
// Artigo (60): 15 matérias-primas, 20 componentes, 25 acabados
// ---------------------------------------------------------------------------
const Artigo = [];
for (let i = 1; i <= 15; i++) {
  Artigo.push({
    Artigo: `MP${String(i).padStart(3, "0")}`,
    Descricao: `Matéria-Prima ${i}`,
    Familia: "Materia-Prima",
    UnidadeVenda: "KG",
    PCMedio: randFloat(0.5, 25, 2),
    PCUltimo: randFloat(0.5, 25, 2),
  });
}
for (let i = 1; i <= 20; i++) {
  Artigo.push({
    Artigo: `CP${String(i).padStart(3, "0")}`,
    Descricao: `Componente ${i}`,
    Familia: "Componentes",
    UnidadeVenda: "UN",
    PCMedio: randFloat(1, 60, 2),
    PCUltimo: randFloat(1, 60, 2),
  });
}
for (let i = 1; i <= 25; i++) {
  Artigo.push({
    Artigo: `A${String(i).padStart(4, "0")}`,
    Descricao: `Produto Acabado ${i}`,
    Familia: "Acabado",
    UnidadeVenda: "UN",
    PCMedio: randFloat(20, 400, 2),
    PCUltimo: randFloat(20, 400, 2),
  });
}
const artigosMP = Artigo.filter((a) => a.Artigo.startsWith("MP")).map((a) => a.Artigo);
const artigosCP = Artigo.filter((a) => a.Artigo.startsWith("CP")).map((a) => a.Artigo);
const artigosA = Artigo.filter((a) => a.Artigo.startsWith("A")).map((a) => a.Artigo);

// ---------------------------------------------------------------------------
// CabecDoc (55 sales docs) + CabecDocStatus + LinhasDoc
// ---------------------------------------------------------------------------
const CabecDoc = [];
const CabecDocStatus = [];
const LinhasDoc = [];

for (let i = 0; i < 55; i++) {
  const data = addDaysStr("2025-07-01", Math.floor((i / 55) * 345) + randInt(0, 4));
  const dueOffset = randInt(30, 60);
  const dataVencimento = addDaysStr(data, dueOffset);
  const totalMerc = randFloat(2000, 15000);
  const totalIva = Number((totalMerc * 0.23).toFixed(2));
  const totalDesc = randFloat(0, totalMerc * 0.05);
  const totalDocumento = Number((totalMerc + totalIva - totalDesc).toFixed(2));

  CabecDoc.push({
    TipoDoc: i % 2 === 0 ? "FA" : "FT",
    Serie: "2026",
    NumDoc: 1000 + i,
    Data: data,
    DataVencimento: dataVencimento,
    Entidade: pick(Clientes).Cliente,
    TipoEntidade: "C",
    Moeda: "EUR",
    CondPag: pick(["30 dias", "60 dias", "Pronto pagamento"]),
    RespCobranca: pick(["V01", "V02", "V03", "V04"]),
    Referencia: `ENC${1000 + i}`,
    TotalDocumento: totalDocumento,
    TotalMerc: totalMerc,
    TotalIva: totalIva,
    TotalDesc: totalDesc,
  });

  CabecDocStatus.push({ IdCabecDoc: i + 1, Anulado: 0 });

  const numLinhas = randInt(2, 4);
  let remaining = totalMerc;
  for (let l = 0; l < numLinhas; l++) {
    const artigo = pick(artigosA.concat(artigosCP));
    const lineTotal = l === numLinhas - 1 ? Math.max(remaining, 10) : Number((remaining / (numLinhas - l) * randFloat(0.7, 1.3)).toFixed(2));
    remaining -= lineTotal;
    const custoRatio = randFloat(0.55, 0.75);
    const totalIliquido = Math.max(lineTotal, 5);
    const precoLiquido = Number((totalIliquido * custoRatio).toFixed(2));

    LinhasDoc.push({
      IdCabecDoc: i + 1,
      NumLinha: l + 1,
      Artigo: artigo,
      Descricao: Artigo.find((a) => a.Artigo === artigo)?.Descricao ?? artigo,
      Quantidade: randInt(1, 50),
      PrecUnit: randFloat(5, 300),
      Desconto1: randFloat(0, 10),
      TotalIliquido: totalIliquido,
      PrecoLiquido: precoLiquido,
      TaxaIva: 23,
      TotalIva: Number((totalIliquido * 0.23).toFixed(2)),
      Armazem: "ARM01",
      CustoMercadoriasMBase: Number((precoLiquido * randFloat(0.55, 0.75)).toFixed(2)),
    });
  }
}

// ---------------------------------------------------------------------------
// CabecCompras (45) + LinhasCompras
// ---------------------------------------------------------------------------
const CabecCompras = [];
const LinhasCompras = [];

for (let i = 0; i < 45; i++) {
  const dataDoc = addDaysStr("2025-07-01", Math.floor((i / 45) * 345) + randInt(0, 4));
  const dueOffset = randInt(30, 45);
  const dataVencimento = addDaysStr(dataDoc, dueOffset);
  const totalMerc = randFloat(300, 6000);
  const totalIva = Number((totalMerc * 0.23).toFixed(2));
  const totalDesc = randFloat(0, totalMerc * 0.03);
  const totalDocumento = Number((totalMerc + totalIva - totalDesc).toFixed(2));

  CabecCompras.push({
    TipoDoc: "FC",
    Serie: "2026",
    NumDoc: 2000 + i,
    Entidade: pick(Fornecedores).Fornecedor,
    DataDoc: dataDoc,
    DataVencimento: dataVencimento,
    TotalDocumento: totalDocumento,
    TotalMerc: totalMerc,
    TotalIva: totalIva,
    TotalDesc: totalDesc,
    Moeda: "EUR",
    CondPag: pick(["30 dias", "45 dias", "60 dias"]),
    NumContribuinte: "",
    Nome: "",
  });

  const numLinhas = randInt(2, 4);
  for (let l = 0; l < numLinhas; l++) {
    LinhasCompras.push({
      IdCabecCompras: i + 1,
      NumLinha: l + 1,
      Artigo: pick(artigosMP.concat(artigosCP)),
      Quantidade: randInt(5, 200),
      PrecUnit: randFloat(0.5, 40),
    });
  }
}

// ---------------------------------------------------------------------------
// ContasBancarias (3) + CabecTesouraria (25)
// ---------------------------------------------------------------------------
const ContasBancarias = [
  { Conta: "BNC001", DescBanco: "Conta Ordem", Banco: "Millennium BCP", Moeda: "EUR", TipoConta: "Ordem", Limite: 2000 },
  { Conta: "BNC002", DescBanco: "Depósito a Prazo", Banco: "Caixa Geral de Depósitos", Moeda: "EUR", TipoConta: "Deposito", Limite: 0 },
  { Conta: "BNC003", DescBanco: "Conta USD", Banco: "Novo Banco", Moeda: "USD", TipoConta: "Ordem", Limite: 500 },
];

const CabecTesouraria = [];
for (let i = 0; i < 25; i++) {
  const data = addDaysStr("2026-04-16", randInt(0, 58));
  const isCredito = i % 2 === 0;
  CabecTesouraria.push({
    TipoDoc: isCredito ? "RC" : "PG",
    Serie: "2026",
    NumDoc: 3000 + i,
    Entidade: isCredito ? pick(Clientes).Cliente : pick(Fornecedores).Fornecedor,
    TipoEntidade: isCredito ? "C" : "F",
    TotalDebito: isCredito ? 0 : randFloat(200, 4000),
    TotalCredito: isCredito ? randFloat(200, 4000) : 0,
    ContaOrigem: pick(ContasBancarias).Conta,
    ContaDestino: pick(ContasBancarias).Conta,
    Moeda: "EUR",
    Observacoes: isCredito ? "Recebimento cliente" : "Pagamento fornecedor",
    DataUltimaActualizacao: data,
  });
}

// ---------------------------------------------------------------------------
// Funcionarios (10)
// ---------------------------------------------------------------------------
const Funcionarios = [
  { Codigo: "ADM01", Nome: "João Silva", Categoria: "Diretor", Situacao: "A", Vencimento: 2200, DataAdmissao: "2020-02-01", DataFimContrato: "", TipoContrato: "Efetivo", Qualificacao: "Licenciatura", CentroCusto: "ADM" },
  { Codigo: "ADM02", Nome: "Maria Santos", Categoria: "Gerente", Situacao: "A", Vencimento: 1800, DataAdmissao: "2021-03-15", DataFimContrato: "", TipoContrato: "Efetivo", Qualificacao: "Licenciatura", CentroCusto: "ADM" },
  { Codigo: "ADM03", Nome: "Ana Costa", Categoria: "Administrativo", Situacao: "A", Vencimento: 1100, DataAdmissao: "2022-06-01", DataFimContrato: "", TipoContrato: "Efetivo", Qualificacao: "12º ano", CentroCusto: "ADM" },
  { Codigo: "ADM04", Nome: "Conceição Alves", Categoria: "Contabilista", Situacao: "A", Vencimento: 1600, DataAdmissao: "2019-09-10", DataFimContrato: "", TipoContrato: "Efetivo", Qualificacao: "Licenciatura", CentroCusto: "ADM" },
  { Codigo: "PRD01", Nome: "Pedro Oliveira", Categoria: "Técnico", Situacao: "A", Vencimento: 1300, DataAdmissao: "2021-01-20", DataFimContrato: "", TipoContrato: "Efetivo", Qualificacao: "12º ano", CentroCusto: "PRD" },
  { Codigo: "PRD02", Nome: "Carlos Mendes", Categoria: "Operário", Situacao: "A", Vencimento: 1000, DataAdmissao: "2020-11-05", DataFimContrato: "", TipoContrato: "Efetivo", Qualificacao: "9º ano", CentroCusto: "PRD" },
  { Codigo: "PRD03", Nome: "Rui Martins", Categoria: "Encarregado", Situacao: "A", Vencimento: 1250, DataAdmissao: "2021-07-12", DataFimContrato: "", TipoContrato: "Efetivo", Qualificacao: "12º ano", CentroCusto: "PRD" },
  { Codigo: "PRD04", Nome: "Paulo Fernandes", Categoria: "Técnico", Situacao: "A", Vencimento: 1150, DataAdmissao: "2022-02-14", DataFimContrato: "", TipoContrato: "Efetivo", Qualificacao: "12º ano", CentroCusto: "PRD" },
  { Codigo: "COM01", Nome: "Joana Mota", Categoria: "Vendedor", Situacao: "A", Vencimento: 1300, DataAdmissao: "2023-01-10", DataFimContrato: "", TipoContrato: "Efetivo", Qualificacao: "Licenciatura", CentroCusto: "COM" },
  { Codigo: "COM02", Nome: "Rita Gomes", Categoria: "Vendedor", Situacao: "I", Vencimento: 1200, DataAdmissao: "2021-11-01", DataFimContrato: "2025-12-15", TipoContrato: "Efetivo", Qualificacao: "12º ano", CentroCusto: "COM" },
];

// ---------------------------------------------------------------------------
// PlanoContas + Movimentos
// ---------------------------------------------------------------------------
const PlanoContas = [
  { Conta: "121", Descricao: "Depósitos à Ordem" },
  { Conta: "122", Descricao: "Depósitos a Prazo" },
  { Conta: "211", Descricao: "Clientes c/c" },
  { Conta: "221", Descricao: "Fornecedores c/c" },
  { Conta: "611", Descricao: "Custo das Mercadorias Vendidas" },
  { Conta: "621", Descricao: "Fornecimentos e Serviços Externos" },
  { Conta: "622", Descricao: "Rendas e Alugueres" },
  { Conta: "623", Descricao: "Comunicação" },
  { Conta: "624", Descricao: "Seguros" },
  { Conta: "625", Descricao: "Deslocações e Estadas" },
  { Conta: "626", Descricao: "Eletricidade" },
  { Conta: "627", Descricao: "Combustíveis" },
  { Conta: "628", Descricao: "Manutenção e Reparação" },
  { Conta: "6421", Descricao: "Remunerações do Pessoal" },
  { Conta: "6452", Descricao: "Encargos sobre Remunerações" },
  { Conta: "6455", Descricao: "Seguros de Acidentes de Trabalho" },
  { Conta: "681", Descricao: "Outros Gastos e Perdas" },
  { Conta: "711", Descricao: "Vendas de Mercadorias" },
  { Conta: "712", Descricao: "Vendas de Produtos Acabados" },
  { Conta: "721", Descricao: "Prestações de Serviços" },
  { Conta: "781", Descricao: "Outros Rendimentos e Ganhos" },
  { Conta: "11", Descricao: "Caixa" },
  { Conta: "12", Descricao: "Depósitos Bancários" },
  { Conta: "22", Descricao: "Fornecedores" },
  { Conta: "24", Descricao: "Estado e Outros Entes Públicos" },
  { Conta: "31", Descricao: "Compras" },
  { Conta: "32", Descricao: "Mercadorias" },
  { Conta: "36", Descricao: "Produtos Acabados e Intermédios" },
  { Conta: "43", Descricao: "Ativos Fixos Tangíveis" },
  { Conta: "51", Descricao: "Capital" },
];

const Movimentos = [];
function addMov(conta, natureza, valor, ano, mes, diario) {
  Movimentos.push({
    Conta: conta,
    Natureza: natureza,
    Valor: Number(valor.toFixed(2)),
    Ano: ano,
    Mes: mes,
    DataGravacao: monthStr(ano, mes),
    Diario: diario,
  });
}

// 12 months of sales/CMV, Jul 2025 - Jun 2026
const months12 = [];
for (let i = 0; i < 12; i++) {
  const m = ((6 + i) % 12) + 1; // starts July
  const y = m >= 7 ? 2025 : 2026;
  months12.push({ ano: y, mes: m });
}
for (const { ano, mes } of months12) {
  const vendasMes = randFloat(28000, 38000);
  addMov("711", "C", vendasMes, ano, mes, "GER");
  addMov("611", "D", vendasMes * randFloat(0.55, 0.65), ano, mes, "GER");
}

// Payroll Jan-Jun 2026, active employees only
const activeFuncionarios = Funcionarios.filter((f) => f.Situacao === "A");
const massaSalarialMensal = activeFuncionarios.reduce((s, f) => s + f.Vencimento, 0);
for (let mes = 1; mes <= 6; mes++) {
  addMov("6421", "D", massaSalarialMensal, 2026, mes, "61");
  addMov("6452", "D", massaSalarialMensal * 0.2375, 2026, mes, "61");
  addMov("6455", "D", massaSalarialMensal * 0.015, 2026, mes, "61");
}

// Operating expenses, spread across the same 12 months
const opexAccounts = ["621", "622", "623", "624", "625", "626", "627", "628"];
for (const conta of opexAccounts) {
  for (let i = 0; i < 6; i++) {
    const { ano, mes } = pick(months12);
    addMov(conta, "D", randFloat(80, 900), ano, mes, "GER");
  }
}

// Bank movements reflecting cash inflow/outflow
for (let i = 0; i < 18; i++) {
  const { ano, mes } = pick(months12);
  addMov("12", i % 2 === 0 ? "D" : "C", randFloat(500, 6000), ano, mes, "GER");
}

// ---------------------------------------------------------------------------
// GPR_OrdemFabrico (7) + Componentes + Operacoes
// ---------------------------------------------------------------------------
const GPR_OrdemFabrico = [];
const GPR_OrdemFabricoComponentes = [];
const GPR_OrdemFabricoOperacoes = [];

for (let i = 0; i < 7; i++) {
  const estado = i < 4 ? 4 : 2; // 4 closed, 3 open
  const overrun = i % 2 === 0; // alternate overrun/savings for closed orders
  const custoMatPrev = randFloat(800, 3000);
  const custoTransfPrev = randFloat(100, 500);
  const custoOutrosPrev = randFloat(20, 150);
  const factor = estado === 4 ? (overrun ? randFloat(1.05, 1.2) : randFloat(0.8, 0.95)) : 0;

  GPR_OrdemFabrico.push({
    OrdemFabrico: `OF2026${String(i + 1).padStart(3, "0")}`,
    Artigo: artigosA[i % artigosA.length],
    QtOrdemFabrico: randInt(5, 50),
    CustoMateriaisPrevisto: custoMatPrev,
    CustoMateriaisReal: estado === 4 ? Number((custoMatPrev * factor).toFixed(2)) : 0,
    CustoTransformacaoPrevisto: custoTransfPrev,
    CustoTransformacaoReal: estado === 4 ? Number((custoTransfPrev * factor).toFixed(2)) : 0,
    OutrosCustosPrevito: custoOutrosPrev,
    OutrosCustosReal: estado === 4 ? Number((custoOutrosPrev * factor).toFixed(2)) : 0,
    DataOrdemFabrico: addDaysStr("2026-01-05", i * 25),
    Estado: estado,
  });

  const numComponentes = randInt(3, 4);
  for (let c = 0; c < numComponentes; c++) {
    const qtPrevista = randInt(5, 50);
    GPR_OrdemFabricoComponentes.push({
      IDOrdemFabrico: i + 1,
      Componente: pick(artigosMP.concat(artigosCP)),
      QtPrevista: qtPrevista,
      QtConsumida: Math.max(0, qtPrevista + randInt(-5, 5)),
      Preco: randFloat(0.5, 40),
    });
  }

  const numOperacoes = randInt(2, 3);
  const operacoesNomes = ["Corte", "Montagem", "Acabamento", "Embalagem"];
  for (let o = 0; o < numOperacoes; o++) {
    GPR_OrdemFabricoOperacoes.push({
      IDOrdemFabrico: i + 1,
      Operacao: operacoesNomes[o % operacoesNomes.length],
      TempoPrevisto: randFloat(2, 20),
      TempoConsumido: randFloat(2, 22),
      CustoOperador: randFloat(20, 200),
      CustoMaquina: randFloat(10, 150),
    });
  }
}

// ---------------------------------------------------------------------------
// INV_ValoresActuaisStock + INV_ValoresActuaisCusteio (one row per Artigo)
// ---------------------------------------------------------------------------
const INV_ValoresActuaisStock = Artigo.map((a, i) => ({
  Artigo: a.Artigo,
  EstadoStock: "N",
  Stock: i < 10 ? randInt(0, 5) : randInt(10, 500),
  DataStock: "2026-06-10",
}));

const INV_ValoresActuaisCusteio = Artigo.map((a) => ({
  Artigo: a.Artigo,
  GrupoCustos: a.Familia === "Materia-Prima" ? "MP" : a.Familia === "Componentes" ? "CP" : "PA",
  CustoGrpCstMBase: a.PCMedio,
  CustoGrpCstLotMBase: a.PCMedio,
  DataCusteio: "2026-06-10",
}));

// INV_Movimentos: only ever COUNT(*)'d, so plain placeholder rows are enough.
const INV_Movimentos = Array.from({ length: 270 }, () => ({}));

// ---------------------------------------------------------------------------
// FuncRecibos (6/employee, Jan-Jun 2026, skipping months after departure)
// ---------------------------------------------------------------------------
const FuncRecibos = [];
const FuncRecibosProcs = [];
for (const f of Funcionarios) {
  const lastMonth = f.DataFimContrato ? Number(f.DataFimContrato.split("-")[1]) - 1 : 6;
  const monthsWorked = f.Situacao === "A" ? 6 : Math.max(0, Math.min(6, lastMonth));
  for (let mes = 1; mes <= monthsWorked; mes++) {
    FuncRecibos.push({ CodFunc: f.Codigo });
    const reciboId = FuncRecibos.length;
    const remuneracoes = f.Vencimento;
    const descontos = Number((remuneracoes * 0.23).toFixed(2));
    FuncRecibosProcs.push({
      ReciboID: reciboId,
      TotalDeRemuneracoes: remuneracoes,
      TotalDeDescontos: descontos,
      TotalLiquido: Number((remuneracoes - descontos).toFixed(2)),
    });
  }
}

// ---------------------------------------------------------------------------
// RHP_Ferias + RHP_HistoricoRegistoVinculo
// ---------------------------------------------------------------------------
const RHP_Ferias = [];
for (const f of Funcionarios) {
  const periodos = randInt(1, 3);
  for (let p = 0; p < periodos; p++) {
    const inicio = addDaysStr("2026-01-01", randInt(0, 330));
    RHP_Ferias.push({ CodFunc: f.Codigo, DataInicio: inicio, DataFim: addDaysStr(inicio, randInt(3, 10)) });
  }
}

const RHP_HistoricoRegistoVinculo = Funcionarios.map((f) => ({
  CodFunc: f.Codigo,
  DataFim: f.DataFimContrato || "",
}));

// ---------------------------------------------------------------------------
// Contactos, Armazens, Vendedores, VersaoModulo, DocumentosCCT
// ---------------------------------------------------------------------------
const Contactos = [
  { Nome: "Luís Baptista", Email: "luis.baptista@example.pt", Telefone: "912345678", Empresa: "Sofrio" },
  { Nome: "Sandra Pinto", Email: "sandra.pinto@example.pt", Telefone: "913456789", Empresa: "Microavi" },
  { Nome: "Miguel Rocha", Email: "miguel.rocha@example.pt", Telefone: "914567890", Empresa: "Worten" },
  { Nome: "Filipa Nogueira", Email: "filipa.nogueira@example.pt", Telefone: "915678901", Empresa: "Ferragens Silva & Filhos" },
  { Nome: "Bruno Cardoso", Email: "bruno.cardoso@example.pt", Telefone: "916789012", Empresa: "Comercial Douro Sul" },
  { Nome: "Teresa Marques", Email: "teresa.marques@example.pt", Telefone: "917890123", Empresa: "Têxteis Minho" },
  { Nome: "Nuno Ramos", Email: "nuno.ramos@example.pt", Telefone: "918901234", Empresa: "Auto Peças Lusitânia" },
  { Nome: "Cátia Lopes", Email: "catia.lopes@example.pt", Telefone: "919012345", Empresa: "Mobiliário Atlântico" },
  { Nome: "Hugo Ferreira", Email: "hugo.ferreira@example.pt", Telefone: "910123456", Empresa: "Embalagens Ibéricas" },
  { Nome: "Vera Antunes", Email: "vera.antunes@example.pt", Telefone: "911234567", Empresa: "Química Industrial Tejo" },
  { Nome: "Ricardo Sousa", Email: "ricardo.sousa@example.pt", Telefone: "912345670", Empresa: "Cerâmica Estrela" },
  { Nome: "Patrícia Gomes", Email: "patricia.gomes@example.pt", Telefone: "913456701", Empresa: "Vidros do Cávado" },
  { Nome: "André Correia", Email: "andre.correia@example.pt", Telefone: "914567012", Empresa: "Plásticos Ribeiro" },
  { Nome: "Cristina Neves", Email: "cristina.neves@example.pt", Telefone: "915670123", Empresa: "Ferro & Aço Bragança" },
  { Nome: "Tiago Batista", Email: "tiago.batista@example.pt", Telefone: "916701234", Empresa: "Comercial Setúbal" },
];

const Armazens = [
  { Codigo: "ARM01", Descricao: "Armazém Central" },
  { Codigo: "ARM02", Descricao: "Armazém Matérias-Primas" },
  { Codigo: "ARM03", Descricao: "Armazém Produto Acabado" },
  { Codigo: "ARM04", Descricao: "Armazém Componentes" },
  { Codigo: "ARM05", Descricao: "Armazém Devoluções" },
];

const Vendedores = [
  { Codigo: "V01", Nome: "Joana Mota" },
  { Codigo: "V02", Nome: "Rita Gomes" },
  { Codigo: "V03", Nome: "Bruno Cardoso" },
  { Codigo: "V04", Nome: "Nuno Ramos" },
];

const versaoModuloCodigos = [
  "BAS", "VND", "CBL", "CCT", "CMP", "CRM", "GPR", "INV", "RHP", "STP", "TES", "TTE",
  "FIL", "EAP", "PRJ", "PCM", "DFP", "INT", "GAB", "ORC", "COM", "COP", "EPK", "IAM",
  "SAF", "MOB", "APR", "CNO",
];
const VersaoModulo = versaoModuloCodigos.map((Modulo) => ({ Modulo }));

const DocumentosCCT = Array.from({ length: 20 }, () => ({}));

export default {
  Clientes,
  Fornecedores,
  Artigo,
  CabecDoc,
  CabecDocStatus,
  LinhasDoc,
  CabecCompras,
  LinhasCompras,
  ContasBancarias,
  CabecTesouraria,
  Movimentos,
  PlanoContas,
  GPR_OrdemFabrico,
  GPR_OrdemFabricoComponentes,
  GPR_OrdemFabricoOperacoes,
  INV_ValoresActuaisStock,
  INV_ValoresActuaisCusteio,
  INV_Movimentos,
  Funcionarios,
  FuncRecibos,
  FuncRecibosProcs,
  RHP_Ferias,
  RHP_HistoricoRegistoVinculo,
  Contactos,
  Armazens,
  Vendedores,
  VersaoModulo,
  DocumentosCCT,
};
