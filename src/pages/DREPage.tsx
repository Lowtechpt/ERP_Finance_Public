import { useEffect, useState } from "react";
import { BarChart3 } from "lucide-react";
import { cn } from "@/lib/utils";
import { apiUrl } from "@/lib/api";
import { PageWrapper, SectionHeader, KPIGrid, PageLoadingState, PageEmptyState } from "@/components";
import { formatCurrency, formatPercent } from "@/lib/format";

type DREData = {
  period: string;
  vendasMercadorias: number;
  descontos: number;
  vendasLiquidas: number;
  custoMercadoriasVendidas: number;
  custoProducaoReal: number;
  custoProducaoPrevisto: number;
  custoTotal: number;
  margemBruta: number;
  margemBrutaPct: number;
  custosOperacionais: number;
  ebitda: number;
  ebitdaPct: number;
  lucroLiquido: number;
  lucroLiquidoPct: number;
};

export default function DREPage() {
  const [data, setData] = useState<DREData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let ignore = false;
    fetch(apiUrl("/api/dre"))
      .then((r) => r.json())
      .then((d) => { if (!ignore) setData(d); })
      .catch(() => {})
      .finally(() => { if (!ignore) setLoading(false); });
    return () => { ignore = true; };
  }, []);

  if (loading) return <PageLoadingState message="A carregar dados de DRE..." />;
  if (!data) return <PageEmptyState title="Sem dados de DRE" description="Nenhum dado de demonstração de resultados disponível" icon={BarChart3} />;

  const rows = [
    { label: "Vendas de mercadorias", value: data.vendasMercadorias, type: "revenue" },
    { label: "Descontos concedidos", value: -data.descontos, type: "revenue" },
    { label: "Vendas líquidas", value: data.vendasLiquidas, type: "total", bold: true },
    { label: "CMV (custo mercadorias vendidas)", value: -data.custoMercadoriasVendidas, type: "cost" },
    { label: "Custos de produção reais", value: -data.custoProducaoReal, type: "cost" },
    { label: "Custo total (CMV + Produção)", value: -data.custoTotal, type: "total", bold: true },
    { label: "Margem bruta", value: data.margemBruta, type: "margin", pct: data.margemBrutaPct, bold: true },
    { label: "Custos operacionais", value: -data.custosOperacionais, type: "cost" },
    { label: "EBITDA", value: data.ebitda, type: "margin", pct: data.ebitdaPct, bold: true },
    { label: "Lucro líquido", value: data.lucroLiquido, type: "result", pct: data.lucroLiquidoPct, bold: true },
  ];

  const kpis = [
    { label: "Vendas Líquidas", value: formatCurrency(data.vendasLiquidas), tone: "default" as const },
    { label: "Custos Totais", value: formatCurrency(data.custoTotal), tone: "danger" as const },
    { label: "Margem Bruta", value: formatCurrency(data.margemBruta), tone: data.margemBrutaPct >= 0 ? "success" as const : "danger" as const },
    { label: "Margem Bruta %", value: formatPercent(data.margemBrutaPct), tone: data.margemBrutaPct >= 0 ? "success" as const : "danger" as const },
    { label: "EBITDA %", value: formatPercent(data.ebitdaPct), tone: data.ebitdaPct >= 0 ? "info" as const : "danger" as const },
  ];

  return (
    <PageWrapper>
      <SectionHeader
        category="Demonstração de Resultados"
        categoryIcon={BarChart3}
        title="DRE e Margens"
        description={`${data.period} — Demonstração de resultados detalhada`}
      />

      <KPIGrid items={kpis} className="mb-5" />


        <div className="bg-background rounded-xl shadow-sm border border-border overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-border bg-muted/60">
                  <th className="px-8 py-6 text-left text-xs font-semibold text-muted-foreground tracking-wider">Conta</th>
                  <th className="px-8 py-6 text-right text-xs font-semibold text-muted-foreground tracking-wider">Valor</th>
                  <th className="px-8 py-6 text-right text-xs font-semibold text-muted-foreground tracking-wider">% Vendas</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((row, i) => {
                  const isPositive = row.value >= 0;
                  const pct = data.vendasLiquidas && row.type !== "total" && row.type !== "result"
                    ? (Math.abs(row.value) / data.vendasLiquidas) * 100 * (row.value < 0 ? -1 : 1)
                    : null;
                  return (
                    <tr key={i} className={cn("border-b border-border hover:bg-muted/40 transition-colors text-sm", row.bold && "bg-muted/50 font-semibold")}>
                      <td className="px-8 py-5 text-foreground font-medium">{row.label}</td>
                      <td className={cn("px-8 py-5 text-right font-semibold tabular-nums", row.type === "revenue" && "text-success", row.type === "cost" && "text-danger", row.type === "margin" && (isPositive ? "text-success" : "text-danger"), row.type === "result" && (isPositive ? "text-success" : "text-danger"), row.type === "total" && "text-foreground font-bold")}>
                        {formatCurrency(row.value)}
                      </td>
                      <td className={cn("px-8 py-5 text-right text-xs tabular-nums font-semibold", pct !== null && (pct >= 0 ? "text-success" : "text-danger"))}>
                        {pct !== null ? formatPercent(pct) : "—"}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        <div className="grid gap-3 md:grid-cols-3">
          <div className={cn("rounded-lg border p-4 shadow-sm", data.margemBruta >= 0 ? "border-success/20 bg-success-soft/30" : "border-danger/20 bg-danger-soft/30")}>
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Margem Bruta</p>
            <p className={cn("mt-1.5 text-2xl font-semibold tabular-nums", data.margemBruta >= 0 ? "text-success" : "text-danger")}>{formatCurrency(data.margemBruta)}</p>
            <p className={cn("mt-2 text-sm tabular-nums", data.margemBrutaPct >= 0 ? "text-success" : "text-danger")}>{formatPercent(data.margemBrutaPct)} das vendas líquidas</p>
          </div>

          <div className={cn("rounded-lg border p-4 shadow-sm", data.ebitda >= 0 ? "border-info/20 bg-info-soft/30" : "border-danger/20 bg-danger-soft/30")}>
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">EBITDA</p>
            <p className={cn("mt-1.5 text-2xl font-semibold tabular-nums", data.ebitda >= 0 ? "text-info" : "text-danger")}>{formatCurrency(data.ebitda)}</p>
            <p className={cn("mt-2 text-sm", data.ebitdaPct >= 0 ? "text-info" : "text-danger")}>{formatPercent(data.ebitdaPct)} das vendas líquidas</p>
          </div>

          <div className={cn("rounded-lg border p-4 shadow-sm", data.lucroLiquido >= 0 ? "border-border bg-muted/30" : "border-danger/20 bg-danger-soft/30")}>
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Lucro Líquido</p>
            <p className={cn("mt-1.5 text-2xl font-semibold tabular-nums", data.lucroLiquido >= 0 ? "text-foreground" : "text-danger")}>{formatCurrency(data.lucroLiquido)}</p>
            <p className={cn("mt-2 text-sm", data.lucroLiquidoPct >= 0 ? "text-success" : "text-danger")}>{formatPercent(data.lucroLiquidoPct)} das vendas líquidas</p>
          </div>
        </div>
    </PageWrapper>
  );
}
