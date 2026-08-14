import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";
import { apiUrl } from "@/lib/api";

const fmt = (n: number) => new Intl.NumberFormat("pt-PT", { style: "currency", currency: "EUR", minimumFractionDigits: 2 }).format(n);

type ForecastData = {
  receivablesByMonth: { month: string; docs: number; total: number }[];
  payablesByMonth: { month: string; docs: number; total: number }[];
  bankAccounts: { Conta: string; DescBanco: string; Banco: string; Moeda: string }[];
  summary: { totalIncoming: number; totalOutgoing: number; projectedBalance: number };
  dailyFlow: { date: string; incoming: number; outgoing: number; balance: number }[];
};

export default function CashFlowForecastPage() {
  const [data, setData] = useState<ForecastData | null>(null);
  const [loading, setLoading] = useState(true);
  const [horizon, setHorizon] = useState<30 | 60 | 90>(30);

  useEffect(() => {
    let ignore = false;
    fetch(apiUrl("/api/cashflow"))
      .then(r => r.json())
      .then(d => { if (!ignore) setData(d); })
      .catch(() => {})
      .finally(() => { if (!ignore) setLoading(false); });
    return () => { ignore = true; };
  }, []);

  const months = ["Jan","Fev","Mar","Abr","Mai","Jun","Jul","Ago","Set","Out","Nov","Dez"];
  const receivables = data?.receivablesByMonth ?? [];
  const payables = data?.payablesByMonth ?? [];

  const incoming30 = receivables
    .filter(r => r.month >= new Date().toISOString().slice(0, 7))
    .reduce((s, r) => s + r.total, 0);
  const outgoing30 = payables
    .filter(p => p.month >= new Date().toISOString().slice(0, 7))
    .reduce((s, p) => s + p.total, 0);

  if (loading) return <div className="flex min-h-[400px] items-center justify-center text-sm text-muted-foreground">A carregar previsão de fluxo de caixa...</div>;
  if (!data) return <div className="p-6 text-sm text-muted-foreground">Sem dados de previsão disponíveis.</div>;

  return (
    <section className="rounded-lg border border-border bg-background shadow-[0_1px_6px_rgba(15,23,42,0.06)]">
      <div className="flex items-center justify-between border-b border-border p-6">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-primary">TESOURARIA</p>
          <h2 className="mt-2 text-[24px] font-bold">Previsão 30/60/90 dias</h2>
          <p className="mt-1 text-sm text-muted-foreground">Projeção de recebimentos, pagamentos e saldo por horizonte temporal.</p>
        </div>
        <span className="rounded bg-success-soft px-2 py-1 text-xs font-semibold text-success">PRIMAVERA SQL</span>
      </div>

      <div className="border-b border-border px-6 py-3">
        <div className="flex gap-1 rounded-lg bg-muted p-1">
          {([30, 60, 90] as const).map(d => (
            <button
              key={d}
              type="button"
              onClick={() => setHorizon(d)}
              className={cn(
                "rounded-md px-4 py-1.5 text-sm font-medium transition-colors",
                horizon === d
                  ? "bg-background text-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              {d} dias
            </button>
          ))}
        </div>
      </div>

      <div className="p-6">
        <div className="grid gap-4 mb-6 md:grid-cols-3">
          <div className={cn("rounded-lg border p-5", incoming30 >= outgoing30 ? "border-success/30 bg-success/5" : "border-danger/30 bg-danger/5")}>
            <p className="text-xs font-semibold text-muted-foreground">Entradas previstas ({horizon}d)</p>
            <p className="mt-2 text-2xl font-bold text-success">{fmt(incoming30)}</p>
          </div>
          <div className="rounded-lg border border-border bg-muted/20 p-5">
            <p className="text-xs font-semibold text-muted-foreground">Saídas previstas ({horizon}d)</p>
            <p className="mt-2 text-2xl font-bold text-danger">{fmt(outgoing30)}</p>
          </div>
          <div className={cn("rounded-lg border p-5", incoming30 >= outgoing30 ? "border-success/30 bg-success/5" : "border-danger/30 bg-danger/5")}>
            <p className="text-xs font-semibold text-muted-foreground">Saldo projetado ({horizon}d)</p>
            <p className={cn("mt-2 text-2xl font-bold", incoming30 >= outgoing30 ? "text-success" : "text-danger")}>
              {fmt(incoming30 - outgoing30)}
            </p>
          </div>
        </div>

        <div className="border-t border-border pt-6">
          <h3 className="mb-4 font-bold">Mapa mensal (recebimentos vs pagamentos)</h3>
          <div className="overflow-x-auto rounded-lg border border-border">
            <table className="w-full min-w-[700px] text-sm">
              <thead>
                <tr className="border-b bg-muted/30 text-left text-xs text-muted-foreground">
                  <th className="px-4 py-3">Mês</th>
                  <th className="px-4 py-3 text-right">Recebimentos</th>
                  <th className="px-4 py-3 text-right">Pagamentos</th>
                  <th className="px-4 py-3 text-right">Saldo Líquido</th>
                  <th className="px-4 py-3 text-right">Saldo Acumulado</th>
                </tr>
              </thead>
              <tbody>
                {receivables.map((r, i) => {
                  const p = payables[i];
                  const monthIdx = parseInt(r.month.split("-")[1] ?? "1", 10) - 1;
                  const label = months[monthIdx] ?? r.month;
                  const net = r.total - (p?.total ?? 0);
                  return (
                    <tr key={r.month} className="border-b hover:bg-muted/20">
                      <td className="px-4 py-3 font-medium">{label}</td>
                      <td className="px-4 py-3 text-right text-success">{fmt(r.total)}</td>
                      <td className="px-4 py-3 text-right text-danger">{fmt(p?.total ?? 0)}</td>
                      <td className={cn("px-4 py-3 text-right font-semibold", net >= 0 ? "text-success" : "text-danger")}>
                        {fmt(net)}
                      </td>
                      <td className="px-4 py-3 text-right">—</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        <div className="mt-6">
          <h3 className="mb-4 font-bold">Contas bancárias (saldo atual)</h3>
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
                {(data?.bankAccounts ?? []).map((acc, i) => (
                  <tr key={i} className="border-b hover:bg-muted/20">
                    <td className="px-4 py-3 font-mono">{acc.Conta}</td>
                    <td className="px-4 py-3">{acc.DescBanco || acc.Banco}</td>
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