import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";
import { apiUrl } from "@/lib/api";
import { formatCurrency, formatPercent } from "@/lib/format";
import { PageWrapper, SectionHeader, PageLoadingState, KPIGrid, DataTable } from "@/components";
import type { ColumnDef } from "@/components";

type KPIs = {
  vendas: number; cmv: number; margem: number; margemPct: number;
  ebitda: number; ebitdaPct: number;
  recebiveis: number; aPagar: number; stock: number;
  saldoBancario: number; capitalCirculante: number; dso: number;
};
type TopClient = { name: string; code: string; salesAmount: number; currentDebt: number };
type SalesTrend = { month: string; total: number; docs: number };
type PayableAlert = { doc: string; supplier: string; dueDate: string; daysOverdue: number; total: number };

export default function DashboardPage() {
  const [kpis, setKpis] = useState<KPIs | null>(null);
  const [topClients, setTopClients] = useState<TopClient[]>([]);
  const [salesTrend, setSalesTrend] = useState<SalesTrend[]>([]);
  const [payablesAlert, setPayablesAlert] = useState<PayableAlert[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let ignore = false;
    Promise.all([
      fetch(apiUrl("/api/financial-kpis")).then((r) => r.json()),
      fetch(apiUrl("/api/dashboard")).then((r) => r.json()),
    ]).then(([kpiData, dashData]) => {
      if (ignore) return;
      setKpis(kpiData);
      setTopClients(dashData.topClients ?? []);
      setSalesTrend(dashData.salesTrend ?? []);
      setPayablesAlert(dashData.payablesAlert ?? []);
    }).catch(() => {}).finally(() => { if (!ignore) setLoading(false); });
    return () => { ignore = true; };
  }, []);

  if (loading) return <PageLoadingState message="A carregar dashboard..." />;

  const trendMax = Math.max(...salesTrend.map((r) => r.total), 1);
  const months = ["Jan","Fev","Mar","Abr","Mai","Jun","Jul","Ago","Set","Out","Nov","Dez"];
  const ebitdaNeg = (kpis?.ebitda ?? 0) < 0;

  const ebitdaTone: "success" | "danger" = ebitdaNeg ? "danger" : "success";
  const headerKpis = [
    { label: "Vendas YTD", value: formatCurrency(kpis?.vendas ?? 0), tone: "default" as const },
    { label: "Margem bruta", value: formatPercent(kpis?.margemPct ?? 0), tone: "success" as const },
    { label: "EBITDA", value: formatCurrency(kpis?.ebitda ?? 0), tone: ebitdaTone },
    { label: "CMV", value: formatCurrency(kpis?.cmv ?? 0), tone: "danger" as const },
    { label: "DSO", value: `${kpis?.dso ?? 0} dias`, tone: "default" as const },
  ];

  const liquidityKpis = [
    { label: "Saldo bancário", value: formatCurrency(kpis?.saldoBancario ?? 0), danger: (kpis?.saldoBancario ?? 0) < 0 },
    { label: "Recebíveis", value: formatCurrency(kpis?.recebiveis ?? 0), danger: false },
    { label: "A pagar (futuro)", value: formatCurrency(kpis?.aPagar ?? 0), danger: true },
    { label: "Stock valorizado", value: formatCurrency(kpis?.stock ?? 0), danger: false },
    { label: "Capital circulante", value: formatCurrency(kpis?.capitalCirculante ?? 0), danger: (kpis?.capitalCirculante ?? 0) < 0 },
  ];

  const payablesColumns: ColumnDef<PayableAlert>[] = [
    { header: "Documento", accessorKey: "doc" },
    { header: "Fornecedor", accessorKey: "supplier" },
    { header: "Vencimento", accessorKey: "dueDate" },
    {
      header: "Dias",
      accessorKey: "daysOverdue",
      render: (value: number) => (
        <span className={cn("font-semibold tabular-nums", value > 0 ? "text-danger" : "text-success")}>
          {value > 0 ? `+${value}` : value}
        </span>
      ),
    },
    {
      header: "Total",
      accessorKey: "total",
      render: (value: number) => <span className="font-semibold tabular-nums">{formatCurrency(value)}</span>,
    },
  ];

  return (
    <PageWrapper>
      {/* Alertas — compactos, um por linha */}
      <div className="mb-5 grid grid-cols-1 gap-3 lg:grid-cols-2">
        <div className="rounded-xl border border-danger/20 bg-danger-soft/40 p-4">
          <span className="font-semibold text-danger">Crítico —</span>
          <span className="text-sm text-muted-foreground">€38.4k vencido há 160 dias (Sofrio €2.458). Ação: cobrar hoje.</span>
        </div>
        <div className="rounded-xl border border-warning/20 bg-warning-soft/40 p-4">
          <span className="font-semibold text-warning">Atenção —</span>
          <span className="text-sm text-muted-foreground">Top 3 clientes = 42% da receita (Sofrio €47k + Microavi €42k + Worten €38k). Concentração elevada.</span>
        </div>
      </div>

      <SectionHeader
        category="Executivo"
        title="Dashboard Financeiro"
        description="Visão executiva de EBITDA, liquidez, vendas e riscos do PRIMAVERA."
      />

      <div className="mt-5">
        <KPIGrid items={headerKpis} />
      </div>

      {/* Hero: um número, não nove */}
      <div className="mt-5 rounded-xl border border-border bg-background p-4 card-elevated">
        <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">EBITDA · {new Date().getFullYear()}</p>
        <p className={cn("mt-2 text-3xl font-semibold leading-none tabular-nums tracking-tight", ebitdaNeg ? "text-danger" : "text-foreground")}>
          {formatCurrency(kpis?.ebitda ?? 0)}
        </p>
        <p className={cn("mt-1.5 text-sm font-medium tabular-nums", ebitdaNeg ? "text-danger" : "text-success")}>
          {formatPercent(kpis?.ebitdaPct ?? 0)} margem EBITDA
        </p>
      </div>

      {/* Liquidez — linha leve, sem caixas */}
      <div className="mt-5 rounded-xl border border-border bg-background p-4 card-elevated">
        <p className="mb-4 text-xs font-medium uppercase tracking-wide text-muted-foreground">Liquidez e capital circulante</p>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
          {liquidityKpis.map((item) => (
            <div key={item.label} className="rounded-lg border border-border bg-background p-4">
              <p className="text-xs text-muted-foreground">{item.label}</p>
              <p className={cn("mt-1 text-base font-semibold tabular-nums", item.danger && "text-danger")}>
                {item.value}
              </p>
            </div>
          ))}
        </div>
      </div>

      {/* Vendas + Top clientes */}
      <div className="mt-5 grid gap-3 lg:grid-cols-[1fr_360px]">
        <div className="rounded-xl border border-border bg-background p-4 card-elevated">
          <h3 className="mb-5 text-sm font-semibold tracking-tight text-foreground">Vendas mensais {new Date().getFullYear()}</h3>
          <div className="space-y-2.5">
            {salesTrend.filter((r) => parseInt(r.month?.split("-")[1] ?? "0", 10) >= 1).map((r) => {
              const monthIdx = parseInt(r.month?.split("-")[1] ?? "1", 10) - 1;
              return (
                <div key={r.month} className="grid grid-cols-[36px_1fr_90px] items-center gap-3 text-xs">
                  <span className="text-muted-foreground">{months[monthIdx] ?? r.month}</span>
                  <div className="h-2 rounded-full bg-muted">
                    <div className="h-full rounded-full bg-primary transition-all" style={{ width: `${Math.max((r.total / trendMax) * 100, 1)}%` }} />
                  </div>
                  <span className="text-right font-medium tabular-nums text-muted-foreground">{formatCurrency(r.total)}</span>
                </div>
              );
            })}
          </div>
        </div>
        <div className="rounded-xl border border-border bg-background p-4 card-elevated">
          <h3 className="mb-5 text-sm font-semibold tracking-tight text-foreground">Top 5 clientes</h3>
          <div className="space-y-1">
            {topClients.slice(0, 5).map((c) => (
              <div key={c.code} className="flex items-center justify-between gap-2 border-b border-border py-2.5 text-sm last:border-0">
                <div className="min-w-0">
                  <p className="truncate font-medium text-muted-foreground">{c.name}</p>
                  <p className="text-xs text-muted-foreground">{c.code}</p>
                </div>
                <div className="shrink-0 text-right">
                  <p className="font-semibold tabular-nums text-muted-foreground">{formatCurrency(c.salesAmount)}</p>
                  {c.currentDebt > 0 && <p className="text-xs text-danger tabular-nums">{formatCurrency(c.currentDebt)} em dívida</p>}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Próximos pagamentos */}
      <div className="mt-5 rounded-xl border border-border bg-background p-4 card-elevated">
        <h3 className="mb-5 text-sm font-semibold tracking-tight text-foreground">Próximos pagamentos a fornecedores</h3>
        <DataTable columns={payablesColumns} data={payablesAlert} />
      </div>
    </PageWrapper>
  );
}
