import { useState, useEffect } from "react";
import { PieChart } from "lucide-react";
import { apiUrl } from "@/lib/api";
import { cn } from "@/lib/utils";
import { formatCurrency } from "@/lib/format";
import { PageWrapper, SectionHeader, KPIGrid, PageLoadingState, PageEmptyState } from "@/components";

interface BudgetData {
  orcamento: {
    vendasOrc: number;
    custosOrc: number;
  };
  real: {
    vendasLiquidas: number;
    custoTotal: number;
  };
  desvios: {
    vendas: number;
    custos: number;
  };
}

export default function BudgetVsActualPage() {
  const [data, setData] = useState<BudgetData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let ignore = false;
    fetch(apiUrl("/api/budget-vs-actual"))
      .then((r) => r.json() as Promise<BudgetData>)
      .then((d) => {
        if (!ignore) setData(d);
      })
      .catch(() => {
        if (!ignore) setError("Falha ao carregar dados orçamentais");
      })
      .finally(() => {
        if (!ignore) setLoading(false);
      });
    return () => {
      ignore = true;
    };
  }, []);

  if (loading) {
    return <PageWrapper><PageLoadingState /></PageWrapper>;
  }

  if (error) {
    return <PageWrapper><PageEmptyState title="Erro" description={error} /></PageWrapper>;
  }

  if (!data) {
    return <PageWrapper><PageEmptyState title="Sem dados" description="Dados orçamentais não disponíveis." /></PageWrapper>;
  }

  const items = [
    { label: "Vendas orçado", value: formatCurrency(data.orcamento.vendasOrc), tone: "default" as const },
    { label: "Vendas realizado", value: formatCurrency(data.real.vendasLiquidas), tone: "success" as const },
    { label: "Desvio vendas", value: `${data.desvios.vendas > 0 ? "+" : ""}${data.desvios.vendas}%`, tone: data.desvios.vendas > 0 ? "success" as const : "danger" as const },
    { label: "Custos orçado", value: formatCurrency(data.orcamento.custosOrc), tone: "default" as const },
    { label: "Custos realizado", value: formatCurrency(data.real.custoTotal), tone: "danger" as const },
  ];

  return (
    <PageWrapper>
      <SectionHeader category="Controlo Orçamental" title="Orçado vs Realizado" description="Comparação entre orçamento e valores reais de vendas e custos." />
      <div className="mt-5"><KPIGrid items={items} /></div>

      <div className="mt-5 bg-background rounded-xl shadow-sm border border-border overflow-hidden">
          <div className="border-b border-border px-8 py-3">
            <div className="flex items-center gap-2">
              <PieChart className="h-5 w-5 text-success" />
              <h2 className="text-sm font-semibold text-muted-foreground tracking-wider">Comparativo Vendas e Custos</h2>
            </div>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-border bg-muted/60">
                  <th className="px-8 py-6 text-left text-xs font-semibold text-muted-foreground tracking-wider">Categoria</th>
                  <th className="px-8 py-6 text-right text-xs font-semibold text-muted-foreground tracking-wider">Orçado</th>
                  <th className="px-8 py-6 text-right text-xs font-semibold text-muted-foreground tracking-wider">Realizado</th>
                  <th className="px-8 py-6 text-right text-xs font-semibold text-muted-foreground tracking-wider">Desvio</th>
                </tr>
              </thead>
              <tbody>
                <tr className="border-b border-border hover:bg-muted/40 transition-colors text-sm">
                  <td className="px-8 py-5 font-medium text-foreground">Vendas</td>
                  <td className="px-8 py-5 text-right font-semibold text-foreground tabular-nums">{formatCurrency(data.orcamento.vendasOrc)}</td>
                  <td className="px-8 py-5 text-right font-semibold text-success tabular-nums">{formatCurrency(data.real.vendasLiquidas)}</td>
                  <td className={cn("px-8 py-5 text-right font-bold tabular-nums", data.desvios.vendas > 0 ? "text-success" : "text-danger")}>
                    {data.desvios.vendas > 0 ? "+" : ""}{data.desvios.vendas}%
                  </td>
                </tr>
                <tr className="border-b border-border hover:bg-muted/40 transition-colors text-sm">
                  <td className="px-8 py-5 font-medium text-foreground">Custos</td>
                  <td className="px-8 py-5 text-right font-semibold text-foreground tabular-nums">{formatCurrency(data.orcamento.custosOrc)}</td>
                  <td className="px-8 py-5 text-right font-semibold text-danger tabular-nums">{formatCurrency(data.real.custoTotal)}</td>
                  <td className={cn("px-8 py-5 text-right font-bold tabular-nums", data.desvios.custos > 0 ? "text-danger" : "text-success")}>
                    {data.desvios.custos > 0 ? "+" : ""}{data.desvios.custos}%
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
      </div>
    </PageWrapper>
  );
}
