import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";
import { apiUrl } from "@/lib/api";
import { formatCurrency } from "@/lib/format";
import { PageWrapper, SectionHeader, KPIGrid, PageLoadingState, PageEmptyState } from "@/components";

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

  if (loading) return <PageLoadingState message="A carregar previsão..." />;
  if (!data) return <PageEmptyState title="Sem dados" description="Sem dados de previsão disponíveis." />;

  const receivables = data?.receivablesByMonth ?? [];
  const payables = data?.payablesByMonth ?? [];

  const incoming30 = receivables.slice(0, 3).reduce((s, r) => s + r.total, 0);
  const outgoing30 = payables.slice(0, 3).reduce((s, p) => s + p.total, 0);

  const kpiItems = [
    { label: `Entradas previstas (${horizon}d)`, value: formatCurrency(incoming30), tone: "success" as const },
    { label: `Saídas previstas (${horizon}d)`, value: formatCurrency(outgoing30), tone: "danger" as const },
    { label: `Saldo projetado (${horizon}d)`, value: formatCurrency(incoming30 - outgoing30), tone: (incoming30 - outgoing30) >= 0 ? "success" as const : "danger" as const },
    { label: "Meses com fluxo", value: String(receivables.length), tone: "default" as const },
    { label: "Contas bancárias", value: String(data.bankAccounts?.length ?? 0), tone: "default" as const },
  ];

  return (
    <PageWrapper>
      <div className="w-full space-y-8">
        <SectionHeader
          category="Tesouraria"
          title="Previsão 30/60/90 dias"
          description="Projeção de recebimentos, pagamentos e saldo por horizonte temporal"
        />

        <KPIGrid items={kpiItems} />

        <div className="bg-background rounded-xl shadow-sm border border-border overflow-hidden">
          <div className="border-b border-border px-8 py-3">
            <div className="flex gap-1 rounded-lg bg-muted p-1 w-fit">
              {([30, 60, 90] as const).map(d => (
                <button
                  key={d}
                  type="button"
                  onClick={() => setHorizon(d)}
                  className={cn(
                    "rounded-md px-4 py-1.5 text-sm font-medium transition-colors",
                    horizon === d ? "bg-background text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"
                  )}
                >
                  {d} dias
                </button>
              ))}
            </div>
          </div>

          <div className="p-8 space-y-4">
            <div className="grid gap-3 md:grid-cols-2">
              <div className="rounded-lg border border-border bg-background p-4">
                <p className="text-sm font-semibold text-muted-foreground uppercase">Entradas Previstas</p>
                <p className="mt-1.5 text-2xl font-semibold text-success">{formatCurrency(incoming30)}</p>
              </div>
              <div className="rounded-lg border border-border bg-background p-4">
                <p className="text-sm font-semibold text-muted-foreground uppercase">Saídas Previstas</p>
                <p className="mt-1.5 text-2xl font-semibold text-danger">{formatCurrency(outgoing30)}</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </PageWrapper>
  );
}
