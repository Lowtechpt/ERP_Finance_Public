import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";
import { apiUrl } from "@/lib/api";

const fmt = (n: number) => new Intl.NumberFormat("pt-PT", { style: "currency", currency: "EUR", minimumFractionDigits: 2 }).format(n);
const fmtPct = (n: number) => `${n >= 0 ? "+" : ""}${n.toFixed(1)}%`;

type CostAnalysisData = {
  fixedCosts: { Conta: string; Descricao: string; total: number }[];
  variableCosts: { Conta: string; Descricao: string; total: number }[];
  energyCosts: { Conta: string; Descricao: string; total: number }[];
  waste: { totalOrdens: number; ordensRefugo: number; custoRefugo: number; taxaRefugo: number };
  suppliers: { code: string; name: string; docCount: number; totalCompras: number; prazoMedio: number }[];
};

export default function IndustrialCostsPage() {
  const [data, setData] = useState<CostAnalysisData | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"fixos" | "variaveis" | "energia" | "refugo" | "fornecedores">("fixos");

  useEffect(() => {
    let ignore = false;
    fetch(apiUrl("/api/cost-analysis"))
      .then(r => r.json())
      .then(d => { if (!ignore) setData(d); })
      .catch(() => {})
      .finally(() => { if (!ignore) setLoading(false); });
    return () => { ignore = true; };
  }, []);

  const tabs = [
    { key: "fixos", label: "Custos Fixos", icon: "🏢" },
    { key: "variaveis", label: "Custos Variáveis", icon: "📦" },
    { key: "energia", label: "Energia", icon: "⚡" },
    { key: "refugo", label: "Refugo/Retrabalho", icon: "🗑️" },
    { key: "fornecedores", label: "Fornecedores", icon: "🚚" },
  ] as const;

  if (loading) return <div className="flex min-h-[400px] items-center justify-center text-sm text-muted-foreground">A carregar custos industriais...</div>;
  if (!data) return <div className="p-6 text-sm text-muted-foreground">Sem dados de custos disponíveis.</div>;

  return (
    <section className="rounded-lg border border-border bg-background shadow-[0_1px_6px_rgba(15,23,42,0.06)]">
      <div className="flex items-center justify-between border-b border-border p-6">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-primary">PRODUÇÃO E CUSTOS</p>
          <h2 className="mt-2 text-[24px] font-bold">Custos industriais</h2>
          <p className="mt-1 text-sm text-muted-foreground">Matéria-prima, transformação, energia, desvios e custos reais por ordem.</p>
        </div>
        <span className="rounded bg-success-soft px-2 py-1 text-xs font-semibold text-success">PRIMAVERA SQL</span>
      </div>

      <div className="border-b border-border px-6 py-3">
        <div className="flex gap-1 rounded-lg bg-muted p-1 overflow-x-auto">
          {tabs.map((tab) => (
            <button
              key={tab.key}
              type="button"
              onClick={() => setActiveTab(tab.key)}
              className={cn(
                "flex items-center gap-2 rounded-md px-4 py-1.5 text-sm font-medium transition-colors whitespace-nowrap",
                activeTab === tab.key
                  ? "bg-background text-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              <span>{tab.icon}</span> {tab.label}
            </button>
          ))}
        </div>
      </div>

      <div className="p-6">
        {activeTab === "fixos" && (
          <div className="overflow-x-auto rounded-lg border border-border">
            <table className="w-full min-w-[600px] text-sm">
              <thead>
                <tr className="border-b bg-muted/30 text-left text-xs text-muted-foreground">
                  <th className="px-4 py-3">Conta</th>
                  <th className="px-4 py-3">Descrição</th>
                  <th className="px-4 py-3 text-right">Total</th>
                </tr>
              </thead>
              <tbody>
                {data.fixedCosts.map((c, i) => (
                  <tr key={i} className="border-b hover:bg-muted/20">
                    <td className="px-4 py-3 font-mono text-xs">{c.Conta}</td>
                    <td className="px-4 py-3">{c.Descricao}</td>
                    <td className="px-4 py-3 text-right text-danger">{fmt(c.total)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {activeTab === "variaveis" && (
          <div className="overflow-x-auto rounded-lg border border-border">
            <table className="w-full min-w-[600px] text-sm">
              <thead>
                <tr className="border-b bg-muted/30 text-left text-xs text-muted-foreground">
                  <th className="px-4 py-3">Conta</th>
                  <th className="px-4 py-3">Descrição</th>
                  <th className="px-4 py-3 text-right">Total</th>
                </tr>
              </thead>
              <tbody>
                {data.variableCosts.map((c, i) => (
                  <tr key={i} className="border-b hover:bg-muted/20">
                    <td className="px-4 py-3 font-mono text-xs">{c.Conta}</td>
                    <td className="px-4 py-3">{c.Descricao}</td>
                    <td className="px-4 py-3 text-right text-danger">{fmt(c.total)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {activeTab === "energia" && (
          <div className="overflow-x-auto rounded-lg border border-border">
            <table className="w-full min-w-[600px] text-sm">
              <thead>
                <tr className="border-b bg-muted/30 text-left text-xs text-muted-foreground">
                  <th className="px-4 py-3">Conta</th>
                  <th className="px-4 py-3">Descrição</th>
                  <th className="px-4 py-3 text-right">Total</th>
                </tr>
              </thead>
              <tbody>
                {data.energyCosts.map((c, i) => (
                  <tr key={i} className="border-b hover:bg-muted/20">
                    <td className="px-4 py-3 font-mono text-xs">{c.Conta}</td>
                    <td className="px-4 py-3">{c.Descricao}</td>
                    <td className="px-4 py-3 text-right text-danger">{fmt(c.total)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {activeTab === "refugo" && (
          <div className="grid gap-4 md:grid-cols-4">
            <div className="rounded-lg border border-border bg-muted/20 p-5">
              <p className="text-xs font-semibold text-muted-foreground">Total Ordens</p>
              <p className="mt-2 text-2xl font-bold">{data.waste.totalOrdens}</p>
            </div>
            <div className="rounded-lg border border-border bg-muted/20 p-5">
              <p className="text-xs font-semibold text-muted-foreground">Ordens Refugo</p>
              <p className="mt-2 text-2xl font-bold text-danger">{data.waste.ordensRefugo}</p>
            </div>
            <div className="rounded-lg border border-border bg-muted/20 p-5">
              <p className="text-xs font-semibold text-muted-foreground">Custo Refugo</p>
              <p className="mt-2 text-2xl font-bold text-danger">{fmt(data.waste.custoRefugo)}</p>
            </div>
            <div className={cn("rounded-lg border p-5", data.waste.taxaRefugo > 5 ? "border-danger/30 bg-danger/5" : "border-border bg-muted/20")}>
              <p className="text-xs font-semibold text-muted-foreground">Taxa Refugo</p>
              <p className={cn("mt-2 text-2xl font-bold", data.waste.taxaRefugo > 5 ? "text-danger" : "text-success")}>{fmtPct(data.waste.taxaRefugo)}</p>
            </div>
          </div>
        )}

        {activeTab === "fornecedores" && (
          <div className="overflow-x-auto rounded-lg border border-border">
            <table className="w-full min-w-[700px] text-sm">
              <thead>
                <tr className="border-b bg-muted/30 text-left text-xs text-muted-foreground">
                  <th className="px-4 py-3">Fornecedor</th>
                  <th className="px-4 py-3 text-right">Compras</th>
                  <th className="px-4 py-3 text-right">Docs</th>
                  <th className="px-4 py-3 text-right">Prazo Médio</th>
                </tr>
              </thead>
              <tbody>
                {data.suppliers.map((s, i) => (
                  <tr key={i} className="border-b hover:bg-muted/20">
                    <td className="px-4 py-3">
                      <p className="font-medium">{s.name}</p>
                      <p className="text-xs text-muted-foreground">{s.code}</p>
                    </td>
                    <td className="px-4 py-3 text-right font-semibold text-danger">{fmt(s.totalCompras)}</td>
                    <td className="px-4 py-3 text-right">{s.docCount}</td>
                    <td className="px-4 py-3 text-right">{s.prazoMedio?.toFixed(1) ?? "—"} dias</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </section>
  );
}