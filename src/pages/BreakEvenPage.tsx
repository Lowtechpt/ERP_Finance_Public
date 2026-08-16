import { useState, useEffect } from "react";
import { AlertTriangle } from "lucide-react";
import { apiUrl } from "@/lib/api";
import { cn } from "@/lib/utils";
import { formatCurrency } from "@/lib/format";
import { PageWrapper, SectionHeader, KPIGrid, PageLoadingState, PageEmptyState } from "@/components";

interface BreakEvenData {
  breakeven: number;
  beUnidades: number;
  margemPct: number;
  custosFixos: number;
}

export default function BreakEvenPage() {
  const [data, setData] = useState<BreakEvenData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let ignore = false;
    fetch(apiUrl("/api/breakeven"))
      .then((r) => r.json() as Promise<BreakEvenData>)
      .then((d) => {
        if (!ignore) setData(d);
      })
      .catch(() => {
        if (!ignore) setError("Falha ao carregar dados de break-even");
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
    return <PageWrapper><PageEmptyState title="Sem dados" description="Dados de ponto de equilíbrio não disponíveis." /></PageWrapper>;
  }

  const isPositive = data.margemPct > 0;

  const items = [
    { label: "Break-Even", value: formatCurrency(data.breakeven), tone: "warning" as const },
    { label: "% das Vendas", value: `${data.beUnidades}%`, tone: "default" as const },
    { label: "Margem Contribuição", value: `${data.margemPct.toFixed(1)}%`, tone: "success" as const },
    { label: "Custos Fixos", value: formatCurrency(data.custosFixos), tone: "default" as const },
    { label: "Estado", value: isPositive ? "Cobre custos" : "Atenção", tone: isPositive ? "success" as const : "danger" as const },
  ];

  return (
    <PageWrapper>
      <SectionHeader category="Análise de Custeio" title="Ponto de Equilíbrio" description="Volume de vendas necessário para cobrir custos fixos e variáveis" />
      <div className="mt-5"><KPIGrid items={items} /></div>

      <div className="mt-5 bg-background rounded-xl shadow-sm border border-border overflow-hidden">
          <div className="border-b border-border px-8 py-3">
            <div className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-warning" />
              <h2 className="text-sm font-semibold text-muted-foreground tracking-wider">Indicadores de equilíbrio</h2>
            </div>
          </div>
          <div className="p-8">
            <div className="grid gap-3 md:grid-cols-4">
              <div className={cn("rounded-lg border p-4 shadow-sm", "border-warning/20 bg-warning-soft/30")}>
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Break-Even</p>
                <p className="mt-1.5 text-2xl font-semibold text-warning tabular-nums">{formatCurrency(data.breakeven)}</p>
              </div>
              <div className={cn("rounded-lg border p-4 shadow-sm", "border-border bg-muted/30")}>
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">% das Vendas</p>
                <p className="mt-1.5 text-2xl font-semibold text-foreground tabular-nums">{data.beUnidades}%</p>
              </div>
              <div className={cn("rounded-lg border p-4 shadow-sm", "border-success/20 bg-success-soft/30")}>
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Margem Contribuição</p>
                <p className="mt-1.5 text-2xl font-semibold text-success tabular-nums">{data.margemPct.toFixed(1)}%</p>
              </div>
              <div className={cn("rounded-lg border p-4 shadow-sm", "border-border bg-muted/30")}>
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Custos Fixos</p>
                <p className="mt-1.5 text-2xl font-semibold text-foreground tabular-nums">{formatCurrency(data.custosFixos)}</p>
              </div>
            </div>
          </div>
      </div>
    </PageWrapper>
  );
}
