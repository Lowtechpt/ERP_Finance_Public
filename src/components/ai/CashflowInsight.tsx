import { formatCurrency } from "@/lib/format";
import { MetricCard, SimpleBar } from "@/components/metrics";

export function CashflowInsight({ cashflow, payables, dataLoading }: { cashflow: any; payables: any; dataLoading: boolean }) {
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
