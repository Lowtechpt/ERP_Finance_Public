import {
  AlertTriangle,
  Banknote,
  BarChart3,
  Bell,
  BookOpenText,
  Building2,
  CalendarDays,
  ChartNoAxesCombined,
  ClipboardList,
  Clock,
  CreditCard,
  Download,
  Factory,
  FileSpreadsheet,
  Gauge,
  LineChart,
  Receipt,
  Send,
  ShieldCheck,
  Sparkles,
  TrendingDown,
  Users,
  WalletCards,
} from "lucide-react";
import { type NavItemType } from "@/components/ui/navigation-menu";

export const executiveLinks: NavItemType[] = [
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

export const financeLinks: NavItemType[] = [
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

export const treasuryLinks: NavItemType[] = [
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

export const clientLinks: NavItemType[] = [
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

export const reportLinks: NavItemType[] = [
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

export const primaveraFinanceLinks: NavItemType[] = [
  { title: "Contabilidade", href: "#cbl", description: "Plano de contas, movimentos e mapas contabilísticos.", icon: FileSpreadsheet },
  { title: "Contas Correntes", href: "#cct", description: "Pendentes, liquidações, clientes e fornecedores.", icon: Receipt },
  { title: "Tesouraria", href: "#tes", description: "Bancos, caixa, recebimentos e pagamentos.", icon: WalletCards },
  { title: "Vendas", href: "#vnd", description: "Documentos de venda, clientes, vendedores e margens.", icon: BarChart3 },
  { title: "Compras", href: "#cmp", description: "Compras, fornecedores e compromissos.", icon: CreditCard },
  { title: "Custos por Departamento", href: "#custos-departamentos", description: "Análise de alocação de custos e rentabilidade por centro.", icon: BarChart3 },
  { title: "Relatórios", href: "#relatorios", description: "Exportações, DRE, aging e gestão.", icon: ClipboardList },
];

export const primaveraOpsLinks: NavItemType[] = [
  { title: "Inventário", href: "#inv", description: "Stock, movimentos, artigos e armazéns.", icon: Factory },
  { title: "Produção", href: "#gpr", description: "Ordens de fabrico, componentes e custos reais.", icon: Factory },
  { title: "CRM", href: "#crm", description: "Contactos, oportunidades e comunicações.", icon: Users },
  { title: "Projetos", href: "#prj", description: "Projetos, serviços e centros de custo.", icon: ClipboardList },
  { title: "Recursos Humanos", href: "#rhp", description: "Funcionários e custos de pessoal.", icon: Users },
  { title: "Serviços Técnicos", href: "#stp", description: "Serviços, equipamentos e contratos.", icon: Gauge },
];

export const primaveraSystemLinks: NavItemType[] = [
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

// Ordered the way a finance lead works through the day: money in and out
// first, then operations, then analysis, with reports and system config last.
// Treasury, client and report links used to be absent from the navigation
// entirely, which left 17 routes — including the default landing page — with
// no way to reach them.
export const navSections = [
  { id: "financeiro", name: "Financeiro", list: primaveraFinanceLinks },
  { id: "tesouraria", name: "Tesouraria", list: treasuryLinks },
  { id: "clientes", name: "Clientes", list: clientLinks },
  { id: "operacoes", name: "Operações", list: primaveraOpsLinks },
  { id: "analise", name: "Análise", list: [...executiveLinks, ...financeLinks] },
  { id: "relatorios", name: "Relatórios", list: reportLinks },
  { id: "sistema", name: "Sistema", list: primaveraSystemLinks },
];

export const summaryCards = [
  { label: "Total em aberto", value: "128.900,00 €", tone: "default" },
  { label: "Vencido", value: "38.400,00 €", tone: "danger" },
  { label: "A vencer (7 dias)", value: "18.250,00 €", tone: "default" },
  { label: "A vencer (30 dias)", value: "51.300,00 €", tone: "default" },
  { label: "Recebido (mês)", value: "96.120,00 €", tone: "success" },
];
