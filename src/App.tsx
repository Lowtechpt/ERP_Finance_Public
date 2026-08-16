import {
  lazy,
  Suspense,
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";
import {
  AlertTriangle,
  CalendarDays,
  ChevronDown,
  Clock,
  FileSpreadsheet,
  Filter,
  MoreHorizontal,
  PanelRight,
  Plus,
  Receipt,
  Search,
  Send,
  Sparkles,
  XIcon,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { apiUrl, isStatic } from "@/lib/api";
import { formatCurrency, formatDate, parseCurrency } from "@/lib/format";
import { toReceivableView, type ReceivableRow, type ReceivableView } from "@/lib/receivables";
import { StatusBadge, Activity } from "@/components/metrics";
import { PageWrapper, SectionHeader, PageLoadingState } from "@/components";
import { AppSidebar, MobileNav } from "@/components/AppSidebar";
import { summaryCards } from "@/config/navigation";
import { moduleViews } from "@/config/moduleViews";
import { getCurrentRoute } from "@/lib/routing";
import { ModulePage } from "@/pages/ModulePage";
import type {
  ForecastColumn,
  PrimaveraCustomersResponse,
  PrimaveraModulesResponse,
  PrimaveraReceivablesResponse,
} from "@/types/primavera";
const BanksPage = lazy(() => import("@/pages/BanksPage"));
const CashFlowPage = lazy(() => import("@/pages/CashFlowPage"));
const DashboardPage = lazy(() => import("@/pages/DashboardPage"));
const PayablesPage = lazy(() => import("@/pages/PayablesPage"));
const DREPage = lazy(() => import("@/pages/DREPage"));
const LiquidityPage = lazy(() => import("@/pages/LiquidityPage"));
const ProductionPage = lazy(() => import("@/pages/ProductionPage"));
const ProfitabilityPage = lazy(() => import("@/pages/ProfitabilityPage"));
const BreakEvenPage = lazy(() => import("@/pages/BreakEvenPage"));
const ComparePeriodsPage = lazy(() => import("@/pages/ComparePeriodsPage"));
const BudgetVsActualPage = lazy(() => import("@/pages/BudgetVsActualPage"));
const CollectionsCommsPage = lazy(() => import("@/pages/CollectionsCommsPage"));
const ExecutiveSummaryPage = lazy(() => import("@/pages/ExecutiveSummaryPage"));
const RootCauseAnalysisPage = lazy(() => import("@/pages/RootCauseAnalysisPage"));
const CreditRiskPage = lazy(() => import("@/pages/CreditRiskPage"));
const AlertsPage = lazy(() => import("@/pages/AlertsPage"));
const AlertThresholdsPage = lazy(() => import("@/pages/AlertThresholdsPage"));
const HRPage = lazy(() => import("@/pages/HRPage"));
const CostAllocationPage = lazy(() => import("@/pages/CostAllocationPage"));
const AiWorkspace = lazy(() =>
  import("@/components/ai/AiWorkspace").then((m) => ({ default: m.AiWorkspace })),
);
const GeminiChatPanel = lazy(() =>
  import("@/components/ai/GeminiChatPanel").then((m) => ({ default: m.GeminiChatPanel })),
);

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

const forecast: ForecastColumn[] = [
  { title: "Hoje", date: "6 Mai", value: "6.120,00 €", count: "2 documentos", names: ["Galp Energia", "Iberdrola Clientes..."] },
  { title: "Amanhã", date: "7 Mai", value: "8.420,00 €", count: "1 documento", names: ["Sonae MC"] },
  { title: "Quinta", date: "8 Mai", value: "0,00 €", count: "0 documentos", names: ["-"] },
  { title: "Próxima semana", date: "12 - 16 Mai", value: "12.849,32 €", count: "2 documentos", names: ["Worten", "Sporting CP"] },
  { title: "Semana seguinte", date: "19 - 23 Mai", value: "7.950,00 €", count: "2 documentos", names: ["Pharol SGPS", "Brisa"] },
  { title: "+ 30 dias", date: "", value: "51.300,00 €", count: "8 documentos", names: ["Leroy Merlin", "Outros (7)"] },
];

export function App() {
  const [primaveraData, setPrimaveraData] = useState<PrimaveraReceivablesResponse | null>(null);
  const [moduleData, setModuleData] = useState<PrimaveraModulesResponse | null>(null);
  const [customerData, setCustomerData] = useState<PrimaveraCustomersResponse | null>(null);
  const [_primaveraError, setPrimaveraError] = useState<string | null>(null);
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

  const notify = useCallback((message: string) => {
    setToast(message);
    window.setTimeout(() => setToast(null), 2800);
  }, []);

  const handleOpenAi = useCallback(() => {
    setChatOpen(false);
    window.location.hash = "ia";
  }, []);

  const handleCloseChat = useCallback(() => {
    setChatOpen(false);
  }, []);

  const handleSelectFilter = useCallback((label: string) => {
    setActiveFilter(label);
    setSelectedIndex(0);
  }, []);

  const handleClearFilters = useCallback(() => {
    setSearchTerm("");
    setActiveFilter("Todos");
  }, []);

  return (
    <div className="flex min-h-screen bg-page text-foreground">
      <AppSidebar route={currentRoute} />

      <div className="flex min-w-0 flex-1 flex-col">
      <header className="sticky top-0 z-40 border-b border-border bg-background/95 backdrop-blur-xl">
        <div className="flex h-14 items-center gap-3 px-3 lg:px-5">
          <MobileNav route={currentRoute} />
          <div className="relative min-w-0 flex-1 md:max-w-xl">
              <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                className="h-9 rounded-md border-border bg-page pl-9 pr-14 text-[13px]"
                placeholder="Pesquisar cliente, fatura, NIF, referência, montante..."
                value={searchTerm}
                onChange={(event) => setSearchTerm(event.target.value)}
              />
              <kbd className="absolute right-2.5 top-1/2 hidden -translate-y-1/2 rounded border bg-muted px-1.5 py-0.5 text-[11px] text-muted-foreground sm:block">
                ⌘ K
              </kbd>
          </div>
          <div className="ml-auto flex items-center gap-2.5">
            <Button
              variant="outline"
              size="sm"
              className="h-8 gap-1.5 border-primary/30 text-primary hover:bg-primary/5"
              onClick={handleOpenAi}
            >
              <Sparkles className="size-3.5" />
              <span className="text-xs font-semibold">IA</span>
            </Button>
            <div className="hidden items-center gap-2 md:flex">
              <div className="grid size-8 place-items-center rounded-full bg-muted text-[11px] font-bold text-secondary-foreground">
                RM
              </div>
              <div className="hidden xl:block">
                <p className="text-[13px] font-medium leading-none">Rui Martins</p>
                <p className="mt-0.5 text-[11px] text-muted-foreground">Nortefin, Lda.</p>
              </div>
              <ChevronDown className="size-4 text-muted-foreground" />
            </div>
          </div>
        </div>
      </header>

      <main className="grid flex-1 grid-cols-1">
       <Suspense fallback={<PageLoadingState message="A carregar página..." />}>
        <section className="min-w-0">
          <div>
            {/* Only the receivables route gets a shell header: every other page
                renders its own SectionHeader, and showing both duplicated the
                title on every screen. */}
            {isReceivablesRoute && (
            <div className="grid items-center gap-3 px-5 pt-5 lg:grid-cols-[280px_1fr]">
              <div className="flex flex-col justify-center">
                <h1 className="text-lg font-semibold tracking-tight">Bom dia, Rui.</h1>
                <p className="mt-0.5 text-sm text-muted-foreground">Terça-feira, 6 de Maio de 2026</p>
              </div>
              <div className="flex flex-wrap items-center gap-x-7 gap-y-2">
                {summaryCards.map((card) => (
                  <div key={card.label} className="flex flex-col">
                    <p className="text-[11px] font-medium text-muted-foreground">{card.label}</p>
                    <p
                      className={cn(
                        "mt-0.5 text-sm font-semibold tabular-nums",
                        card.tone === "danger" && "text-danger",
                        card.tone === "success" && "text-success",
                      )}
                    >
                      {card.value}
                    </p>
                  </div>
                ))}
              </div>
            </div>
            )}

            {isReceivablesRoute ? (
            <PageWrapper>
              <SectionHeader
                title="Contas a receber"
                description={`${receivables.length} documentos · ${usingPrimavera ? "PRIMAVERA SQL" : "Dados demo"}`}
              />

              <section className="mt-6 rounded-lg border border-slate-200 bg-white shadow-sm dark:border-slate-700 dark:bg-slate-900">
                <div className="border-b border-slate-200 p-5 dark:border-slate-700">
                  <div className="flex flex-wrap items-center gap-2">
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
                        onClick={() => handleSelectFilter(label)}
                        className={cn(
                          "h-8 gap-2 rounded-md px-3 text-[13px]",
                          activeFilter === label && "border-primary/40 text-primary",
                        )}
                      >
                        {label}
                        <span className="rounded-sm bg-slate-100 px-1.5 py-0.5 text-[11px] text-slate-600 dark:bg-slate-700 dark:text-slate-300">
                          {count}
                        </span>
                      </Button>
                    ))}
                    <div className="ml-auto flex items-center gap-2 border-l border-slate-200 pl-3 dark:border-slate-700">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setShowAdvancedFilters((value) => !value)}
                      >
                        <Filter className="size-4" /> Filtros
                      </Button>
                      <Button
                        variant="outline"
                        size="icon"
                        aria-label="Ver colunas"
                        onClick={() => notify("Preferências de colunas serão guardadas por utilizador.")}
                      >
                        <PanelRight className="size-4" />
                      </Button>
                      <Button
                        variant="outline"
                        size="icon"
                        aria-label="Mais opções"
                        onClick={() => notify("Exportação e ações em massa ficam neste menu.")}
                      >
                        <MoreHorizontal className="size-4" />
                      </Button>
                    </div>
                  </div>
                  {showAdvancedFilters && (
                    <div className="mt-4 grid gap-3 rounded-md border border-slate-200 bg-slate-50 p-3 text-[12px] text-slate-600 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300 md:grid-cols-4">
                      <span>Origem: {usingPrimavera ? "PRIMAVERA SQL / PRIDEMO" : "Dados demo"}</span>
                      <span>Filtro ativo: {activeFilter}</span>
                      <span>Pesquisa: {searchTerm || "sem termo"}</span>
                      <button
                        className="text-left font-semibold text-primary"
                        onClick={handleClearFilters}
                      >
                        Limpar filtros
                      </button>
                    </div>
                  )}
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full min-w-[1030px] border-collapse text-[12px]">
                    <thead>
                      <tr className="border-b border-slate-200 bg-slate-50 text-left text-[12px] font-semibold text-slate-700 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300">
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
                            "cursor-pointer border-b border-slate-200 transition hover:bg-slate-50 dark:border-slate-700 dark:hover:bg-slate-800",
                            detailOpen && index === selectedIndex && "bg-slate-50 dark:bg-slate-800",
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
                          <td className="px-1 py-2 text-center text-[16px] text-slate-400 dark:text-slate-500">☆</td>
                          <td className="px-3 py-2">
                            <p className="font-semibold text-slate-900 dark:text-slate-50">{row[0]}</p>
                            <p className="text-xs text-slate-600 dark:text-slate-400">{row[1]}</p>
                          </td>
                          <td className="px-3 py-2 text-slate-900 dark:text-slate-50">{row[2]}</td>
                          <td className="px-3 py-2 text-slate-900 dark:text-slate-50">{row[3]}</td>
                          <td className={cn("px-3 py-2 font-semibold", Number(row[4]) > 20 ? "text-danger" : "text-success")}>
                            {row[4]}
                          </td>
                          <td className="px-3 py-2 text-right font-medium text-slate-900 dark:text-slate-50">{row[5]}</td>
                          <td className="px-3 py-2 text-right text-slate-600 dark:text-slate-400">{row[6]}</td>
                          <td className="px-3 py-2 text-right font-medium text-slate-900 dark:text-slate-50">{row[7]}</td>
                          <td className="px-3 py-2">
                            <StatusBadge status={row[8] ?? ""} />
                          </td>
                          <td className="px-3 py-2 text-slate-600 dark:text-slate-400">{row[9]}</td>
                          <td className="px-3 py-2">
                            <MoreHorizontal className="size-4 text-slate-400 dark:text-slate-500" />
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                <div className="flex items-center justify-between border-t border-slate-200 px-5 py-3 text-[13px] text-slate-600 dark:border-slate-700 dark:text-slate-400">
                  <span>1-{receivables.length} de {baseReceivables.length} documentos</span>
                  <span className="font-semibold text-slate-900 dark:text-slate-50">Totais&nbsp;&nbsp;&nbsp; 44.890,97 € &nbsp;&nbsp; 1.000,00 € &nbsp;&nbsp; 43.890,97 €</span>
                </div>
              </section>
            </PageWrapper>
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
            <div className="mt-6 grid gap-0 overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm dark:border-slate-700 dark:bg-slate-900 2xl:grid-cols-[1fr_420px]">
              <section className="p-5">
                <div className="mb-4 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <h2 className="font-bold text-slate-900 dark:text-slate-50">Fluxo de recebimentos esperado</h2>
                    <Button variant="outline" size="icon" className="size-7">
                      <ChevronDown className="size-4 rotate-90" />
                    </Button>
                    <Button variant="outline" size="icon" className="size-7">
                      <ChevronDown className="size-4 -rotate-90" />
                    </Button>
                  </div>
                  <Button variant="outline" size="sm">
                    <CalendarDays className="size-4" /> Ver calendário
                  </Button>
                </div>
                <div className="grid gap-0 md:grid-cols-3 xl:grid-cols-6">
                  {forecast.map((column) => (
                    <div className="min-h-[248px] border-r border-slate-200 px-4 last:border-r-0 dark:border-slate-700" key={column.title}>
                      <p className="text-sm font-semibold text-slate-900 dark:text-slate-50">{column.title}</p>
                      <p className="mt-1 text-xs text-slate-600 dark:text-slate-400">{column.date}</p>
                      <p className="mt-4 font-bold text-slate-900 dark:text-slate-50">{column.value}</p>
                      <p className="text-xs text-slate-600 dark:text-slate-400">{column.count}</p>
                      <div className="mt-4 space-y-2">
                        {column.names.map((name) => (
                          <div className="rounded-md border border-slate-200 bg-slate-50 p-3 text-xs text-slate-700 shadow-sm dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300" key={name}>
                            {name}
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </section>

              <section className="border-l border-slate-200 p-5 dark:border-slate-700">
                <div className="mb-4 flex items-center justify-between">
                  <h2 className="font-bold text-slate-900 dark:text-slate-50">Atividades e tarefas</h2>
                  <Button variant="outline" size="sm">
                    <Plus className="size-4" /> Nova tarefa
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
        <aside className="fixed right-0 top-[68px] z-30 h-[calc(100vh-68px)] w-full max-w-[430px] overflow-y-auto border-l border-slate-200 bg-white px-7 py-7 shadow-2xl dark:border-slate-700 dark:bg-slate-900">
          <div className="mb-6 flex items-start justify-between">
            <div>
              <h2 className="text-[22px] font-bold text-slate-900 dark:text-slate-50">{selectedRow[2]}</h2>
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
          <div className="mb-6 flex gap-4 border-b border-slate-200 text-[12px] font-semibold dark:border-slate-700">
            {["Resumo", "Linha a linha", "Histórico", "Comunicações"].map((tab) => (
              <button
                className={cn(
                  "whitespace-nowrap border-b-2 px-1 pb-4 transition",
                  activeTab === tab
                    ? "border-primary text-primary"
                    : "border-transparent text-slate-600 dark:text-slate-400",
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
              <p className="text-xs text-slate-600 dark:text-slate-400">Cliente</p>
              <p className="mt-2 font-bold text-slate-900 dark:text-slate-50">
                {selectedDocument?.clientName ?? selectedRow[0]}
              </p>
              <p className="mt-1 text-sm text-slate-700 dark:text-slate-300">{selectedDocument?.nif ?? selectedRow[1]}</p>
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
                isStatic ? (
                  <p className="text-xs text-slate-600 dark:text-slate-400">
                    Detalhe por linha não disponível na demo estática (só em <code>npm run dev</code>).
                  </p>
                ) : (
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
                )
              ) : (
                <div className="overflow-x-auto rounded-lg border border-slate-200 text-xs dark:border-slate-700">
                  <table className="w-full">
                    <thead><tr className="border-b border-slate-200 bg-slate-50 text-left text-slate-700 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300">
                      <th className="px-3 py-2">#</th><th className="px-3 py-2">Artigo</th>
                      <th className="px-3 py-2">Descrição</th><th className="px-3 py-2 text-right">Qtd</th>
                      <th className="px-3 py-2 text-right">Preço</th><th className="px-3 py-2 text-right">Total</th>
                      <th className="px-3 py-2 text-right">IVA%</th>
                    </tr></thead>
                    <tbody>
                      {docLines.map((l) => (
                        <tr key={l.NumLinha} className="border-b border-slate-200 hover:bg-slate-50 dark:border-slate-700 dark:hover:bg-slate-800">
                          <td className="px-3 py-2 text-slate-600 dark:text-slate-400">{l.NumLinha}</td>
                          <td className="px-3 py-2 font-medium text-slate-900 dark:text-slate-50">{l.artigo}</td>
                          <td className="px-3 py-2 text-slate-700 dark:text-slate-300">{l.descricao}</td>
                          <td className="px-3 py-2 text-right text-slate-900 dark:text-slate-50">{l.quantidade}</td>
                          <td className="px-3 py-2 text-right text-slate-900 dark:text-slate-50">{l.precUnit}</td>
                          <td className="px-3 py-2 text-right font-semibold text-slate-900 dark:text-slate-50">{l.totalLiquido}</td>
                          <td className="px-3 py-2 text-right text-slate-900 dark:text-slate-50">{l.taxaIva}%</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}
          {activeTab !== "Resumo" && activeTab !== "Linha a linha" && (
            <div className="mb-5 rounded-lg border border-slate-200 bg-slate-50 p-4 text-sm dark:border-slate-700 dark:bg-slate-800">
              <p className="font-semibold text-slate-900 dark:text-slate-50">{activeTab}</p>
              <p className="mt-2 leading-5 text-slate-600 dark:text-slate-400">Histórico de cobrança e comunicações vindas do PRIMAVERA/CRM.</p>
            </div>
          )}
          <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-700 dark:bg-slate-900">
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
              <div className="flex items-center justify-between gap-4 border-b border-slate-200 py-3 text-[13px] last:border-b-0 dark:border-slate-700" key={label}>
                <span className="text-slate-600 dark:text-slate-400">{label}</span>
                <span className={cn("text-right font-semibold", label === "Em aberto" || label === "Dias vencido" ? "text-danger" : "text-slate-900 dark:text-slate-50")}>
                  {value}
                </span>
              </div>
            ))}
          </div>
          <div className="mt-7">
            <h3 className="mb-3 font-bold text-slate-900 dark:text-slate-50">Ações</h3>
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
                <Send className="size-4" /> Enviar lembrete de pagamento
              </Button>
              <Button
                variant="outline"
                className="w-full"
                onClick={() => {
                  setShowPaymentForm((v) => !v);
                  setPaymentAmount((selectedDocument?.openAmount ?? 0).toString());
                }}
              >
                <Receipt className="size-4" /> Registar pagamento
              </Button>
              <Button
                variant="outline"
                className="w-full"
                onClick={() => {
                  if (isStatic) {
                    notify("Abrir no ERP só está disponível a correr localmente em modo sqlserver.");
                    return;
                  }
                  fetch(apiUrl("/api/open-erp"))
                    .then((r) => r.json())
                    .then((d: { launched?: boolean; error?: string }) => {
                      notify(d.launched
                        ? `PRIMAVERA ERP a abrir — navegue para ${selectedRow[2]}.`
                        : d.error ?? "Não foi possível abrir o PRIMAVERA.");
                    })
                    .catch(() => notify("Não foi possível abrir o PRIMAVERA."));
                }}
              >
                <FileSpreadsheet className="size-4" /> Ver no ERP
              </Button>
              <Button
                variant="outline"
                className="w-full"
                onClick={() => notify("Menu de ações adicionais.")}
              >
                <MoreHorizontal className="size-4" /> Mais ações
              </Button>
            </div>
          </div>
          {showPaymentForm && (
            <div className="mt-5 rounded-lg border border-slate-200 bg-slate-50 p-4 text-sm dark:border-slate-700 dark:bg-slate-800">
              <p className="mb-3 font-bold text-slate-900 dark:text-slate-50">Registar pagamento</p>
              <div className="space-y-3">
                <div>
                  <label className="text-xs text-slate-600 dark:text-slate-400">Valor pago (€)</label>
                  <Input type="number" step="0.01" value={paymentAmount} onChange={(e) => setPaymentAmount(e.target.value)} className="mt-1 h-8 text-sm" />
                </div>
                <div>
                  <label className="text-xs text-slate-600 dark:text-slate-400">Data</label>
                  <Input type="date" value={paymentDate} onChange={(e) => setPaymentDate(e.target.value)} className="mt-1 h-8 text-sm" />
                </div>
                <div>
                  <label className="text-xs text-slate-600 dark:text-slate-400">Modo</label>
                  <select value={paymentMethod} onChange={(e) => setPaymentMethod(e.target.value)} className="mt-1 h-8 w-full rounded-md border border-slate-200 bg-white px-2 text-sm dark:border-slate-700 dark:bg-slate-900">
                    {["Transferência", "Cheque", "Numerário", "Débito direto"].map((m) => <option key={m}>{m}</option>)}
                  </select>
                </div>
                <div className="flex gap-2">
                  <Button size="sm" className="flex-1"
                    onClick={() => {
                      if (isStatic) {
                        notify(`Pagamento de ${paymentAmount}€ registado para ${selectedRow[2]}. (demo estática — não persistido)`);
                        setShowPaymentForm(false);
                        return;
                      }
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
       </Suspense>
      </main>
      </div>
      {toast && (
        <div className="fixed bottom-5 left-1/2 z-50 -translate-x-1/2 rounded-md border border-border bg-background px-4 py-3 text-sm font-medium shadow-xl">
          {toast}
        </div>
      )}
      <Suspense fallback={null}>
        <GeminiChatPanel
          open={chatOpen}
          onClose={handleCloseChat}
          messages={chatMessages}
          setMessages={setChatMessages}
          input={chatInput}
          setInput={setChatInput}
          loading={chatLoading}
          setLoading={setChatLoading}
        />
      </Suspense>
    </div>
  );
}

