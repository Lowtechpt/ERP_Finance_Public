import { useState, useEffect } from "react";
import { BarChart3 } from "lucide-react";
import { apiUrl } from "@/lib/api";
import { formatCurrency } from "@/lib/format";
import { PageWrapper, SectionHeader, KPIGrid, PageLoadingState, PageEmptyState } from "@/components";

interface Period {
  vendas: string;
  compras: string;
  mes: string;
}

interface ComparePeriodsResponse {
  periods: Period[];
}

export default function ComparePeriodsPage() {
  const [periods, setPeriods] = useState<Period[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let ignore = false;
    fetch(apiUrl("/api/compare-periods?meses=12"))
      .then((r) => r.json() as Promise<ComparePeriodsResponse>)
      .then((d) => {
        if (!ignore) setPeriods(d.periods || []);
      })
      .catch(() => {
        if (!ignore) setError("Falha ao carregar comparação de períodos");
      })
      .finally(() => {
        if (!ignore) setLoading(false);
      });
    return () => {
      ignore = true;
    };
  }, []);

  const totalVendas = periods.reduce((s, p) => s + parseFloat(String(p.vendas || 0)), 0);
  const totalCompras = periods.reduce((s, p) => s + parseFloat(String(p.compras || 0)), 0);
  const melhorMes = periods.length > 0
    ? periods.reduce((best: Period, p: Period) => (!best || parseFloat(p.vendas) > parseFloat(best.vendas) ? p : best))
    : null;

  if (loading) {
    return <PageLoadingState message="A carregar comparação de períodos..." />;
  }

  if (error) {
    return <PageEmptyState title="Erro" description={error} />;
  }

  const saldo = totalVendas - totalCompras;
  const saldoTone = saldo >= 0 ? "success" : "danger";
  type ToneType = "default" | "success" | "danger" | "warning" | "info";
  const kpiItems: Array<{ label: string; value: string | number; tone: ToneType }> = [
    { label: "Períodos", value: periods.length, tone: "default" },
    { label: "Vendas totais", value: formatCurrency(totalVendas), tone: "success" },
    { label: "Compras totais", value: formatCurrency(totalCompras), tone: "danger" },
    { label: "Saldo (V-C)", value: formatCurrency(saldo), tone: saldoTone },
    { label: "Melhor mês vendas", value: melhorMes ? melhorMes.mes : "—", tone: "default" },
  ];

  return (
    <PageWrapper>
      <div className="space-y-8">
        <KPIGrid items={kpiItems} />

        <SectionHeader
          category="Análise de Períodos"
          title="Comparar Períodos"
          description="Evolução mensal de vendas vs compras nos últimos 12 meses"
        />

        <div className="bg-background rounded-xl shadow-sm border border-border overflow-hidden">
          <div className="border-b border-border px-8 py-3">
            <div className="flex items-center gap-2">
              <BarChart3 className="h-5 w-5 text-info" />
              <h2 className="text-sm font-semibold text-muted-foreground tracking-wider">Comparação mensal</h2>
            </div>
          </div>
          {periods.length === 0 ? (
            <div className="px-8 py-12 text-center text-muted-foreground">Sem dados de períodos disponíveis.</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-border bg-muted/60">
                    <th className="px-8 py-6 text-left text-xs font-semibold text-muted-foreground tracking-wider">Período</th>
                    <th className="px-8 py-6 text-right text-xs font-semibold text-muted-foreground tracking-wider">Vendas</th>
                    <th className="px-8 py-6 text-right text-xs font-semibold text-muted-foreground tracking-wider">Compras</th>
                  </tr>
                </thead>
                <tbody>
                  {periods.map((p, i) => (
                    <tr key={i} className="border-b border-border hover:bg-muted/40 transition-colors text-sm cursor-pointer">
                      <td className="px-8 py-5 font-medium text-foreground">{p.mes}</td>
                      <td className="px-8 py-5 text-right font-semibold text-success tabular-nums">{formatCurrency(parseFloat(p.vendas))}</td>
                      <td className="px-8 py-5 text-right font-semibold text-danger tabular-nums">{formatCurrency(parseFloat(p.compras))}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </PageWrapper>
  );
}
