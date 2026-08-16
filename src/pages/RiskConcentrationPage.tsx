import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";
import { apiUrl } from "@/lib/api";
import { formatCurrency, formatPercent } from "@/lib/format";
import { PageWrapper, SectionHeader, KPIGrid, PageLoadingState, PageEmptyState } from "@/components";

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
    ]).then(([custData, prodData]: [{ customers: Array<{ code: string; name: string; salesAmount: number; currentDebt: number }> }, Array<{ code: string; name: string; revenue: number; margin: number }>]) => {
      if (ignore) return;
      const customers = custData.customers ?? [];
      const products: Array<{ code: string; name: string; revenue: number; margin: number }> = Array.isArray(prodData) ? prodData : [];

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
      const hhiSales = byClient.reduce((s, c) => s + Math.pow(c.salesShare / 100, 2), 0) * 10000;
      const hhiDebt = byClient.reduce((s, c) => s + Math.pow(c.debtShare / 100, 2), 0) * 10000;

      setData({
        byClient,
        byProduct,
        summary: {
          top5SalesShare: top5.reduce((s, c) => s + c.salesShare, 0),
          top5DebtShare: top5.reduce((s, c) => s + c.debtShare, 0),
          top5MarginShare: top5.reduce((s, c) => s + c.marginShare, 0),
          hhiSales: Math.round(hhiSales),
          hhiDebt: Math.round(hhiDebt),
        },
      });
    }).finally(() => { if (!ignore) setLoading(false); });
    return () => { ignore = true; };
  }, []);

  if (loading) return <PageLoadingState message="A carregar concentração de risco..." />;
  if (!data) return <PageEmptyState title="Sem dados" description="Sem dados de concentração disponíveis." />;

  const currentData = view === "clientes" ? data.byClient : data.byProduct;
  const isClientView = view === "clientes";

  const kpiItems = [
    { label: "Top 5 Faturação", value: formatPercent(data.summary.top5SalesShare), tone: "default" as const, subtext: "Concentração vendas" },
    { label: "Top 5 Dívida", value: formatPercent(data.summary.top5DebtShare), tone: "danger" as const, subtext: "Concentração recebíveis" },
    { label: "HHI Vendas", value: String(data.summary.hhiSales), tone: data.summary.hhiSales > 2500 ? "danger" as const : "default" as const, subtext: data.summary.hhiSales > 2500 ? "Alta concentração" : "Moderada" },
    { label: "HHI Dívida", value: String(data.summary.hhiDebt), tone: data.summary.hhiDebt > 2500 ? "danger" as const : "default" as const, subtext: data.summary.hhiDebt > 2500 ? "Alta concentração" : "Moderada" },
    { label: "Top 5 Margem", value: formatPercent(data.summary.top5MarginShare), tone: "success" as const, subtext: "Concentração margem" },
  ];

  return (
    <PageWrapper>
      <div className="w-full space-y-8">
        <SectionHeader
          category="Clientes"
          title="Concentração de risco"
          description="Peso de clientes/produtos no volume, dívida, margem e risco de cobrança."
        />

        <KPIGrid items={kpiItems} />

        <div className="mt-5 rounded-xl border border-border bg-background p-4">
        <div className="mb-4 flex gap-1 rounded-xl bg-muted p-1 w-fit">
          {[
            { key: "clientes", label: "Por Cliente" },
            { key: "produtos", label: "Por Produto" },
          ].map((tab) => (
            <button
              key={tab.key}
              type="button"
              onClick={() => setView(tab.key as "clientes" | "produtos")}
              className={cn(
                "rounded-lg px-4 py-1.5 text-sm font-medium transition-colors",
                view === tab.key
                  ? "bg-background text-foreground shadow-sm"
                  : "text-muted-foreground hover:text-muted-foreground"
              )}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {currentData.length === 0 ? (
          <p className="text-sm text-muted-foreground">Sem dados para esta dimensão.</p>
        ) : (
          <div className="overflow-x-auto rounded-lg border border-border">
            <table className="w-full min-w-[800px] text-sm">
              <thead className="bg-muted/60">
                <tr className="border-b border-border text-left text-xs font-medium uppercase tracking-wide text-muted-foreground">
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
                {currentData.map((item, i) => {
                  const itemAsClient = item as unknown as typeof data.byClient[0];
                  const itemAsProduct = item as unknown as typeof data.byProduct[0];
                  const cumulative = currentData.slice(0, i + 1).reduce((s, x) => {
                    const xAsClient = x as unknown as typeof data.byClient[0];
                    const xAsProduct = x as unknown as typeof data.byProduct[0];
                    return s + (isClientView ? xAsClient.salesShare : xAsProduct.revenueShare);
                  }, 0);
                  return (
                    <tr key={`${item.code}-${i}`} className="border-b border-border hover:bg-muted/40">
                      <td className="px-4 py-3">
                        <p className="font-medium text-muted-foreground">{item.name}</p>
                        <p className="text-xs text-muted-foreground">{item.code}</p>
                      </td>
                      {isClientView ? (
                        <>
                          <td className="px-4 py-3 text-right font-semibold tabular-nums text-muted-foreground">{formatCurrency(itemAsClient.salesAmount)}</td>
                          <td className="px-4 py-3 text-right tabular-nums text-muted-foreground">{formatPercent(itemAsClient.salesShare)}</td>
                          <td className="px-4 py-3 text-right text-danger tabular-nums">{formatCurrency(itemAsClient.currentDebt)}</td>
                          <td className="px-4 py-3 text-right tabular-nums text-muted-foreground">{formatPercent(itemAsClient.debtShare)}</td>
                          <td className="px-4 py-3 text-right tabular-nums text-muted-foreground">{formatCurrency(itemAsClient.salesAmount - itemAsClient.currentDebt * 0.3)}</td>
                          <td className="px-4 py-3 text-right tabular-nums text-muted-foreground">{formatPercent(itemAsClient.marginShare)}</td>
                        </>
                      ) : (
                        <>
                          <td className="px-4 py-3 text-right font-semibold tabular-nums text-muted-foreground">{formatCurrency(itemAsProduct.revenue)}</td>
                          <td className="px-4 py-3 text-right tabular-nums text-muted-foreground">{formatPercent(itemAsProduct.revenueShare)}</td>
                          <td className="px-4 py-3 text-right tabular-nums text-muted-foreground">{formatCurrency(itemAsProduct.margin)}</td>
                          <td className="px-4 py-3 text-right tabular-nums text-muted-foreground">{formatPercent(itemAsProduct.marginShare)}</td>
                        </>
                      )}
                      <td className="px-4 py-3 text-right font-mono font-semibold tabular-nums text-muted-foreground">{formatPercent(cumulative)}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
        </div>
      </div>
    </PageWrapper>
  );
}
