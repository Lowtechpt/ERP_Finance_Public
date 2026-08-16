import { useState, useEffect } from "react";
import { Phone } from "lucide-react";
import { apiUrl } from "@/lib/api";
import { formatCurrency } from "@/lib/format";
import { PageWrapper, SectionHeader, KPIGrid, PageLoadingState, PageEmptyState } from "@/components";

interface OverdueItem {
  docs: number;
  total: string;
  diasAtraso: number;
  [key: string]: string | number;
}

interface CollectionsResponse {
  overdue: OverdueItem[];
}

export default function CollectionsCommsPage() {
  const [overdue, setOverdue] = useState<OverdueItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let ignore = false;
    fetch(apiUrl("/api/collections"))
      .then((r) => r.json() as Promise<CollectionsResponse>)
      .then((d) => {
        if (!ignore) setOverdue(d.overdue || []);
      })
      .catch(() => {
        if (!ignore) setError("Falha ao carregar cobranças");
      })
      .finally(() => {
        if (!ignore) setLoading(false);
      });
    return () => {
      ignore = true;
    };
  }, []);

  const totalDocs = overdue.reduce((s, c) => s + (c.docs || 0), 0);
  const totalAtraso = overdue.reduce((s, c) => s + parseFloat(String(c.total || 0)), 0);
  const maxDias = overdue.reduce((m, c) => Math.max(m, c.diasAtraso || 0), 0);

  if (loading) {
    return <PageLoadingState message="A carregar cobranças..." />;
  }

  if (error) {
    return <PageEmptyState title="Erro" description={error} />;
  }

  const kpiItems = [
    { label: "Clientes em atraso", value: overdue.length, tone: "default" as const },
    { label: "Documentos", value: totalDocs, tone: "default" as const },
    { label: "Total em atraso", value: formatCurrency(totalAtraso), tone: "danger" as const },
    { label: "Máx. dias atraso", value: `${maxDias} dias`, tone: "danger" as const },
    { label: "Estado", value: "Ativo", tone: "success" as const },
  ];

  return (
    <PageWrapper>
      <div className="space-y-8">
        <KPIGrid items={kpiItems} />

        <SectionHeader
          category="Cobranças"
          title="Comunicações de Cobrança"
          description="Clientes com valores em atraso e dias de incumprimento para priorizar contactos"
        />

        <div className="bg-background rounded-xl shadow-sm border border-border overflow-hidden">
          <div className="border-b border-border px-8 py-3">
            <div className="flex items-center gap-2">
              <Phone className="h-5 w-5 text-info" />
              <h2 className="text-sm font-semibold text-muted-foreground tracking-wider">Clientes em atraso</h2>
            </div>
          </div>
          {overdue.length === 0 ? (
            <div className="px-8 py-12 text-center text-muted-foreground">Sem clientes em atraso.</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-border bg-muted/60">
                    <th className="px-8 py-6 text-left text-xs font-semibold text-muted-foreground tracking-wider">Cliente</th>
                    <th className="px-8 py-6 text-right text-xs font-semibold text-muted-foreground tracking-wider">Docs</th>
                    <th className="px-8 py-6 text-right text-xs font-semibold text-muted-foreground tracking-wider">Total em Atraso</th>
                    <th className="px-8 py-6 text-right text-xs font-semibold text-muted-foreground tracking-wider">Dias em Atraso</th>
                  </tr>
                </thead>
                <tbody>
                  {overdue.map((c, i) => (
                    <tr key={i} className="border-b border-border hover:bg-muted/40 transition-colors text-sm cursor-pointer">
                      <td className="px-8 py-5 font-medium text-foreground">{c.Nome}</td>
                      <td className="px-8 py-5 text-right text-muted-foreground">{c.docs}</td>
                      <td className="px-8 py-5 text-right font-bold text-danger tabular-nums">{formatCurrency(parseFloat(c.total))}</td>
                      <td className="px-8 py-5 text-right text-danger">{c.diasAtraso} dias</td>
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
