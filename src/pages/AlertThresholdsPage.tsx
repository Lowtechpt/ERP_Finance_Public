import { useState } from "react";
import { Bell } from "lucide-react";
import { PageWrapper, SectionHeader, KPIGrid } from "@/components";

export default function AlertThresholdsPage() {
  const [thresholds, setThresholds] = useState({
    margemMinima: 15,
    diasAtrasoCritico: 30,
    saldoBaixo: 10000,
    custoMaximo: 5000,
  });

  const handleChange = (key: string, value: number) => {
    setThresholds(p => ({ ...p, [key]: value }));
  };

  const items = [
    { label: "Margem mínima", value: `${thresholds.margemMinima}%`, tone: "success" as const },
    { label: "Dias atraso crítico", value: `${thresholds.diasAtrasoCritico} dias`, tone: "danger" as const },
    { label: "Saldo mínimo", value: `${thresholds.saldoBaixo.toLocaleString("pt-PT")} €`, tone: "default" as const },
    { label: "Custo máximo", value: `${thresholds.custoMaximo.toLocaleString("pt-PT")} €`, tone: "warning" as const },
    { label: "Estado", value: "Configurável", tone: "default" as const },
  ];

  return (
    <PageWrapper>
      <SectionHeader category="Configuração" title="Configuração de Alertas" description="Define os limites que disparam alertas financeiros no sistema" />
      <div className="mt-5"><KPIGrid items={items} /></div>

      <div className="mt-5 bg-background rounded-xl shadow-sm border border-border overflow-hidden">
          <div className="border-b border-border px-8 py-3">
            <div className="flex items-center gap-2">
              <Bell className="h-5 w-5 text-info" />
              <h2 className="text-sm font-semibold text-muted-foreground tracking-wider">Limites de alerta</h2>
            </div>
          </div>
          <div className="p-8 space-y-3">
            <div className="grid gap-3 md:grid-cols-2">
              <div className="rounded-lg border border-border bg-background p-4 shadow-sm">
                <label className="block text-sm font-semibold text-muted-foreground">Margem Mínima (%)</label>
                <input type="number" value={thresholds.margemMinima} onChange={(e) => handleChange("margemMinima", parseInt(e.target.value))} className="mt-2 w-full rounded-lg border border-border bg-background px-4 py-2 text-sm text-muted-foreground focus:border-info/20 focus:outline-none" />
              </div>
              <div className="rounded-lg border border-border bg-background p-4 shadow-sm">
                <label className="block text-sm font-semibold text-muted-foreground">Dias em Atraso Crítico</label>
                <input type="number" value={thresholds.diasAtrasoCritico} onChange={(e) => handleChange("diasAtrasoCritico", parseInt(e.target.value))} className="mt-2 w-full rounded-lg border border-border bg-background px-4 py-2 text-sm text-muted-foreground focus:border-info/20 focus:outline-none" />
              </div>
              <div className="rounded-lg border border-border bg-background p-4 shadow-sm">
                <label className="block text-sm font-semibold text-muted-foreground">Saldo Mínimo (€)</label>
                <input type="number" value={thresholds.saldoBaixo} onChange={(e) => handleChange("saldoBaixo", parseInt(e.target.value))} className="mt-2 w-full rounded-lg border border-border bg-background px-4 py-2 text-sm text-muted-foreground focus:border-info/20 focus:outline-none" />
              </div>
              <div className="rounded-lg border border-border bg-background p-4 shadow-sm">
                <label className="block text-sm font-semibold text-muted-foreground">Custo Máximo (€)</label>
                <input type="number" value={thresholds.custoMaximo} onChange={(e) => handleChange("custoMaximo", parseInt(e.target.value))} className="mt-2 w-full rounded-lg border border-border bg-background px-4 py-2 text-sm text-muted-foreground focus:border-info/20 focus:outline-none" />
              </div>
            </div>
            <button className="w-full rounded-lg bg-success py-3 text-sm font-semibold text-white transition hover:bg-success">Guardar Thresholds</button>
          </div>
      </div>
    </PageWrapper>
  );
}
