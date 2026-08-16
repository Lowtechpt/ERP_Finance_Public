import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";
import { AlertTriangle, AlertCircle, CheckCircle } from "lucide-react";
import { apiUrl } from "@/lib/api";
import { formatCurrency } from "@/lib/format";
import { PageWrapper, SectionHeader, KPIGrid, PageLoadingState } from "@/components";

type AlertItem = {
  type: string;
  severity: string;
  title: string;
  message: string;
  data?: Record<string, unknown>;
};

type LiquidityData = {
  cashflow: {
    summary: { totalIncoming: number; totalOutgoing: number; projectedBalance: number };
    bankAccounts: { Conta: string; DescBanco: string; Moeda: string }[];
  };
  alerts: {
    alerts: AlertItem[];
    counts: { total: number; high: number; medium: number };
  };
  dashboard: {
    kpis: { totalOverdue: number; totalOpen: number; docCount: number; clientCount: number };
    payablesAlert: { doc: string; supplier: string; dueDate: string; daysOverdue: number; total: number }[];
  };
};

export default function LiquidityRiskPage() {
  const [data, setData] = useState<LiquidityData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let ignore = false;
    Promise.all([
      fetch(apiUrl("/api/cashflow")).then(r => r.json()).catch(() => ({})),
      fetch(apiUrl("/api/alerts")).then(r => r.json()).catch(() => ({ alerts: [], counts: { total: 0, high: 0, medium: 0 } })),
      fetch(apiUrl("/api/dashboard")).then(r => r.json()).catch(() => ({ kpis: { totalOverdue: 0, totalOpen: 0, docCount: 0, clientCount: 0 }, payablesAlert: [] })),
    ]).then(([cashflow, alerts, dashboard]) => {
      if (!ignore) setData({ cashflow, alerts, dashboard });
    }).finally(() => { if (!ignore) setLoading(false); });
    return () => { ignore = true; };
  }, []);

  const projectedBalance = data?.cashflow?.summary?.projectedBalance ?? 0;
  const totalIncoming = data?.cashflow?.summary?.totalIncoming ?? 0;
  const totalOutgoing = data?.cashflow?.summary?.totalOutgoing ?? 0;
  const highAlerts = data?.alerts?.alerts?.filter(a => a.severity === "high") ?? [];
  const mediumAlerts = data?.alerts?.alerts?.filter(a => a.severity === "medium") ?? [];
  const overdueClients = data?.dashboard?.kpis?.totalOverdue ?? 0;
  const totalOpen = data?.dashboard?.kpis?.totalOpen ?? 0;
  const payablesDue = data?.dashboard?.payablesAlert?.slice(0, 5) ?? [];

  const riskLevel = highAlerts.length > 0 ? "high" : mediumAlerts.length > 2 ? "medium" : "low";

  if (loading) return <PageLoadingState message="A carregar risco de liquidez..." />;

  const kpiItems = [
    { label: "Saldo Projetado", value: formatCurrency(projectedBalance), tone: projectedBalance < 0 ? "danger" as const : "success" as const },
    { label: "Recebíveis em Atraso", value: formatCurrency(overdueClients), tone: "danger" as const },
    { label: "Total em Aberto", value: formatCurrency(totalOpen), tone: "default" as const },
    { label: "Alertas Críticos", value: String(data?.alerts?.counts?.high ?? 0), tone: highAlerts.length > 0 ? "danger" as const : "success" as const },
    { label: "Alertas Totais", value: String(data?.alerts?.counts?.total ?? 0), tone: "default" as const },
  ];

  return (
    <PageWrapper>
      <div className="w-full space-y-8">
        <SectionHeader
          category="Tesouraria"
          title="Risco de liquidez"
          description="Sinais de risco no saldo projetado, atrasos de cobrança e compromissos futuros."
        />

        {/* Risk Level Banner */}
        <div className={cn(
          "mt-5 rounded-xl border p-4",
          riskLevel === "high" && "border-danger/20 bg-danger-soft/40",
          riskLevel === "medium" && "border-warning/20 bg-warning-soft/40",
          riskLevel === "low" && "border-success/20 bg-success-soft/40"
        )}>
          <div className="flex items-center gap-3">
            <div className={cn("grid size-12 place-items-center rounded-full",
              riskLevel === "high" && "bg-danger/10 text-danger",
              riskLevel === "medium" && "bg-warning/10 text-warning",
              riskLevel === "low" && "bg-success/10 text-success"
            )}>
              {riskLevel === "high" && <AlertTriangle className="size-6" />}
              {riskLevel === "medium" && <AlertCircle className="size-6" />}
              {riskLevel === "low" && <CheckCircle className="size-6" />}
            </div>
            <div>
              <p className={cn("text-lg font-bold",
                riskLevel === "high" && "text-danger",
                riskLevel === "medium" && "text-warning",
                riskLevel === "low" && "text-success"
              )}>
                {riskLevel === "high" && "RISCO ALTO DE LIQUIDEZ"}
                {riskLevel === "medium" && "ATENÇÃO: Liquidez sob pressão"}
                {riskLevel === "low" && "Liquidez controlada"}
              </p>
              <p className="mt-1 text-sm text-muted-foreground">
                Saldo projetado: <strong>{formatCurrency(projectedBalance)}</strong> | Entradas: {formatCurrency(totalIncoming)} | Saídas: {formatCurrency(totalOutgoing)}
                {highAlerts.length > 0 && ` | ${highAlerts.length} alertas críticos`}
              </p>
            </div>
          </div>
        </div>

        <KPIGrid items={kpiItems} />

        <div className="mt-5 rounded-xl border border-border bg-background p-4">
        {/* Critical Alerts */}
        {(highAlerts.length > 0 || mediumAlerts.length > 0) && (
          <div className="mb-6">
            <h3 className="mb-3 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">Alertas de Liquidez</h3>
            <div className="space-y-2">
              {[...highAlerts, ...mediumAlerts].slice(0, 10).map((alert, i) => (
                <div key={i} className={cn(
                  "rounded-lg border p-4 flex items-start gap-3",
                  alert.severity === "high" && "border-danger/20 bg-danger-soft/40",
                  alert.severity === "medium" && "border-warning/20 bg-warning-soft/40"
                )}>
                  <div className={cn("mt-0.5 grid size-8 place-items-center rounded-full",
                    alert.severity === "high" && "bg-danger/10 text-danger",
                    alert.severity === "medium" && "bg-warning/10 text-warning"
                  )}>
                    {alert.severity === "high" ? <AlertTriangle className="size-4" /> : <AlertCircle className="size-4" />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-muted-foreground">{alert.title}</p>
                    <p className="mt-1 text-sm text-muted-foreground">{alert.message}</p>
                  </div>
                  <span className={cn("px-2 py-1 text-xs font-semibold rounded-md",
                    alert.severity === "high" && "bg-danger/10 text-danger",
                    alert.severity === "medium" && "bg-warning/10 text-warning"
                  )}>
                    {alert.severity.toUpperCase()}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Upcoming Payments */}
        <div className="mb-6">
          <h3 className="mb-3 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">Próximos Pagamentos Críticos</h3>
          <div className="overflow-x-auto rounded-lg border border-border">
            <table className="w-full min-w-[700px] text-sm">
              <thead className="bg-muted/60">
                <tr className="border-b border-border text-left text-xs font-medium uppercase tracking-wide text-muted-foreground">
                  <th className="px-4 py-3">Documento</th>
                  <th className="px-4 py-3">Fornecedor</th>
                  <th className="px-4 py-3">Vencimento</th>
                  <th className="px-4 py-3 text-right">Dias</th>
                  <th className="px-4 py-3 text-right">Total</th>
                </tr>
              </thead>
              <tbody>
                {payablesDue.map((p, i) => (
                  <tr key={i} className="border-b border-border hover:bg-muted/40">
                    <td className="px-4 py-3 font-medium text-muted-foreground">{p.doc}</td>
                    <td className="px-4 py-3 text-muted-foreground">{p.supplier}</td>
                    <td className="px-4 py-3 text-muted-foreground">{p.dueDate}</td>
                    <td className={cn("px-4 py-3 text-right font-semibold", p.daysOverdue > 0 ? "text-danger" : "text-warning")}>
                      {p.daysOverdue > 0 ? `+${p.daysOverdue}` : p.daysOverdue}
                    </td>
                    <td className="px-4 py-3 text-right font-semibold text-danger tabular-nums">{formatCurrency(p.total)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Bank Position */}
        <div>
          <h3 className="mb-3 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">Posição Bancária</h3>
          <div className="overflow-x-auto rounded-lg border border-border">
            <table className="w-full text-sm">
              <thead className="bg-muted/60">
                <tr className="border-b border-border text-left text-xs font-medium uppercase tracking-wide text-muted-foreground">
                  <th className="px-4 py-3">Conta</th>
                  <th className="px-4 py-3">Banco</th>
                  <th className="px-4 py-3">Moeda</th>
                </tr>
              </thead>
              <tbody>
                {(data?.cashflow?.bankAccounts ?? []).map((acc, i) => (
                  <tr key={i} className="border-b border-border hover:bg-muted/40">
                    <td className="px-4 py-3 font-mono text-muted-foreground">{acc.Conta}</td>
                    <td className="px-4 py-3 text-muted-foreground">{acc.DescBanco}</td>
                    <td className="px-4 py-3 text-muted-foreground">{acc.Moeda}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
        </div>
      </div>
    </PageWrapper>
  );
}
