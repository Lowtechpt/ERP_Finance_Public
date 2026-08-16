import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";
import { apiUrl } from "@/lib/api";
import { formatCurrency, formatPercent } from "@/lib/format";
import { PageWrapper, SectionHeader, KPIGrid, PageLoadingState, PageEmptyState } from "@/components";

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

  if (loading) return <PageWrapper><PageLoadingState /></PageWrapper>;
  if (!data) return <PageWrapper><PageEmptyState title="Sem dados" description="Dados de custos não disponíveis." /></PageWrapper>;

  const totalFixed = data.fixedCosts.reduce((s, c) => s + c.total, 0);
  const totalVariable = data.variableCosts.reduce((s, c) => s + c.total, 0);
  const totalEnergy = data.energyCosts.reduce((s, c) => s + c.total, 0);

  const items = [
    { label: "Custos Fixos", value: formatCurrency(totalFixed), tone: "default" as const },
    { label: "Custos Variáveis", value: formatCurrency(totalVariable), tone: "warning" as const },
    { label: "Energia", value: formatCurrency(totalEnergy), tone: "warning" as const },
    { label: "Fornecedores", value: String(data.suppliers.length), tone: "default" as const },
    { label: "Taxa de Refugo", value: formatPercent(data.waste.taxaRefugo), tone: data.waste.taxaRefugo > 5 ? "danger" as const : "success" as const },
  ];

  return (
    <PageWrapper>
      <SectionHeader category="Produção e Custos" title="Custos industriais" description="Matéria-prima, transformação, energia, desvios e custos reais por ordem." />
      <div className="mt-5"><KPIGrid items={items} /></div>

      <div className="mt-5 rounded-xl border border-border bg-background p-4">
        <div className="mb-4 flex gap-1 rounded-xl bg-muted p-1 overflow-x-auto">
          {tabs.map((tab) => (
            <button
              key={tab.key}
              type="button"
              onClick={() => setActiveTab(tab.key)}
              className={cn(
                "flex items-center gap-2 rounded-lg px-4 py-1.5 text-sm font-medium transition-colors whitespace-nowrap",
                activeTab === tab.key
                  ? "bg-background text-foreground shadow-sm"
                  : "text-muted-foreground hover:text-muted-foreground"
              )}
            >
              <span>{tab.icon}</span> {tab.label}
            </button>
          ))}
        </div>

        {activeTab === "fixos" && (
          <div className="overflow-x-auto rounded-lg border border-border">
            <table className="w-full min-w-[600px] text-sm">
              <thead className="bg-muted/60">
                <tr className="border-b border-border text-left text-xs font-medium uppercase tracking-wide text-muted-foreground">
                  <th className="px-4 py-3">Conta</th>
                  <th className="px-4 py-3">Descrição</th>
                  <th className="px-4 py-3 text-right">Total</th>
                </tr>
              </thead>
              <tbody>
                {data.fixedCosts.map((c, i) => (
                  <tr key={i} className="border-b border-border hover:bg-muted/40">
                    <td className="px-4 py-3 font-mono text-xs text-muted-foreground">{c.Conta}</td>
                    <td className="px-4 py-3 text-muted-foreground">{c.Descricao}</td>
                    <td className="px-4 py-3 text-right text-danger tabular-nums">{formatCurrency(c.total)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {activeTab === "variaveis" && (
          <div className="overflow-x-auto rounded-lg border border-border">
            <table className="w-full min-w-[600px] text-sm">
              <thead className="bg-muted/60">
                <tr className="border-b border-border text-left text-xs font-medium uppercase tracking-wide text-muted-foreground">
                  <th className="px-4 py-3">Conta</th>
                  <th className="px-4 py-3">Descrição</th>
                  <th className="px-4 py-3 text-right">Total</th>
                </tr>
              </thead>
              <tbody>
                {data.variableCosts.map((c, i) => (
                  <tr key={i} className="border-b border-border hover:bg-muted/40">
                    <td className="px-4 py-3 font-mono text-xs text-muted-foreground">{c.Conta}</td>
                    <td className="px-4 py-3 text-muted-foreground">{c.Descricao}</td>
                    <td className="px-4 py-3 text-right text-danger tabular-nums">{formatCurrency(c.total)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {activeTab === "energia" && (
          <div className="overflow-x-auto rounded-lg border border-border">
            <table className="w-full min-w-[600px] text-sm">
              <thead className="bg-muted/60">
                <tr className="border-b border-border text-left text-xs font-medium uppercase tracking-wide text-muted-foreground">
                  <th className="px-4 py-3">Conta</th>
                  <th className="px-4 py-3">Descrição</th>
                  <th className="px-4 py-3 text-right">Total</th>
                </tr>
              </thead>
              <tbody>
                {data.energyCosts.map((c, i) => (
                  <tr key={i} className="border-b border-border hover:bg-muted/40">
                    <td className="px-4 py-3 font-mono text-xs text-muted-foreground">{c.Conta}</td>
                    <td className="px-4 py-3 text-muted-foreground">{c.Descricao}</td>
                    <td className="px-4 py-3 text-right text-danger tabular-nums">{formatCurrency(c.total)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {activeTab === "refugo" && (
          <div className="grid gap-3 md:grid-cols-4">
            <div className="rounded-lg border border-border bg-background p-4">
              <p className="text-xs font-semibold text-muted-foreground">Total Ordens</p>
              <p className="mt-2 text-xl font-semibold tabular-nums text-foreground">{data.waste.totalOrdens}</p>
            </div>
            <div className="rounded-lg border border-border bg-background p-4">
              <p className="text-xs font-semibold text-muted-foreground">Ordens Refugo</p>
              <p className="mt-2 text-xl font-semibold text-danger tabular-nums">{data.waste.ordensRefugo}</p>
            </div>
            <div className="rounded-lg border border-border bg-background p-4">
              <p className="text-xs font-semibold text-muted-foreground">Custo Refugo</p>
              <p className="mt-2 text-xl font-semibold text-danger tabular-nums">{formatCurrency(data.waste.custoRefugo)}</p>
            </div>
            <div className={cn("rounded-lg border p-4", data.waste.taxaRefugo > 5 ? "border-danger/20 bg-danger-soft/40" : "border-border bg-background")}>
              <p className="text-xs font-semibold text-muted-foreground">Taxa Refugo</p>
              <p className={cn("mt-2 text-xl font-semibold tabular-nums", data.waste.taxaRefugo > 5 ? "text-danger" : "text-success")}>{formatPercent(data.waste.taxaRefugo)}</p>
            </div>
          </div>
        )}

        {activeTab === "fornecedores" && (
          <div className="overflow-x-auto rounded-lg border border-border">
            <table className="w-full min-w-[700px] text-sm">
              <thead className="bg-muted/60">
                <tr className="border-b border-border text-left text-xs font-medium uppercase tracking-wide text-muted-foreground">
                  <th className="px-4 py-3">Fornecedor</th>
                  <th className="px-4 py-3 text-right">Compras</th>
                  <th className="px-4 py-3 text-right">Docs</th>
                  <th className="px-4 py-3 text-right">Prazo Médio</th>
                </tr>
              </thead>
              <tbody>
                {data.suppliers.map((s, i) => (
                  <tr key={i} className="border-b border-border hover:bg-muted/40">
                    <td className="px-4 py-3">
                      <p className="font-medium text-muted-foreground">{s.name}</p>
                      <p className="text-xs text-muted-foreground">{s.code}</p>
                    </td>
                    <td className="px-4 py-3 text-right font-semibold text-danger tabular-nums">{formatCurrency(s.totalCompras)}</td>
                    <td className="px-4 py-3 text-right text-muted-foreground">{s.docCount}</td>
                    <td className="px-4 py-3 text-right tabular-nums text-muted-foreground">{s.prazoMedio?.toFixed(1) ?? "—"} dias</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </PageWrapper>
  );
}
