import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";
import { apiUrl } from "@/lib/api";
import { formatCurrency } from "@/lib/format";
import { PageWrapper, SectionHeader, KPIGrid, PageLoadingState } from "@/components";

type KPIs = { saldoBancario: number; recebiveis: number; aPagar: number; stock: number; capitalCirculante: number; dso: number; vendas: number };
type CFSummary = { totalIncoming: number; totalOutgoing: number; projectedBalance: number };
type CFMonth = { month: string; total: number; docs: number };
type Payable = { doc: string; supplierName: string; dueDate: string; daysOverdue: number; totalAmount: number; status: string };
type Receivable = { clientName: string; dueDate: string; daysOverdue: number; openAmount: number; status: string };

function RiskBadge({ level }: { level: "baixo" | "medio" | "alto" | "critico" }) {
  const map = {
    baixo:   { cls: "bg-success-soft text-success",  label: "Risco baixo" },
    medio:   { cls: "bg-warning-soft text-warning",  label: "Risco médio" },
    alto:    { cls: "bg-danger/15 text-danger",       label: "Risco alto" },
    critico: { cls: "bg-danger text-white",           label: "Risco crítico" },
  };
  const { cls, label } = map[level];
  return <span className={cn("rounded-md px-2 py-1 text-xs font-bold", cls)}>{label}</span>;
}

export default function LiquidityPage() {
  const [kpis, setKpis]         = useState<KPIs | null>(null);
  const [cfSummary, setCfSummary] = useState<CFSummary | null>(null);
  const [_cfMonths, setCfMonths]  = useState<{ rec: CFMonth[]; pay: CFMonth[] }>({ rec: [], pay: [] });
  const [payables, setPayables]   = useState<Payable[]>([]);
  const [receivables, setReceivables] = useState<Receivable[]>([]);
  const [loading, setLoading]     = useState(true);

  useEffect(() => {
    let ignore = false;
    Promise.all([
      fetch(apiUrl("/api/financial-kpis")).then((r) => r.json()).catch(() => ({})),
      fetch(apiUrl("/api/cashflow")).then((r) => r.json()).catch(() => ({})),
      fetch(apiUrl("/api/payables")).then((r) => r.json()).catch(() => ({ payables: [] })),
      fetch(apiUrl("/api/receivables")).then((r) => r.json()).catch(() => ({ receivables: [] })),
    ]).then(([kpiData, cfData, payData, recData]) => {
      if (ignore) return;
      setKpis(kpiData.saldoBancario !== undefined ? kpiData : null);
      setCfSummary(cfData.summary ?? null);
      setCfMonths({ rec: cfData.receivablesByMonth ?? [], pay: cfData.payablesByMonth ?? [] });
      setPayables(payData.payables ?? []);
      setReceivables(recData.receivables ?? []);
    }).finally(() => { if (!ignore) setLoading(false); });
    return () => { ignore = true; };
  }, []);

  const saldo      = kpis?.saldoBancario ?? 0;
  const recebiveis = kpis?.recebiveis ?? 0;
  const aPagar     = kpis?.aPagar ?? 0;
  const stock      = kpis?.stock ?? 0;

  // Rácios de liquidez
  const liquidezGeral   = aPagar > 0 ? (recebiveis + stock + saldo) / aPagar : null;
  const liquidezReduzida = aPagar > 0 ? (recebiveis + saldo) / aPagar : null;
  const liquidezImediata = aPagar > 0 ? saldo / aPagar : null;

  // Nível de risco baseado no rácio de liquidez imediata
  const riskLevel: "baixo" | "medio" | "alto" | "critico" =
    liquidezImediata === null ? "medio"
    : liquidezImediata >= 0.5 ? "baixo"
    : liquidezImediata >= 0.2 ? "medio"
    : liquidezImediata >= 0 ? "alto"
    : "critico";

  // Vencimentos próximos (30/60/90 dias)
  const today = new Date();
  const buckets = [
    { label: "Próximos 30 dias", min: 0, max: 30 },
    { label: "31 a 60 dias",     min: 31, max: 60 },
    { label: "61 a 90 dias",     min: 61, max: 90 },
    { label: "Mais de 90 dias",  min: 91, max: Infinity },
  ];

  const recByBucket = buckets.map((b) => {
    const rows = receivables.filter((r) => {
      if (!r.dueDate) return false;
      const days = Math.ceil((new Date(r.dueDate).getTime() - today.getTime()) / 86400000);
      return days >= b.min && days <= b.max;
    });
    return { ...b, amount: rows.reduce((s, r) => s + Number(r.openAmount), 0), count: rows.length };
  });

  const payOverdue  = payables.filter((p) => p.status === "Vencido");
  const payUpcoming = payables.filter((p) => p.status === "Pendente").slice(0, 10);
  const totalPayOverdue = payOverdue.reduce((s, p) => s + Number(p.totalAmount), 0);

  // Cobertura: consigo pagar o vencido com o saldo actual?
  const coverageRatio = totalPayOverdue > 0 ? saldo / totalPayOverdue : null;

  type ToneType = "default" | "success" | "danger" | "warning" | "info";

  const getKpiTone = (value: number | null, low: number, medium: number, invertLogic?: boolean): ToneType => {
    if (value === null) return "default";
    if (invertLogic) {
      if (value >= medium) return "success";
      if (value >= low) return "warning";
      return "danger";
    }
    if (value < low) return "danger";
    if (value < medium) return "warning";
    return "success";
  };

  const saldoTone: ToneType = saldo < 0 ? "danger" : "success";
  const headerKpis: Array<{ label: string; value: string; tone: ToneType }> = [
    { label: "Liquidez imediata", value: liquidezImediata !== null ? liquidezImediata.toFixed(2) : "—", tone: getKpiTone(liquidezImediata, 0.2, 0.5) },
    { label: "Liquidez reduzida", value: liquidezReduzida !== null ? liquidezReduzida.toFixed(2) : "—", tone: getKpiTone(liquidezReduzida, 0.8, 1.0) },
    { label: "Liquidez geral", value: liquidezGeral !== null ? liquidezGeral.toFixed(2) : "—", tone: getKpiTone(liquidezGeral, 1.0, 1.5) },
    { label: "Cobertura vencido", value: coverageRatio !== null ? coverageRatio.toFixed(2) : "—", tone: getKpiTone(coverageRatio, 0.5, 1.0) },
    { label: "Saldo bancário", value: formatCurrency(saldo), tone: saldoTone },
  ];

  if (loading) {
    return <PageLoadingState message="A carregar..." />;
  }

  return (
    <PageWrapper>
      <div className="space-y-8">
        <div className="flex items-center justify-between">
          <div>
            <SectionHeader
              category="Tesouraria"
              title="Risco de liquidez"
              description="Rácios, cobertura de pagamentos e projeção de caixa 30/60/90 dias."
            />
          </div>
          <div className="flex items-center gap-2">
            {!loading && <RiskBadge level={riskLevel} />}
            <span className="rounded-md bg-success-soft px-2 py-1 text-xs font-semibold text-success">PRIMAVERA SQL</span>
          </div>
        </div>

        <>
          <KPIGrid items={headerKpis} />

          {/* Posição de caixa */}
          <div className="mt-5 rounded-xl border border-border bg-background p-4">
            <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-info">Posição actual</p>
            <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
              <div className="rounded-lg border border-border bg-background p-4">
                <p className="text-xs text-muted-foreground">Recebíveis em aberto</p>
                <p className="mt-2 text-xl font-bold tabular-nums text-foreground">{formatCurrency(recebiveis)}</p>
              </div>
              <div className={cn("rounded-lg border p-4", totalPayOverdue > saldo ? "border-danger/20 bg-danger-soft/40" : "border-border bg-background")}>
                <p className="text-xs text-muted-foreground">Pagamentos vencidos</p>
                <p className="mt-2 text-xl font-bold text-danger tabular-nums">{formatCurrency(totalPayOverdue)}</p>
                <p className="text-xs text-muted-foreground">{payOverdue.length} documentos</p>
              </div>
              <div className="rounded-lg border border-border bg-background p-4">
                <p className="text-xs text-muted-foreground">Saldo projetado (90d)</p>
                <p className={cn("mt-2 text-xl font-bold", (cfSummary?.projectedBalance ?? 0) < 0 ? "text-danger" : "text-success")}>
                  <span className="tabular-nums">{formatCurrency(cfSummary?.projectedBalance ?? 0)}</span>
                </p>
              </div>
              <div className="rounded-lg border border-border bg-background p-4">
                <p className="text-xs text-muted-foreground">Stock</p>
                <p className="mt-2 text-xl font-bold tabular-nums text-foreground">{formatCurrency(stock)}</p>
              </div>
            </div>
          </div>

          {/* Projeção 30/60/90 dias */}
          <div className="mt-5 rounded-xl border border-border bg-background p-4">
            <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-info">Recebimentos esperados por prazo</p>
            <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
              {recByBucket.map((b) => (
                <div key={b.label} className="rounded-lg border border-border bg-background p-4">
                  <p className="text-xs font-semibold text-info">{b.label}</p>
                  <p className="mt-2 text-xl font-bold text-success tabular-nums">{formatCurrency(b.amount)}</p>
                  <p className="text-xs text-muted-foreground">{b.count} documentos</p>
                </div>
              ))}
            </div>
          </div>

          {/* Pagamentos a vencer */}
          <div className="mt-5 grid gap-3 md:grid-cols-2">
            <div className="rounded-xl border border-border bg-background p-4">
              <h3 className="mb-3 font-semibold tracking-tight text-danger">Pagamentos vencidos ({payOverdue.length})</h3>
              {payOverdue.length === 0 ? (
                <p className="text-sm text-success">Sem pagamentos vencidos.</p>
              ) : (
                <div className="space-y-2">
                  {payOverdue.slice(0, 8).map((p, i) => (
                    <div key={i} className="flex items-center justify-between rounded-xl border border-danger/20 bg-danger-soft/40 px-3 py-2 text-sm">
                      <div>
                        <p className="font-medium text-muted-foreground">{p.supplierName}</p>
                        <p className="text-xs text-muted-foreground">{p.doc} · +{p.daysOverdue} dias</p>
                      </div>
                      <p className="font-bold text-danger tabular-nums">{formatCurrency(Number(p.totalAmount))}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>
            <div className="rounded-xl border border-border bg-background p-4">
              <h3 className="mb-3 font-semibold tracking-tight text-foreground">Próximos a vencer</h3>
              <div className="space-y-2">
                {payUpcoming.map((p, i) => (
                  <div key={i} className="flex items-center justify-between rounded-xl border border-border px-3 py-2 text-sm">
                    <div>
                      <p className="font-medium text-muted-foreground">{p.supplierName}</p>
                      <p className="text-xs text-muted-foreground">{p.doc} · {p.dueDate}</p>
                    </div>
                    <p className="font-semibold tabular-nums text-muted-foreground">{formatCurrency(Number(p.totalAmount))}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </>
      </div>
    </PageWrapper>
  );
}
