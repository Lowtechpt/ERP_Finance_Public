import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";
import { apiUrl } from "@/lib/api";

type CashFlowData = {
  receivablesByMonth: { month: string; docs: number; total: number }[];
  payablesByMonth: { month: string; docs: number; total: number }[];
  bankAccounts: {
    Conta: string;
    DescBanco: string;
    Banco: string;
    Moeda: string;
  }[];
  summary: {
    totalIncoming: number;
    totalOutgoing: number;
    projectedBalance: number;
  };
};

function formatCurrency(value: number) {
  return new Intl.NumberFormat("pt-PT", {
    style: "currency",
    currency: "EUR",
    minimumFractionDigits: 2,
  }).format(value);
}

const months = [
  "Jan", "Fev", "Mar", "Abr", "Mai", "Jun",
  "Jul", "Ago", "Set", "Out", "Nov", "Dez",
];

function entriesToMonthly(input: { month: string; docs: number; total: number }[]) {
  return input.map((e) => {
    const monthIndex = parseInt(e.month.split("-")[1] ?? "1", 10) - 1;
    return { ...e, label: months[monthIndex] ?? e.month };
  });
}

export default function CashFlowPage() {
  const [data, setData] = useState<CashFlowData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let ignore = false;
    fetch(apiUrl("/api/cashflow"))
      .then((r) => {
        if (!r.ok) throw new Error(`API cashflow respondeu ${r.status}`);
        return r.json() as Promise<CashFlowData>;
      })
      .then((d) => {
        if (!ignore) setData(d);
      })
      .catch(() => {
        if (!ignore) setData(null);
      })
      .finally(() => {
        if (!ignore) setLoading(false);
      });
    return () => { ignore = true; };
  }, []);

  if (loading) {
    return (
      <div className="flex min-h-[400px] items-center justify-center">
        <p className="text-sm text-muted-foreground">A carregar fluxo de caixa...</p>
      </div>
    );
  }

  const summary = data?.summary ?? {
    totalIncoming: 0, totalOutgoing: 0, projectedBalance: 0,
  };
  const receivables = entriesToMonthly(data?.receivablesByMonth ?? []);
  const payables = entriesToMonthly(data?.payablesByMonth ?? []);
  const bankAccounts = data?.bankAccounts ?? [];

  const receivablesMax = Math.max(...receivables.map((r) => r.total), 1);
  const payablesMax = Math.max(...payables.map((p) => p.total), 1);

  return (
    <section className="rounded-lg border border-border bg-background shadow-[0_1px_6px_rgba(15,23,42,0.06)]">
      <div className="border-b border-border p-6">
        <p className="text-xs font-semibold uppercase tracking-wide text-primary">
          Tesouraria
        </p>
        <h2 className="mt-2 text-[24px] font-bold">Fluxo de caixa</h2>
        <p className="mt-2 max-w-3xl text-sm leading-6 text-muted-foreground">
          Entradas, saídas e saldo projetado com dados do PRIMAVERA.
        </p>
      </div>

      <div className="grid gap-4 p-6 md:grid-cols-3">
        <div className="rounded-lg border border-border bg-muted/20 p-5 shadow-sm">
          <p className="text-xs font-semibold text-muted-foreground">Entradas previstas</p>
          <p className="mt-2 text-2xl font-bold text-success">{formatCurrency(summary.totalIncoming)}</p>
        </div>
        <div className="rounded-lg border border-border bg-muted/20 p-5 shadow-sm">
          <p className="text-xs font-semibold text-muted-foreground">Saídas previstas</p>
          <p className="mt-2 text-2xl font-bold text-danger">{formatCurrency(summary.totalOutgoing)}</p>
        </div>
        <div className="rounded-lg border border-border bg-muted/20 p-5 shadow-sm">
          <p className="text-xs font-semibold text-muted-foreground">Saldo projetado</p>
          <p
            className={cn(
              "mt-2 text-2xl font-bold",
              summary.projectedBalance >= 0 ? "text-success" : "text-danger",
            )}
          >
            {formatCurrency(summary.projectedBalance)}
          </p>
        </div>
      </div>

      <div className="border-t border-border p-6">
        <h3 className="mb-4 font-bold">Mapa mensal</h3>
        <div className="space-y-3">
          {receivables.map((r, i) => {
            const p = payables[i];
            const maxVal = Math.max(receivablesMax, payablesMax);
            const greenPct = (r.total / maxVal) * 100;
            const redPct = p ? (p.total / maxVal) * 100 : 0;
            return (
              <div key={r.month} className="grid grid-cols-[60px_1fr_1fr] items-center gap-3 text-sm">
                <span className="text-xs font-semibold text-muted-foreground">{r.label}</span>
                <div className="flex items-center gap-2">
                  <div className="h-4 flex-1 rounded-full bg-muted">
                    <div
                      className="h-full rounded-full bg-success transition-all"
                      style={{ width: `${greenPct}%` }}
                    />
                  </div>
                  <span className="w-20 text-right text-xs font-medium text-success">
                    {formatCurrency(r.total)}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="h-4 flex-1 rounded-full bg-muted">
                    <div
                      className="h-full rounded-full bg-danger transition-all"
                      style={{ width: `${redPct}%` }}
                    />
                  </div>
                  <span className="w-20 text-right text-xs font-medium text-danger">
                    {p ? formatCurrency(p.total) : "—"}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <div className="grid gap-4 border-t border-border p-6 lg:grid-cols-2">
        <div className="rounded-lg border border-border shadow-sm">
          <div className="border-b border-border px-4 py-3">
            <h4 className="font-semibold">Recebimentos previstos</h4>
          </div>
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-muted/30 text-left text-xs text-muted-foreground">
                <th className="px-4 py-3">Mês</th>
                <th className="px-4 py-3 text-right">Docs</th>
                <th className="px-4 py-3 text-right">Total</th>
              </tr>
            </thead>
            <tbody>
              {receivables.map((r) => (
                <tr key={r.month} className="border-b border-border">
                  <td className="px-4 py-3 font-medium">{r.label}</td>
                  <td className="px-4 py-3 text-right">{r.docs}</td>
                  <td className="px-4 py-3 text-right font-semibold text-success">
                    {formatCurrency(r.total)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="rounded-lg border border-border shadow-sm">
          <div className="border-b border-border px-4 py-3">
            <h4 className="font-semibold">Pagamentos previstos</h4>
          </div>
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-muted/30 text-left text-xs text-muted-foreground">
                <th className="px-4 py-3">Mês</th>
                <th className="px-4 py-3 text-right">Docs</th>
                <th className="px-4 py-3 text-right">Total</th>
              </tr>
            </thead>
            <tbody>
              {payables.map((p) => (
                <tr key={p.month} className="border-b border-border">
                  <td className="px-4 py-3 font-medium">{p.label}</td>
                  <td className="px-4 py-3 text-right">{p.docs}</td>
                  <td className="px-4 py-3 text-right font-semibold text-danger">
                    {formatCurrency(p.total)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className="border-t border-border p-6">
        <h3 className="mb-4 font-bold">Contas bancárias</h3>
        <div className="overflow-x-auto rounded-lg border border-border">
          {bankAccounts.length === 0 ? (
            <p className="p-4 text-sm text-muted-foreground">
              Sem contas bancárias devolvidas pelo endpoint.
            </p>
          ) : (
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border bg-muted/30 text-left text-xs text-muted-foreground">
                  <th className="px-4 py-3">Conta</th>
                  <th className="px-4 py-3">Descrição</th>
                  <th className="px-4 py-3">Moeda</th>
                </tr>
              </thead>
              <tbody>
                {bankAccounts.map((acc, i) => (
                  <tr key={`${acc.Conta}-${i}`} className="border-b border-border">
                    <td className="px-4 py-3 font-medium">{acc.Conta}</td>
                    <td className="px-4 py-3">{acc.DescBanco}</td>
                    <td className="px-4 py-3">{acc.Moeda}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      <div className="flex items-center justify-between border-t border-border px-6 py-3">
        <span className="rounded-md bg-success-soft px-2 py-1 text-xs font-semibold text-success">
          PRIMAVERA SQL
        </span>
      </div>
    </section>
  );
}
