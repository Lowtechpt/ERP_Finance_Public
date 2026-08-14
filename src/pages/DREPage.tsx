import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";
import { apiUrl } from "@/lib/api";

const fmt = (n: number) => new Intl.NumberFormat("pt-PT", { style: "currency", currency: "EUR", minimumFractionDigits: 2 }).format(n);
const fmtPct = (n: number) => `${n >= 0 ? "+" : ""}${n.toFixed(1)}%`;

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

  if (loading) return <div className="flex min-h-[400px] items-center justify-center text-sm text-muted-foreground">A carregar DRE...</div>;
  if (!data) return <div className="p-6 text-sm text-muted-foreground">Sem dados de DRE disponíveis.</div>;

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

  return (
    <section className="rounded-lg border border-border bg-background shadow-[0_1px_6px_rgba(15,23,42,0.06)]">
      <div className="flex items-center justify-between border-b border-border p-6">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-primary">ANÁLISE FINANCEIRA</p>
          <h2 className="mt-2 text-[24px] font-bold">DRE e margens</h2>
          <p className="mt-1 text-sm text-muted-foreground">{data.period} — Demonstração de resultados detalhada.</p>
        </div>
        <span className="rounded bg-success-soft px-2 py-1 text-xs font-semibold text-success">PRIMAVERA SQL</span>
      </div>

      <div className="p-6">
        <div className="overflow-x-auto rounded-lg border border-border">
          <table className="w-full min-w-[700px] text-sm">
            <thead>
              <tr className="border-b bg-muted/30 text-left text-xs text-muted-foreground">
                <th className="px-4 py-3 w-[320px]">Conta</th>
                <th className="px-4 py-3 text-right">Valor</th>
                <th className="px-4 py-3 text-right w-32">% Vendas</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row, i) => {
                const isPositive = row.value >= 0;
                const pct = data.vendasLiquidas && row.type !== "total" && row.type !== "result"
                  ? (Math.abs(row.value) / data.vendasLiquidas) * 100 * (row.value < 0 ? -1 : 1)
                  : null;
                return (
                  <tr key={i} className={cn("border-b hover:bg-muted/20", row.bold && "font-semibold")}>
                    <td className="px-4 py-3">{row.label}</td>
                    <td className={cn("px-4 py-3 text-right font-medium", row.type === "revenue" && "text-success", row.type === "cost" && "text-danger", row.type === "margin" && (isPositive ? "text-success" : "text-danger"), row.type === "result" && (isPositive ? "text-success" : "text-danger"), row.type === "total" && "text-foreground")}>
                      {fmt(row.value)}
                    </td>
                    <td className={cn("px-4 py-3 text-right text-xs", pct !== null && (pct >= 0 ? "text-success" : "text-danger"))}>
                      {pct !== null ? fmtPct(pct) : "—"}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        <div className="mt-6 grid gap-4 md:grid-cols-3">
          <div className={cn("rounded-lg border p-5", data.margemBruta >= 0 ? "border-success/30 bg-success/5" : "border-danger/30 bg-danger/5")}>
            <p className="text-xs font-semibold text-muted-foreground">Margem Bruta</p>
            <p className={cn("mt-2 text-2xl font-bold", data.margemBruta >= 0 ? "text-success" : "text-danger")}>{fmt(data.margemBruta)}</p>
            <p className={cn("text-sm", data.margemBrutaPct >= 0 ? "text-success" : "text-danger")}>{fmtPct(data.margemBrutaPct)} das vendas líquidas</p>
          </div>
          <div className={cn("rounded-lg border p-5", data.ebitda >= 0 ? "border-success/30 bg-success/5" : "border-danger/30 bg-danger/5")}>
            <p className="text-xs font-semibold text-muted-foreground">EBITDA</p>
            <p className={cn("mt-2 text-2xl font-bold", data.ebitda >= 0 ? "text-success" : "text-danger")}>{fmt(data.ebitda)}</p>
            <p className={cn("text-sm", data.ebitdaPct >= 0 ? "text-success" : "text-danger")}>{fmtPct(data.ebitdaPct)} das vendas líquidas</p>
          </div>
          <div className={cn("rounded-lg border p-5", data.lucroLiquido >= 0 ? "border-success/30 bg-success/5" : "border-danger/30 bg-danger/5")}>
            <p className="text-xs font-semibold text-muted-foreground">Lucro Líquido</p>
            <p className={cn("mt-2 text-2xl font-bold", data.lucroLiquido >= 0 ? "text-success" : "text-danger")}>{fmt(data.lucroLiquido)}</p>
            <p className={cn("text-sm", data.lucroLiquidoPct >= 0 ? "text-success" : "text-danger")}>{fmtPct(data.lucroLiquidoPct)} das vendas líquidas</p>
          </div>
        </div>
      </div>
    </section>
  );
}