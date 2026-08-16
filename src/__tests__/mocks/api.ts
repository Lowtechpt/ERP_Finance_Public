// Mock API responses for testing
export const mockReceivables = [
  {
    documentNumber: "FT001",
    clientName: "Cliente A",
    totalAmount: 1500.00,
    dueDate: "2026-09-15",
    status: "Vencido" as const,
    daysPastDue: 10,
    source: "demo" as const,
  },
  {
    documentNumber: "FT002",
    clientName: "Cliente B",
    totalAmount: 2500.50,
    dueDate: "2026-09-20",
    status: "Pendente" as const,
    daysPastDue: 0,
    source: "demo" as const,
  },
];

export const mockPayables = [
  {
    documentNumber: "FC001",
    vendorName: "Fornecedor X",
    totalAmount: 3000.00,
    dueDate: "2026-09-25",
    status: "Vencido" as const,
    source: "demo" as const,
  },
  {
    documentNumber: "FC002",
    vendorName: "Fornecedor Y",
    totalAmount: 1200.00,
    dueDate: "2026-10-10",
    status: "Pendente" as const,
    source: "demo" as const,
  },
];

// DashboardPage fetches two endpoints in parallel and treats each response as
// a distinct shape: `/api/financial-kpis` resolves directly to a flat KPIs
// object (setKpis(kpiData) — no wrapper), `/api/dashboard` resolves to
// { topClients, salesTrend, payablesAlert }. A previous version merged both
// into one nested `mockDashboard.kpis` object with made-up field names
// (sales6m, receivables, upcomingPayments) that the component never reads —
// every field silently fell back to its `?? 0`/`?? []` default, and nothing
// caught it because the tests using it only asserted `toBeDefined()`.
export const mockFinancialKpis = {
  vendas: 359849.27,
  cmv: 214313.7,
  margem: 145535.57,
  margemPct: 40.4,
  ebitda: 26928.69,
  ebitdaPct: 7.5,
  recebiveis: 89539.2,
  aPagar: 29740.05,
  stock: 1150599.48,
  saldoBancario: 3161.6,
  capitalCirculante: 1210398.63,
  dso: 91,
};

export const mockDashboard = {
  topClients: [
    { name: "Cliente A", code: "CL001", salesAmount: 35000, currentDebt: 5000 },
    { name: "Cliente B", code: "CL002", salesAmount: 28000, currentDebt: 0 },
  ],
  salesTrend: [{ month: "2026-05", total: 32889.34, docs: 3 }],
  payablesAlert: [
    { doc: "FC001", supplier: "Fornecedor X", dueDate: "25/09/2026", daysOverdue: 12, total: 3000 },
  ],
};

export const mockCashFlow = {
  months: ["Jan", "Feb", "Mar", "Apr", "May", "Jun"],
  inflows: [15000, 18000, 16500, 19000, 17500, 20000],
  outflows: [12000, 13500, 14000, 15000, 14500, 15500],
  netCashFlow: [3000, 4500, 2500, 4000, 3000, 4500],
  balance: [3000, 7500, 10000, 14000, 17000, 21500],
};

export const mockBanks = [
  {
    accountNumber: "PT50123456789",
    bankName: "Banco A",
    balance: 50000,
    currency: "EUR",
    type: "Conta Corrente" as const,
  },
];

export const mockDRE = {
  vendas: 125000,
  custoVendido: 75000,
  margem: 50000,
  operacional: 20000,
  ebitda: 30000,
  financeiro: 1000,
  imposto: 7300,
  resultado: 21700,
};

export const mockAlerts = [
  {
    id: "alert-1",
    type: "receivables" as const,
    severity: "high" as const,
    title: "Cobranças vencidas",
    message: "5 documentos vencidos totalizando 15,000 EUR",
    date: "2026-08-15",
  },
  {
    id: "alert-2",
    type: "inventory" as const,
    severity: "medium" as const,
    title: "Stock baixo",
    message: "3 artigos abaixo de stock mínimo",
    date: "2026-08-15",
  },
];

export const mockHRData = {
  totalEmployees: 10,
  activeEmployees: 9,
  payroll: 45000,
  absenteeismRate: 0.032,
  turnoverRate: 0.167,
  accidents: 3,
};

export const mockModules = [
  { code: "VND", name: "Vendas", records: 125 },
  { code: "CMP", name: "Compras", records: 87 },
  { code: "INV", name: "Inventário", records: 342 },
  { code: "RH", name: "Recursos Humanos", records: 10 },
];

export const mockCustomers = [
  {
    id: "CUST001",
    name: "Cliente A",
    email: "cliente.a@example.com",
    phone: "+351 21 1234567",
    outstanding: 15000,
    rating: "A" as const,
  },
  {
    id: "CUST002",
    name: "Cliente B",
    email: "cliente.b@example.com",
    phone: "+351 21 7654321",
    outstanding: 8500,
    rating: "B" as const,
  },
];

export const mockProduction = {
  orders: [
    {
      number: "ORD001",
      status: "Em produção" as const,
      completionPercentage: 65,
      scheduledEnd: "2026-08-20",
    },
  ],
  materials: [
    {
      articleCode: "ART001",
      description: "Matéria Prima A",
      quantity: 100,
      cost: 50,
    },
  ],
};

export const mockProfitability = {
  products: [
    {
      name: "Produto A",
      revenue: 45000,
      cost: 27000,
      margin: 40,
      marketShare: 0.35,
    },
    {
      name: "Produto B",
      revenue: 35000,
      cost: 21000,
      margin: 40,
      marketShare: 0.27,
    },
  ],
};

export const createMockFetchResponse = (data: unknown, status = 200) => {
  return Promise.resolve({
    ok: status >= 200 && status < 300,
    status,
    json: () => Promise.resolve(data),
    text: () => Promise.resolve(JSON.stringify(data)),
    blob: () => Promise.resolve(new Blob([JSON.stringify(data)])),
    clone: () => ({
      ok: status >= 200 && status < 300,
      status,
      json: () => Promise.resolve(data),
    }),
  } as Response);
};

export const createMockFetchError = (message: string) => {
  return Promise.reject(new Error(message));
};
