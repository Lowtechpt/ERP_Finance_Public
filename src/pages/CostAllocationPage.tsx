import { useState } from "react";
import { formatCurrency } from "@/lib/format";
import { PageWrapper, SectionHeader, KPIGrid } from "@/components";

interface DepartmentCost {
  name: string;
  pessoal: number;
  contribuicoes: number;
  encargos: number;
  custoTotal: number;
  receita: number;
  margem: number;
}

export default function CostAllocationPage() {
  // Note: loading state kept for future API integration
  const [_loading] = useState(true);

  const departmentData: Record<string, DepartmentCost> = {
    ADM: {
      name: "Administração",
      pessoal: 9300.00,
      contribuicoes: 2206.50,
      encargos: 250.00,
      custoTotal: 11756.50,
      receita: 0,
      margem: -11756.50
    },
    PRD: {
      name: "Produção",
      pessoal: 5200.00,
      contribuicoes: 1234.00,
      encargos: 200.00,
      custoTotal: 6634.00,
      receita: 45000.00,
      margem: 38366.00
    },
    COM: {
      name: "Comercial",
      pessoal: 1300.00,
      contribuicoes: 308.75,
      encargos: 50.00,
      custoTotal: 1658.75,
      receita: 83900.00,
      margem: 82241.25
    }
  };

  const totalPessoal = Object.values(departmentData).reduce((s, d) => s + d.pessoal, 0);
  const totalReceita = Object.values(departmentData).reduce((s, d) => s + d.receita, 0);
  const totalCusto = Object.values(departmentData).reduce((s, d) => s + d.custoTotal, 0);
  const margemGeral = totalReceita - totalCusto;

  // useEffect removed - data is static (future API integration)

  const margemTone = margemGeral > 0 ? "success" : "danger";
  type ToneType = "default" | "success" | "danger" | "warning" | "info";
  const kpiItems: Array<{ label: string; value: string; tone: ToneType }> = [
    { label: "Custo RH/Mês", value: formatCurrency(totalPessoal), tone: "default" },
    { label: "Receita Total", value: formatCurrency(totalReceita), tone: "success" },
    { label: "Custo Operacional", value: formatCurrency(totalCusto), tone: "warning" },
    { label: "Margem Contribuição", value: formatCurrency(margemGeral), tone: "default" },
    { label: "Margem %", value: `${((margemGeral / totalReceita) * 100).toFixed(1)}%`, tone: margemTone },
  ];

  return (
    <PageWrapper>
      <div className="space-y-8">
        <SectionHeader
          category="Custos"
          title="Análise de Custos por Departamento"
          description="Distribuição de custos de RH, receita e margem por departamento"
        />

        <KPIGrid items={kpiItems} />

        <div className="grid gap-3 md:grid-cols-3">
        {Object.entries(departmentData).map(([key, dept]) => (
          <div key={key} className="rounded-xl border border-border bg-background p-4">
            <h3 className="mb-4 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">{dept.name}</h3>
            <div className="space-y-4">
              <div className="flex justify-between pb-4 border-b border-border">
                <span className="text-sm font-medium text-muted-foreground">Pessoal:</span>
                <span className="font-semibold text-foreground tabular-nums">{formatCurrency(dept.pessoal)}</span>
              </div>
              <div className="flex justify-between pb-4 border-b border-border">
                <span className="text-sm font-medium text-muted-foreground">Encargos:</span>
                <span className="font-semibold text-foreground tabular-nums">{formatCurrency(dept.contribuicoes)}</span>
              </div>
              <div className="flex justify-between pb-4 border-b border-border">
                <span className="text-sm font-medium text-muted-foreground">Custo Total:</span>
                <span className="font-semibold text-foreground tabular-nums">{formatCurrency(dept.custoTotal)}</span>
              </div>
              <div className="flex justify-between pb-4 border-b border-border">
                <span className="text-sm font-medium text-muted-foreground">Receita:</span>
                <span className="font-semibold text-success tabular-nums">{formatCurrency(dept.receita)}</span>
              </div>
              <div className="flex justify-between font-bold text-lg">
                <span>Margem:</span>
                <span className={dept.margem >= 0 ? "text-success" : "text-danger"}>{formatCurrency(dept.margem)}</span>
              </div>
            </div>
          </div>
        ))}
      </div>
      </div>
    </PageWrapper>
  );
}
