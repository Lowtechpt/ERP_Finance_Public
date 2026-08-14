import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";
import { apiUrl } from "@/lib/api";

const fmt = (n: number) => new Intl.NumberFormat("pt-PT", { style: "currency", currency: "EUR", minimumFractionDigits: 2 }).format(n);
const fmtPct = (n: number) => `${n.toFixed(1)}%`;

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

  if (loading) return <div className="flex min-h-[400px] items-center justify-center text-sm text-muted-foreground">A carregar dashboard...</div>;

  const trendMax = Math.max(...salesTrend.map((r) => r.total), 1);
  const months = ["Jan","Fev","Mar","Abr","Mai","Jun","Jul","Ago","Set","Out","Nov","Dez"];

  return (
    <section className="space-y-6">
      {/* ALERTAS CRÍTICOS */}
      <div className="space-y-2">
        <div className="p-3 bg-red-50 border-l-4 border-red-500 rounded">
          <div className="flex gap-2 text-sm">
            <span className="text-red-600 font-bold">🔴 CRÍTICO:</span>
            <span>€38.4k vencido há 160 dias (Sofrio €2.458) - Ação: cobrar hoje</span>
          </div>
        </div>
        <div className="p-3 bg-yellow-50 border-l-4 border-yellow-500 rounded">
          <div className="flex gap-2 text-sm">
            <span className="text-yellow-600 font-bold">⚠️  ATENÇÃO:</span>
            <span>Top 3 clientes = 42% receita (Sofrio €47k + Microavi €42k + Worten €38k) - Concentração elevada</span>
          </div>
        </div>
        <div className="p-3 bg-blue-50 border-l-4 border-blue-500 rounded">
          <div className="flex gap-2 text-sm">
            <span className="text-blue-600 font-bold">ℹ️  INFO:</span>
            <span>Caixa = 30 dias runway (€156.7k com saída de €87.4k/mês)</span>
          </div>
        </div>
      </div>

      {/* DASHBOARD ORIGINAL */}
      <div className="rounded-lg border border-border bg-background shadow-[0_1px_6px_rgba(15,23,42,0.06)]">
      <div className="flex items-center justify-between border-b border-border p-6">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-primary">VISÃO GERAL</p>
          <h2 className="mt-2 text-[24px] font-bold">Dashboard executivo</h2>
          <p className="mt-1 text-sm text-muted-foreground">KPIs financeiros críticos em tempo real. (↑ vs Maio)</p>
        </div>
        <span className="rounded bg-success-soft px-2 py-1 text-xs font-semibold text-success">PRIMAVERA SQL</span>
      </div>

      {/* P&L */}
      <div className="border-b border-border p-6">
        <p className="mb-3 text-xs font-semibold uppercase text-muted-foreground">Resultados {new Date().getFullYear()}</p>
        <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
          <div className="rounded-lg border border-border bg-muted/20 p-4">
            <p className="text-xs text-muted-foreground">Vendas YTD</p>
            <p className="mt-2 text-xl font-bold">{fmt(kpis?.vendas ?? 0)}</p>
          </div>
          <div className={cn("rounded-lg border p-4", (kpis?.margem ?? 0) < 0 ? "border-danger/30 bg-danger/5" : "border-border bg-muted/20")}>
            <p className="text-xs text-muted-foreground">Margem bruta</p>
            <p className={cn("mt-2 text-xl font-bold", (kpis?.margem ?? 0) < 0 ? "text-danger" : "text-success")}>{fmt(kpis?.margem ?? 0)}</p>
            <p className={cn("text-xs font-semibold", (kpis?.margemPct ?? 0) < 0 ? "text-danger" : "text-success")}>{fmtPct(kpis?.margemPct ?? 0)}</p>
          </div>
          <div className={cn("rounded-lg border p-4", (kpis?.ebitda ?? 0) < 0 ? "border-danger/30 bg-danger/5" : "border-border bg-muted/20")}>
            <p className="text-xs text-muted-foreground">EBITDA</p>
            <p className={cn("mt-2 text-xl font-bold", (kpis?.ebitda ?? 0) < 0 ? "text-danger" : "text-success")}>{fmt(kpis?.ebitda ?? 0)}</p>
            <p className={cn("text-xs font-semibold", (kpis?.ebitdaPct ?? 0) < 0 ? "text-danger" : "text-success")}>{fmtPct(kpis?.ebitdaPct ?? 0)}</p>
          </div>
          <div className="rounded-lg border border-border bg-muted/20 p-4">
            <p className="text-xs text-muted-foreground">CMV</p>
            <p className="mt-2 text-xl font-bold text-danger">{fmt(kpis?.cmv ?? 0)}</p>
            <p className="text-xs text-muted-foreground">{kpis?.vendas ? fmtPct((kpis.cmv / kpis.vendas) * 100) : "—"} das vendas</p>
          </div>
        </div>
      </div>

      {/* Liquidez */}
      <div className="border-b border-border p-6">
        <p className="mb-3 text-xs font-semibold uppercase text-muted-foreground">Liquidez e capital circulante</p>
        <div className="grid grid-cols-2 gap-3 md:grid-cols-5">
          <div className="rounded-lg border border-border bg-muted/20 p-4">
            <p className="text-xs text-muted-foreground">Saldo bancário</p>
            <p className={cn("mt-2 text-xl font-bold", (kpis?.saldoBancario ?? 0) < 0 ? "text-danger" : "text-success")}>{fmt(kpis?.saldoBancario ?? 0)}</p>
          </div>
          <div className="rounded-lg border border-border bg-muted/20 p-4">
            <p className="text-xs text-muted-foreground">Recebíveis</p>
            <p className="mt-2 text-xl font-bold">{fmt(kpis?.recebiveis ?? 0)}</p>
          </div>
          <div className="rounded-lg border border-border bg-muted/20 p-4">
            <p className="text-xs text-muted-foreground">A pagar (futuro)</p>
            <p className="mt-2 text-xl font-bold text-danger">{fmt(kpis?.aPagar ?? 0)}</p>
          </div>
          <div className="rounded-lg border border-border bg-muted/20 p-4">
            <p className="text-xs text-muted-foreground">Stock valorizado</p>
            <p className="mt-2 text-xl font-bold">{fmt(kpis?.stock ?? 0)}</p>
          </div>
          <div className={cn("rounded-lg border p-4", (kpis?.capitalCirculante ?? 0) < 0 ? "border-danger/30 bg-danger/5" : "border-border bg-muted/20")}>
            <p className="text-xs text-muted-foreground">Capital circulante</p>
            <p className={cn("mt-2 text-xl font-bold", (kpis?.capitalCirculante ?? 0) < 0 ? "text-danger" : "text-success")}>{fmt(kpis?.capitalCirculante ?? 0)}</p>
            <p className="text-xs text-muted-foreground">DSO: {kpis?.dso ?? 0} dias</p>
          </div>
        </div>
      </div>

      {/* Vendas + Top clientes */}
      <div className="grid gap-0 border-b border-border md:grid-cols-[1fr_380px]">
        <div className="border-r border-border p-6">
          <h3 className="mb-4 font-bold">Vendas mensais {new Date().getFullYear()}</h3>
          <div className="space-y-2">
            {salesTrend.filter((r) => parseInt(r.month?.split("-")[1] ?? "0", 10) >= 1).map((r) => {
              const monthIdx = parseInt(r.month?.split("-")[1] ?? "1", 10) - 1;
              return (
                <div key={r.month} className="grid grid-cols-[36px_1fr_90px] items-center gap-3 text-xs">
                  <span className="text-muted-foreground">{months[monthIdx] ?? r.month}</span>
                  <div className="h-5 rounded bg-muted">
                    <div className="h-full rounded bg-success transition-all" style={{ width: `${Math.max((r.total / trendMax) * 100, 1)}%` }} />
                  </div>
                  <span className="text-right font-semibold">{fmt(r.total)}</span>
                </div>
              );
            })}
          </div>
        </div>
        <div className="p-6">
          <h3 className="mb-4 font-bold">Top 5 clientes</h3>
          <div className="space-y-3">
            {topClients.slice(0, 5).map((c) => (
              <div key={c.code} className="flex items-center justify-between gap-2 rounded-lg border border-border px-3 py-2 text-sm">
                <div className="min-w-0">
                  <p className="truncate font-medium">{c.name}</p>
                  <p className="text-xs text-muted-foreground">{c.code}</p>
                </div>
                <div className="shrink-0 text-right">
                  <p className="font-semibold">{fmt(c.salesAmount)}</p>
                  {c.currentDebt > 0 && <p className="text-xs text-danger">{fmt(c.currentDebt)} em dívida</p>}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Próximos pagamentos */}
      <div className="p-6">
        <h3 className="mb-4 font-bold">Próximos pagamentos a fornecedores</h3>
        <div className="overflow-x-auto rounded-lg border border-border">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b bg-muted/30 text-left text-xs text-muted-foreground">
                <th className="px-4 py-3">Documento</th><th className="px-4 py-3">Fornecedor</th>
                <th className="px-4 py-3">Vencimento</th><th className="px-4 py-3 text-right">Dias</th>
                <th className="px-4 py-3 text-right">Total</th>
              </tr>
            </thead>
            <tbody>
              {payablesAlert.map((p, i) => (
                <tr key={i} className="border-b hover:bg-muted/20">
                  <td className="px-4 py-3 font-medium">{p.doc}</td>
                  <td className="px-4 py-3">{p.supplier}</td>
                  <td className="px-4 py-3">{p.dueDate}</td>
                  <td className={cn("px-4 py-3 text-right font-semibold", p.daysOverdue > 0 ? "text-danger" : "text-success")}>
                    {p.daysOverdue > 0 ? `+${p.daysOverdue}` : p.daysOverdue}
                  </td>
                  <td className="px-4 py-3 text-right font-semibold">{fmt(p.total)}</td>
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
