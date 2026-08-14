import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";
import { apiUrl } from "@/lib/api";

const fmt = (n: number) => new Intl.NumberFormat("pt-PT", { style: "currency", currency: "EUR", minimumFractionDigits: 2 }).format(n);
const fmtPct = (n: number) => `${n.toFixed(1)}%`;

type ConcentrationData = {
  byClient: {
    code: string;
    name: string;
    salesAmount: number;
    currentDebt: number;
    salesShare: number;
    debtShare: number;
    marginShare: number;
  }[];
  byProduct: {
    code: string;
    name: string;
    revenue: number;
    margin: number;
    revenueShare: number;
    marginShare: number;
  }[];
  summary: {
    top5SalesShare: number;
    top5DebtShare: number;
    top5MarginShare: number;
    hhiSales: number;
    hhiDebt: number;
  };
};

export default function RiskConcentrationPage() {
  const [data, setData] = useState<ConcentrationData | null>(null);
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState<"clientes" | "produtos">("clientes");

  useEffect(() => {
    let ignore = false;
    Promise.all([
      fetch(apiUrl("/api/customers")).then(r => r.json()).catch(() => ({ customers: [] })),
      fetch(apiUrl("/api/profitability/product")).then(r => r.json()).catch(() => []),
    ]).then(([custData, prodData]) => {
      if (ignore) return;
      const customers: any[] = custData.customers ?? [];
      const products: any[] = prodData ?? [];

      const totalSales = customers.reduce((s, c) => s + c.salesAmount, 0);
      const totalDebt = customers.reduce((s, c) => s + c.currentDebt, 0);
      const totalMargin = customers.reduce((s, c) => s + (c.salesAmount - c.currentDebt * 0.3), 0);

      const byClient = customers
        .map(c => ({
          code: c.code,
          name: c.name,
          salesAmount: c.salesAmount,
          currentDebt: c.currentDebt,
          salesShare: totalSales > 0 ? (c.salesAmount / totalSales) * 100 : 0,
          debtShare: totalDebt > 0 ? (c.currentDebt / totalDebt) * 100 : 0,
          marginShare: totalMargin > 0 ? ((c.salesAmount - c.currentDebt * 0.3) / totalMargin) * 100 : 0,
        }))
        .sort((a, b) => b.salesAmount - a.salesAmount);

      const totalProdRevenue = products.reduce((s, p) => s + p.revenue, 0);
      const totalProdMargin = products.reduce((s, p) => s + p.margin, 0);

      const byProduct = products
        .map(p => ({
          code: p.code,
          name: p.name,
          revenue: p.revenue,
          margin: p.margin,
          revenueShare: totalProdRevenue > 0 ? (p.revenue / totalProdRevenue) * 100 : 0,
          marginShare: totalProdMargin > 0 ? (p.margin / totalProdMargin) * 100 : 0,
        }))
        .sort((a, b) => b.revenue - a.revenue);

      const top5 = byClient.slice(0, 5);
      const hhiSales = byClient.reduce((s: number, c: any) => s + Math.pow(c.salesShare / 100, 2), 0) * 10000;
      const hhiDebt = byClient.reduce((s: number, c: any) => s + Math.pow(c.debtShare / 100, 2), 0) * 10000;

      setData({
        byClient,
        byProduct,
        summary: {
          top5SalesShare: top5.reduce((s: number, c: any) => s + c.salesShare, 0),
          top5DebtShare: top5.reduce((s: number, c: any) => s + c.debtShare, 0),
          top5MarginShare: top5.reduce((s: number, c: any) => s + c.marginShare, 0),
          hhiSales: Math.round(hhiSales),
          hhiDebt: Math.round(hhiDebt),
        },
      });
    }).finally(() => { if (!ignore) setLoading(false); });
    return () => { ignore = true; };
  }, []);

  if (loading) return <div className="flex min-h-[400px] items-center justify-center text-sm text-muted-foreground">A carregar concentração de risco...</div>;
  if (!data) return <div className="p-6 text-sm text-muted-foreground">Sem dados de concentração.</div>;

  const currentData = view === "clientes" ? data.byClient : data.byProduct;
  const isClientView = view === "clientes";

  return (
    <section className="rounded-lg border border-border bg-background shadow-[0_1px_6px_rgba(15,23,42,0.06)]">
      <div className="flex items-center justify-between border-b border-border p-6">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-primary">CLIENTES</p>
          <h2 className="mt-2 text-[24px] font-bold">Concentração de risco</h2>
          <p className="mt-1 text-sm text-muted-foreground">Peso de clientes/produtos no volume, dívida, margem e risco de cobrança.</p>
        </div>
        <span className="rounded bg-success-soft px-2 py-1 text-xs font-semibold text-success">PRIMAVERA SQL</span>
      </div>

      <div className="border-b border-border px-6 py-3">
        <div className="flex gap-1 rounded-lg bg-muted p-1">
          {[
            { key: "clientes", label: "Por Cliente" },
            { key: "produtos", label: "Por Produto" },
          ].map((tab) => (
            <button
              key={tab.key}
              type="button"
              onClick={() => setView(tab.key as any)}
              className={cn(
                "rounded-md px-4 py-1.5 text-sm font-medium transition-colors",
                view === tab.key
                  ? "bg-background text-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      <div className="p-6">
        <div className="grid gap-4 mb-6 md:grid-cols-4">
          <div className="rounded-lg border border-border bg-muted/20 p-5">
            <p className="text-xs font-semibold text-muted-foreground">Top 5 Faturação</p>
            <p className="mt-2 text-2xl font-bold">{fmtPct(data.summary.top5SalesShare)}</p>
            <p className="text-xs text-muted-foreground">Concentração vendas</p>
          </div>
          <div className="rounded-lg border border-border bg-muted/20 p-5">
            <p className="text-xs font-semibold text-muted-foreground">Top 5 Dívida</p>
            <p className="mt-2 text-2xl font-bold text-danger">{fmtPct(data.summary.top5DebtShare)}</p>
            <p className="text-xs text-muted-foreground">Concentração recebíveis</p>
          </div>
          <div className="rounded-lg border border-border bg-muted/20 p-5">
            <p className="text-xs font-semibold text-muted-foreground">HHI Vendas</p>
            <p className="mt-2 text-2xl font-bold">{data.summary.hhiSales}</p>
            <p className="text-xs text-muted-foreground">{data.summary.hhiSales > 2500 ? "Alta concentração" : "Moderada"}</p>
          </div>
          <div className="rounded-lg border border-border bg-muted/20 p-5">
            <p className="text-xs font-semibold text-muted-foreground">HHI Dívida</p>
            <p className="mt-2 text-2xl font-bold">{data.summary.hhiDebt}</p>
            <p className="text-xs text-muted-foreground">{data.summary.hhiDebt > 2500 ? "Alta concentração" : "Moderada"}</p>
          </div>
        </div>

        {currentData.length === 0 ? (
          <p className="text-sm text-muted-foreground">Sem dados para esta dimensão.</p>
        ) : (
          <div className="overflow-x-auto rounded-lg border border-border">
            <table className="w-full min-w-[800px] text-sm">
              <thead>
                <tr className="border-b bg-muted/30 text-left text-xs text-muted-foreground">
                  <th className="px-4 py-3">Item</th>
                  {isClientView ? (
                    <>
                      <th className="px-4 py-3 text-right">Faturação</th>
                      <th className="px-4 py-3 text-right">% Vendas</th>
                      <th className="px-4 py-3 text-right">Dívida</th>
                      <th className="px-4 py-3 text-right">% Dívida</th>
                      <th className="px-4 py-3 text-right">Margem Est.</th>
                      <th className="px-4 py-3 text-right">% Margem</th>
                    </>
                  ) : (
                    <>
                      <th className="px-4 py-3 text-right">Receita</th>
                      <th className="px-4 py-3 text-right">% Receita</th>
                      <th className="px-4 py-3 text-right">Margem</th>
                      <th className="px-4 py-3 text-right">% Margem</th>
                    </>
                  )}
                  <th className="px-4 py-3 text-right">Acumulado %</th>
                </tr>
              </thead>
              <tbody>
                {currentData.map((item: any, i: number) => {
                  const cumulative = currentData.slice(0, i + 1).reduce((s: number, x: any) => s + (isClientView ? x.salesShare : x.revenueShare), 0);
                  return (
                    <tr key={`${item.code}-${i}`} className="border-b hover:bg-muted/20">
                      <td className="px-4 py-3">
                        <p className="font-medium">{item.name}</p>
                        <p className="text-xs text-muted-foreground">{item.code}</p>
                      </td>
                      {isClientView ? (
                        <>
                          <td className="px-4 py-3 text-right font-semibold">{fmt(item.salesAmount)}</td>
                          <td className="px-4 py-3 text-right">{fmtPct(item.salesShare)}</td>
                          <td className="px-4 py-3 text-right text-danger">{fmt(item.currentDebt)}</td>
                          <td className="px-4 py-3 text-right">{fmtPct(item.debtShare)}</td>
                          <td className="px-4 py-3 text-right">{fmt(item.salesAmount - item.currentDebt * 0.3)}</td>
                          <td className="px-4 py-3 text-right">{fmtPct(item.marginShare)}</td>
                        </>
                      ) : (
                        <>
                          <td className="px-4 py-3 text-right font-semibold">{fmt(item.revenue)}</td>
                          <td className="px-4 py-3 text-right">{fmtPct(item.revenueShare)}</td>
                          <td className="px-4 py-3 text-right">{fmt(item.margin)}</td>
                          <td className="px-4 py-3 text-right">{fmtPct(item.marginShare)}</td>
                        </>
                      )}
                      <td className="px-4 py-3 text-right font-mono font-semibold">{fmtPct(cumulative)}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </section>
  );
}