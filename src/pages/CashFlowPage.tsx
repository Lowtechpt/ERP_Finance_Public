import { useEffect, useState } from "react";
import { apiUrl } from "@/lib/api";
import { formatCurrency } from "@/lib/format";
import { PageWrapper, SectionHeader, PageLoadingState, KPIGrid } from "@/components";

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
    return <PageLoadingState message="A carregar fluxo de caixa..." />;
  }

  const summary = data?.summary ?? {
    totalIncoming: 0, totalOutgoing: 0, projectedBalance: 0,
  };
  const receivables = entriesToMonthly(data?.receivablesByMonth ?? []);
  const payables = entriesToMonthly(data?.payablesByMonth ?? []);
  const bankAccounts = data?.bankAccounts ?? [];

  const receivablesMax = Math.max(...receivables.map((r) => r.total), 1);
  const payablesMax = Math.max(...payables.map((p) => p.total), 1);

  const balanceTone: "success" | "danger" = summary.projectedBalance >= 0 ? "success" : "danger";
  const kpis = [
    { label: "Entradas Previstas", value: formatCurrency(summary.totalIncoming), tone: "success" as const },
    { label: "Saídas Previstas", value: formatCurrency(summary.totalOutgoing), tone: "danger" as const },
    { label: "Saldo Projetado", value: formatCurrency(summary.projectedBalance), tone: balanceTone },
    { label: "Docs Entrada", value: String(receivables.reduce((s, r) => s + r.docs, 0)), tone: "default" as const },
    { label: "Docs Saída", value: String(payables.reduce((s, p) => s + p.docs, 0)), tone: "default" as const },
  ];

  return (
    <PageWrapper>
      <SectionHeader
        category="Tesouraria"
        title="Fluxo de Caixa"
        description="Entradas, saídas e saldo projetado com dados do PRIMAVERA"
      />

      <div className="mt-5">
        <KPIGrid items={kpis} />
      </div>

      <div className="mt-5 rounded-xl border border-border bg-background p-4 card-elevated">
        <h3 className="mb-4 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">Mapa Mensal</h3>
        <div className="space-y-3">
          {receivables.map((r, i) => {
            const p = payables[i];
            const maxVal = Math.max(receivablesMax, payablesMax);
            const greenPct = (r.total / maxVal) * 100;
            const redPct = p ? (p.total / maxVal) * 100 : 0;
            return (
              <div key={r.month} className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-semibold text-foreground">{r.label}</span>
                  <span className="text-xs text-muted-foreground">{r.docs} docs entrada | {p ? p.docs : 0} docs saída</span>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="flex items-center gap-2">
                    <div className="flex-1 h-2 rounded-full bg-muted">
                      <div className="h-full rounded-full bg-success transition-all" style={{ width: `${greenPct}%` }} />
                    </div>
                    <span className="w-32 text-right text-xs font-semibold text-success tabular-nums">{formatCurrency(r.total)}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="flex-1 h-2 rounded-full bg-muted">
                      <div className="h-full rounded-full bg-danger transition-all" style={{ width: `${redPct}%` }} />
                    </div>
                    <span className="w-32 text-right text-xs font-semibold text-danger tabular-nums">{p ? formatCurrency(p.total) : "—"}</span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <div className="mt-5 rounded-xl border border-border bg-background p-4 card-elevated">
        <h3 className="mb-4 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">Contas Bancárias</h3>
        <div className="grid gap-3 md:grid-cols-3">
          {bankAccounts.length === 0 ? (
            <p className="col-span-full text-sm text-muted-foreground">Nenhuma conta bancária disponível.</p>
          ) : (
            bankAccounts.map((acc) => (
              <div key={acc.Conta} className="rounded-lg border border-border bg-background p-4 card-elevated">
                <p className="font-semibold text-foreground">{acc.Conta}</p>
                <p className="mt-1 text-sm text-muted-foreground">{acc.DescBanco}</p>
                <div className="mt-3 flex items-center gap-2">
                  <span className="rounded-md bg-muted px-2 py-0.5 text-xs font-medium text-muted-foreground">{acc.Banco}</span>
                  <span className="rounded-md bg-info-soft px-2 py-0.5 text-xs font-semibold text-info">{acc.Moeda}</span>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </PageWrapper>
  );
}
