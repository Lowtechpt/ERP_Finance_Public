import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";
import { AlertTriangle, AlertCircle, CheckCircle } from "lucide-react";
import { apiUrl } from "@/lib/api";

const fmt = (n: number) => new Intl.NumberFormat("pt-PT", { style: "currency", currency: "EUR", minimumFractionDigits: 2 }).format(n);

type LiquidityData = {
  cashflow: {
    summary: { totalIncoming: number; totalOutgoing: number; projectedBalance: number };
    bankAccounts: { Conta: string; DescBanco: string; Moeda: string }[];
  };
  alerts: {
    alerts: { type: string; severity: string; title: string; message: string; data: any }[];
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

  if (loading) return <div className="flex min-h-[400px] items-center justify-center text-sm text-muted-foreground">A carregar risco de liquidez...</div>;

  return (
    <section className="rounded-lg border border-border bg-background shadow-[0_1px_6px_rgba(15,23,42,0.06)]">
      <div className="flex items-center justify-between border-b border-border p-6">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-primary">TESOURARIA</p>
          <h2 className="mt-2 text-[24px] font-bold">Risco de liquidez</h2>
          <p className="mt-1 text-sm text-muted-foreground">Sinais de risco no saldo projetado, atrasos de cobrança e compromissos futuros.</p>
        </div>
        <span className="rounded bg-success-soft px-2 py-1 text-xs font-semibold text-success">PRIMAVERA SQL</span>
      </div>

      <div className="p-6">
        {/* Risk Level Banner */}
        <div className={cn(
          "mb-6 rounded-lg border p-5",
          riskLevel === "high" && "border-danger/30 bg-danger/5",
          riskLevel === "medium" && "border-warning/30 bg-warning/5",
          riskLevel === "low" && "border-success/30 bg-success/5"
        )}>
          <div className="flex items-center gap-4">
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
                Saldo projetado: <strong>{fmt(projectedBalance)}</strong> | Entradas: {fmt(totalIncoming)} | Saídas: {fmt(totalOutgoing)}
                {highAlerts.length > 0 && ` | ${highAlerts.length} alertas críticos`}
              </p>
            </div>
          </div>
        </div>

        {/* KPIs */}
        <div className="grid gap-4 mb-6 md:grid-cols-4">
          <div className={cn("rounded-lg border p-5", projectedBalance < 0 ? "border-danger/30 bg-danger/5" : "border-success/30 bg-success/5")}>
            <p className="text-xs font-semibold text-muted-foreground">Saldo Projetado</p>
            <p className={cn("mt-2 text-2xl font-bold", projectedBalance < 0 ? "text-danger" : "text-success")}>
              {fmt(projectedBalance)}
            </p>
          </div>
          <div className="rounded-lg border border-border bg-muted/20 p-5">
            <p className="text-xs font-semibold text-muted-foreground">Recebíveis em Atraso</p>
            <p className="mt-2 text-2xl font-bold text-danger">{fmt(overdueClients)}</p>
          </div>
          <div className="rounded-lg border border-border bg-muted/20 p-5">
            <p className="text-xs font-semibold text-muted-foreground">Total em Aberto</p>
            <p className="mt-2 text-2xl font-bold">{fmt(totalOpen)}</p>
          </div>
          <div className={cn("rounded-lg border p-5", highAlerts.length > 0 ? "border-danger/30 bg-danger/5" : "border-border bg-muted/20")}>
            <p className="text-xs font-semibold text-muted-foreground">Alertas Críticos</p>
            <p className={cn("mt-2 text-2xl font-bold", highAlerts.length > 0 ? "text-danger" : "text-success")}>
              {data?.alerts?.counts?.high ?? 0}
            </p>
          </div>
        </div>

        {/* Critical Alerts */}
        {(highAlerts.length > 0 || mediumAlerts.length > 0) && (
          <div className="mb-6">
            <h3 className="mb-3 font-bold">Alertas de Liquidez</h3>
            <div className="space-y-2">
              {[...highAlerts, ...mediumAlerts].slice(0, 10).map((alert, i) => (
                <div key={i} className={cn(
                  "rounded-lg border p-4 flex items-start gap-3",
                  alert.severity === "high" && "border-danger/30 bg-danger/5",
                  alert.severity === "medium" && "border-warning/30 bg-warning/5"
                )}>
                  <div className={cn("mt-0.5 grid size-8 place-items-center rounded-full",
                    alert.severity === "high" && "bg-danger/10 text-danger",
                    alert.severity === "medium" && "bg-warning/10 text-warning"
                  )}>
                    {alert.severity === "high" ? <AlertTriangle className="size-4" /> : <AlertCircle className="size-4" />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold">{alert.title}</p>
                    <p className="mt-1 text-sm text-muted-foreground">{alert.message}</p>
                  </div>
                  <span className={cn("px-2 py-1 text-xs font-semibold rounded",
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
          <h3 className="mb-3 font-bold">Próximos Pagamentos Críticos</h3>
          <div className="overflow-x-auto rounded-lg border border-border">
            <table className="w-full min-w-[700px] text-sm">
              <thead>
                <tr className="border-b bg-muted/30 text-left text-xs text-muted-foreground">
                  <th className="px-4 py-3">Documento</th>
                  <th className="px-4 py-3">Fornecedor</th>
                  <th className="px-4 py-3">Vencimento</th>
                  <th className="px-4 py-3 text-right">Dias</th>
                  <th className="px-4 py-3 text-right">Total</th>
                </tr>
              </thead>
              <tbody>
                {payablesDue.map((p, i) => (
                  <tr key={i} className="border-b hover:bg-muted/20">
                    <td className="px-4 py-3 font-medium">{p.doc}</td>
                    <td className="px-4 py-3">{p.supplier}</td>
                    <td className="px-4 py-3">{p.dueDate}</td>
                    <td className={cn("px-4 py-3 text-right font-semibold", p.daysOverdue > 0 ? "text-danger" : "text-warning")}>
                      {p.daysOverdue > 0 ? `+${p.daysOverdue}` : p.daysOverdue}
                    </td>
                    <td className="px-4 py-3 text-right font-semibold text-danger">{fmt(p.total)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Bank Position */}
        <div>
          <h3 className="mb-3 font-bold">Posição Bancária</h3>
          <div className="overflow-x-auto rounded-lg border border-border">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b bg-muted/30 text-left text-xs text-muted-foreground">
                  <th className="px-4 py-3">Conta</th>
                  <th className="px-4 py-3">Banco</th>
                  <th className="px-4 py-3">Moeda</th>
                </tr>
              </thead>
              <tbody>
                {(data?.cashflow?.bankAccounts ?? []).map((acc, i) => (
                  <tr key={i} className="border-b hover:bg-muted/20">
                    <td className="px-4 py-3 font-mono">{acc.Conta}</td>
                    <td className="px-4 py-3">{acc.DescBanco}</td>
                    <td className="px-4 py-3">{acc.Moeda}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </section>
  );
}