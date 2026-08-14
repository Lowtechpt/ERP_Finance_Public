import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";
import { apiUrl } from "@/lib/api";

const fmt = (n: number) => new Intl.NumberFormat("pt-PT", { style: "currency", currency: "EUR", minimumFractionDigits: 2 }).format(n);

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
  return <span className={cn("rounded px-2 py-1 text-xs font-bold", cls)}>{label}</span>;
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

  return (
    <section className="rounded-lg border border-border bg-background shadow-[0_1px_6px_rgba(15,23,42,0.06)]">
      <div className="flex items-center justify-between border-b border-border p-6">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-primary">TESOURARIA</p>
          <h2 className="mt-2 text-[24px] font-bold">Risco de liquidez</h2>
          <p className="mt-1 text-sm text-muted-foreground">Rácios, cobertura de pagamentos e projeção de caixa 30/60/90 dias.</p>
        </div>
        <div className="flex items-center gap-2">
          {!loading && <RiskBadge level={riskLevel} />}
          <span className="rounded bg-success-soft px-2 py-1 text-xs font-semibold text-success">PRIMAVERA SQL</span>
        </div>
      </div>

      {loading ? (
        <div className="flex min-h-[300px] items-center justify-center text-sm text-muted-foreground">A carregar...</div>
      ) : (
        <>
          {/* Rácios de liquidez */}
          <div className="border-b border-border p-6">
            <p className="mb-3 text-xs font-semibold uppercase text-muted-foreground">Rácios de liquidez</p>
            <div className="grid grid-cols-1 gap-3 md:grid-cols-4">
              {[
                { label: "Liquidez imediata",  value: liquidezImediata,  desc: "Caixa / Passivo circulante", threshold: [0.2, 0.5] },
                { label: "Liquidez reduzida",  value: liquidezReduzida,  desc: "(Caixa + Recebíveis) / Passivo", threshold: [0.8, 1.0] },
                { label: "Liquidez geral",     value: liquidezGeral,     desc: "(Caixa + Rec. + Stock) / Passivo", threshold: [1.0, 1.5] },
                { label: "Cobertura vencido",  value: coverageRatio,     desc: "Caixa / Pagamentos vencidos", threshold: [0.5, 1.0] },
              ].map((r) => {
                const v = r.value;
                const cls = v === null ? "text-muted-foreground"
                  : v < (r.threshold[0] ?? 0) ? "text-danger"
                  : v < (r.threshold[1] ?? 1) ? "text-warning"
                  : "text-success";
                return (
                  <div key={r.label} className="rounded-lg border border-border bg-muted/20 p-4">
                    <p className="text-xs text-muted-foreground">{r.label}</p>
                    <p className={cn("mt-2 text-2xl font-bold", cls)}>{v !== null ? v.toFixed(2) : "—"}</p>
                    <p className="mt-1 text-xs text-muted-foreground">{r.desc}</p>
                    <p className="text-xs text-muted-foreground">Referência: &gt;{(r.threshold[1] ?? 1).toFixed(1)}</p>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Posição de caixa */}
          <div className="border-b border-border p-6">
            <p className="mb-3 text-xs font-semibold uppercase text-muted-foreground">Posição actual</p>
            <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
              <div className="rounded-lg border border-border bg-muted/20 p-4">
                <p className="text-xs text-muted-foreground">Saldo bancário</p>
                <p className={cn("mt-2 text-xl font-bold", saldo < 0 ? "text-danger" : "text-success")}>{fmt(saldo)}</p>
              </div>
              <div className="rounded-lg border border-border bg-muted/20 p-4">
                <p className="text-xs text-muted-foreground">Recebíveis em aberto</p>
                <p className="mt-2 text-xl font-bold">{fmt(recebiveis)}</p>
              </div>
              <div className={cn("rounded-lg border p-4", totalPayOverdue > saldo ? "border-danger/30 bg-danger/5" : "border-border bg-muted/20")}>
                <p className="text-xs text-muted-foreground">Pagamentos vencidos</p>
                <p className="mt-2 text-xl font-bold text-danger">{fmt(totalPayOverdue)}</p>
                <p className="text-xs text-muted-foreground">{payOverdue.length} documentos</p>
              </div>
              <div className="rounded-lg border border-border bg-muted/20 p-4">
                <p className="text-xs text-muted-foreground">Saldo projetado (90d)</p>
                <p className={cn("mt-2 text-xl font-bold", (cfSummary?.projectedBalance ?? 0) < 0 ? "text-danger" : "text-success")}>
                  {fmt(cfSummary?.projectedBalance ?? 0)}
                </p>
              </div>
            </div>
          </div>

          {/* Projeção 30/60/90 dias */}
          <div className="border-b border-border p-6">
            <p className="mb-3 text-xs font-semibold uppercase text-muted-foreground">Recebimentos esperados por prazo</p>
            <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
              {recByBucket.map((b) => (
                <div key={b.label} className="rounded-lg border border-border bg-muted/20 p-4">
                  <p className="text-xs font-semibold text-primary">{b.label}</p>
                  <p className="mt-2 text-xl font-bold text-success">{fmt(b.amount)}</p>
                  <p className="text-xs text-muted-foreground">{b.count} documentos</p>
                </div>
              ))}
            </div>
          </div>

          {/* Pagamentos a vencer */}
          <div className="grid gap-0 border-b border-border md:grid-cols-2">
            <div className="border-r border-border p-6">
              <h3 className="mb-3 font-bold text-danger">Pagamentos vencidos ({payOverdue.length})</h3>
              {payOverdue.length === 0 ? (
                <p className="text-sm text-success">Sem pagamentos vencidos.</p>
              ) : (
                <div className="space-y-2">
                  {payOverdue.slice(0, 8).map((p, i) => (
                    <div key={i} className="flex items-center justify-between rounded border border-danger/20 bg-danger/5 px-3 py-2 text-sm">
                      <div>
                        <p className="font-medium">{p.supplierName}</p>
                        <p className="text-xs text-muted-foreground">{p.doc} · +{p.daysOverdue} dias</p>
                      </div>
                      <p className="font-bold text-danger">{fmt(Number(p.totalAmount))}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>
            <div className="p-6">
              <h3 className="mb-3 font-bold">Próximos a vencer</h3>
              <div className="space-y-2">
                {payUpcoming.map((p, i) => (
                  <div key={i} className="flex items-center justify-between rounded border border-border px-3 py-2 text-sm">
                    <div>
                      <p className="font-medium">{p.supplierName}</p>
                      <p className="text-xs text-muted-foreground">{p.doc} · {p.dueDate}</p>
                    </div>
                    <p className="font-semibold">{fmt(Number(p.totalAmount))}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </>
      )}
    </section>
  );
}
