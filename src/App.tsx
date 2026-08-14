import {
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import {
  AlertTriangle,
  Banknote,
  BarChart3,
  Bell,
  BookOpenText,
  Building2,
  CalendarDays,
  ChartNoAxesCombined,
  ChevronDown,
  ClipboardList,
  Clock,
  CreditCard,
  Download,
  Factory,
  FileSpreadsheet,
  Filter,
  Gauge,
  LineChart,
  MenuIcon,
  MoreHorizontal,
  PanelRight,
  Plus,
  Receipt,
  Search,
  Send,
  Settings,
  ShieldCheck,
  Sparkles,
  TrendingDown,
  Users,
  WalletCards,
  XIcon,
} from "lucide-react";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  NavGridCard,
  NavItemMobile,
  NavSmallItem,
  NavigationMenu,
  NavigationMenuContent,
  NavigationMenuItem,
  NavigationMenuList,
  NavigationMenuTrigger,
  type NavItemType,
} from "@/components/ui/navigation-menu";
import { Sheet, SheetClose, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { cn } from "@/lib/utils";
import { apiUrl } from "@/lib/api";
import BanksPage from "@/pages/BanksPage";
import CashFlowPage from "@/pages/CashFlowPage";
import DashboardPage from "@/pages/DashboardPage";
import PayablesPage from "@/pages/PayablesPage";
import DREPage from "@/pages/DREPage";
import LiquidityPage from "@/pages/LiquidityPage";
import ProductionPage from "@/pages/ProductionPage";
import ProfitabilityPage from "@/pages/ProfitabilityPage";
import BreakEvenPage from "@/pages/BreakEvenPage";
import ComparePeriodsPage from "@/pages/ComparePeriodsPage";
import BudgetVsActualPage from "@/pages/BudgetVsActualPage";
import CollectionsCommsPage from "@/pages/CollectionsCommsPage";
import ExecutiveSummaryPage from "@/pages/ExecutiveSummaryPage";
import RootCauseAnalysisPage from "@/pages/RootCauseAnalysisPage";
import CreditRiskPage from "@/pages/CreditRiskPage";
import AlertsPage from "@/pages/AlertsPage";
import AlertThresholdsPage from "@/pages/AlertThresholdsPage";
import HRPage from "@/pages/HRPage";
import CostAllocationPage from "@/pages/CostAllocationPage";

const executiveLinks: NavItemType[] = [
  {
    title: "Dashboard executivo",
    href: "#dashboard",
    description: "KPIs, liquidez, margem e alertas críticos.",
    icon: Gauge,
  },
  {
    title: "Sumário com IA",
    href: "#sumario-ia",
    description: "Leitura executiva automática do período.",
    icon: Sparkles,
  },
  {
    title: "Alertas prioritários",
    href: "#alertas",
    description: "Riscos que precisam de decisão hoje.",
    icon: Bell,
  },
  { title: "Orçado vs realizado", href: "#orcado", icon: ChartNoAxesCombined },
  { title: "Top clientes", href: "#top-clientes", icon: Users },
  { title: "Top produtos", href: "#top-produtos", icon: BarChart3 },
];

const financeLinks: NavItemType[] = [
  {
    title: "DRE e margens",
    href: "#dre",
    description: "Demonstração de resultados por período.",
    icon: FileSpreadsheet,
  },
  {
    title: "Rentabilidade",
    href: "#rentabilidade",
    description: "Produto, cliente, centro de custo e departamento.",
    icon: LineChart,
  },
  {
    title: "Custos industriais",
    href: "#custos",
    description: "Matéria-prima, transformação, energia e desvios.",
    icon: Factory,
  },
  { title: "Break-even", href: "#breakeven", icon: TrendingDown },
  { title: "Comparar períodos", href: "#comparar", icon: CalendarDays },
  { title: "Causas com IA", href: "#causas", icon: Sparkles },
];

const treasuryLinks: NavItemType[] = [
  {
    title: "Fluxo de caixa",
    href: "#fluxo",
    description: "Entradas e saídas reais por dia, semana e mês.",
    icon: WalletCards,
  },
  {
    title: "Contas a receber",
    href: "#receber",
    description: "Faturas, aging, cobranças e detalhe operacional.",
    icon: Receipt,
  },
  {
    title: "Contas a pagar",
    href: "#pagar",
    description: "Compromissos futuros e prioridades de pagamento.",
    icon: CreditCard,
  },
  { title: "Previsão 30/60/90", href: "#previsao", icon: CalendarDays },
  { title: "Risco de liquidez", href: "#liquidez", icon: AlertTriangle },
  { title: "Bancos", href: "#bancos", icon: Banknote },
];

const clientLinks: NavItemType[] = [
  {
    title: "Carteira de clientes",
    href: "#clientes",
    description: "Volume, margem média e prazo médio de pagamento.",
    icon: Building2,
  },
  {
    title: "Aging de recebimentos",
    href: "#aging",
    description: "0-30, 31-60, 61-90 e mais de 90 dias.",
    icon: Clock,
  },
  {
    title: "Risco de crédito",
    href: "#risco-credito",
    description: "Score e sinais de incumprimento.",
    icon: ShieldCheck,
  },
  { title: "Histórico de pagamentos", href: "#historico", icon: BookOpenText },
  { title: "Concentração de risco", href: "#concentracao", icon: AlertTriangle },
  { title: "Comunicações", href: "#comunicacoes", icon: Send },
];

const reportLinks: NavItemType[] = [
  {
    title: "Relatórios financeiros",
    href: "#relatorios",
    description: "DRE, balanço, fluxo de caixa e rentabilidade.",
    icon: ClipboardList,
  },
  {
    title: "Exportações",
    href: "#exportacoes",
    description: "PDF, Excel e pacotes para administração.",
    icon: Download,
  },
  {
    title: "Simulador de cenários",
    href: "#simulador",
    description: "Preço, custos, investimento e clientes críticos.",
    icon: Sparkles,
  },
  { title: "Relatórios agendados", href: "#agendados", icon: CalendarDays },
  { title: "Thresholds", href: "#thresholds", icon: Bell },
  { title: "Ações tomadas", href: "#acoes", icon: ClipboardList },
];

const primaveraFinanceLinks: NavItemType[] = [
  { title: "Contabilidade", href: "#cbl", description: "Plano de contas, movimentos e mapas contabilísticos.", icon: FileSpreadsheet },
  { title: "Contas Correntes", href: "#cct", description: "Pendentes, liquidações, clientes e fornecedores.", icon: Receipt },
  { title: "Tesouraria", href: "#tes", description: "Bancos, caixa, recebimentos e pagamentos.", icon: WalletCards },
  { title: "Vendas", href: "#vnd", description: "Documentos de venda, clientes, vendedores e margens.", icon: BarChart3 },
  { title: "Compras", href: "#cmp", description: "Compras, fornecedores e compromissos.", icon: CreditCard },
  { title: "Custos por Departamento", href: "#custos-departamentos", description: "Análise de alocação de custos e rentabilidade por centro.", icon: BarChart3 },
  { title: "Relatórios", href: "#relatorios", description: "Exportações, DRE, aging e gestão.", icon: ClipboardList },
];

const primaveraOpsLinks: NavItemType[] = [
  { title: "Inventário", href: "#inv", description: "Stock, movimentos, artigos e armazéns.", icon: Factory },
  { title: "Produção", href: "#gpr", description: "Ordens de fabrico, componentes e custos reais.", icon: Factory },
  { title: "CRM", href: "#crm", description: "Contactos, oportunidades e comunicações.", icon: Users },
  { title: "Projetos", href: "#prj", description: "Projetos, serviços e centros de custo.", icon: ClipboardList },
  { title: "Recursos Humanos", href: "#rhp", description: "Funcionários e custos de pessoal.", icon: Users },
  { title: "Serviços Técnicos", href: "#stp", description: "Serviços, equipamentos e contratos.", icon: Gauge },
];

const primaveraSystemLinks: NavItemType[] = [
  { title: "Base Aplicacional", href: "#bas", description: "Clientes, artigos, armazéns e tabelas base.", icon: Building2 },
  { title: "ERP", href: "#erp", description: "Núcleo ERP e documentos transversais.", icon: Gauge },
  { title: "Equipamentos e Activos", href: "#eap", description: "Activos, equipamentos e manutenção.", icon: ShieldCheck },
  { title: "Filiais", href: "#fil", description: "Empresas, filiais e estrutura organizacional.", icon: Building2 },
  { title: "Track and Trace", href: "#tte", description: "Transações eletrónicas e rastreabilidade.", icon: LineChart },
  { title: "Web API", href: "#webapi", description: "Estado da integração local e endpoints.", icon: Sparkles },
  { title: "EyePeak", href: "#epk", description: "Componente EyePeak instalado na base e no Windows.", icon: Gauge },
  { title: "Internos", href: "#int", description: "Documentos internos e operações transversais.", icon: ClipboardList },
  { title: "Mobile", href: "#mob", description: "Sincronização e operação móvel.", icon: WalletCards },
  { title: "Contratos", href: "#pcm", description: "Gestão de contratos e serviços recorrentes.", icon: BookOpenText },
];

const navSections = [
  { id: "financeiro", name: "Financeiro", list: primaveraFinanceLinks },
  { id: "operacoes", name: "Operações", list: primaveraOpsLinks },
  { id: "sistema", name: "Sistema", list: primaveraSystemLinks },
  { id: "analise", name: "Análise", list: [...executiveLinks, ...financeLinks] },
];

const summaryCards = [
  { label: "Total em aberto", value: "128.900,00 €", tone: "default" },
  { label: "Vencido", value: "38.400,00 €", tone: "danger" },
  { label: "A vencer (7 dias)", value: "18.250,00 €", tone: "default" },
  { label: "A vencer (30 dias)", value: "51.300,00 €", tone: "default" },
  { label: "Recebido (mês)", value: "96.120,00 €", tone: "success" },
];

type PrimaveraReceivable = {
  clientName: string | null;
  nif: string | null;
  documentNumber: string;
  dueDate: string | null;
  daysOverdue: number | null;
  totalAmount: number;
  paidAmount: number;
  openAmount: number;
  currency: string | null;
  status: string;
  paymentCondition: string | null;
  collector: string | null;
  reference: string | null;
};

type PrimaveraReceivablesResponse = {
  source: string;
  server: string;
  database: string;
  generatedAt: string;
  receivables: PrimaveraReceivable[];
};

type PrimaveraModule = {
  code: string;
  name: string;
  tableName: string;
  records: number;
};

type PrimaveraModulesResponse = {
  source: string;
  server: string;
  database: string;
  generatedAt: string;
  modules: PrimaveraModule[];
};

type PrimaveraCustomer = {
  code: string;
  name: string;
  email: string;
  telefone: string;
  nif: string | null;
  currency: string | null;
  salesAmount: number;
  documentCount: number;
  currentDebt: number;
  creditLimit: number;
  paymentCondition: string | null;
  seller: string | null;
};

type PrimaveraCustomersResponse = {
  source: string;
  server: string;
  database: string;
  generatedAt: string;
  customers: PrimaveraCustomer[];
};

type ReceivableRow = [
  clientName: string,
  nif: string,
  documentNumber: string,
  dueDate: string,
  daysOverdue: string,
  totalAmount: string,
  paidAmount: string,
  openAmount: string,
  status: string,
  lastContact: string,
];

type ReceivableView = {
  row: ReceivableRow;
  source?: PrimaveraReceivable;
};

const moduleViews: Record<
  string,
  { title: string; eyebrow: string; description: string; links: NavItemType[] }
> = {
  ia: {
    title: "Assistente IA",
    eyebrow: "Analise assistida",
    description: "Chat Gemini com contexto PRIMAVERA, dados operacionais e graficos de apoio.",
    links: executiveLinks,
  },
  dashboard: {
    title: "Dashboard executivo",
    eyebrow: "Visão geral",
    description: "KPIs financeiros, liquidez, margem, recebimentos em atraso e sinais críticos.",
    links: executiveLinks,
  },
  "sumario-ia": {
    title: "Sumário com IA",
    eyebrow: "Visão geral",
    description: "Leitura executiva automática dos KPIs e variações do período.",
    links: executiveLinks,
  },
  alertas: {
    title: "Alertas prioritários",
    eyebrow: "Visão geral",
    description: "Riscos financeiros, operacionais e de liquidez que precisam de ação.",
    links: executiveLinks,
  },
  orcado: {
    title: "Orçado vs realizado",
    eyebrow: "Controlo financeiro",
    description: "Comparação entre orçamento, realizado e desvios por período.",
    links: executiveLinks,
  },
  "top-clientes": {
    title: "Top clientes",
    eyebrow: "Clientes",
    description: "Clientes por faturação, margem, dívida, prazo médio e concentração de risco.",
    links: clientLinks,
  },
  "top-produtos": {
    title: "Top produtos",
    eyebrow: "Produtos",
    description: "Produtos por faturação, rentabilidade, margem e impacto nos custos industriais.",
    links: primaveraOpsLinks,
  },
  dre: {
    title: "DRE e margens",
    eyebrow: "Análise financeira",
    description: "Demonstração de resultados, margens e comparação por período.",
    links: financeLinks,
  },
  rentabilidade: {
    title: "Rentabilidade",
    eyebrow: "Análise financeira",
    description: "Rentabilidade por produto, cliente, segmento e centro de custo.",
    links: financeLinks,
  },
  custos: {
    title: "Custos industriais",
    eyebrow: "Produção e custos",
    description: "Matéria-prima, transformação, energia, desvios e custos reais por ordem.",
    links: financeLinks,
  },
  breakeven: {
    title: "Break-even",
    eyebrow: "Análise financeira",
    description: "Ponto de equilíbrio por produto, linha, cliente ou centro de custo.",
    links: financeLinks,
  },
  comparar: {
    title: "Comparar períodos",
    eyebrow: "Análise financeira",
    description: "Comparação mês a mês, trimestre a trimestre e ano a ano.",
    links: financeLinks,
  },
  causas: {
    title: "Causas com IA",
    eyebrow: "Análise assistida",
    description: "Identificação de causas prováveis para quedas de margem, custos anómalos e desvios.",
    links: financeLinks,
  },
  fluxo: {
    title: "Fluxo de caixa",
    eyebrow: "Tesouraria",
    description: "Entradas, saídas e saldo projetado com dados do PRIMAVERA.",
    links: treasuryLinks,
  },
  receber: {
    title: "Contas a receber",
    eyebrow: "Tesouraria",
    description: "Faturas de clientes, aging, cobrança e detalhe do documento.",
    links: treasuryLinks,
  },
  pagar: {
    title: "Contas a pagar",
    eyebrow: "Tesouraria",
    description: "Compromissos de fornecedores, vencimentos e prioridades de pagamento.",
    links: treasuryLinks,
  },
  previsao: {
    title: "Previsão 30/60/90",
    eyebrow: "Tesouraria",
    description: "Projeção de recebimentos, pagamentos e saldo por horizonte temporal.",
    links: treasuryLinks,
  },
  liquidez: {
    title: "Risco de liquidez",
    eyebrow: "Tesouraria",
    description: "Sinais de risco no saldo projetado, atrasos de cobrança e compromissos futuros.",
    links: treasuryLinks,
  },
  bancos: {
    title: "Bancos",
    eyebrow: "Tesouraria",
    description: "Contas bancárias, movimentos, conciliação e extratos.",
    links: treasuryLinks,
  },
  clientes: {
    title: "Carteira de clientes",
    eyebrow: "Clientes",
    description: "Volume, margem média, prazo médio de pagamento e risco por cliente.",
    links: clientLinks,
  },
  aging: {
    title: "Aging de recebimentos",
    eyebrow: "Clientes",
    description: "Separação por antiguidade de dívida e concentração de risco.",
    links: clientLinks,
  },
  "risco-credito": {
    title: "Risco de crédito",
    eyebrow: "Clientes",
    description: "Score de risco, histórico de atrasos e sinais de incumprimento.",
    links: clientLinks,
  },
  historico: {
    title: "Histórico de pagamentos",
    eyebrow: "Clientes",
    description: "Pagamentos, atrasos, liquidações e comportamento financeiro por cliente.",
    links: clientLinks,
  },
  concentracao: {
    title: "Concentração de risco",
    eyebrow: "Clientes",
    description: "Peso de clientes no volume, dívida, margem e risco de cobrança.",
    links: clientLinks,
  },
  comunicacoes: {
    title: "Comunicações",
    eyebrow: "Clientes",
    description: "E-mails, chamadas, lembretes e histórico de contacto de cobrança.",
    links: clientLinks,
  },
  relatorios: {
    title: "Relatórios financeiros",
    eyebrow: "Relatórios",
    description: "DRE, balanço, fluxo de caixa e rentabilidade para exportação.",
    links: reportLinks,
  },
  exportacoes: {
    title: "Exportações",
    eyebrow: "Relatórios",
    description: "Exportação para PDF, Excel e pacotes de reporting executivo.",
    links: reportLinks,
  },
  agendados: {
    title: "Relatórios agendados",
    eyebrow: "Relatórios",
    description: "Relatórios periódicos com envio automático e histórico.",
    links: reportLinks,
  },
  thresholds: {
    title: "Thresholds",
    eyebrow: "Alertas",
    description: "Limites de margem, caixa, atraso, custos e orçamento.",
    links: reportLinks,
  },
  acoes: {
    title: "Ações tomadas",
    eyebrow: "Alertas",
    description: "Histórico de ações, responsáveis, datas e resultados.",
    links: reportLinks,
  },
  simulador: {
    title: "Simulador de cenários",
    eyebrow: "Planeamento",
    description: "Simulação de preço, custos, investimento e perda/ganho de clientes.",
    links: reportLinks,
  },
  bas: {
    title: "Base Aplicacional",
    eyebrow: "BAS",
    description: "Entidades, artigos, armazéns, tabelas base e dados mestre do PRIMAVERA.",
    links: primaveraSystemLinks,
  },
  cbl: {
    title: "Contabilidade",
    eyebrow: "CBL",
    description: "Plano de contas, movimentos contabilísticos, balancetes e mapas.",
    links: primaveraFinanceLinks,
  },
  cct: {
    title: "Contas Correntes",
    eyebrow: "CCT",
    description: "Pendentes de clientes/fornecedores, liquidações, aging e cobrança.",
    links: treasuryLinks,
  },
  cmp: {
    title: "Compras",
    eyebrow: "CMP",
    description: "Documentos de compra, fornecedores, custos e compromissos.",
    links: primaveraFinanceLinks,
  },
  crm: {
    title: "CRM",
    eyebrow: "CRM",
    description: "Contactos, oportunidades, propostas e comunicações comerciais.",
    links: primaveraOpsLinks,
  },
  eap: {
    title: "Equipamentos e Activos",
    eyebrow: "EAP",
    description: "Equipamentos, activos, manutenção e imobilizado operacional.",
    links: primaveraSystemLinks,
  },
  erp: {
    title: "ERP",
    eyebrow: "ERP",
    description: "Núcleo ERP, documentos transversais e ligação entre módulos.",
    links: primaveraSystemLinks,
  },
  epk: {
    title: "EyePeak",
    eyebrow: "EPK",
    description: "Componente EyePeak detetado no PRIMAVERA, para operação e integração específica.",
    links: primaveraSystemLinks,
  },
  fil: {
    title: "Filiais",
    eyebrow: "FIL",
    description: "Filiais, empresas e estrutura multi-entidade.",
    links: primaveraSystemLinks,
  },
  int: {
    title: "Internos",
    eyebrow: "INT",
    description: "Operações internas e documentos transversais do PRIMAVERA.",
    links: primaveraSystemLinks,
  },
  gpr: {
    title: "Produção",
    eyebrow: "GPR",
    description: "Ordens de fabrico, componentes, tempos e custos previstos/reais.",
    links: primaveraOpsLinks,
  },
  inv: {
    title: "Inventário",
    eyebrow: "INV",
    description: "Artigos, armazéns, movimentos de stock, stock atual e custeio.",
    links: primaveraOpsLinks,
  },
  prj: {
    title: "Projetos e Serviços",
    eyebrow: "PRJ",
    description: "Projetos, serviços, WBS, centros de custo e rentabilidade.",
    links: primaveraOpsLinks,
  },
  mob: {
    title: "Mobile",
    eyebrow: "MOB",
    description: "Componente mobile instalado, sincronização e operação fora do ERP desktop.",
    links: primaveraSystemLinks,
  },
  pcm: {
    title: "Gestão de Contratos",
    eyebrow: "PCM",
    description: "Contratos, serviços recorrentes e obrigações associadas.",
    links: primaveraSystemLinks,
  },
  rhp: {
    title: "Recursos Humanos",
    eyebrow: "RHP",
    description: "Funcionários, custos de pessoal e informação de RH.",
    links: primaveraOpsLinks,
  },
  stp: {
    title: "Serviços Técnicos",
    eyebrow: "STP",
    description: "Serviços técnicos, contratos, equipamentos e intervenções.",
    links: primaveraOpsLinks,
  },
  tes: {
    title: "Tesouraria",
    eyebrow: "TES",
    description: "Contas bancárias, movimentos, caixa, recebimentos e pagamentos.",
    links: treasuryLinks,
  },
  tte: {
    title: "Track and Trace",
    eyebrow: "TTE",
    description: "Transações eletrónicas e rastreabilidade documental.",
    links: primaveraSystemLinks,
  },
  vnd: {
    title: "Vendas",
    eyebrow: "VND",
    description: "Documentos de venda, clientes, vendedores, faturação e margem.",
    links: primaveraFinanceLinks,
  },
  webapi: {
    title: "Web API Cegid",
    eyebrow: "Integração",
    description: "Estado da Web API instalada e ligação alternativa via SQL local.",
    links: primaveraSystemLinks,
  },
};

const routeAliases: Record<string, string> = {};
const specialRoutes = ["custos-departamentos", "rhp", "ia", "alertas", "thresholds", "liquidez", "previsao"];

function getCurrentRoute() {
  const hash = window.location.hash.replace("#", "");
  const route = routeAliases[hash] ?? hash;
  return (route && (moduleViews[route] || specialRoutes.includes(route))) ? route : "receber";
}

const mockReceivables: ReceivableRow[] = [
  ["Worten Equipamentos S.A.", "501 234 987", "FT 2026/004812", "12/04/2026", "42", "12.849,32 €", "0,00 €", "12.849,32 €", "Vencido", "08/05/2026"],
  ["Sonae MC", "503 456 790", "FT 2026/004799", "18/04/2026", "36", "8.420,00 €", "0,00 €", "8.420,00 €", "Vencido", "05/05/2026"],
  ["Auchan Retail Portugal", "502 926 998", "FT 2026/004788", "25/04/2026", "29", "5.210,75 €", "1.000,00 €", "4.210,75 €", "Parcial", "16/05/2026"],
  ["Continente Online", "507 345 480", "FT 2026/004776", "02/05/2026", "22", "3.210,50 €", "0,00 €", "3.210,50 €", "Vencido", "02/05/2026"],
  ["Pharol SGPS", "504 159 399", "FT 2026/004752", "05/05/2026", "19", "7.950,00 €", "0,00 €", "7.950,00 €", "Vencido", "-"],
  ["Galp Energia", "500 697 370", "FT 2026/004801", "10/05/2026", "4", "2.450,40 €", "0,00 €", "2.450,40 €", "Pendente", "10/05/2026"],
  ["Sporting Clube de Portugal", "500 852 780", "FT 2026/004811", "15/05/2026", "9", "1.200,00 €", "0,00 €", "1.200,00 €", "Pendente", "-"],
  ["Iberdrola Clientes Portugal", "508 036 360", "FT 2026/004823", "20/05/2026", "14", "3.600,00 €", "0,00 €", "3.600,00 €", "Pendente", "-"],
];

function formatCurrency(value: number, currency = "EUR") {
  return new Intl.NumberFormat("pt-PT", {
    style: "currency",
    currency,
    minimumFractionDigits: 2,
  }).format(value);
}

function formatDate(date: string | null) {
  if (!date) {
    return "-";
  }

  return new Intl.DateTimeFormat("pt-PT").format(new Date(`${date}T00:00:00`));
}

function toReceivableRow(item: PrimaveraReceivable): ReceivableRow {
  const currency = item.currency || "EUR";

  return [
    item.clientName || "Cliente sem nome",
    item.nif || "-",
    item.documentNumber,
    formatDate(item.dueDate),
    String(item.daysOverdue ?? 0),
    formatCurrency(item.totalAmount, currency),
    formatCurrency(item.paidAmount, currency),
    formatCurrency(item.openAmount, currency),
    item.status,
    "-",
  ];
}

function toReceivableView(item: PrimaveraReceivable): ReceivableView {
  return {
    row: toReceivableRow(item),
    source: item,
  };
}

function parseCurrency(text: string) {
  return Number(text.replace(/[^\d,-]/g, "").replace(",", ".")) || 0;
}

function moduleDisplayName(module: PrimaveraModule) {
  const names: Record<string, string> = {
    ARM: "Armazéns",
    ART: "Artigos",
    BAS: "Base Aplicacional",
    CBL: "Contabilidade",
    "CBL-PC": "Plano de contas",
    CCT: "Contas Correntes",
    CMP: "Compras",
    CRM: "CRM",
    EAP: "Equipamentos e Activos",
    EPK: "EyePeak",
    ERP: "ERP",
    FIL: "Filiais",
    FOR: "Fornecedores",
    GPR: "Produção",
    "GPR-CMP": "Componentes de produção",
    INT: "Internos",
    INV: module.tableName === "VersaoModulo" ? "Módulo INV" : "Inventário",
    MOB: "Mobile",
    PCM: "Gestão de Contratos",
    PRJ: "Projetos e Serviços",
    RHP: "Recursos Humanos",
    STK: "Stock atual",
    STP: "Serviços Técnicos",
    TES: "Tesouraria",
    TTE: "Track and Trace",
    VDR: "Vendedores",
    VND: "Vendas",
    "VND-LIN": "Linhas de venda",
  };

  return names[module.code] ?? module.name;
}

type ForecastColumn = {
  title: string;
  date: string;
  value: string;
  count: string;
  names: string[];
};

const forecast: ForecastColumn[] = [
  { title: "Hoje", date: "6 Mai", value: "6.120,00 €", count: "2 documentos", names: ["Galp Energia", "Iberdrola Clientes..."] },
  { title: "Amanhã", date: "7 Mai", value: "8.420,00 €", count: "1 documento", names: ["Sonae MC"] },
  { title: "Quinta", date: "8 Mai", value: "0,00 €", count: "0 documentos", names: ["-"] },
  { title: "Próxima semana", date: "12 - 16 Mai", value: "12.849,32 €", count: "2 documentos", names: ["Worten", "Sporting CP"] },
  { title: "Semana seguinte", date: "19 - 23 Mai", value: "7.950,00 €", count: "2 documentos", names: ["Pharol SGPS", "Brisa"] },
  { title: "+ 30 dias", date: "", value: "51.300,00 €", count: "8 documentos", names: ["Leroy Merlin", "Outros (7)"] },
];

function AppNav() {
  return (
    <NavigationMenu className="hidden xl:flex">
      <NavigationMenuList>
        <MegaSection title="Financeiro" links={primaveraFinanceLinks} />
        <MegaSection title="Operações" links={primaveraOpsLinks} />
        <MegaSection title="Sistema" links={primaveraSystemLinks} />
        <MegaSection title="Análise" links={[...executiveLinks, ...financeLinks]} />
      </NavigationMenuList>
    </NavigationMenu>
  );
}

function MegaSection({ title, links }: { title: string; links: NavItemType[] }) {
  return (
    <NavigationMenuItem>
      <NavigationMenuTrigger>{title}</NavigationMenuTrigger>
      <NavigationMenuContent>
        <div className="grid w-[760px] grid-cols-[1fr_220px]">
          <ul className="grid grid-cols-3 gap-4 border-r p-4">
            {links.slice(0, 3).map((link) => (
              <li key={link.href}>
                <NavGridCard link={link} className="min-h-36" />
              </li>
            ))}
          </ul>
          <ul className="space-y-1 p-4">
            {links.slice(3).map((link) => (
              <li key={link.href}>
                <NavSmallItem item={link} href={link.href} />
              </li>
            ))}
          </ul>
        </div>
      </NavigationMenuContent>
    </NavigationMenuItem>
  );
}

function MobileNav() {
  return (
    <Sheet>
      <SheetTrigger asChild>
        <Button size="icon" variant="ghost" className="xl:hidden" aria-label="Abrir menu">
          <MenuIcon />
        </Button>
      </SheetTrigger>
      <SheetContent showClose={false} className="w-full gap-0 bg-background/95 backdrop-blur">
        <div className="flex h-16 items-center justify-between border-b px-4">
          <div className="flex items-center gap-2">
            <div className="grid size-8 place-items-center rounded-md bg-primary text-primary-foreground">
              <BarChart3 className="size-4" />
            </div>
            <span className="font-semibold">ERP Finance</span>
          </div>
          <SheetClose asChild>
            <Button size="icon" variant="ghost" aria-label="Fechar menu">
              <XIcon />
            </Button>
          </SheetClose>
        </div>
        <div className="overflow-y-auto px-4 pb-12 pt-4">
          <Accordion type="single" collapsible>
            {navSections.map((section) => (
              <AccordionItem key={section.id} value={section.id}>
                <AccordionTrigger>{section.name}</AccordionTrigger>
                <AccordionContent className="space-y-1">
                  {section.list.map((link) => (
                    <SheetClose asChild key={link.href}>
                      <NavItemMobile item={link} href={link.href} />
                    </SheetClose>
                  ))}
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </div>
      </SheetContent>
    </Sheet>
  );
}

function StatusBadge({ status }: { status: string }) {
  const style = {
    Vencido: "bg-danger-soft text-danger",
    Parcial: "bg-warning-soft text-warning",
    Pendente: "bg-info-soft text-info",
  }[status];

  return (
    <span className={cn("rounded-md px-2 py-1 text-xs font-semibold", style)}>
      {status}
    </span>
  );
}

export function App() {
  const [primaveraData, setPrimaveraData] = useState<PrimaveraReceivablesResponse | null>(null);
  const [moduleData, setModuleData] = useState<PrimaveraModulesResponse | null>(null);
  const [customerData, setCustomerData] = useState<PrimaveraCustomersResponse | null>(null);
  const [primaveraError, setPrimaveraError] = useState<string | null>(null);
  const [currentRoute, setCurrentRoute] = useState(getCurrentRoute);
  const [activeFilter, setActiveFilter] = useState("Todos");
  const [activeTab, setActiveTab] = useState("Resumo");
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [detailOpen, setDetailOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);
  const [toast, setToast] = useState<string | null>(null);
  const [showPaymentForm, setShowPaymentForm] = useState(false);
  const [paymentAmount, setPaymentAmount] = useState("");
  const [paymentDate, setPaymentDate] = useState(() => new Date().toISOString().split("T")[0]);
  const [paymentMethod, setPaymentMethod] = useState("Transferência");
  const [docLines, setDocLines] = useState<Array<{ NumLinha: string; artigo: string; descricao: string; quantidade: string; precUnit: string; desconto: string; totalLiquido: string; taxaIva: string; totalIva: string }>>([]);
  const [docLinesLoading, setDocLinesLoading] = useState(false);
  const [chatOpen, setChatOpen] = useState(false);
  const [chatMessages, setChatMessages] = useState<Array<{ role: "user" | "assistant"; content: string }>>([]);
  const [chatInput, setChatInput] = useState("");
  const [chatLoading, setChatLoading] = useState(false);

  useEffect(() => {
    const onHashChange = () => {
      setCurrentRoute(getCurrentRoute());
      setSelectedIndex(0);
      setDetailOpen(false);
      setDocLines([]);
      setShowPaymentForm(false);
    };

    window.addEventListener("hashchange", onHashChange);
    return () => window.removeEventListener("hashchange", onHashChange);
  }, []);

  useEffect(() => {
    let ignore = false;

    fetch(apiUrl("/api/customers"))
      .then((response) => {
        if (!response.ok) {
          throw new Error(`API clientes respondeu ${response.status}`);
        }

        return response.json() as Promise<PrimaveraCustomersResponse>;
      })
      .then((data) => {
        if (!ignore) {
          setCustomerData(data);
        }
      })
      .catch((error: unknown) => {
        if (!ignore) {
          setPrimaveraError(error instanceof Error ? error.message : String(error));
        }
      });

    return () => {
      ignore = true;
    };
  }, []);

  useEffect(() => {
    let ignore = false;

    fetch(apiUrl("/api/modules"))
      .then((response) => {
        if (!response.ok) {
          throw new Error(`API módulos respondeu ${response.status}`);
        }

        return response.json() as Promise<PrimaveraModulesResponse>;
      })
      .then((data) => {
        if (!ignore) {
          setModuleData(data);
        }
      })
      .catch((error: unknown) => {
        if (!ignore) {
          setPrimaveraError(error instanceof Error ? error.message : String(error));
        }
      });

    return () => {
      ignore = true;
    };
  }, []);

  useEffect(() => {
    let ignore = false;

    fetch(apiUrl("/api/receivables"))
      .then((response) => {
        if (!response.ok) {
          throw new Error(`API PRIMAVERA respondeu ${response.status}`);
        }

        return response.json() as Promise<PrimaveraReceivablesResponse>;
      })
      .then((data) => {
        if (!ignore) {
          setPrimaveraData(data);
          setPrimaveraError(null);
        }
      })
      .catch((error: unknown) => {
        if (!ignore) {
          setPrimaveraError(error instanceof Error ? error.message : String(error));
        }
      });

    return () => {
      ignore = true;
    };
  }, []);

  const baseReceivables = useMemo<ReceivableView[]>(
    () =>
      primaveraData?.receivables.length
        ? primaveraData.receivables.map(toReceivableView)
        : mockReceivables.map((row) => ({ row })),
    [primaveraData],
  );
  const receivables = useMemo(() => {
    const query = searchTerm.trim().toLowerCase();

    return baseReceivables.filter(({ row }) => {
      const days = Number(row[4]);
      const paid = parseCurrency(row[6]);
      const matchesSearch =
        !query || row.some((cell) => cell.toLowerCase().includes(query));
      const matchesFilter =
        activeFilter === "Todos" ||
        (activeFilter === "Vencidos" && row[8] === "Vencido") ||
        (activeFilter === "A vencer (7 dias)" && days >= 0 && days <= 7) ||
        (activeFilter === "A vencer (30 dias)" && days >= 0 && days <= 30) ||
        (activeFilter === "Pagos" && paid > 0) ||
        activeFilter === "Em disputa";

      return matchesSearch && matchesFilter;
    });
  }, [activeFilter, baseReceivables, searchTerm]);
  const selectedItem = receivables[selectedIndex] ?? receivables[0] ?? baseReceivables[0];
  const selectedDocument = selectedItem?.source ?? null;
  const selectedRow = selectedItem?.row ?? mockReceivables[0]!;
  const usingPrimavera = Boolean(primaveraData?.receivables.length);
  const route = moduleViews[currentRoute] ?? moduleViews.receber!;
  const isReceivablesRoute = currentRoute === "receber";
  const isDashboardRoute = currentRoute === "dashboard";
  const isCashFlowRoute = currentRoute === "fluxo";
  const isBanksRoute = currentRoute === "bancos" || currentRoute === "tes";
  const isPayablesRoute = currentRoute === "pagar" || currentRoute === "cmp";
  const isProductionRoute = currentRoute === "custos" || currentRoute === "gpr";
  const isDRERoute = currentRoute === "dre";
  const isProfitabilityRoute = currentRoute === "rentabilidade";
  const isBreakEvenRoute = currentRoute === "breakeven";
  const isComparePeriodsRoute = currentRoute === "comparar";
  const isBudgetVsActualRoute = currentRoute === "orcado";
  const isCollectionsRoute = currentRoute === "comunicacoes";
  const isExecutiveSummaryRoute = currentRoute === "sumario-ia";
  const isRootCauseRoute = currentRoute === "causas";
  const isCreditRiskRoute = currentRoute === "risco-credito";
  const isAlertsRoute = currentRoute === "alertas";
  const isThresholdsRoute = currentRoute === "thresholds";
  const isHRRoute = currentRoute === "rhp";
  const isCostRoute = currentRoute === "custos-departamentos";
  const isLiquidityRoute = currentRoute === "liquidez" || currentRoute === "previsao";
  const isAiRoute = currentRoute === "ia";
  const filterCounts = {
    Todos: baseReceivables.length,
    Vencidos: baseReceivables.filter(({ row }) => row[8] === "Vencido").length,
    "A vencer (7 dias)": baseReceivables.filter(({ row }) => {
      const days = Number(row[4]);
      return days >= 0 && days <= 7;
    }).length,
    "A vencer (30 dias)": baseReceivables.filter(({ row }) => {
      const days = Number(row[4]);
      return days >= 0 && days <= 30;
    }).length,
    Pagos: baseReceivables.filter(({ row }) => parseCurrency(row[6]) > 0).length,
    "Em disputa": 0,
  };

  function notify(message: string) {
    setToast(message);
    window.setTimeout(() => setToast(null), 2800);
  }

  return (
    <div className="min-h-screen bg-page text-foreground">
      <header className="sticky top-0 z-40 border-b border-border bg-background/95 backdrop-blur-xl">
        <div className="grid h-[68px] grid-cols-[auto_1fr_auto] items-center gap-3 px-3 md:grid-cols-[1fr_minmax(420px,700px)_1fr] md:gap-5 md:px-8">
          <div className="flex items-center gap-2">
            <AppNav />
            <MobileNav />
          </div>
          <div className="relative">
              <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                className="h-10 rounded-md border-border bg-background pl-10 pr-16 text-[13px] shadow-[0_1px_4px_rgba(15,23,42,0.08)]"
                placeholder="Pesquisar cliente, fatura, NIF, referência, montante..."
                value={searchTerm}
                onChange={(event) => setSearchTerm(event.target.value)}
              />
              <kbd className="absolute right-3 top-1/2 -translate-y-1/2 rounded border bg-muted px-2 py-1 text-xs text-muted-foreground">
                ⌘ K
              </kbd>
          </div>
          <div className="flex items-center justify-end gap-3">
            <Button
              variant="outline"
              size="sm"
              className="h-8 gap-1.5 border-primary/30 text-primary hover:bg-primary/5"
              onClick={() => {
                setChatOpen(false);
                window.location.hash = "ia";
              }}
            >
              <Sparkles className="size-3.5" />
              <span className="text-xs font-semibold">IA</span>
            </Button>
            <div className="hidden items-center gap-3 md:flex">
              <div className="grid size-9 place-items-center rounded-full bg-[linear-gradient(135deg,#dbe3ec,#ffffff)] text-xs font-bold shadow-sm">
                RM
              </div>
              <div className="hidden lg:block">
                <p className="text-sm font-semibold leading-none">Rui Martins</p>
                <p className="mt-1 text-xs text-muted-foreground">Nortefin, Lda.</p>
              </div>
              <ChevronDown className="size-4 text-muted-foreground" />
            </div>
          </div>
        </div>
      </header>

      <main className="grid min-h-[calc(100vh-68px)] grid-cols-1">
        <section className="min-w-0 border-r border-border">
          <div className="px-3 py-3">
            <div className={cn("mb-3 grid gap-3", isAiRoute ? "lg:grid-cols-1" : "lg:grid-cols-[300px_1fr]")}>
              <div className="flex h-[84px] flex-col justify-center px-5">
                <h1 className="text-[19px] font-bold tracking-normal">
                  {isReceivablesRoute ? "Bom dia, Rui." : route.title}
                </h1>
                <p className="mt-2 text-[13px] text-muted-foreground">
                  {isReceivablesRoute ? "Terça-feira, 6 de Maio de 2026" : route.eyebrow}
                </p>
              </div>
              {!isAiRoute && (
              <div className="grid h-[84px] overflow-hidden rounded-lg border border-border bg-background shadow-[0_1px_6px_rgba(15,23,42,0.06)] sm:grid-cols-2 lg:grid-cols-5">
                {summaryCards.map((card) => (
                  <div className="flex min-w-36 flex-col justify-center border-r border-border px-5 last:border-r-0" key={card.label}>
                    <p className="text-[12px] font-semibold text-muted-foreground">{card.label}</p>
                    <p
                      className={cn(
                        "mt-3 text-[17px] font-bold",
                        card.tone === "danger" && "text-danger",
                        card.tone === "success" && "text-success",
                      )}
                    >
                      {card.value}
                    </p>
                  </div>
                ))}
              </div>
              )}
            </div>

            {isReceivablesRoute ? (
            <section className="rounded-lg border border-border bg-background shadow-[0_1px_6px_rgba(15,23,42,0.06)]">
              <div className="border-b border-border p-5">
                <div className="flex items-baseline gap-3">
                  <h2 className="text-[20px] font-bold">Contas a receber</h2>
                  <span className="text-[13px] font-medium text-muted-foreground">
                    {receivables.length} documentos
                  </span>
                  <span
                    className={cn(
                      "rounded-md px-2 py-1 text-[11px] font-semibold",
                      usingPrimavera
                        ? "bg-success-soft text-success"
                        : "bg-warning-soft text-warning",
                    )}
                    title={primaveraError ?? undefined}
                  >
                    {usingPrimavera ? "PRIMAVERA SQL" : "Dados demo"}
                  </span>
                </div>
                <div className="mt-4 flex flex-wrap items-center gap-2">
                  {([
                    ["Todos", String(filterCounts.Todos)],
                    ["Vencidos", String(filterCounts.Vencidos)],
                    ["A vencer (7 dias)", String(filterCounts["A vencer (7 dias)"])],
                    ["A vencer (30 dias)", String(filterCounts["A vencer (30 dias)"])],
                    ["Pagos", String(filterCounts.Pagos)],
                    ["Em disputa", String(filterCounts["Em disputa"])],
                  ] as Array<[string, string]>).map(([label, count], index) => (
                    <Button
                      key={label}
                      variant={index === 0 ? "outline" : "secondary"}
                      size="sm"
                      onClick={() => {
                        setActiveFilter(label);
                        setSelectedIndex(0);
                      }}
                      className={cn(
                        "h-8 gap-3 rounded-md border-border bg-background px-3 text-[13px] shadow-sm",
                        activeFilter === label && "border-primary/40 text-primary",
                      )}
                    >
                      {label}
                      <span className="rounded-md bg-muted px-2 py-0.5 text-[12px] text-muted-foreground">
                        {count}
                      </span>
                    </Button>
                  ))}
                  <div className="ml-auto flex items-center gap-2 border-l border-border pl-3">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setShowAdvancedFilters((value) => !value)}
                    >
                      <Filter /> Filtros
                    </Button>
                    <Button
                      variant="outline"
                      size="icon"
                      aria-label="Ver colunas"
                      onClick={() => notify("Preferências de colunas serão guardadas por utilizador.")}
                    >
                      <PanelRight />
                    </Button>
                    <Button
                      variant="outline"
                      size="icon"
                      aria-label="Mais opções"
                      onClick={() => notify("Exportação e ações em massa ficam neste menu.")}
                    >
                      <MoreHorizontal />
                    </Button>
                  </div>
                </div>
                {showAdvancedFilters && (
                  <div className="mt-4 grid gap-3 rounded-md border border-border bg-muted/30 p-3 text-[12px] text-muted-foreground md:grid-cols-4">
                    <span>Origem: {usingPrimavera ? "PRIMAVERA SQL / PRIDEMO" : "Dados demo"}</span>
                    <span>Filtro ativo: {activeFilter}</span>
                    <span>Pesquisa: {searchTerm || "sem termo"}</span>
                    <button
                      className="text-left font-semibold text-primary"
                      onClick={() => {
                        setSearchTerm("");
                        setActiveFilter("Todos");
                      }}
                    >
                      Limpar filtros
                    </button>
                  </div>
                )}
              </div>

              <div className="overflow-x-auto">
                <table className="w-full min-w-[1030px] border-collapse text-[12px]">
                  <thead>
                    <tr className="border-b border-border bg-muted/30 text-left text-[12px] font-semibold text-muted-foreground">
                      <th className="w-10 px-5 py-3">
                        <input type="checkbox" aria-label="Selecionar todos" />
                      </th>
                      <th className="w-8 px-1 py-3 text-center">☆</th>
                      <th className="px-3 py-3">Cliente</th>
                      <th className="px-3 py-3">Documento</th>
                      <th className="px-3 py-3">Vencimento</th>
                      <th className="px-3 py-3">Dias v.</th>
                      <th className="px-3 py-3 text-right">Valor</th>
                      <th className="px-3 py-3 text-right">Pago</th>
                      <th className="px-3 py-3 text-right">Em aberto</th>
                      <th className="px-3 py-3">Estado</th>
                      <th className="px-3 py-3">Último contacto</th>
                      <th className="w-10 px-3 py-3" />
                    </tr>
                  </thead>
                  <tbody>
                    {receivables.map(({ row }, index) => (
                      <tr
                        className={cn(
                          "cursor-pointer border-b border-border transition hover:bg-muted/45",
                          detailOpen && index === selectedIndex && "bg-muted/45",
                        )}
                        key={row[2]}
                        onClick={() => {
                          setSelectedIndex(index);
                          setDetailOpen(true);
                          setDocLines([]);
                          setShowPaymentForm(false);
                        }}
                      >
                        <td className="px-5 py-2">
                          <input
                            type="checkbox"
                            checked={detailOpen && index === selectedIndex}
                            onChange={() => {
                              setSelectedIndex(index);
                              setDetailOpen(true);
                            }}
                            onClick={(event) => event.stopPropagation()}
                            aria-label={`Selecionar ${row[2]}`}
                          />
                        </td>
                        <td className="px-1 py-2 text-center text-[16px] text-muted-foreground">☆</td>
                        <td className="px-3 py-2">
                          <p className="font-semibold">{row[0]}</p>
                          <p className="text-xs text-muted-foreground">{row[1]}</p>
                        </td>
                        <td className="px-3 py-2">{row[2]}</td>
                        <td className="px-3 py-2">{row[3]}</td>
                        <td className={cn("px-3 py-2 font-semibold", Number(row[4]) > 20 ? "text-danger" : "text-success")}>
                          {row[4]}
                        </td>
                        <td className="px-3 py-2 text-right font-medium">{row[5]}</td>
                        <td className="px-3 py-2 text-right">{row[6]}</td>
                        <td className="px-3 py-2 text-right font-medium">{row[7]}</td>
                        <td className="px-3 py-2">
                          <StatusBadge status={row[8] ?? ""} />
                        </td>
                        <td className="px-3 py-2">{row[9]}</td>
                        <td className="px-3 py-2">
                          <MoreHorizontal className="size-4" />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <div className="flex items-center justify-between border-t border-border px-5 py-3 text-[13px]">
                <span>1-{receivables.length} de {baseReceivables.length} documentos</span>
                <span className="font-semibold">Totais&nbsp;&nbsp;&nbsp; 44.890,97 € &nbsp;&nbsp; 1.000,00 € &nbsp;&nbsp; 43.890,97 €</span>
              </div>
            </section>
            ) : isAiRoute ? (
              <AiWorkspace
                messages={chatMessages}
                setMessages={setChatMessages}
                input={chatInput}
                setInput={setChatInput}
                loading={chatLoading}
                setLoading={setChatLoading}
              />
            ) : isDashboardRoute ? (
              <DashboardPage />
            ) : isCashFlowRoute ? (
              <CashFlowPage />
            ) : isBanksRoute ? (
              <BanksPage />
            ) : isPayablesRoute ? (
              <PayablesPage />
            ) : isProductionRoute ? (
              <ProductionPage />
            ) : isDRERoute ? (
              <DREPage />
            ) : isProfitabilityRoute ? (
              <ProfitabilityPage />
            ) : isBreakEvenRoute ? (
              <BreakEvenPage />
            ) : isComparePeriodsRoute ? (
              <ComparePeriodsPage />
            ) : isBudgetVsActualRoute ? (
              <BudgetVsActualPage />
            ) : isCollectionsRoute ? (
              <CollectionsCommsPage />
            ) : isExecutiveSummaryRoute ? (
              <ExecutiveSummaryPage />
            ) : isRootCauseRoute ? (
              <RootCauseAnalysisPage />
            ) : isCreditRiskRoute ? (
              <CreditRiskPage />
            ) : isAlertsRoute ? (
              <AlertsPage />
            ) : isThresholdsRoute ? (
              <AlertThresholdsPage />
            ) : isHRRoute ? (
              <HRPage />
            ) : isCostRoute ? (
              <CostAllocationPage />
            ) : isLiquidityRoute ? (
              <LiquidityPage />
            ) : (
              <ModulePage
                route={route}
                routeKey={currentRoute}
                modules={moduleData?.modules ?? []}
                customers={customerData?.customers ?? []}
                customersLoaded={customerData !== null}
                receivables={baseReceivables}
                onNotify={notify}
              />
            )}

            {isReceivablesRoute && (
            <div className="mt-4 grid gap-0 overflow-hidden rounded-lg border border-border bg-background shadow-[0_1px_6px_rgba(15,23,42,0.06)] 2xl:grid-cols-[1fr_420px]">
              <section className="p-5">
                <div className="mb-4 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <h2 className="font-bold">Fluxo de recebimentos esperado</h2>
                    <Button variant="outline" size="icon" className="size-7">
                      <ChevronDown className="rotate-90" />
                    </Button>
                    <Button variant="outline" size="icon" className="size-7">
                      <ChevronDown className="-rotate-90" />
                    </Button>
                  </div>
                  <Button variant="outline" size="sm">
                    <CalendarDays /> Ver calendário
                  </Button>
                </div>
                <div className="grid gap-0 md:grid-cols-3 xl:grid-cols-6">
                  {forecast.map((column) => (
                    <div className="min-h-[248px] border-r border-border px-4 last:border-r-0" key={column.title}>
                      <p className="text-sm font-semibold">{column.title}</p>
                      <p className="mt-1 text-xs text-muted-foreground">{column.date}</p>
                      <p className="mt-4 font-bold">{column.value}</p>
                      <p className="text-xs text-muted-foreground">{column.count}</p>
                      <div className="mt-4 space-y-2">
                        {column.names.map((name) => (
                          <div className="rounded-md border border-border p-3 text-xs shadow-sm" key={name}>
                            {name}
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </section>

              <section className="border-l border-border p-5">
                <div className="mb-4 flex items-center justify-between">
                  <h2 className="font-bold">Atividades e tarefas</h2>
                  <Button variant="outline" size="sm">
                    <Plus /> Nova tarefa
                  </Button>
                </div>
                <div className="space-y-4 text-sm">
                  <Activity icon={Send} title="Lembrete de pagamento enviado" body="FT 2026/004812 · Worten Equipamentos S.A. · 09:31" />
                  <Activity icon={Clock} title="Ligação telefónica efetuada" body="Sonae MC · Contacto com Margarida Costa · 10:15" />
                  <Activity icon={Receipt} title="E-mail recebido" body="RE: Pagamento FT 2026/004788 · de paula.oliveira@auchan.pt" />
                  <Activity icon={AlertTriangle} title="Rever proposta de acordo" body="Pharol SGPS · planeado para amanhã" warning />
                </div>
              </section>
            </div>
            )}
          </div>
        </section>

        {isReceivablesRoute && detailOpen && (
        <aside className="fixed right-0 top-[68px] z-30 h-[calc(100vh-68px)] w-full max-w-[430px] overflow-y-auto border-l border-border bg-background px-7 py-7 shadow-2xl">
          <div className="mb-6 flex items-start justify-between">
            <div>
              <h2 className="text-[22px] font-bold">{selectedRow[2]}</h2>
            </div>
            <Button
              variant="ghost"
              size="icon"
              aria-label="Fechar detalhe"
              onClick={() => setDetailOpen(false)}
            >
              <XIcon />
            </Button>
          </div>
          <div className="mb-6 flex gap-4 border-b border-border text-[12px] font-semibold">
            {["Resumo", "Linha a linha", "Histórico", "Comunicações"].map((tab) => (
              <button
                className={cn(
                  "whitespace-nowrap border-b-2 px-1 pb-4",
                  activeTab === tab ? "border-primary text-primary" : "border-transparent text-muted-foreground",
                )}
                key={tab}
                onClick={() => setActiveTab(tab)}
              >
                {tab}
              </button>
            ))}
          </div>
          <div className="mb-6 flex items-center justify-between">
            <div>
              <p className="text-xs text-muted-foreground">Cliente</p>
              <p className="mt-2 font-bold">
                {selectedDocument?.clientName ?? selectedRow[0]}
              </p>
              <p className="mt-1 text-sm">{selectedDocument?.nif ?? selectedRow[1]}</p>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                window.location.hash = "clientes";
                notify(`Abriste a ficha de ${selectedRow[0]}.`);
              }}
            >
              Ver cliente
            </Button>
          </div>
          {activeTab === "Linha a linha" && (
            <div className="mb-5">
              {docLines.length === 0 ? (
                <Button variant="outline" size="sm" disabled={docLinesLoading}
                  onClick={() => {
                    setDocLinesLoading(true);
                    fetch(apiUrl(`/api/document-lines?doc=${encodeURIComponent(selectedRow[2])}`))
                      .then((r) => r.json())
                      .then((d: { lines: typeof docLines }) => setDocLines(d.lines ?? []))
                      .catch(() => notify("Erro ao carregar linhas do documento."))
                      .finally(() => setDocLinesLoading(false));
                  }}
                >
                  {docLinesLoading ? "A carregar..." : "Carregar linhas do documento"}
                </Button>
              ) : (
                <div className="overflow-x-auto rounded-lg border border-border text-xs">
                  <table className="w-full">
                    <thead><tr className="border-b bg-muted/30 text-left text-muted-foreground">
                      <th className="px-3 py-2">#</th><th className="px-3 py-2">Artigo</th>
                      <th className="px-3 py-2">Descrição</th><th className="px-3 py-2 text-right">Qtd</th>
                      <th className="px-3 py-2 text-right">Preço</th><th className="px-3 py-2 text-right">Total</th>
                      <th className="px-3 py-2 text-right">IVA%</th>
                    </tr></thead>
                    <tbody>
                      {docLines.map((l) => (
                        <tr key={l.NumLinha} className="border-b hover:bg-muted/20">
                          <td className="px-3 py-2 text-muted-foreground">{l.NumLinha}</td>
                          <td className="px-3 py-2 font-medium">{l.artigo}</td>
                          <td className="px-3 py-2">{l.descricao}</td>
                          <td className="px-3 py-2 text-right">{l.quantidade}</td>
                          <td className="px-3 py-2 text-right">{l.precUnit}</td>
                          <td className="px-3 py-2 text-right font-semibold">{l.totalLiquido}</td>
                          <td className="px-3 py-2 text-right">{l.taxaIva}%</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}
          {activeTab !== "Resumo" && activeTab !== "Linha a linha" && (
            <div className="mb-5 rounded-lg border border-border bg-muted/25 p-4 text-sm">
              <p className="font-semibold">{activeTab}</p>
              <p className="mt-2 leading-5 text-muted-foreground">Histórico de cobrança e comunicações vindas do PRIMAVERA/CRM.</p>
            </div>
          )}
          <div className="rounded-lg border border-border p-4 shadow-sm">
            {[
              ["Valor do documento", selectedDocument ? formatCurrency(selectedDocument.totalAmount, selectedDocument.currency || "EUR") : selectedRow[5]],
              ["Pago", selectedDocument ? formatCurrency(selectedDocument.paidAmount, selectedDocument.currency || "EUR") : selectedRow[6]],
              ["Em aberto", selectedDocument ? formatCurrency(selectedDocument.openAmount, selectedDocument.currency || "EUR") : selectedRow[7]],
              ["Vencimento", selectedDocument ? formatDate(selectedDocument.dueDate) : selectedRow[3]],
              ["Dias vencido", selectedDocument ? `${selectedDocument.daysOverdue ?? 0} dias` : `${selectedRow[4]} dias`],
              ["Estado", selectedDocument?.status ?? selectedRow[8]],
              ["Moeda", selectedDocument?.currency ?? "EUR"],
              ["Condição de pagamento", selectedDocument?.paymentCondition || "30 dias"],
              ["Centro de custo", "Comercial - Norte"],
              ["Vendedor", selectedDocument?.collector || "João Ferreira"],
              ["Referência", selectedDocument?.reference || "OF 2026/0154"],
            ].map(([label, value]) => (
              <div className="flex items-center justify-between gap-4 py-3 text-[13px]" key={label}>
                <span className="text-muted-foreground">{label}</span>
                <span className={cn("text-right font-semibold", label === "Em aberto" || label === "Dias vencido" ? "text-danger" : "")}>
                  {value}
                </span>
              </div>
            ))}
          </div>
          <div className="mt-7">
            <h3 className="mb-3 font-bold">Ações</h3>
            <div className="space-y-3">
              <Button
                className="w-full bg-primary-dark hover:bg-primary-dark/90"
                onClick={() => {
                  const customer = customerData?.customers.find((c) => c.name === (selectedDocument?.clientName ?? selectedRow[0]));
                  const email = customer?.email ?? "";
                  const subject = encodeURIComponent(`Lembrete de pagamento — ${selectedRow[2]}`);
                  const days = selectedDocument?.daysOverdue ?? Number(selectedRow[4]);
                  const amount = selectedDocument ? formatCurrency(selectedDocument.openAmount, selectedDocument.currency || "EUR") : selectedRow[7];
                  const body = encodeURIComponent(
                    `Exmo(a) Sr(a) ${selectedRow[0]},\n\nVimos por este meio recordar que o documento ${selectedRow[2]} no valor de ${amount} se encontra por liquidar há ${days} dias.\n\nAgradecemos a regularização com a maior brevidade possível.\n\nCom os melhores cumprimentos,\nRui Martins\nNortefin, Lda.`
                  );
                  window.open(`mailto:${email}?subject=${subject}&body=${body}`, "_blank");
                  notify(`Email de lembrete preparado para ${selectedRow[0]}.`);
                }}
              >
                <Send /> Enviar lembrete de pagamento
              </Button>
              <Button
                variant="outline"
                className="w-full"
                onClick={() => {
                  setShowPaymentForm((v) => !v);
                  setPaymentAmount((selectedDocument?.openAmount ?? 0).toString());
                }}
              >
                <Receipt /> Registar pagamento
              </Button>
              <Button
                variant="outline"
                className="w-full"
                onClick={() => {
                  fetch(apiUrl("/api/open-erp"))
                    .then(() => notify(`PRIMAVERA ERP a abrir — navegue para ${selectedRow[2]}.`))
                    .catch(() => notify("Não foi possível abrir o PRIMAVERA."));
                }}
              >
                <FileSpreadsheet /> Ver no ERP
              </Button>
              <Button
                variant="outline"
                className="w-full"
                onClick={() => notify("Menu de ações adicionais.")}
              >
                <MoreHorizontal /> Mais ações
              </Button>
            </div>
          </div>
          {showPaymentForm && (
            <div className="mt-5 rounded-lg border border-border p-4 text-sm">
              <p className="mb-3 font-bold">Registar pagamento</p>
              <div className="space-y-3">
                <div>
                  <label className="text-xs text-muted-foreground">Valor pago (€)</label>
                  <Input type="number" step="0.01" value={paymentAmount} onChange={(e) => setPaymentAmount(e.target.value)} className="mt-1 h-8 text-sm" />
                </div>
                <div>
                  <label className="text-xs text-muted-foreground">Data</label>
                  <Input type="date" value={paymentDate} onChange={(e) => setPaymentDate(e.target.value)} className="mt-1 h-8 text-sm" />
                </div>
                <div>
                  <label className="text-xs text-muted-foreground">Modo</label>
                  <select value={paymentMethod} onChange={(e) => setPaymentMethod(e.target.value)} className="mt-1 h-8 w-full rounded-md border border-border bg-background px-2 text-sm">
                    {["Transferência", "Cheque", "Numerário", "Débito direto"].map((m) => <option key={m}>{m}</option>)}
                  </select>
                </div>
                <div className="flex gap-2">
                  <Button size="sm" className="flex-1"
                    onClick={() => {
                      fetch(apiUrl("/api/register-payment"), {
                        method: "POST",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({ doc: selectedRow[2], client: selectedRow[0], amount: paymentAmount, date: paymentDate, method: paymentMethod }),
                      })
                        .then(() => { notify(`Pagamento de ${paymentAmount}€ registado para ${selectedRow[2]}.`); setShowPaymentForm(false); })
                        .catch(() => notify("Erro ao registar pagamento."));
                    }}
                  >Confirmar</Button>
                  <Button size="sm" variant="outline" className="flex-1" onClick={() => setShowPaymentForm(false)}>Cancelar</Button>
                </div>
              </div>
            </div>
          )}
        </aside>
        )}
      </main>
      {toast && (
        <div className="fixed bottom-5 left-1/2 z-50 -translate-x-1/2 rounded-md border border-border bg-background px-4 py-3 text-sm font-medium shadow-xl">
          {toast}
        </div>
      )}
      <GeminiChatPanel
        open={chatOpen}
        onClose={() => setChatOpen(false)}
        messages={chatMessages}
        setMessages={setChatMessages}
        input={chatInput}
        setInput={setChatInput}
        loading={chatLoading}
        setLoading={setChatLoading}
      />
    </div>
  );
}

const geminiModels = [
  { id: "gemini-3.1-flash-lite", label: "Gemini 3.1 Flash Lite — 500 req/dia ✓ recomendado" },
  { id: "gemini-2.5-flash", label: "Gemini 2.5 Flash — 20 req/dia" },
  { id: "gemini-2.5-flash-lite", label: "Gemini 2.5 Flash Lite — 20 req/dia" },
  { id: "gemini-3.5-flash", label: "Gemini 3.5 Flash — 20 req/dia" },
  { id: "gemini-3-flash", label: "Gemini 3 Flash — 20 req/dia" },
];

type AiKeySlot = {
  name: string;
  value: string;
};

function readAiKeySlots(): AiKeySlot[] {
  try {
    const stored = localStorage.getItem("erp-finance-gemini-key-slots");
    if (stored) {
      const parsed = JSON.parse(stored) as AiKeySlot[];
      if (Array.isArray(parsed) && parsed.length) {
        return [0, 1, 2].map((index) => ({
          name: parsed[index]?.name || `Key ${index + 1}`,
          value: parsed[index]?.value || "",
        }));
      }
    }
  } catch {
    localStorage.removeItem("erp-finance-gemini-key-slots");
  }

  return [
    { name: "Key 1", value: localStorage.getItem("erp-finance-gemini-key") ?? "" },
    { name: "Key 2", value: "" },
    { name: "Key 3", value: "" },
  ];
}

type AiWorkspaceProps = {
  messages: Array<{ role: "user" | "assistant"; content: string }>;
  setMessages: React.Dispatch<React.SetStateAction<Array<{ role: "user" | "assistant"; content: string }>>>;
  input: string;
  setInput: (v: string) => void;
  loading: boolean;
  setLoading: (v: boolean) => void;
};

function AiWorkspace({
  messages,
  setMessages,
  input,
  setInput,
  loading,
  setLoading,
}: AiWorkspaceProps) {
  const [data, setData] = useState<Record<string, any>>({});
  const [dataLoading, setDataLoading] = useState(true);

  useEffect(() => {
    let ignore = false;
    const endpoints = [
      ["production", "/api/production-costs"],
      ["costs", "/api/cost-analysis"],
      ["receivables", "/api/receivables"],
      ["customers", "/api/customers"],
      ["cashflow", "/api/cashflow"],
      ["payables", "/api/payables"],
      ["dashboard", "/api/dashboard"],
      ["alerts", "/api/alerts"],
      ["dre", "/api/dre"],
      ["personnel", "/api/hr-costs"],
    ] as const;

    Promise.allSettled(
      endpoints.map(([key, path]) =>
        fetch(path)
          .then((response) => {
            if (!response.ok) throw new Error(`${path} respondeu ${response.status}`);
            return response.json();
          })
          .then((payload) => [key, payload] as const),
      ),
    )
      .then((results) => {
        if (ignore) return;
        const next: Record<string, any> = {};
        results.forEach((result) => {
          if (result.status === "fulfilled") {
            next[result.value[0]] = result.value[1];
          }
        });
        setData(next);
      })
      .finally(() => {
        if (!ignore) setDataLoading(false);
      });

    return () => {
      ignore = true;
    };
  }, []);

  const productionSummary = data.production?.summary ?? {};
  const productionOrders = Array.isArray(data.production?.orders) ? data.production.orders : [];
  const customers = Array.isArray(data.customers?.customers) ? data.customers.customers : [];
  const receivables = Array.isArray(data.receivables?.receivables) ? data.receivables.receivables : [];
  const lastQuestion = [...messages].reverse().find((message) => message.role === "user")?.content ?? "";
  const insightTopic = getInsightTopic(lastQuestion);
  const costCards = [
    { label: "Ordens de fabrico", value: String(productionSummary.totalOrdens ?? 0), tone: "default" },
    { label: "Custo previsto", value: formatCurrency(Number(productionSummary.totalPrevisto ?? 0)), tone: "default" },
    { label: "Custo real", value: formatCurrency(Number(productionSummary.totalReal ?? 0)), tone: "danger" },
    { label: "Desvio total", value: formatCurrency(Number(productionSummary.desvioTotal ?? 0)), tone: Number(productionSummary.desvioTotal ?? 0) < 0 ? "success" : "danger" },
  ];

  return (
    <section className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_560px]">
      <div className="min-h-[calc(100vh-180px)] rounded-lg border border-border bg-background shadow-[0_1px_6px_rgba(15,23,42,0.06)]">
        <div className="border-b border-border p-6">
          <p className="text-xs font-semibold uppercase tracking-wide text-primary">PRIMAVERA + IA</p>
          <h2 className="mt-2 text-[24px] font-bold">{getInsightTitle(insightTopic)}</h2>
          <p className="mt-2 max-w-3xl text-sm leading-6 text-muted-foreground">
            {lastQuestion ? `Vista gerada para: "${lastQuestion}"` : "Faz uma pergunta no chat para adaptar esta area com tabelas e graficos."}
          </p>
        </div>

        <AdaptiveInsightPanel
          topic={insightTopic}
          data={data}
          dataLoading={dataLoading}
          costCards={costCards}
          productionOrders={productionOrders}
          customers={customers}
          receivables={receivables}
        />
      </div>

      <GeminiChatPanel
        open
        variant="page"
        insightData={data}
        onClose={() => { window.location.hash = "receber"; }}
        messages={messages}
        setMessages={setMessages}
        input={input}
        setInput={setInput}
        loading={loading}
        setLoading={setLoading}
      />
    </section>
  );
}

type InsightTopic = "collections" | "production" | "cashflow" | "personnel" | "general";

function normalizeQuestion(text: string) {
  return text
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");
}

function getInsightTopic(question: string): InsightTopic {
  const normalized = normalizeQuestion(question);
  if (/funcion|pessoal|salari|venciment|remuner|ordenad|recursos humanos|colaborador/.test(normalized)) return "personnel";
  if (/custo/.test(normalized) && !/produc|materia|fabrico|ordem|mao de obra direta|industrial/.test(normalized)) return "general";
  if (/cliente|cobrar|cobran|divida|d[ií]vida|receber|vencid|aging/.test(normalized)) return "collections";
  if (/produ|custo|materia|mat[eé]ria|fabrico|ordem/.test(normalized)) return "production";
  if (/fluxo|caixa|liquidez|tesouraria|saldo|pagar/.test(normalized)) return "cashflow";
  return "general";
}

function getInsightTitle(topic: InsightTopic) {
  const titles: Record<InsightTopic, string> = {
    collections: "Cobranças prioritárias",
    production: "Custos de produção",
    cashflow: "Fluxo e liquidez",
    personnel: "Custos com pessoal",
    general: "Painel de análise assistida",
  };

  return titles[topic];
}

function AdaptiveInsightPanel({
  topic,
  data,
  dataLoading,
  costCards,
  productionOrders,
  customers,
  receivables,
}: {
  topic: InsightTopic;
  data: Record<string, any>;
  dataLoading: boolean;
  costCards: Array<{ label: string; value: string; tone: string }>;
  productionOrders: any[];
  customers: any[];
  receivables: any[];
}) {
  if (topic === "collections") {
    return <CollectionsInsight customers={customers} receivables={receivables} dataLoading={dataLoading} />;
  }

  if (topic === "cashflow") {
    return <CashflowInsight cashflow={data.cashflow} payables={data.payables} dataLoading={dataLoading} />;
  }

  if (topic === "personnel") {
    return <PersonnelInsight data={data} dataLoading={dataLoading} />;
  }

  if (topic !== "production") {
    return <GeneralInsight dataLoading={dataLoading} />;
  }

  return (
    <>
      <div className="grid gap-4 p-6 md:grid-cols-2 xl:grid-cols-4">
        {costCards.map((card) => (
          <div key={card.label} className="rounded-lg border border-border bg-muted/20 p-5">
            <p className="text-xs font-semibold text-muted-foreground">{card.label}</p>
            <p className={cn("mt-2 text-xl font-bold", card.tone === "danger" && "text-danger", card.tone === "success" && "text-success")}>
              {dataLoading ? "..." : card.value}
            </p>
          </div>
        ))}
      </div>
      <ProductionInsight orders={productionOrders} dataLoading={dataLoading} />
    </>
  );
}

function PersonnelInsight({ data, dataLoading }: { data: Record<string, any>; dataLoading: boolean }) {
  const personnel = data.personnel ?? {};
  const dre = data.dre ?? {};
  const accounts = Array.isArray(personnel.contabilidade) ? personnel.contabilidade : [];
  const employees = Array.isArray(personnel.detalhe) ? personnel.detalhe : [];
  const totalPersonnel = Number(personnel.totalContabilidade ?? accounts.reduce((sum: number, account: any) => sum + Number(account.total ?? 0), 0));
  const totalEmployees = Number(personnel.funcionarios?.totalFuncionarios ?? 0);
  const activeEmployeesRaw = Number(personnel.funcionarios?.ativos ?? 0);
  const activeEmployees = activeEmployeesRaw > 0 ? activeEmployeesRaw : totalEmployees;
  const monthlyPayroll = Number(personnel.funcionarios?.massaSalarialMensal ?? 0);
  const annualPayroll = Number(personnel.funcionarios?.massaSalarialAnual ?? 0);
  const netSales = Number(dre.vendasLiquidas ?? 0);
  const operatingCosts = Number(dre.custosOperacionais ?? 0);
  const ebitda = Number(dre.ebitda ?? 0);
  const avgCost = activeEmployees > 0 ? totalPersonnel / activeEmployees : 0;
  const personnelSalesPct = netSales > 0 ? (totalPersonnel / netSales) * 100 : 0;
  const payrollGap = totalPersonnel - annualPayroll;
  const barMax = Math.max(totalPersonnel, netSales, operatingCosts, Math.abs(ebitda), 1);
  const personnelOpexPct = operatingCosts > 0 ? (totalPersonnel / operatingCosts) * 100 : 0;
  const demoSupplement = personnel.demoSupplement;
  const headline = netSales > 0
    ? `Custo com pessoal de ${formatCurrency(totalPersonnel)} representa ${personnelSalesPct.toFixed(1)}% das vendas liquidas e pressiona um EBITDA negativo de ${formatCurrency(ebitda)}.`
    : `Custo com pessoal de ${formatCurrency(totalPersonnel)} sem base de vendas liquidas suficiente para avaliar peso operacional.`;

  return (
    <div className="space-y-5 p-6">
      <div className="rounded-lg border border-danger/30 bg-danger/5 p-5">
        <p className="text-xs font-bold uppercase text-danger">Conclusao executiva</p>
        <h3 className="mt-2 text-xl font-bold leading-7">{dataLoading ? "A calcular leitura financeira..." : headline}</h3>
        <div className="mt-4 grid gap-3 md:grid-cols-3">
          <MetricLine label="Peso no OPEX" value={operatingCosts > 0 ? `${personnelOpexPct.toFixed(1)}%` : "Sem OPEX"} tone={personnelOpexPct > 40 ? "danger" : "default"} />
          <MetricLine label="Contabilidade vs payroll anual" value={formatCurrency(payrollGap)} tone={payrollGap > 0 ? "danger" : "success"} />
          <MetricLine label="Acao imediata" value="Mapear centros de custo" tone="danger" />
        </div>
      </div>

      {demoSupplement?.isDemo && (
        <div className="rounded-lg border border-warning/40 bg-warning/5 p-4">
          <div className="flex items-start gap-3">
            <span className="mt-0.5 shrink-0 rounded bg-warning/20 px-2 py-0.5 text-xs font-bold uppercase tracking-wider text-warning">Demo</span>
            <div>
              <p className="text-sm font-bold text-warning">Dados suplementares de teste</p>
              <p className="mt-1 text-xs leading-5 text-muted-foreground">{demoSupplement.note}</p>
            </div>
          </div>
        </div>
      )}

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <MetricCard label="Custo contabilistico pessoal" value={dataLoading ? "..." : formatCurrency(totalPersonnel)} tone="danger" />
        <MetricCard label="Funcionarios considerados" value={dataLoading ? "..." : `${activeEmployees} / ${totalEmployees}`} />
        <MetricCard label="Massa salarial mensal" value={dataLoading ? "..." : formatCurrency(monthlyPayroll)} />
        <MetricCard label="Custo medio por ativo" value={dataLoading ? "..." : formatCurrency(avgCost)} />
        <MetricCard label="Massa salarial anual estimada" value={dataLoading ? "..." : formatCurrency(annualPayroll)} />
        <MetricCard label="Peso nas vendas liquidas" value={dataLoading || !netSales ? "Sem vendas" : `${personnelSalesPct.toFixed(1)}%`} tone={personnelSalesPct > 35 ? "danger" : "default"} />
        <MetricCard label="EBITDA" value={dataLoading ? "..." : formatCurrency(ebitda)} tone={ebitda >= 0 ? "success" : "danger"} />
        <MetricCard label="Diferenca vs massa anual" value={dataLoading ? "..." : formatCurrency(payrollGap)} tone={payrollGap > 0 ? "danger" : "success"} />
      </div>

      <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_420px]">
        <div className="rounded-lg border border-border">
          <div className="border-b border-border px-5 py-4">
            <h3 className="font-bold">Breakdown contabilistico por conta</h3>
            <p className="mt-1 text-sm text-muted-foreground">Debitos nas contas de pessoal encontrados no PRIMAVERA.</p>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[720px] text-sm">
              <thead>
                <tr className="border-b border-border bg-muted/30 text-left text-xs text-muted-foreground">
                  <th className="px-4 py-3">Conta</th>
                  <th className="px-4 py-3">Descricao</th>
                  <th className="px-4 py-3 text-right">Total</th>
                  <th className="px-4 py-3 text-right">Peso</th>
                </tr>
              </thead>
              <tbody>
                {accounts.length ? accounts.map((account: any) => {
                  const value = Number(account.total ?? 0);
                  const pct = totalPersonnel > 0 ? (value / totalPersonnel) * 100 : 0;
                  return (
                    <tr key={account.Conta} className="border-b border-border">
                      <td className="px-4 py-3 font-semibold">{account.Conta}</td>
                      <td className="px-4 py-3">{cleanAccountDescription(account)}</td>
                      <td className="px-4 py-3 text-right font-bold text-danger">{formatCurrency(value)}</td>
                      <td className="px-4 py-3 text-right">{pct.toFixed(1)}%</td>
                    </tr>
                  );
                }) : (
                  <tr>
                    <td colSpan={4} className="px-4 py-6 text-center text-muted-foreground">Sem contas contabilisticas de pessoal no periodo analisado.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        <div className="space-y-5">
          <div className="rounded-lg border border-border p-5">
            <h3 className="mb-4 font-bold">Comparacao executiva</h3>
            <div className="space-y-3">
              <SimpleBar label="Pessoal" value={totalPersonnel} max={barMax} tone="danger" />
              <SimpleBar label="Vendas liquidas" value={netSales} max={barMax} tone="success" />
              <SimpleBar label="Custos operacionais" value={operatingCosts} max={barMax} tone="danger" />
              <SimpleBar label="EBITDA absoluto" value={Math.abs(ebitda)} max={barMax} tone={ebitda >= 0 ? "success" : "danger"} />
            </div>
          </div>

          <div className="rounded-lg border border-border p-5">
            <h3 className="font-bold">Leitura CFO</h3>
            <div className="mt-3 space-y-3 text-sm leading-6 text-muted-foreground">
              <p>O custo contabilistico de pessoal representa {netSales > 0 ? `${personnelSalesPct.toFixed(1)}% das vendas liquidas` : "um peso que nao pode ser calculado sem vendas liquidas"}.</p>
              <p>A diferenca entre contabilidade e massa salarial anual estimada e {formatCurrency(payrollGap)}.</p>
              <p>Prioridade: validar se remuneracoes, encargos e seguros estao corretamente imputados por centro de custo.</p>
            </div>
          </div>
        </div>
      </div>

      <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_420px]">
        <div className="rounded-lg border border-border">
          <div className="border-b border-border px-5 py-4">
            <h3 className="font-bold">Top vencimentos base</h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[760px] text-sm">
              <thead>
                <tr className="border-b border-border bg-muted/30 text-left text-xs text-muted-foreground">
                  <th className="px-4 py-3">Codigo</th>
                  <th className="px-4 py-3">Nome</th>
                  <th className="px-4 py-3">Categoria</th>
                  <th className="px-4 py-3">Situacao</th>
                  <th className="px-4 py-3 text-right">Vencimento</th>
                </tr>
              </thead>
              <tbody>
                {employees.slice(0, 8).map((employee: any) => (
                  <tr key={employee.Codigo} className="border-b border-border">
                    <td className="px-4 py-3 font-semibold">{employee.Codigo}</td>
                    <td className="px-4 py-3">{employee.Nome}</td>
                    <td className="px-4 py-3 text-muted-foreground">{employee.Categoria || "-"}</td>
                    <td className="px-4 py-3">{employee.Situacao || "-"}</td>
                    <td className="px-4 py-3 text-right font-bold">{formatCurrency(Number(employee.vencimento ?? 0))}</td>
                  </tr>
                ))}
                {!employees.length && (
                  <tr>
                    <td colSpan={5} className="px-4 py-6 text-center text-muted-foreground">Sem detalhe de funcionarios disponivel.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        <div className="rounded-lg border border-border p-5">
          <h3 className="font-bold">Dimensoes disponiveis para teste</h3>
          <div className="mt-3 space-y-2 text-sm leading-6">
            {demoSupplement ? (
              <>
                <p className="text-muted-foreground">Os dados abaixo foram gerados para simular dimensoes que o PRIMAVERA demo nao fornece. As seguintes dimensoes reais continuam por integrar do ERP:</p>
                <ul className="mt-2 space-y-1">
                  {demoSupplement.missingRealDimensions.map((dim: string) => (
                    <li key={dim} className="flex items-center gap-2 text-muted-foreground">
                      <span className="size-1.5 shrink-0 rounded-full bg-muted-foreground/40" />
                      {dim}
                    </li>
                  ))}
                </ul>
              </>
            ) : (
              <p className="text-muted-foreground">Sem dados suplementares disponiveis. As dimensoes analiticas dependem da configuracao do PRIMAVERA.</p>
            )}
          </div>
        </div>
      </div>

      {demoSupplement && (
        <>
          <div className="rounded-lg border border-border">
            <div className="border-b border-border px-5 py-4">
              <div className="flex items-center gap-2">
                <h3 className="font-bold">Custos por departamento / centro de custo</h3>
                <span className="rounded bg-warning/15 px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wide text-warning">demo</span>
              </div>
              <p className="mt-1 text-sm text-muted-foreground">Distribuicao estimada do custo com pessoal pelos departamentos.</p>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full min-w-[760px] text-sm">
                <thead>
                  <tr className="border-b border-border bg-muted/30 text-left text-xs text-muted-foreground">
                    <th className="px-4 py-3">Departamento</th>
                    <th className="px-4 py-3">Centro Custo</th>
                    <th className="px-4 py-3 text-right">Montante</th>
                    <th className="px-4 py-3 text-right">%</th>
                    <th className="px-4 py-3 text-right">FTE</th>
                    <th className="px-4 py-3" />
                  </tr>
                </thead>
                <tbody>
                  {demoSupplement.departments.map((dep: any) => (
                    <tr key={dep.department} className="border-b border-border">
                      <td className="px-4 py-3 font-semibold">{dep.department}</td>
                      <td className="px-4 py-3 text-muted-foreground">{dep.costCenter}</td>
                      <td className="px-4 py-3 text-right font-bold">{formatCurrency(dep.amount)}</td>
                      <td className="px-4 py-3 text-right">{dep.percent}%</td>
                      <td className="px-4 py-3 text-right">{dep.fte}</td>
                      <td className="px-4 py-3">
                        <div className="h-2 w-24 overflow-hidden rounded-full bg-muted">
                          <div className="h-full rounded-full bg-danger" style={{ width: `${dep.percent}%` }} />
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <div className="rounded-lg border border-border">
            <div className="border-b border-border px-5 py-4">
              <div className="flex items-center gap-2">
                <h3 className="font-bold">Mapa mensal e encargos</h3>
                <span className="rounded bg-warning/15 px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wide text-warning">demo</span>
              </div>
              <p className="mt-1 text-sm text-muted-foreground">Estimativa mensal do custo total, base salarial e encargos patronais com base no contabilistico anual.</p>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full min-w-[820px] text-sm">
                <thead>
                  <tr className="border-b border-border bg-muted/30 text-left text-xs text-muted-foreground">
                    <th className="px-4 py-3">Mes</th>
                    <th className="px-4 py-3 text-right">Base salarial</th>
                    <th className="px-4 py-3 text-right">Encargos</th>
                    <th className="px-4 py-3 text-right">Total</th>
                    <th className="px-4 py-3" />
                  </tr>
                </thead>
                <tbody>
                  {demoSupplement.monthlyTrend.map((mt: any) => {
                    const maxMonthly = Math.max(...demoSupplement.monthlyTrend.map((m: any) => m.amount), 1);
                    return (
                      <tr key={mt.month} className="border-b border-border">
                        <td className="px-4 py-3 font-semibold">{mt.month}</td>
                        <td className="px-4 py-3 text-right">{formatCurrency(mt.payrollBase)}</td>
                        <td className="px-4 py-3 text-right">{formatCurrency(mt.employerCharges)}</td>
                        <td className="px-4 py-3 text-right font-bold">{formatCurrency(mt.amount)}</td>
                        <td className="px-4 py-3">
                          <div className="h-2 w-24 overflow-hidden rounded-full bg-muted">
                            <div className="h-full rounded-full bg-primary" style={{ width: `${(mt.amount / maxMonthly) * 100}%` }} />
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          <div className="rounded-lg border border-border">
            <div className="border-b border-border px-5 py-4">
              <div className="flex items-center gap-2">
                <h3 className="font-bold">Mao de obra imputada a ordens</h3>
                <span className="rounded bg-warning/15 px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wide text-warning">demo</span>
              </div>
              <p className="mt-1 text-sm text-muted-foreground">Imputacao estimada de mao de obra direta do departamento Producao (42% do total) pelas ordens de fabrico ativas.</p>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full min-w-[760px] text-sm">
                <thead>
                  <tr className="border-b border-border bg-muted/30 text-left text-xs text-muted-foreground">
                    <th className="px-4 py-3">Ordem</th>
                    <th className="px-4 py-3">Artigo</th>
                    <th className="px-4 py-3 text-right">Horas</th>
                    <th className="px-4 py-3 text-right">Custo/hora</th>
                    <th className="px-4 py-3 text-right">Mao obra</th>
                    <th className="px-4 py-3">Fonte</th>
                  </tr>
                </thead>
                <tbody>
                  {demoSupplement.productionLabor.map((pl: any) => (
                    <tr key={pl.order} className="border-b border-border">
                      <td className="px-4 py-3 font-semibold">{pl.order}</td>
                      <td className="px-4 py-3">{pl.article}</td>
                      <td className="px-4 py-3 text-right">{pl.hours}</td>
                      <td className="px-4 py-3 text-right">{formatCurrency(pl.costPerHour)}</td>
                      <td className="px-4 py-3 text-right font-bold">{formatCurrency(pl.directLabor)}</td>
                      <td className="px-4 py-3"><span className="rounded bg-warning/10 px-1.5 py-0.5 text-[10px] font-bold uppercase text-warning">demo</span></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}
    </div>
  );
}

function cleanAccountDescription(account: any) {
  const accountCode = String(account?.Conta ?? "");
  if (accountCode === "6421") return "Remuneracoes do Pessoal - Vencimentos";
  if (accountCode === "6452") return "Encargos sobre Remuneracoes - Pessoal";
  return String(account?.Descricao ?? "-").replace(/�/g, "");
}

function GeneralInsight({ dataLoading }: { dataLoading: boolean }) {
  return (
    <div className="grid gap-4 p-6 md:grid-cols-3">
      <MetricCard label="Contexto PRIMAVERA" value={dataLoading ? "..." : "Disponivel"} />
      <MetricCard label="Analise" value={dataLoading ? "..." : "Financeira"} />
      <MetricCard label="Graficos automaticos" value={dataLoading ? "..." : "Por tema"} />
    </div>
  );
}

function CollectionsInsight({ customers, receivables, dataLoading }: { customers: any[]; receivables: any[]; dataLoading: boolean }) {
  const priorityCustomers = [...customers]
    .filter((customer) => Number(customer.currentDebt ?? 0) > 0)
    .sort((a, b) => Number(b.currentDebt ?? 0) - Number(a.currentDebt ?? 0))
    .slice(0, 10);
  const overdueDocs = [...receivables]
    .filter((doc) => Number(doc.daysOverdue ?? 0) > 0 && Number(doc.openAmount ?? 0) > 0)
    .sort((a, b) => Number(b.openAmount ?? 0) - Number(a.openAmount ?? 0))
    .slice(0, 8);
  const totalDebt = priorityCustomers.reduce((sum, customer) => sum + Number(customer.currentDebt ?? 0), 0);
  const maxDebt = Math.max(...priorityCustomers.map((customer) => Number(customer.currentDebt ?? 0)), 1);

  return (
    <div className="space-y-4 p-6">
      <div className="grid gap-4 md:grid-cols-3">
        <MetricCard label="Clientes com dívida" value={dataLoading ? "..." : String(priorityCustomers.length)} />
        <MetricCard label="Dívida em prioridade" value={formatCurrency(totalDebt)} tone="danger" />
        <MetricCard label="Docs vencidos" value={String(overdueDocs.length)} />
      </div>
      <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_420px]">
        <div className="rounded-lg border border-border">
          <div className="border-b border-border px-4 py-3">
            <h3 className="font-bold">Clientes a cobrar primeiro</h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[760px] text-sm">
              <thead>
                <tr className="border-b border-border bg-muted/30 text-left text-xs text-muted-foreground">
                  <th className="px-4 py-3">Cliente</th>
                  <th className="px-4 py-3">NIF</th>
                  <th className="px-4 py-3 text-right">Dívida</th>
                  <th className="px-4 py-3 text-right">Docs</th>
                  <th className="px-4 py-3">Condição</th>
                </tr>
              </thead>
              <tbody>
                {priorityCustomers.map((customer) => (
                  <tr key={customer.code} className="border-b border-border">
                    <td className="px-4 py-3 font-semibold">{customer.name}</td>
                    <td className="px-4 py-3 text-muted-foreground">{customer.nif ?? "-"}</td>
                    <td className="px-4 py-3 text-right font-bold text-danger">{formatCurrency(Number(customer.currentDebt ?? 0), customer.currency ?? "EUR")}</td>
                    <td className="px-4 py-3 text-right">{customer.documentCount ?? 0}</td>
                    <td className="px-4 py-3">{customer.paymentCondition || "-"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
        <div className="rounded-lg border border-border p-5">
          <h3 className="mb-4 font-bold">Gráfico de dívida</h3>
          <div className="space-y-3">
            {priorityCustomers.slice(0, 7).map((customer) => (
              <SimpleBar
                key={customer.code}
                label={customer.name}
                value={Number(customer.currentDebt ?? 0)}
                max={maxDebt}
                tone="danger"
              />
            ))}
          </div>
        </div>
      </div>
      <div className="rounded-lg border border-border">
        <div className="border-b border-border px-4 py-3">
          <h3 className="font-bold">Documentos vencidos de maior valor</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[760px] text-sm">
            <thead>
              <tr className="border-b border-border bg-muted/30 text-left text-xs text-muted-foreground">
                <th className="px-4 py-3">Cliente</th>
                <th className="px-4 py-3">Documento</th>
                <th className="px-4 py-3 text-right">Dias vencido</th>
                <th className="px-4 py-3 text-right">Em aberto</th>
              </tr>
            </thead>
            <tbody>
              {overdueDocs.map((doc) => (
                <tr key={`${doc.documentNumber}-${doc.clientName}`} className="border-b border-border">
                  <td className="px-4 py-3 font-semibold">{doc.clientName ?? "Cliente indiferenciado"}</td>
                  <td className="px-4 py-3">{doc.documentNumber}</td>
                  <td className="px-4 py-3 text-right text-danger">{doc.daysOverdue ?? 0}</td>
                  <td className="px-4 py-3 text-right font-bold">{formatCurrency(Number(doc.openAmount ?? 0), doc.currency ?? "EUR")}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

function ProductionInsight({ orders, dataLoading }: { orders: any[]; dataLoading: boolean }) {
  const topOrders = orders.slice(0, 8);
  const maxOrderCost = Math.max(
    ...topOrders.map((order: any) => Number(order.CustoMateriaisPrevisto ?? 0) + Number(order.CustoTransformacaoPrevisto ?? 0)),
    1,
  );

  return (
    <div className="grid gap-4 px-6 pb-6 lg:grid-cols-2">
      <div className="rounded-lg border border-border p-5">
        <div className="mb-4 flex items-center justify-between">
          <h3 className="font-bold">Custos por ordem</h3>
          <span className="text-xs text-muted-foreground">previsto vs real</span>
        </div>
        <div className="space-y-4">
          {topOrders.map((order: any) => {
            const previsto = Number(order.CustoMateriaisPrevisto ?? 0) + Number(order.CustoTransformacaoPrevisto ?? 0);
            const real = Number(order.CustoMateriaisReal ?? 0) + Number(order.CustoTransformacaoReal ?? 0);
            return (
              <div key={order.Id ?? order.OrdemFabrico}>
                <div className="mb-1 flex items-center justify-between gap-3 text-xs">
                  <span className="font-semibold">{order.ArtigoDescricao ?? order.Artigo}</span>
                  <span className="text-muted-foreground">{formatCurrency(real)} / {formatCurrency(previsto)}</span>
                </div>
                <div className="h-3 overflow-hidden rounded-full bg-muted">
                  <div className="h-full rounded-full bg-primary" style={{ width: `${Math.min(100, (previsto / maxOrderCost) * 100)}%` }} />
                </div>
                <div className="mt-1 h-2 overflow-hidden rounded-full bg-muted">
                  <div className="h-full rounded-full bg-danger" style={{ width: `${Math.min(100, (real / maxOrderCost) * 100)}%` }} />
                </div>
              </div>
            );
          })}
          {!dataLoading && topOrders.length === 0 && (
            <p className="text-sm text-muted-foreground">Sem ordens devolvidas pelo endpoint de producao.</p>
          )}
        </div>
      </div>
      <div className="rounded-lg border border-border">
        <div className="border-b border-border px-4 py-3">
          <h3 className="font-bold">Tabela de ordens de fabrico</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[760px] text-sm">
            <thead>
              <tr className="border-b border-border bg-muted/30 text-left text-xs text-muted-foreground">
                <th className="px-4 py-3">Ordem</th>
                <th className="px-4 py-3">Artigo</th>
                <th className="px-4 py-3 text-right">Mat. real</th>
                <th className="px-4 py-3 text-right">Total previsto</th>
                <th className="px-4 py-3 text-right">Total real</th>
              </tr>
            </thead>
            <tbody>
              {topOrders.map((order: any) => {
                const previsto = Number(order.CustoMateriaisPrevisto ?? 0) + Number(order.CustoTransformacaoPrevisto ?? 0);
                const real = Number(order.CustoMateriaisReal ?? 0) + Number(order.CustoTransformacaoReal ?? 0);
                return (
                  <tr key={order.Id ?? order.OrdemFabrico} className="border-b border-border">
                    <td className="px-4 py-3 font-semibold">{order.OrdemFabrico}</td>
                    <td className="px-4 py-3">{order.ArtigoDescricao ?? order.Artigo}</td>
                    <td className="px-4 py-3 text-right">{formatCurrency(Number(order.CustoMateriaisReal ?? 0))}</td>
                    <td className="px-4 py-3 text-right">{formatCurrency(previsto)}</td>
                    <td className="px-4 py-3 text-right font-bold">{formatCurrency(real)}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

function CashflowInsight({ cashflow, payables, dataLoading }: { cashflow: any; payables: any; dataLoading: boolean }) {
  const cashflowSummary = cashflow?.summary ?? {};
  const payablesSummary = payables?.summary ?? {};
  const incoming = Number(cashflowSummary.totalIncoming ?? 0);
  const outgoing = Number(cashflowSummary.totalOutgoing ?? 0);
  const max = Math.max(incoming, outgoing, 1);

  return (
    <div className="space-y-4 p-6">
      <div className="grid gap-4 md:grid-cols-4">
        <MetricCard label="Entradas previstas" value={dataLoading ? "..." : formatCurrency(incoming)} tone="success" />
        <MetricCard label="Saídas previstas" value={formatCurrency(outgoing)} tone="danger" />
        <MetricCard label="Saldo projetado" value={formatCurrency(Number(cashflowSummary.projectedBalance ?? 0))} tone={Number(cashflowSummary.projectedBalance ?? 0) >= 0 ? "success" : "danger"} />
        <MetricCard label="Total a pagar" value={formatCurrency(Number(payablesSummary.totalOpen ?? payablesSummary.total ?? 0))} />
      </div>
      <div className="rounded-lg border border-border p-5">
        <h3 className="mb-4 font-bold">Fluxo previsto</h3>
        <SimpleBar label="Entradas" value={incoming} max={max} tone="success" />
        <SimpleBar label="Saídas" value={outgoing} max={max} tone="danger" />
      </div>
    </div>
  );
}

function MetricCard({ label, value, tone = "default" }: { label: string; value: string; tone?: "default" | "success" | "danger" }) {
  return (
    <div className="rounded-lg border border-border bg-muted/20 p-5">
      <p className="text-xs font-semibold text-muted-foreground">{label}</p>
      <p className={cn("mt-2 text-xl font-bold", tone === "success" && "text-success", tone === "danger" && "text-danger")}>{value}</p>
    </div>
  );
}

function MetricLine({ label, value, tone }: { label: string; value: string; tone: "default" | "success" | "danger" }) {
  return (
    <div className="flex items-center justify-between rounded-lg border border-border bg-muted/20 px-4 py-3 text-sm">
      <span className="text-muted-foreground">{label}</span>
      <span className={cn("font-bold", tone === "success" && "text-success", tone === "danger" && "text-danger")}>{value}</span>
    </div>
  );
}

function GeminiChatPanel({
  open,
  variant = "floating",
  insightData,
  onClose,
  messages,
  setMessages,
  input,
  setInput,
  loading,
  setLoading,
}: {
  open: boolean;
  variant?: "floating" | "page";
  insightData?: Record<string, any>;
  onClose: () => void;
  messages: Array<{ role: "user" | "assistant"; content: string }>;
  setMessages: React.Dispatch<React.SetStateAction<Array<{ role: "user" | "assistant"; content: string }>>>;
  input: string;
  setInput: (v: string) => void;
  loading: boolean;
  setLoading: (v: boolean) => void;
}) {
  const [error, setError] = useState<string | null>(null);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [selectedModel, setSelectedModel] = useState(
    () => localStorage.getItem("erp-finance-gemini-model") ?? geminiModels[0]?.id ?? "",
  );
  const [activeKeyIndex, setActiveKeyIndex] = useState(() => Number(localStorage.getItem("erp-finance-gemini-active-key") ?? "0"));
  const [keySlots, setKeySlots] = useState<AiKeySlot[]>(readAiKeySlots);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, loading, error]);

  const activeKey = keySlots[activeKeyIndex]?.value.trim() ?? "";
  const selectedModelLabel = geminiModels.find((model) => model.id === selectedModel)?.label ?? selectedModel;

  function saveSelectedModel(value: string) {
    setSelectedModel(value);
    localStorage.setItem("erp-finance-gemini-model", value);
  }

  function saveKeySlot(index: number, value: string) {
    setKeySlots((current) => {
      const next = current.map((slot, slotIndex) => (slotIndex === index ? { ...slot, value } : slot));
      localStorage.setItem("erp-finance-gemini-key-slots", JSON.stringify(next));
      localStorage.setItem("erp-finance-gemini-key", next[0]?.value.trim() ?? "");
      return next;
    });
  }

  function activateKey(index: number) {
    setActiveKeyIndex(index);
    localStorage.setItem("erp-finance-gemini-active-key", String(index));
  }

  async function fetchContextPart(path: string) {
    const response = await fetch(path);
    if (!response.ok) {
      throw new Error(`${path} respondeu ${response.status}`);
    }

    return response.json();
  }

  async function collectPrimaveraContext() {
    const endpoints = [
      "/api/production-costs",
      "/api/cost-analysis",
      "/api/dashboard",
      "/api/receivables",
      "/api/customers",
      "/api/cashflow",
      "/api/payables",
      "/api/banks",
      "/api/dre",
      "/api/alerts",
    ];
    const results = await Promise.allSettled(endpoints.map((path) => fetchContextPart(path)));
    const data: Record<string, unknown> = {};
    const failures: string[] = [];

    endpoints.forEach((path, index) => {
      const key = path.replace("/api/", "").replace(/-/g, "_");
      const result = results[index];
      if (!result) return;

      if (result.status === "fulfilled") {
        data[key] = compactPrimaveraPayload(key, result.value);
      } else {
        failures.push(result.reason instanceof Error ? result.reason.message : String(result.reason));
      }
    });

    return {
      generatedAt: new Date().toISOString(),
      source: "Endpoints locais da app ERP Finance ligados ao PRIMAVERA",
      failures,
      data,
    };
  }

  function compactPrimaveraPayload(key: string, payload: unknown) {
    if (!payload || typeof payload !== "object") return payload;
    const value = payload as Record<string, unknown>;

    if (key === "production_costs") {
      return {
        source: value.source,
        database: value.database,
        summary: value.summary,
        orders: Array.isArray(value.orders) ? value.orders.slice(0, 12) : [],
        materialComponents: Array.isArray(value.components) ? value.components.slice(0, 30) : [],
        operations: Array.isArray(value.operations) ? value.operations.slice(0, 20) : [],
      };
    }

    if (key === "cost_analysis") {
      return {
        source: value.source,
        database: value.database,
        production: value.production,
        debitCosts: Array.isArray(value.debitCosts) ? value.debitCosts.slice(0, 12) : [],
        creditCosts: Array.isArray(value.creditCosts) ? value.creditCosts.slice(0, 8) : [],
        suppliers: Array.isArray(value.suppliers) ? value.suppliers.slice(0, 8) : [],
      };
    }

    if (key === "receivables") {
      return {
        source: value.source,
        database: value.database,
        summary: value.summary,
        receivables: Array.isArray(value.receivables) ? value.receivables.slice(0, 20) : [],
      };
    }

    if (key === "customers") {
      return {
        source: value.source,
        database: value.database,
        customers: Array.isArray(value.customers) ? value.customers.slice(0, 20) : [],
      };
    }

    if (key === "payables") {
      return {
        source: value.source,
        database: value.database,
        summary: value.summary,
        payables: Array.isArray(value.payables) ? value.payables.slice(0, 20) : [],
      };
    }

    return value;
  }

  async function askGemini(question: string, history: Array<{ role: "user" | "assistant"; content: string }>) {
    const key = activeKey;
    if (!key) {
      throw new Error("Cola primeiro uma Gemini API key nas configuracoes e ativa essa key.");
    }

    const primaveraContext = await collectPrimaveraContext();
    const prompt = [
      "Es o assistente IA financeiro da app ERP Finance.",
      "Responde em portugues de Portugal, direto e operacional.",
      "Usa apenas os dados do contexto PRIMAVERA recebido.",
      "Para perguntas sobre custos de producao, usa primeiro data.production_costs.summary, data.production_costs.orders, data.production_costs.materialComponents e data.cost_analysis.production.",
      "Para perguntas sobre funcionarios, pessoal, salarios, vencimentos ou remuneracoes, nao uses custos de producao nem artigos como grafico automatico; usa a leitura contabilistica disponivel.",
      "Se os dados forem insuficientes, diz exatamente o que falta.",
      "Nao inventes valores, clientes, stocks, producao, custos, compras, vendas ou contabilidade.",
      "Quando fizer sentido, aponta documentos, clientes, totais e prioridades praticas.",
      "",
      "Historico recente:",
      JSON.stringify(history.slice(-8), null, 2),
      "",
      "Pergunta do utilizador:",
      question,
      "",
      "Contexto PRIMAVERA disponivel:",
      JSON.stringify(primaveraContext, null, 2).slice(0, 45000),
    ].join("\n");

    let lastError = "Gemini nao respondeu.";

    for (const model of [selectedModel, "gemini-2.0-flash", "gemini-2.0-flash-lite"]) {
      const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${encodeURIComponent(key)}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            contents: [{ role: "user", parts: [{ text: prompt }] }],
            generationConfig: {
              temperature: 0.2,
              maxOutputTokens: 1400,
            },
          }),
        },
      );
      const responseData = await response.json();

      if (!response.ok) {
        lastError = responseData?.error?.message || `Gemini respondeu ${response.status}`;
        continue;
      }

      const reply = responseData?.candidates?.[0]?.content?.parts
        ?.map((part: { text?: string }) => part.text)
        .filter(Boolean)
        .join("\n")
        .trim();

      if (reply) {
        return reply;
      }
    }

    throw new Error(lastError);
  }

  async function sendMessage() {
    const text = input.trim();
    if (!text || loading) return;

    const userMsg = { role: "user" as const, content: text };
    const nextMessages = [...messages, userMsg];
    setMessages(nextMessages);
    setInput("");
    setLoading(true);
    setError(null);

    try {
      const reply = await askGemini(text, nextMessages);
      setMessages((prev) => [...prev, { role: "assistant", content: reply }]);
    } catch (sendError) {
      setError(sendError instanceof Error ? sendError.message : "Erro ao falar com a IA.");
    } finally {
      setLoading(false);
    }
  }

  if (!open) return null;

  return (
    <div
      className={cn(
        "flex min-h-0 flex-col rounded-xl border border-border bg-background shadow-2xl",
        variant === "page"
          ? "h-[calc(100vh-150px)] min-h-[760px] w-full"
          : "fixed bottom-20 right-5 z-50 w-[420px] max-w-[calc(100vw-2rem)]",
      )}
      style={variant === "floating" ? { height: "580px" } : undefined}
    >
      <div className="flex items-center justify-between border-b border-border px-4 py-3">
        <div className="flex items-center gap-2">
          <Sparkles className="size-4 text-primary" />
          <span className="text-sm font-semibold">Assistente IA Gemini</span>
        </div>
        <div className="flex items-center gap-1">
          <Button variant="ghost" size="icon" className="size-7" onClick={() => setSettingsOpen((value) => !value)} aria-label="Configurar IA">
            <Settings className="size-4" />
          </Button>
          <Button variant="ghost" size="icon" className="size-7" onClick={onClose} aria-label="Fechar chat">
            <XIcon className="size-4" />
          </Button>
        </div>
      </div>
      {settingsOpen ? (
        <div className="border-b border-border px-4 py-3">
          <div className="mb-3 flex items-start justify-between gap-3">
            <div>
              <p className="text-sm font-semibold">Configuracoes de API</p>
              <p className="mt-1 text-[11px] leading-4 text-muted-foreground">
                Insere as tuas keys Gemini. Ativa a que queres usar; quando uma esgotar, troca aqui.
              </p>
            </div>
            <span className={cn("rounded-md px-2 py-1 text-[11px] font-semibold", activeKey ? "bg-success-soft text-success" : "bg-warning-soft text-warning")}>
              {activeKey ? `Key ${activeKeyIndex + 1} ativa` : "sem key"}
            </span>
          </div>
          <label className="mb-1 flex items-center justify-between text-xs font-semibold text-muted-foreground">
            <span>Modelo</span>
            <span className="font-normal">escolhe conforme a tua quota</span>
          </label>
          <select
            value={selectedModel}
            onChange={(event) => saveSelectedModel(event.target.value)}
            className="mb-3 h-9 w-full rounded-md border border-border bg-background px-3 text-sm shadow-sm outline-none focus:border-primary"
          >
            {geminiModels.map((model) => (
              <option key={model.id} value={model.id}>
                {model.label}
              </option>
            ))}
          </select>
          <div className="space-y-2">
            {keySlots.map((slot, index) => (
              <div key={slot.name}>
                <label className="mb-1 block text-xs font-semibold text-muted-foreground">
                  {slot.name}
                </label>
                <div className="flex gap-2">
                  <Input
                    type="password"
                    value={slot.value}
                    onChange={(event) => saveKeySlot(index, event.target.value)}
                    placeholder="AIza..."
                    className="h-9 text-sm"
                  />
                  <Button
                    type="button"
                    variant={activeKeyIndex === index ? "default" : "outline"}
                    className="h-9 px-3 text-xs"
                    onClick={() => activateKey(index)}
                    disabled={!slot.value.trim()}
                  >
                    {activeKeyIndex === index ? "Ativa" : "Ativar"}
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </div>
      ) : (
        <div className="flex items-center justify-between gap-3 border-b border-border px-4 py-2 text-xs text-muted-foreground">
          <span className="truncate">{selectedModelLabel}</span>
          <Button variant="outline" size="sm" className="h-7 gap-1.5 text-xs" onClick={() => setSettingsOpen(true)}>
            <Settings className="size-3.5" />
            Configurar
          </Button>
        </div>
      )}
      <div ref={scrollRef} className="min-h-0 flex-1 overflow-y-auto px-4 py-3 text-sm">
        {messages.length === 0 && !error && (
          <div className="flex h-full items-center justify-center text-center text-muted-foreground">
            <div>
              <Sparkles className="mx-auto mb-2 size-8 text-primary/40" />
              <p className="font-semibold">Pergunte sobre os dados PRIMAVERA</p>
              <p className="mt-1 text-xs">Ex: "Quais sao os clientes com mais divida?"</p>
            </div>
          </div>
        )}
        {messages.map((msg, i) => {
          const previousUserMessage = [...messages]
            .slice(0, i)
            .reverse()
            .find((item) => item.role === "user")?.content ?? "";

          return (
            <div key={i} className={cn("mb-4 flex", msg.role === "user" ? "justify-end" : "justify-start")}>
              <div className={cn("max-w-[92%] rounded-lg px-3 py-2", msg.role === "user" ? "bg-primary text-primary-foreground" : "bg-muted")}>
                {msg.role === "assistant" ? <FormattedAiMessage content={msg.content} /> : msg.content}
                {variant === "page" && msg.role === "assistant" && (
                  <AiInlineCharts question={previousUserMessage} data={insightData} />
                )}
              </div>
            </div>
          );
        })}
        {loading && (
          <div className="flex justify-start">
            <div className="rounded-lg bg-muted px-3 py-2 text-muted-foreground">A consultar PRIMAVERA e Gemini...</div>
          </div>
        )}
        {error && (
          <div className="mb-3 rounded-lg border border-danger/30 bg-danger-soft px-3 py-2 text-xs text-danger">
            {error}
          </div>
        )}
      </div>
      <div className="border-t border-border p-3">
        <div className="mb-2 flex flex-wrap gap-2">
          {["Resume o fluxo de caixa", "Que clientes devo cobrar primeiro?", "Quais os custos de producao?", "Ha riscos de liquidez?"].map((suggestion) => (
            <Button
              key={suggestion}
              type="button"
              variant="outline"
              size="sm"
              className="h-7 text-xs"
              onClick={() => setInput(suggestion)}
              disabled={loading}
            >
              {suggestion}
            </Button>
          ))}
        </div>
        <form
          onSubmit={(event) => { event.preventDefault(); sendMessage(); }}
          className="flex gap-2"
        >
          <Input
            value={input}
            onChange={(event) => setInput(event.target.value)}
            placeholder="Pergunte ao assistente..."
            className="h-9 text-sm"
            disabled={loading}
          />
          <Button type="submit" size="icon" className="h-9 w-9 shrink-0" disabled={loading || !input.trim()}>
            <Send className="size-4" />
          </Button>
        </form>
      </div>
    </div>
  );
}

function FormattedAiMessage({ content }: { content: string }) {
  const lines = content.split("\n");

  return (
    <div className="space-y-2 leading-5">
      {lines.map((rawLine, index) => {
        const line = rawLine.trim();
        if (!line) return <div key={index} className="h-1" />;

        if (line.startsWith("### ")) {
          return <h4 key={index} className="pt-1 text-sm font-bold">{renderInlineMarkdown(line.replace(/^###\s+/, ""))}</h4>;
        }

        if (line.startsWith("## ")) {
          return <h3 key={index} className="pt-1 text-base font-bold">{renderInlineMarkdown(line.replace(/^##\s+/, ""))}</h3>;
        }

        if (line.startsWith("# ")) {
          return <h3 key={index} className="pt-1 text-base font-bold">{renderInlineMarkdown(line.replace(/^#\s+/, ""))}</h3>;
        }

        if (/^[-*]\s+/.test(line)) {
          return (
            <div key={index} className="flex gap-2">
              <span className="mt-2 size-1.5 shrink-0 rounded-full bg-primary" />
              <p>{renderInlineMarkdown(line.replace(/^[-*]\s+/, ""))}</p>
            </div>
          );
        }

        if (/^\d+\.\s+/.test(line)) {
          return <p key={index}>{renderInlineMarkdown(line.replace(/^\d+\.\s+/, ""))}</p>;
        }

        return <p key={index}>{renderInlineMarkdown(line)}</p>;
      })}
    </div>
  );
}

function renderInlineMarkdown(text: string) {
  const clean = text.replace(/\*\*/g, "");
  return clean;
}

function AiInlineCharts({ question, data }: { question: string; data?: Record<string, any> | undefined }) {
  const normalized = normalizeQuestion(question);
  const wantsPersonnel = /funcion|pessoal|salari|venciment|remuner|ordenad|recursos humanos|colaborador/.test(normalized);
  const wantsCollections = /cliente|cobrar|cobran|divida|receber|vencid|aging/.test(normalized);
  const wantsProduction = /produ|custo|materia|mat[eé]ria|fabrico|ordem/.test(normalized);
  const wantsCashflow = /fluxo|caixa|liquidez|tesouraria|saldo/.test(normalized);

  if (wantsPersonnel) return null;
  if (/custo/.test(normalized) && !/produc|materia|fabrico|ordem|mao de obra direta|industrial/.test(normalized)) return null;

  if (wantsCollections && data?.customers) {
    const customers = Array.isArray(data.customers.customers) ? data.customers.customers : [];
    const topCustomers = customers
      .filter((customer: any) => Number(customer.currentDebt ?? 0) > 0)
      .sort((a: any, b: any) => Number(b.currentDebt ?? 0) - Number(a.currentDebt ?? 0))
      .slice(0, 5);
    const maxDebt = Math.max(...topCustomers.map((customer: any) => Number(customer.currentDebt ?? 0)), 1);

    return (
      <div className="mt-4 rounded-lg border border-border bg-background p-3">
        <div className="mb-3 flex items-center justify-between">
          <p className="text-xs font-bold uppercase text-primary">Tabela automatica</p>
          <p className="text-xs text-muted-foreground">clientes a cobrar</p>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr className="border-b border-border text-left text-muted-foreground">
                <th className="py-2 pr-2">Cliente</th>
                <th className="py-2 text-right">Divida</th>
              </tr>
            </thead>
            <tbody>
              {topCustomers.map((customer: any) => (
                <tr key={customer.code} className="border-b border-border">
                  <td className="py-2 pr-2 font-semibold">{customer.name}</td>
                  <td className="py-2 text-right font-bold text-danger">{formatCurrency(Number(customer.currentDebt ?? 0), customer.currency ?? "EUR")}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="mt-3 space-y-2">
          {topCustomers.map((customer: any) => (
            <SimpleBar key={`${customer.code}-bar`} label={customer.name} value={Number(customer.currentDebt ?? 0)} max={maxDebt} tone="danger" />
          ))}
        </div>
      </div>
    );
  }

  if (wantsProduction && data?.production) {
    const summary = data.production.summary ?? {};
    const orders = Array.isArray(data.production.orders) ? data.production.orders.slice(0, 5) : [];
    const max = Math.max(
      ...orders.map((order: any) => Number(order.CustoMateriaisPrevisto ?? 0) + Number(order.CustoTransformacaoPrevisto ?? 0)),
      1,
    );

    return (
      <div className="mt-4 rounded-lg border border-border bg-background p-3">
        <div className="mb-3 flex items-center justify-between">
          <p className="text-xs font-bold uppercase text-primary">Grafico automatico</p>
          <p className="text-xs text-muted-foreground">custos de producao</p>
        </div>
        <div className="mb-3 grid grid-cols-3 gap-2 text-xs">
          <MetricMini label="Previsto" value={formatCurrency(Number(summary.totalPrevisto ?? 0))} />
          <MetricMini label="Real" value={formatCurrency(Number(summary.totalReal ?? 0))} tone="danger" />
          <MetricMini label="Desvio" value={formatCurrency(Number(summary.desvioTotal ?? 0))} tone={Number(summary.desvioTotal ?? 0) < 0 ? "success" : "danger"} />
        </div>
        <div className="space-y-3">
          {orders.map((order: any) => {
            const previsto = Number(order.CustoMateriaisPrevisto ?? 0) + Number(order.CustoTransformacaoPrevisto ?? 0);
            const real = Number(order.CustoMateriaisReal ?? 0) + Number(order.CustoTransformacaoReal ?? 0);
            return (
              <div key={order.Id ?? order.OrdemFabrico}>
                <div className="mb-1 flex justify-between gap-2 text-[11px]">
                  <span className="truncate font-semibold">{order.ArtigoDescricao ?? order.Artigo}</span>
                  <span className="shrink-0 text-muted-foreground">{formatCurrency(real)}</span>
                </div>
                <div className="h-2 rounded-full bg-muted">
                  <div className="h-2 rounded-full bg-primary" style={{ width: `${Math.min(100, (previsto / max) * 100)}%` }} />
                </div>
                <div className="mt-1 h-2 rounded-full bg-muted">
                  <div className="h-2 rounded-full bg-danger" style={{ width: `${Math.min(100, (real / max) * 100)}%` }} />
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  }

  if (wantsCashflow && data?.cashflow) {
    const summary = data.cashflow.summary ?? {};
    const incoming = Number(summary.totalIncoming ?? 0);
    const outgoing = Number(summary.totalOutgoing ?? 0);
    const max = Math.max(incoming, outgoing, 1);

    return (
      <div className="mt-4 rounded-lg border border-border bg-background p-3">
        <p className="mb-3 text-xs font-bold uppercase text-primary">Grafico automatico</p>
        <SimpleBar label="Entradas" value={incoming} max={max} tone="success" />
        <SimpleBar label="Saidas" value={outgoing} max={max} tone="danger" />
        <MetricMini label="Saldo projetado" value={formatCurrency(Number(summary.projectedBalance ?? 0))} tone={Number(summary.projectedBalance ?? 0) >= 0 ? "success" : "danger"} />
      </div>
    );
  }

  return null;
}

function MetricMini({ label, value, tone = "default" }: { label: string; value: string; tone?: "default" | "success" | "danger" }) {
  return (
    <div className="rounded-md border border-border bg-muted/20 p-2">
      <p className="text-[11px] text-muted-foreground">{label}</p>
      <p className={cn("mt-1 font-bold", tone === "success" && "text-success", tone === "danger" && "text-danger")}>{value}</p>
    </div>
  );
}

function SimpleBar({ label, value, max, tone }: { label: string; value: number; max: number; tone: "success" | "danger" }) {
  return (
    <div className="mb-3">
      <div className="mb-1 flex justify-between text-xs">
        <span>{label}</span>
        <span className={cn("font-semibold", tone === "success" ? "text-success" : "text-danger")}>{formatCurrency(value)}</span>
      </div>
      <div className="h-3 rounded-full bg-muted">
        <div className={cn("h-3 rounded-full", tone === "success" ? "bg-success" : "bg-danger")} style={{ width: `${Math.min(100, (value / max) * 100)}%` }} />
      </div>
    </div>
  );
}

export function ChatPanel({
  open,
  onClose,
  messages,
  setMessages,
  input,
  setInput,
  loading,
  setLoading,
}: {
  open: boolean;
  onClose: () => void;
  messages: Array<{ role: "user" | "assistant"; content: string }>;
  setMessages: React.Dispatch<React.SetStateAction<Array<{ role: "user" | "assistant"; content: string }>>>;
  input: string;
  setInput: (v: string) => void;
  loading: boolean;
  setLoading: (v: boolean) => void;
}) {
  const [error, setError] = useState<string | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  async function sendMessage() {
    const text = input.trim();
    if (!text || loading) return;

    const userMsg = { role: "user" as const, content: text };
    setMessages((prev) => [...prev, userMsg]);
    setInput("");
    setLoading(true);
    setError(null);

    try {
      const res = await fetch(apiUrl("/api/ai/chat"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: text,
          history: [...messages, userMsg].map((m) => ({ role: m.role, content: m.content })),
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || `Erro ${res.status}`);
      } else {
        setMessages((prev) => [...prev, { role: "assistant", content: data.reply }]);
      }
    } catch {
      setError("Erro de ligação ao servidor.");
    } finally {
      setLoading(false);
    }
  }

  if (!open) return null;

  return (
    <div className="fixed bottom-20 right-5 z-50 flex w-[380px] max-w-[calc(100vw-2rem)] flex-col rounded-xl border border-border bg-background shadow-2xl" style={{ height: "500px" }}>
      <div className="flex items-center justify-between border-b border-border px-4 py-3">
        <div className="flex items-center gap-2">
          <Sparkles className="size-4 text-primary" />
          <span className="text-sm font-semibold">Assistente IA</span>
        </div>
        <Button variant="ghost" size="icon" className="size-7" onClick={onClose} aria-label="Fechar chat">
          <XIcon className="size-4" />
        </Button>
      </div>
      <div ref={scrollRef} className="flex-1 overflow-y-auto px-4 py-3 text-sm">
        {messages.length === 0 && !error && (
          <div className="flex h-full items-center justify-center text-center text-muted-foreground">
            <div>
              <Sparkles className="mx-auto mb-2 size-8 text-primary/40" />
              <p className="font-semibold">Pergunte sobre os dados financeiros</p>
              <p className="mt-1 text-xs">Ex: "Quais são os clientes com mais dívida?"</p>
            </div>
          </div>
        )}
        {messages.map((msg, i) => (
          <div key={i} className={cn("mb-3 flex", msg.role === "user" ? "justify-end" : "justify-start")}>
            <div className={cn("max-w-[85%] rounded-lg px-3 py-2", msg.role === "user" ? "bg-primary text-primary-foreground" : "bg-muted")}>
              {msg.content}
            </div>
          </div>
        ))}
        {loading && (
          <div className="flex justify-start">
            <div className="rounded-lg bg-muted px-3 py-2 text-muted-foreground">A pensar...</div>
          </div>
        )}
        {error && (
          <div className="mb-3 rounded-lg border border-danger/30 bg-danger-soft px-3 py-2 text-xs text-danger">
            {error}
          </div>
        )}
      </div>
      <div className="border-t border-border p-3">
        <form
          onSubmit={(e) => { e.preventDefault(); sendMessage(); }}
          className="flex gap-2"
        >
          <Input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Escreva a sua pergunta..."
            className="h-9 text-sm"
            disabled={loading}
          />
          <Button type="submit" size="icon" className="h-9 w-9 shrink-0" disabled={loading || !input.trim()}>
            <Send className="size-4" />
          </Button>
        </form>
      </div>
    </div>
  );
}

function Activity({
  icon: Icon,
  title,
  body,
  warning,
}: {
  icon: typeof Send;
  title: string;
  body: string;
  warning?: boolean;
}) {
  return (
    <div className="flex gap-3">
      <div
        className={cn(
          "mt-1 grid size-6 shrink-0 place-items-center rounded-full",
          warning ? "bg-warning-soft text-warning" : "bg-success-soft text-success",
        )}
      >
        <Icon className="size-3.5" />
      </div>
      <div>
        <p className="font-semibold">{title}</p>
        <p className="mt-1 leading-5 text-muted-foreground">{body}</p>
      </div>
    </div>
  );
}

function ModulePage({
  route,
  routeKey,
  modules,
  customers,
  customersLoaded,
  receivables,
  onNotify,
}: {
  route: { title: string; eyebrow: string; description: string; links: NavItemType[] };
  routeKey: string;
  modules: PrimaveraModule[];
  customers: PrimaveraCustomer[];
  customersLoaded: boolean;
  receivables: ReceivableView[];
  onNotify: (message: string) => void;
}) {
  const routeCode = route.eyebrow.toUpperCase();
  const moduleFamilies: Record<string, string[]> = {
    BAS: ["BAS", "ART", "ARM", "FOR", "VDR"],
    CBL: ["CBL", "CBL-PC"],
    CCT: ["CCT", "TES"],
    CMP: ["CMP", "FOR"],
    CRM: ["CRM"],
    EAP: ["EAP"],
    EPK: ["EPK"],
    ERP: ["BAS", "VND", "CMP", "CCT", "TES", "INV", "GPR", "CBL"],
    GPR: ["GPR", "GPR-CMP"],
    INT: ["BAS", "VND", "CMP"],
    INV: ["INV", "STK", "ART", "ARM"],
    MOB: ["BAS", "VND", "INV"],
    PCM: ["BAS", "CRM"],
    PRJ: ["PRJ"],
    RHP: ["RHP"],
    STP: ["STP"],
    TES: ["TES", "CCT"],
    TTE: ["TTE"],
    VND: ["VND", "VND-LIN", "BAS", "VDR"],
    "VISÃO GERAL": ["VND", "CCT", "TES", "INV", "GPR", "CBL"],
    "ANÁLISE FINANCEIRA": ["CBL", "CCT", "TES", "VND", "CMP"],
    CLIENTES: ["BAS", "CCT", "VND"],
    RELATÓRIOS: ["CBL", "CCT", "TES", "VND", "CMP", "INV"],
    PLANEAMENTO: ["VND", "CMP", "GPR", "INV"],
    INTEGRAÇÃO: ["BAS", "VND", "CMP", "INV", "GPR", "CBL"],
  };
  const relevantCodes = moduleFamilies[routeCode] ?? [routeCode];
  const relevantModules = modules.filter((module) =>
    relevantCodes.some((code) => module.code === code || module.code.startsWith(`${code}-`)),
  );
  const visibleModules = relevantModules.length ? relevantModules : modules.slice(0, 6);
  const customerRoutes = new Set([
    "clientes",
    "top-clientes",
    "aging",
    "risco-credito",
    "historico",
    "concentracao",
    "comunicacoes",
  ]);
  const showCustomerWorkspace = customerRoutes.has(routeKey);
  const customerWorkspaceTitle: Record<string, string> = {
    clientes: "Carteira de clientes",
    "top-clientes": "Clientes por faturacao e divida",
    aging: "Aging de recebimentos por cliente",
    "risco-credito": "Risco de credito",
    historico: "Historico de documentos",
    concentracao: "Concentracao de risco",
    comunicacoes: "Comunicacoes de cobranca",
  };
  const topCustomers = [...customers].sort((a, b) => b.currentDebt - a.currentDebt).slice(0, 8);
  const totalDebt = customers.reduce((sum, customer) => sum + customer.currentDebt, 0);
  const agingBuckets = [
    { label: "0-30 dias", min: 0, max: 30 },
    { label: "31-60 dias", min: 31, max: 60 },
    { label: "61-90 dias", min: 61, max: 90 },
    { label: "+90 dias", min: 91, max: Number.POSITIVE_INFINITY },
  ].map((bucket) => {
    const rows = receivables.filter(({ row }) => {
      const days = Number(row[4]) || 0;
      return days >= bucket.min && days <= bucket.max;
    });
    return {
      label: bucket.label,
      count: rows.length,
      amount: rows.reduce((sum, { row }) => sum + parseCurrency(row[7]), 0),
    };
  });
  const recentReceivables = receivables.slice(0, 8);

  return (
    <section className="rounded-lg border border-border bg-background shadow-[0_1px_6px_rgba(15,23,42,0.06)]">
      <div className="border-b border-border p-6">
        <p className="text-xs font-semibold uppercase tracking-wide text-primary">
          {route.eyebrow}
        </p>
        <h2 className="mt-2 text-[24px] font-bold">{route.title}</h2>
        <p className="mt-2 max-w-3xl text-sm leading-6 text-muted-foreground">
          {route.description}
        </p>
      </div>
      <div className="grid gap-4 p-6 lg:grid-cols-3">
        {route.links.map((link) => {
          const linkRoute = link.href.replace(/^#/, "");
          const isActiveLink = linkRoute === routeKey;
          return (
          <a
            key={link.href}
            href={link.href}
            aria-current={isActiveLink ? "page" : undefined}
            className={cn(
              "rounded-lg border bg-background p-5 shadow-sm transition hover:border-primary/40 hover:bg-muted/25",
              isActiveLink ? "border-primary/60 bg-muted/20 ring-1 ring-primary/30" : "border-border",
            )}
          >
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="font-semibold">{link.title}</p>
                <p className="mt-2 text-sm leading-5 text-muted-foreground">
                  {link.description ?? "Abrir vista operacional deste módulo."}
                </p>
              </div>
              {link.icon && <link.icon className="size-5 text-primary" />}
            </div>
          </a>
          );
        })}
      </div>
      {showCustomerWorkspace && routeKey !== "top-clientes" && (
        <div className="border-t border-border p-6">
          <div className="mb-4 flex items-center justify-between">
            <div>
              <p className="text-xs text-muted-foreground">Dados reais</p>
              <h3 className="mt-1 font-semibold">{customerWorkspaceTitle[routeKey] ?? "Carteira de clientes"}</h3>
            </div>
            <span className="rounded-md bg-success-soft px-2 py-1 text-xs font-semibold text-success">
              PRIMAVERA SQL
            </span>
          </div>
          {routeKey === "aging" && (
            <div className="mb-4 grid gap-3 md:grid-cols-4">
              {agingBuckets.map((bucket) => (
                <button
                  key={bucket.label}
                  className="rounded-lg border border-border bg-muted/20 p-4 text-left transition hover:border-primary/40 hover:bg-muted/40"
                  onClick={() => onNotify(`${bucket.label}: ${bucket.count} documentos, ${formatCurrency(bucket.amount)}.`)}
                >
                  <p className="text-xs font-semibold text-primary">{bucket.label}</p>
                  <p className="mt-2 text-2xl font-bold">{formatCurrency(bucket.amount)}</p>
                  <p className="mt-1 text-xs text-muted-foreground">{bucket.count} documentos em aberto</p>
                </button>
              ))}
            </div>
          )}
          {routeKey === "concentracao" && (
            <div className="mb-4 grid gap-3 md:grid-cols-3">
              {topCustomers.slice(0, 3).map((customer) => {
                const share = totalDebt > 0 ? (customer.currentDebt / totalDebt) * 100 : 0;
                return (
                  <button
                    key={customer.code}
                    className="rounded-lg border border-border bg-muted/20 p-4 text-left transition hover:border-primary/40 hover:bg-muted/40"
                    onClick={() => onNotify(`${customer.name}: ${share.toFixed(1)}% da divida aberta.`)}
                  >
                    <p className="font-semibold">{customer.name}</p>
                    <p className="mt-2 text-2xl font-bold">{share.toFixed(1)}%</p>
                    <p className="mt-1 text-xs text-muted-foreground">{formatCurrency(customer.currentDebt, customer.currency ?? "EUR")}</p>
                  </button>
                );
              })}
            </div>
          )}
          {routeKey === "comunicacoes" && (
            <div className="mb-4 grid gap-3 md:grid-cols-3">
              <button
                className="rounded-lg border border-border bg-muted/20 p-4 text-left transition hover:border-primary/40 hover:bg-muted/40"
                onClick={() => onNotify("Fila de lembretes preparada a partir dos documentos vencidos.")}
              >
                <p className="font-semibold">Lembretes de pagamento</p>
                <p className="mt-2 text-2xl font-bold">{receivables.filter(({ row }) => row[8] === "Vencido").length}</p>
                <p className="mt-1 text-xs text-muted-foreground">Documentos vencidos com acao possivel</p>
              </button>
              <button
                className="rounded-lg border border-border bg-muted/20 p-4 text-left transition hover:border-primary/40 hover:bg-muted/40"
                onClick={() => onNotify("Historico de contactos filtrado por cliente/documento.")}
              >
                <p className="font-semibold">Contactos registados</p>
                <p className="mt-2 text-2xl font-bold">{receivables.filter(({ row }) => row[9] !== "-").length}</p>
                <p className="mt-1 text-xs text-muted-foreground">Documentos com ultimo contacto</p>
              </button>
              <button
                className="rounded-lg border border-primary/30 bg-primary p-4 text-left text-primary-foreground shadow-sm transition hover:bg-primary/90"
                onClick={() => onNotify("Integracao real de e-mail/SMS fica no backend de operacoes.")}
              >
                <p className="font-semibold">Nova comunicacao</p>
                <p className="mt-2 text-sm">Criar contacto para o cliente selecionado</p>
              </button>
            </div>
          )}
          {routeKey === "historico" && (
            <div className="mb-4 overflow-x-auto rounded-lg border border-border">
              <table className="w-full min-w-[760px] text-sm">
                <thead>
                  <tr className="border-b border-border bg-muted/30 text-left text-xs text-muted-foreground">
                    <th className="px-4 py-3">Documento</th>
                    <th className="px-4 py-3">Cliente</th>
                    <th className="px-4 py-3">Vencimento</th>
                    <th className="px-4 py-3 text-right">Em aberto</th>
                    <th className="px-4 py-3">Estado</th>
                  </tr>
                </thead>
                <tbody>
                  {recentReceivables.map(({ row }) => (
                    <tr
                      className="border-b border-border transition hover:bg-muted/30"
                      key={`${row[2]}-${row[0]}`}
                      onClick={() => onNotify(`${row[2]} de ${row[0]}: ${row[7]} em aberto.`)}
                    >
                      <td className="px-4 py-3 font-semibold">{row[2]}</td>
                      <td className="px-4 py-3">{row[0]}</td>
                      <td className="px-4 py-3">{row[3]}</td>
                      <td className="px-4 py-3 text-right font-semibold">{row[7]}</td>
                      <td className="px-4 py-3"><StatusBadge status={row[8] ?? ""} /></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
          <div className="overflow-x-auto rounded-lg border border-border">
            <table className="w-full min-w-[840px] text-sm">
              <thead>
                <tr className="border-b border-border bg-muted/30 text-left text-xs text-muted-foreground">
                  <th className="px-4 py-3">Cliente</th>
                  <th className="px-4 py-3">NIF</th>
                  <th className="px-4 py-3 text-right">Faturacao</th>
                  <th className="px-4 py-3 text-right">Divida</th>
                  <th className="px-4 py-3 text-right">Docs</th>
                  <th className="px-4 py-3">{routeKey === "risco-credito" ? "Risco" : "Condicao"}</th>
                </tr>
              </thead>
              <tbody>
                {topCustomers.map((customer) => {
                  const creditUse = customer.creditLimit > 0 ? (customer.currentDebt / customer.creditLimit) * 100 : null;
                  const riskLabel = creditUse === null
                    ? (customer.currentDebt > 0 ? "Sem limite definido" : "Sem divida")
                    : `${creditUse.toFixed(0)}% do limite`;
                  return (
                    <tr
                      className="border-b border-border transition hover:bg-muted/30"
                      key={customer.code}
                      onClick={() => onNotify(`Cliente ${customer.name}: ${customer.documentCount} documentos.`)}
                    >
                      <td className="px-4 py-3">
                        <p className="font-semibold">{customer.name}</p>
                        <p className="text-xs text-muted-foreground">{customer.code}</p>
                      </td>
                      <td className="px-4 py-3">{customer.nif ?? "-"}</td>
                      <td className="px-4 py-3 text-right font-semibold">
                        {formatCurrency(customer.salesAmount, customer.currency ?? "EUR")}
                      </td>
                      <td className={cn("px-4 py-3 text-right", customer.currentDebt > 0 && "font-semibold text-danger")}>
                        {formatCurrency(customer.currentDebt, customer.currency ?? "EUR")}
                      </td>
                      <td className="px-4 py-3 text-right">{customer.documentCount}</td>
                      <td className="px-4 py-3">
                        {routeKey === "risco-credito" ? riskLabel : customer.paymentCondition || "-"}
                      </td>
                    </tr>
                  );
                })}
                {!customersLoaded && (
                  <tr>
                    <td className="px-4 py-6 text-muted-foreground" colSpan={6}>
                      A carregar clientes do PRIMAVERA...
                    </td>
                  </tr>
                )}
                {customersLoaded && !topCustomers.length && (
                  <tr>
                    <td className="px-4 py-6 text-muted-foreground" colSpan={6}>
                      Sem clientes devolvidos pelo endpoint /api/customers.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
      {routeKey === "top-clientes" && (
        <div className="border-t border-border p-6">
          <div className="mb-4 flex items-center justify-between">
            <div>
              <p className="text-xs text-muted-foreground">Dados reais</p>
              <h3 className="mt-1 font-semibold">Clientes por faturação e dívida</h3>
            </div>
            <span className="rounded-md bg-success-soft px-2 py-1 text-xs font-semibold text-success">
              PRIMAVERA SQL
            </span>
          </div>
          <div className="overflow-x-auto rounded-lg border border-border">
            <table className="w-full min-w-[840px] text-sm">
              <thead>
                <tr className="border-b border-border bg-muted/30 text-left text-xs text-muted-foreground">
                  <th className="px-4 py-3">Cliente</th>
                  <th className="px-4 py-3">NIF</th>
                  <th className="px-4 py-3 text-right">Faturação</th>
                  <th className="px-4 py-3 text-right">Dívida</th>
                  <th className="px-4 py-3 text-right">Docs</th>
                  <th className="px-4 py-3">Condição</th>
                </tr>
              </thead>
              <tbody>
                {customers.map((customer) => (
                  <tr
                    className="border-b border-border transition hover:bg-muted/30"
                    key={customer.code}
                    onClick={() => onNotify(`Cliente ${customer.name}: ${customer.documentCount} documentos.`)}
                  >
                    <td className="px-4 py-3">
                      <p className="font-semibold">{customer.name}</p>
                      <p className="text-xs text-muted-foreground">{customer.code}</p>
                    </td>
                    <td className="px-4 py-3">{customer.nif ?? "-"}</td>
                    <td className="px-4 py-3 text-right font-semibold">
                      {formatCurrency(customer.salesAmount, customer.currency ?? "EUR")}
                    </td>
                    <td className="px-4 py-3 text-right">
                      {formatCurrency(customer.currentDebt, customer.currency ?? "EUR")}
                    </td>
                    <td className="px-4 py-3 text-right">{customer.documentCount}</td>
                    <td className="px-4 py-3">{customer.paymentCondition || "-"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
      {!showCustomerWorkspace && (
      <div className="border-t border-border p-6">
        <div className="mb-4 flex items-center justify-between">
          <div>
            <p className="text-xs text-muted-foreground">Origem dos dados</p>
            <p className="mt-1 font-semibold">PRIMAVERA SQL / PRIDEMO</p>
          </div>
          <Button
            variant="outline"
            onClick={() => onNotify(`Vista "${route.title}" atualizada com dados locais do PRIMAVERA.`)}
          >
            <Sparkles /> Atualizar vista
          </Button>
        </div>
        <div className="grid gap-4 lg:grid-cols-4">
          {visibleModules.map((module) => (
            <button
              key={`${module.code}-${module.tableName}`}
              className="rounded-lg border border-border bg-muted/20 p-4 text-left transition hover:border-primary/40 hover:bg-muted/40"
              onClick={() => onNotify(`${module.name}: ${module.records.toLocaleString("pt-PT")} registos em ${module.tableName}.`)}
            >
              <p className="text-xs font-semibold text-primary">{module.code}</p>
              <p className="mt-2 font-semibold">{moduleDisplayName(module)}</p>
              <p className="mt-2 text-2xl font-bold">{module.records.toLocaleString("pt-PT")}</p>
              <p className="mt-1 text-xs text-muted-foreground">{module.tableName}</p>
            </button>
          ))}
        </div>
      </div>
      )}
    </section>
  );
}
