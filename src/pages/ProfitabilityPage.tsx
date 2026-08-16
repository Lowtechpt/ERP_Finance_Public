import { useState, useEffect } from "react";
import { TrendingUp } from "lucide-react";
import { apiUrl } from "@/lib/api";
import { formatCurrency, formatPercent } from "@/lib/format";
import { PageWrapper, SectionHeader, KPIGrid, PageLoadingState, PageEmptyState } from "@/components";

interface Product {
  revenue: string | number;
  cogs: string | number;
  margin: string | number;
  [key: string]: string | number;
}

interface ProfitabilityResponse {
  products: Product[];
}

export default function ProfitabilityPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let ignore = false;
    fetch(apiUrl("/api/profitability"))
      .then((r) => r.json() as Promise<ProfitabilityResponse>)
      .then((d) => {
        if (!ignore) setProducts(d.products || []);
      })
      .catch(() => {
        if (!ignore) setError("Falha ao carregar dados de rentabilidade");
      })
      .finally(() => {
        if (!ignore) setLoading(false);
      });
    return () => {
      ignore = true;
    };
  }, []);

  const totalReceita = products.reduce((s, p) => s + Number(p.revenue || 0), 0);
  const totalCogs = products.reduce((s, p) => s + Number(p.cogs || 0), 0);
  const totalMargem = products.reduce((s, p) => s + Number(p.margin || 0), 0);
  const margemMedia = totalReceita > 0 ? (totalMargem / totalReceita) * 100 : 0;

  if (loading) {
    return <PageLoadingState message="Carregando rentabilidade..." />;
  }

  if (error) {
    return <PageEmptyState title="Erro" description={error} />;
  }

  const kpiItems = [
    { label: "Artigos", value: String(products.length), tone: "default" as const },
    { label: "Receita total", value: formatCurrency(totalReceita), tone: "success" as const },
    { label: "COGS total", value: formatCurrency(totalCogs), tone: "danger" as const },
    { label: "Margem total", value: formatCurrency(totalMargem), tone: totalMargem >= 0 ? "success" as const : "danger" as const },
    { label: "Margem média", value: formatPercent(margemMedia), tone: "default" as const },
  ];

  return (
    <PageWrapper>
      <div className="w-full space-y-8">
        <SectionHeader
          category="Rentabilidade"
          title="Rentabilidade por Produto"
          description="Receita, custo e margem por artigo para identificar produtos mais rentáveis"
        />

        <KPIGrid items={kpiItems} />

        <div className="bg-background rounded-xl shadow-sm border border-border overflow-hidden">
          <div className="border-b border-border px-8 py-3">
            <div className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-success" />
              <h2 className="text-sm font-semibold text-muted-foreground tracking-wider">Tabela de rentabilidade</h2>
            </div>
          </div>
          {products.length === 0 ? (
            <div className="px-8 py-12 text-center text-muted-foreground">Sem dados de rentabilidade disponíveis.</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-border bg-muted/60">
                    <th className="px-8 py-6 text-left text-xs font-semibold text-muted-foreground tracking-wider">Artigo</th>
                    <th className="px-8 py-6 text-right text-xs font-semibold text-muted-foreground tracking-wider">Quantidade</th>
                    <th className="px-8 py-6 text-right text-xs font-semibold text-muted-foreground tracking-wider">Receita</th>
                    <th className="px-8 py-6 text-right text-xs font-semibold text-muted-foreground tracking-wider">COGS</th>
                    <th className="px-8 py-6 text-right text-xs font-semibold text-muted-foreground tracking-wider">Margem €</th>
                    <th className="px-8 py-6 text-right text-xs font-semibold text-muted-foreground tracking-wider">Margem %</th>
                  </tr>
                </thead>
                <tbody>
                  {products.map((p, i) => {
                    const marginPct = Number(p.revenue) > 0 ? ((Number(p.margin) / Number(p.revenue)) * 100) : 0;
                    return (
                      <tr key={i} className="border-b border-border hover:bg-muted/40 transition-colors text-sm cursor-pointer">
                        <td className="px-8 py-5 font-medium text-foreground">{p.Artigo}</td>
                        <td className="px-8 py-5 text-right text-muted-foreground">{p.qty}</td>
                        <td className="px-8 py-5 text-right tabular-nums text-foreground">{formatCurrency(Number(p.revenue))}</td>
                        <td className="px-8 py-5 text-right tabular-nums text-danger">{formatCurrency(Number(p.cogs))}</td>
                        <td className="px-8 py-5 text-right font-semibold text-success tabular-nums">{formatCurrency(Number(p.margin))}</td>
                        <td className="px-8 py-5 text-right font-semibold tabular-nums text-foreground">{marginPct.toFixed(1)}%</td>
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
