import { useEffect, useState } from "react";
import { Factory } from "lucide-react";
import { cn } from "@/lib/utils";
import { apiUrl } from "@/lib/api";
import { PageWrapper, SectionHeader, KPIGrid, PageLoadingState, PageEmptyState } from "@/components";
import { formatCurrency } from "@/lib/format";

type Order = {
  Id: string; OrdemFabrico: string; Artigo: string; ArtigoDescricao: string; Quantidade: number;
  CustoMateriaisPrevisto: number; CustoMateriaisReal: number;
  CustoTransformacaoPrevisto: number; CustoTransformacaoReal: number;
  OutrosCustosPrevito: number; OutrosCustosReal: number;
  DataOrdemFabrico: string; Estado: number;
};
type ArticleCost = {
  artigo: string; quantidade: number;
  custoMateriaisPrevisto: number; custoMateriaisReal: number;
  custoTransformacaoPrevisto: number; custoTransformacaoReal: number;
  totalPrevisto: number; totalReal: number;
  custoUnitarioPrevisto: number; custoUnitarioReal: number;
  desvio: number; desvioPct: number;
  OutrosCustosPrevito: number; OutrosCustosReal: number;
};
type Component = {
  IDOrdemFabrico: number; Componente: string;
  QtPrevista: number; QtConsumida: number; Preco: number;
  custoReal: number; custoPrevisto: number;
};
type Summary = {
  totalOrdens: number;
  totalMatPrevisto: number; totalMatReal: number;
  totalTransfPrevisto: number; totalTransfReal: number;
  totalPrevisto: number; totalReal: number; desvioTotal: number;
};
type ProductionData = {
  summary: Summary;
  orders: Order[];
  components: Component[];
  articleCosts: ArticleCost[];
};

const estadoLabel: Record<number, { label: string; cls: string }> = {
  1: { label: "Prevista",  cls: "bg-muted text-muted-foreground" },
  2: { label: "Em curso",  cls: "bg-info-soft text-info" },
  3: { label: "Suspensa",  cls: "bg-warning-soft text-warning" },
  4: { label: "Concluída", cls: "bg-success-soft text-success" },
  5: { label: "Fechada",   cls: "bg-success-soft text-success" },
};

export default function ProductionPage() {
  const [data, setData] = useState<ProductionData | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);

  useEffect(() => {
    let ignore = false;
    fetch(apiUrl("/api/production-costs"))
      .then((r) => r.json() as Promise<ProductionData & { source: string }>)
      .then((d) => { if (!ignore) setData(d); })
      .catch(() => {})
      .finally(() => { if (!ignore) setLoading(false); });
    return () => { ignore = true; };
  }, []);

  if (loading) return <PageLoadingState message="A carregar dados de produção..." />;
  if (!data) return <PageEmptyState title="Sem dados de produção" description="Nenhum dado de produção disponível" icon={Factory} />;

  const s = data.summary;
  const desvioTotal = s ? s.totalReal - s.totalPrevisto : 0;

  const kpis = [
    { label: "Ordens de fabrico", value: String(s?.totalOrdens ?? 0), tone: "default" as const },
    { label: "Custo materiais real", value: formatCurrency(s?.totalMatReal ?? 0), tone: "danger" as const },
    { label: "Custo transformação real", value: formatCurrency(s?.totalTransfReal ?? 0), tone: "default" as const },
    { label: "Desvio total", value: formatCurrency(desvioTotal), tone: desvioTotal > 0 ? "danger" as const : "success" as const },
    { label: "Total real", value: formatCurrency(s?.totalReal ?? 0), tone: "default" as const },
  ];

  return (
    <PageWrapper>
      <SectionHeader
        category="Produção"
        categoryIcon={Factory}
        title="Custos industriais"
        description="Ordens de fabrico, componentes, custos previstos vs reais e desvios"
      />

      <KPIGrid items={kpis} className="mb-5" />

      {/* Custo por artigo */}
      <div className="mt-5 rounded-xl border border-border bg-background p-4">
        <h3 className="mb-4 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">Custo por artigo produzido</h3>
        <div className="overflow-x-auto rounded-lg border border-border">
          <table className="w-full text-sm">
            <thead className="bg-muted/60">
              <tr className="border-b border-border text-left text-xs font-medium uppercase tracking-wide text-muted-foreground">
                <th className="px-4 py-3">Artigo</th>
                <th className="px-4 py-3 text-right">Qtd</th>
                <th className="px-4 py-3 text-right" title="Estimativa de materiais antes da ordem">Mat. estim.</th>
                <th className="px-4 py-3 text-right" title="Custo de transformação estimado">Transf. estim.</th>
                <th className="px-4 py-3 text-right" title="Total estimado (mat + transf)">Total estim.</th>
                <th className="px-4 py-3 text-right" title="Custo real após conclusão da ordem">Mat. real</th>
                <th className="px-4 py-3 text-right" title="Total real (mat + transf concluídos)">Total real</th>
                <th className="px-4 py-3 text-right">Custo unit.</th>
                <th className="px-4 py-3 text-right">Desvio</th>
              </tr>
            </thead>
            <tbody>
              {(data?.articleCosts ?? []).map((a) => {
                const desc = data?.orders.find((o) => o.Artigo === a.artigo)?.ArtigoDescricao ?? a.artigo;
                return (
                <tr key={a.artigo} className="border-b border-border hover:bg-muted/40">
                  <td className="px-4 py-3">
                    <p className="font-semibold text-muted-foreground">{desc}</p>
                    {desc !== a.artigo && <p className="text-xs text-muted-foreground">{a.artigo}</p>}
                  </td>
                  <td className="px-4 py-3 text-right text-muted-foreground">{a.quantidade}</td>
                  <td className="px-4 py-3 text-right tabular-nums text-muted-foreground">{formatCurrency(a.custoMateriaisPrevisto)}</td>
                  <td className="px-4 py-3 text-right text-muted-foreground tabular-nums">{formatCurrency(a.custoTransformacaoPrevisto)}</td>
                  <td className="px-4 py-3 text-right font-semibold text-muted-foreground">{formatCurrency(a.totalPrevisto)}</td>
                  <td className="px-4 py-3 text-right tabular-nums text-muted-foreground">{formatCurrency(a.custoMateriaisReal)}</td>
                  <td className="px-4 py-3 text-right font-semibold text-muted-foreground">{formatCurrency(a.totalReal)}</td>
                  <td className="px-4 py-3 text-right tabular-nums text-muted-foreground">{formatCurrency(a.custoUnitarioReal)}</td>
                  <td className={cn("px-4 py-3 text-right font-semibold tabular-nums", a.desvio > 0 ? "text-danger" : a.desvio < 0 ? "text-success" : "text-muted-foreground")}>
                    {a.desvio > 0 ? "+" : ""}{formatCurrency(a.desvio)}
                    <span className="ml-1 text-xs text-muted-foreground tabular-nums">({a.desvioPct.toFixed(1)}%)</span>
                  </td>
                </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Ordens de fabrico */}
      <div className="mt-5 rounded-xl border border-border bg-background p-4">
        <h3 className="mb-4 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">Ordens de fabrico</h3>
        <div className="overflow-x-auto rounded-lg border border-border">
          <table className="w-full text-sm">
            <thead className="bg-muted/60">
              <tr className="border-b border-border text-left text-xs font-medium uppercase tracking-wide text-muted-foreground">
                <th className="px-4 py-3">Ordem</th>
                <th className="px-4 py-3">Artigo</th>
                <th className="px-4 py-3 text-right">Qtd</th>
                <th className="px-4 py-3 text-right">Mat. real</th>
                <th className="px-4 py-3 text-right">Transf. real</th>
                <th className="px-4 py-3 text-right">Total real</th>
                <th className="px-4 py-3">Data</th>
                <th className="px-4 py-3">Estado</th>
              </tr>
            </thead>
            <tbody>
              {(data?.orders ?? []).map((o) => {
                const totalReal = o.CustoMateriaisReal + o.CustoTransformacaoReal + o.OutrosCustosReal;
                const est = estadoLabel[o.Estado] ?? { label: `Estado ${o.Estado}`, cls: "bg-muted text-muted-foreground" };
                const isSelected = selectedOrder?.OrdemFabrico === o.OrdemFabrico;
                return (
                  <tr key={o.Id} className={cn("cursor-pointer border-b border-border hover:bg-muted/40", isSelected && "bg-muted/60")}
                    onClick={() => setSelectedOrder(isSelected ? null : o)}>
                    <td className="px-4 py-3 font-semibold text-muted-foreground">{o.OrdemFabrico}</td>
                    <td className="px-4 py-3">
                      <p className="font-medium text-muted-foreground">{o.ArtigoDescricao}</p>
                      {o.ArtigoDescricao !== o.Artigo && <p className="text-xs text-muted-foreground">{o.Artigo}</p>}
                    </td>
                    <td className="px-4 py-3 text-right text-muted-foreground">{o.Quantidade}</td>
                    <td className="px-4 py-3 text-right tabular-nums text-muted-foreground">{formatCurrency(o.CustoMateriaisReal)}</td>
                    <td className="px-4 py-3 text-right tabular-nums text-muted-foreground">{formatCurrency(o.CustoTransformacaoReal)}</td>
                    <td className="px-4 py-3 text-right font-semibold text-muted-foreground">{formatCurrency(totalReal)}</td>
                    <td className="px-4 py-3 text-xs text-muted-foreground">{o.DataOrdemFabrico?.slice(0, 10)}</td>
                    <td className="px-4 py-3">
                      <span className={cn("rounded-md px-2 py-1 text-xs font-semibold", est.cls)}>{est.label}</span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Componentes da ordem seleccionada */}
        {selectedOrder && (
          <div className="mt-4 rounded-lg border border-info/20 bg-info-soft/30 p-4">
            <p className="mb-3 text-sm font-bold text-muted-foreground">Componentes — Ordem {selectedOrder.OrdemFabrico} ({selectedOrder.Artigo})</p>
            <div className="overflow-x-auto rounded-xl border border-border">
              <table className="w-full text-xs">
                <thead className="bg-muted/60">
                  <tr className="border-b border-border text-left text-muted-foreground">
                    <th className="px-3 py-2">Componente</th>
                    <th className="px-3 py-2 text-right">Qt prevista</th>
                    <th className="px-3 py-2 text-right">Qt consumida</th>
                    <th className="px-3 py-2 text-right">Preço unit.</th>
                    <th className="px-3 py-2 text-right">Custo previsto</th>
                    <th className="px-3 py-2 text-right">Custo real</th>
                  </tr>
                </thead>
                <tbody>
                  {(data?.components ?? [])
                    .filter((c) => String(c.IDOrdemFabrico) === String((selectedOrder as unknown as Record<string, unknown>).IDOrdemFabrico ?? (selectedOrder as unknown as Record<string, unknown>).Id))
                    .map((c, i) => (
                      <tr key={i} className="border-b border-border hover:bg-muted/40">
                        <td className="px-3 py-2 font-medium text-muted-foreground">{c.Componente}</td>
                        <td className="px-3 py-2 text-right text-muted-foreground">{c.QtPrevista}</td>
                        <td className={cn("px-3 py-2 text-right text-muted-foreground", c.QtConsumida > c.QtPrevista ? "text-danger font-semibold" : "")}>{c.QtConsumida}</td>
                        <td className="px-3 py-2 text-right text-muted-foreground">{formatCurrency(c.Preco)}</td>
                        <td className="px-3 py-2 text-right text-muted-foreground">{formatCurrency(c.custoPrevisto)}</td>
                        <td className="px-3 py-2 text-right font-semibold text-muted-foreground">{formatCurrency(c.custoReal)}</td>
                      </tr>
                    ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      <div className="mt-4 flex items-center justify-between">
        <span className="rounded-md bg-success-soft px-2 py-1 text-xs font-semibold text-success">PRIMAVERA SQL</span>
        <span className="text-xs text-muted-foreground">PRIDEMO · GPR_OrdemFabrico</span>
      </div>
    </PageWrapper>
  );
}
