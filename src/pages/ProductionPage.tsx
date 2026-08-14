import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";
import { apiUrl } from "@/lib/api";

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

const fmt = (n: number) =>
  new Intl.NumberFormat("pt-PT", { style: "currency", currency: "EUR", minimumFractionDigits: 2 }).format(n);

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

  if (loading) return <div className="flex min-h-[400px] items-center justify-center text-sm text-muted-foreground">A carregar dados de produção...</div>;

  const s = data?.summary;
  const desvioTotal = s ? s.totalReal - s.totalPrevisto : 0;

  return (
    <section className="rounded-lg border border-border bg-background shadow-[0_1px_6px_rgba(15,23,42,0.06)]">
      <div className="border-b border-border p-6">
        <p className="text-xs font-semibold uppercase tracking-wide text-primary">PRODUÇÃO</p>
        <h2 className="mt-2 text-[24px] font-bold">Custos industriais</h2>
        <p className="mt-2 text-sm text-muted-foreground">Ordens de fabrico, componentes, custos previstos vs reais e desvios.</p>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 gap-4 p-6 md:grid-cols-4">
        {[
          { label: "Ordens de fabrico", value: String(s?.totalOrdens ?? 0), cls: "" },
          { label: "Custo materiais real", value: fmt(s?.totalMatReal ?? 0), cls: "text-danger" },
          { label: "Custo transformação real", value: fmt(s?.totalTransfReal ?? 0), cls: "" },
          { label: "Desvio total", value: fmt(desvioTotal), cls: desvioTotal > 0 ? "text-danger" : "text-success" },
        ].map((k) => (
          <div key={k.label} className="rounded-lg border border-border bg-muted/20 p-4">
            <p className="text-xs text-muted-foreground">{k.label}</p>
            <p className={cn("mt-2 text-xl font-bold", k.cls)}>{k.value}</p>
          </div>
        ))}
      </div>

      {/* Custo por artigo */}
      <div className="border-t border-border p-6">
        <h3 className="mb-4 font-bold">Custo por artigo produzido</h3>
        <div className="overflow-x-auto rounded-lg border border-border">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b bg-muted/30 text-left text-xs text-muted-foreground">
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
                <tr key={a.artigo} className="border-b hover:bg-muted/20">
                  <td className="px-4 py-3">
                    <p className="font-semibold">{desc}</p>
                    {desc !== a.artigo && <p className="text-xs text-muted-foreground">{a.artigo}</p>}
                  </td>
                  <td className="px-4 py-3 text-right">{a.quantidade}</td>
                  <td className="px-4 py-3 text-right">{fmt(a.custoMateriaisPrevisto)}</td>
                  <td className="px-4 py-3 text-right text-muted-foreground">{fmt(a.custoTransformacaoPrevisto)}</td>
                  <td className="px-4 py-3 text-right font-semibold">{fmt(a.totalPrevisto)}</td>
                  <td className="px-4 py-3 text-right">{fmt(a.custoMateriaisReal)}</td>
                  <td className="px-4 py-3 text-right font-semibold">{fmt(a.totalReal)}</td>
                  <td className="px-4 py-3 text-right">{fmt(a.custoUnitarioReal)}</td>
                  <td className={cn("px-4 py-3 text-right font-semibold", a.desvio > 0 ? "text-danger" : a.desvio < 0 ? "text-success" : "")}>
                    {a.desvio > 0 ? "+" : ""}{fmt(a.desvio)}
                    <span className="ml-1 text-xs text-muted-foreground">({a.desvioPct.toFixed(1)}%)</span>
                  </td>
                </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Ordens de fabrico */}
      <div className="border-t border-border p-6">
        <h3 className="mb-4 font-bold">Ordens de fabrico</h3>
        <div className="overflow-x-auto rounded-lg border border-border">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b bg-muted/30 text-left text-xs text-muted-foreground">
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
                  <tr key={o.Id} className={cn("cursor-pointer border-b hover:bg-muted/20", isSelected && "bg-muted/30")}
                    onClick={() => setSelectedOrder(isSelected ? null : o)}>
                    <td className="px-4 py-3 font-semibold">{o.OrdemFabrico}</td>
                    <td className="px-4 py-3">
                      <p className="font-medium">{o.ArtigoDescricao}</p>
                      {o.ArtigoDescricao !== o.Artigo && <p className="text-xs text-muted-foreground">{o.Artigo}</p>}
                    </td>
                    <td className="px-4 py-3 text-right">{o.Quantidade}</td>
                    <td className="px-4 py-3 text-right">{fmt(o.CustoMateriaisReal)}</td>
                    <td className="px-4 py-3 text-right">{fmt(o.CustoTransformacaoReal)}</td>
                    <td className="px-4 py-3 text-right font-semibold">{fmt(totalReal)}</td>
                    <td className="px-4 py-3 text-xs">{o.DataOrdemFabrico?.slice(0, 10)}</td>
                    <td className="px-4 py-3">
                      <span className={cn("rounded px-2 py-1 text-xs font-semibold", est.cls)}>{est.label}</span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Componentes da ordem seleccionada */}
        {selectedOrder && (
          <div className="mt-4 rounded-lg border border-primary/30 p-4">
            <p className="mb-3 text-sm font-bold">Componentes — Ordem {selectedOrder.OrdemFabrico} ({selectedOrder.Artigo})</p>
            <div className="overflow-x-auto rounded border border-border">
              <table className="w-full text-xs">
                <thead>
                  <tr className="border-b bg-muted/30 text-left text-muted-foreground">
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
                      <tr key={i} className="border-b hover:bg-muted/10">
                        <td className="px-3 py-2 font-medium">{c.Componente}</td>
                        <td className="px-3 py-2 text-right">{c.QtPrevista}</td>
                        <td className={cn("px-3 py-2 text-right", c.QtConsumida > c.QtPrevista ? "text-danger font-semibold" : "")}>{c.QtConsumida}</td>
                        <td className="px-3 py-2 text-right">{fmt(c.Preco)}</td>
                        <td className="px-3 py-2 text-right">{fmt(c.custoPrevisto)}</td>
                        <td className="px-3 py-2 text-right font-semibold">{fmt(c.custoReal)}</td>
                      </tr>
                    ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      <div className="flex items-center justify-between border-t border-border px-6 py-3">
        <span className="rounded-md bg-success-soft px-2 py-1 text-xs font-semibold text-success">PRIMAVERA SQL</span>
        <span className="text-xs text-muted-foreground">PRIDEMO · GPR_OrdemFabrico</span>
      </div>
    </section>
  );
}
