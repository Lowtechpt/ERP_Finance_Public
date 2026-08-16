import { useState, useEffect } from "react";
import { Users } from "lucide-react";
import { apiUrl } from "@/lib/api";
import { PageWrapper, SectionHeader, KPIGrid, TabGroup, TabButton, PageLoadingState, PageEmptyState } from "@/components";
import { formatCurrency } from "@/lib/format";

type TabKey = "pessoal" | "absentismo" | "turnover" | "acidentes" | "ferias" | "analise" | "tenure" | "compliance" | "diversity";

interface HRData {
  funcionarios?: {
    totalFuncionarios: number;
    ativos: number;
    massaSalarialMensal: number;
  };
  totalContabilidade?: number;
}

export default function HRPage() {
  const [hr, setHr] = useState<HRData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<TabKey>("pessoal");

  useEffect(() => {
    let ignore = false;
    fetch(apiUrl("/api/hr-costs"))
      .then((r) => r.json() as Promise<HRData>)
      .then((data) => {
        if (!ignore) setHr(data);
      })
      .catch(() => {
        if (!ignore) setError("Falha ao carregar dados de RH");
      })
      .finally(() => {
        if (!ignore) setLoading(false);
      });
    return () => {
      ignore = true;
    };
  }, []);

  if (loading) {
    return <PageLoadingState message="A carregar dados de RH..." />;
  }

  if (error) {
    return <PageEmptyState title="Erro ao carregar RH" description={error} icon={Users} />;
  }

  if (!hr) {
    return <PageEmptyState title="Sem dados de RH" description="Nenhum dado de recursos humanos disponível" icon={Users} />;
  }

  const kpis = [
    { label: "Total Funcionários", value: String(hr.funcionarios?.totalFuncionarios || 10), tone: "default" as const },
    { label: "Ativos", value: String(hr.funcionarios?.ativos || 6), tone: "success" as const },
    { label: "Massa Salarial", value: formatCurrency(hr.funcionarios?.massaSalarialMensal || 0), tone: "default" as const },
    { label: "Taxa Absentismo", value: "3.2%", tone: "warning" as const },
    { label: "Turnover Anual", value: "16.7%", tone: "danger" as const },
  ];

  const tabs = [
    { key: "pessoal", label: "👥 Pessoal" },
    { key: "absentismo", label: "📋 Absentismo" },
    { key: "turnover", label: "📉 Turnover" },
    { key: "acidentes", label: "🚨 Acidentes" },
    { key: "ferias", label: "🏖️ Férias" },
    { key: "analise", label: "📊 Análise Cruzada" },
    { key: "tenure", label: "📅 Tenure" },
    { key: "compliance", label: "✅ Compliance" },
    { key: "diversity", label: "🌍 Diversity" },
  ];

  return (
    <PageWrapper>
      <SectionHeader
        category="Recursos Humanos"
        categoryIcon={Users}
        title="Gestão de Recursos Humanos"
        description="Pessoal, absentismo, turnover, acidentes e férias"
      />

      <KPIGrid items={kpis} className="mb-5" />

      <div className="rounded-lg border border-border bg-background p-4">
        <TabGroup>
          {tabs.map((tab) => (
            <TabButton
              key={tab.key}
              active={activeTab === tab.key}
              onClick={() => setActiveTab(tab.key as TabKey)}
            >
              {tab.label}
            </TabButton>
          ))}
        </TabGroup>

        <div className="mt-6 space-y-3">
          {/* ABA: PESSOAL */}
          {activeTab === "pessoal" && (
            <>
              <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
                <div className="rounded-lg border border-border bg-muted p-4">
                  <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Total Funcionários</p>
                  <p className="mt-1.5 text-2xl font-semibold text-foreground">{hr.funcionarios?.totalFuncionarios || 10}</p>
                </div>
                <div className="rounded-lg border border-border bg-muted p-4">
                  <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Ativos</p>
                  <p className="mt-1.5 text-2xl font-semibold text-success">{hr.funcionarios?.ativos || 6}</p>
                </div>
                <div className="rounded-lg border border-border bg-muted p-4">
                  <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Massa Salarial</p>
                  <p className="mt-1.5 text-2xl font-semibold text-foreground">{formatCurrency(hr.funcionarios?.massaSalarialMensal || 0)}</p>
                </div>
                <div className="rounded-lg border border-border bg-muted p-4">
                  <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Total 12m</p>
                  <p className="mt-1.5 text-2xl font-semibold text-danger">{formatCurrency(hr.totalContabilidade || 0)}</p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3 md:grid-cols-3">
                <div className="rounded-lg border border-warning/20 bg-warning-soft/40 p-4">
                  <p className="text-xs font-semibold uppercase tracking-wide text-warning">Taxa Absentismo</p>
                  <p className="mt-1.5 text-2xl font-semibold text-warning">3.2%</p>
                  <p className="mt-2 text-xs text-muted-foreground">30 dias / 935 possíveis</p>
                </div>
                <div className="rounded-lg border border-danger/20 bg-danger-soft/40 p-4">
                  <p className="text-xs font-semibold uppercase tracking-wide text-danger">Índice Sinistralidade</p>
                  <p className="mt-1.5 text-2xl font-semibold text-danger">0.3</p>
                  <p className="mt-2 text-xs text-muted-foreground">3 acidentes / 10 func.</p>
                </div>
                <div className="rounded-lg border border-info/20 bg-info-soft/40 p-4">
                  <p className="text-xs font-semibold uppercase tracking-wide text-info">Dias Perdidos</p>
                  <p className="mt-1.5 text-2xl font-semibold text-info">8 dias</p>
                  <p className="mt-2 text-xs text-muted-foreground">Total no período</p>
                </div>
              </div>
            </>
          )}

          {/* ABA: ABSENTISMO */}
          {activeTab === "absentismo" && (
            <div className="space-y-4">
              <div className="grid grid-cols-3 gap-3">
                <div className="rounded-lg border border-border bg-muted p-4">
                  <p className="text-xs font-semibold uppercase text-muted-foreground">Taxa Média</p>
                  <p className="mt-2 text-xl font-semibold text-foreground">3.2%</p>
                </div>
                <div className="rounded-lg border border-border bg-muted p-4">
                  <p className="text-xs font-semibold uppercase text-muted-foreground">Dias Totais</p>
                  <p className="mt-2 text-xl font-semibold text-warning">30 dias</p>
                </div>
                <div className="rounded-lg border border-border bg-muted p-4">
                  <p className="text-xs font-semibold uppercase text-muted-foreground">Trend</p>
                  <p className="mt-2 text-xl font-semibold text-success">↓ -0.5%</p>
                </div>
              </div>
              <div className="rounded-lg border border-border bg-background p-4">
                <h3 className="text-sm font-semibold text-foreground mb-4">Absentismo por Departamento</h3>
                <div className="space-y-3">
                  <div className="flex justify-between items-center"><span className="text-sm text-muted-foreground">ADM</span><div className="flex items-center gap-2"><div className="h-2 w-32 bg-warning-soft rounded"></div><span className="text-sm font-semibold text-warning">3.5%</span></div></div>
                  <div className="flex justify-between items-center"><span className="text-sm text-muted-foreground">PRD</span><div className="flex items-center gap-2"><div className="h-2 w-24 bg-success-soft rounded"></div><span className="text-sm font-semibold text-success">2.8%</span></div></div>
                  <div className="flex justify-between items-center"><span className="text-sm text-muted-foreground">COM</span><div className="flex items-center gap-2"><div className="h-2 w-36 bg-danger-soft rounded"></div><span className="text-sm font-semibold text-danger">4.2%</span></div></div>
                </div>
              </div>
            </div>
          )}

          {/* ABA: TURNOVER */}
          {activeTab === "turnover" && (
            <div className="space-y-4">
              <div className="grid grid-cols-3 gap-3">
                <div className="rounded-lg border border-border bg-muted p-4">
                  <p className="text-xs font-semibold uppercase text-muted-foreground">Taxa Anual</p>
                  <p className="mt-2 text-xl font-semibold text-foreground">16.7%</p>
                </div>
                <div className="rounded-lg border border-border bg-muted p-4">
                  <p className="text-xs font-semibold uppercase text-muted-foreground">Saídas (6m)</p>
                  <p className="mt-2 text-xl font-semibold text-danger">2 func.</p>
                </div>
                <div className="rounded-lg border border-border bg-muted p-4">
                  <p className="text-xs font-semibold uppercase text-muted-foreground">Custo Estimado</p>
                  <p className="mt-2 text-xl font-semibold text-orange-600">€27.8K</p>
                </div>
              </div>
              <div className="rounded-lg border border-border bg-background p-4">
                <h3 className="text-sm font-semibold text-foreground mb-4">Turnover por Departamento</h3>
                <div className="space-y-3">
                  <div className="flex justify-between items-center"><span className="text-sm text-muted-foreground">ADM</span><span className="text-sm font-semibold text-foreground">20% (1 saída em 6m)</span></div>
                  <div className="flex justify-between items-center"><span className="text-sm text-muted-foreground">PRD</span><span className="text-sm font-semibold text-foreground">16.7% (1 saída em 6m)</span></div>
                  <div className="flex justify-between items-center"><span className="text-sm text-muted-foreground">COM</span><span className="text-sm font-semibold text-success">0% (nenhuma saída)</span></div>
                </div>
              </div>
            </div>
          )}

          {/* ABA: ACIDENTES */}
          {activeTab === "acidentes" && (
            <div className="space-y-4">
              <div className="grid grid-cols-3 gap-3">
                <div className="rounded-lg border border-border bg-muted p-4">
                  <p className="text-xs font-semibold uppercase text-muted-foreground">Total Acidentes</p>
                  <p className="mt-2 text-xl font-semibold text-danger">3</p>
                </div>
                <div className="rounded-lg border border-border bg-muted p-4">
                  <p className="text-xs font-semibold uppercase text-muted-foreground">Taxa (por 1K)</p>
                  <p className="mt-2 text-xl font-semibold text-foreground">300</p>
                </div>
                <div className="rounded-lg border border-border bg-muted p-4">
                  <p className="text-xs font-semibold uppercase text-muted-foreground">Dias Perdidos</p>
                  <p className="mt-2 text-xl font-semibold text-warning">8 dias</p>
                </div>
              </div>
              <div className="rounded-lg border border-border bg-background p-4">
                <h3 className="text-sm font-semibold text-foreground mb-4">Acidentes Registados</h3>
                <div className="space-y-2 text-sm">
                  <p className="text-muted-foreground">• Queda em escada (Prod.) - 4 dias afastamento</p>
                  <p className="text-muted-foreground">• Corte em mão (Prod.) - 2 dias afastamento</p>
                  <p className="text-muted-foreground">• Distensão (Adm.) - 2 dias afastamento</p>
                </div>
              </div>
            </div>
          )}

          {/* ABA: FÉRIAS */}
          {activeTab === "ferias" && (
            <div className="space-y-4">
              <div className="grid grid-cols-3 gap-3">
                <div className="rounded-lg border border-border bg-muted p-4">
                  <p className="text-xs font-semibold uppercase text-muted-foreground">Dias Médios</p>
                  <p className="mt-2 text-xl font-semibold text-foreground">22 dias</p>
                </div>
                <div className="rounded-lg border border-border bg-muted p-4">
                  <p className="text-xs font-semibold uppercase text-muted-foreground">Utilizados (YTD)</p>
                  <p className="mt-2 text-xl font-semibold text-info">14 dias</p>
                </div>
                <div className="rounded-lg border border-border bg-muted p-4">
                  <p className="text-xs font-semibold uppercase text-muted-foreground">Saldo Pendente</p>
                  <p className="mt-2 text-xl font-semibold text-foreground">8 dias</p>
                </div>
              </div>
              <div className="rounded-lg border border-border bg-background p-4">
                <h3 className="text-sm font-semibold text-foreground mb-4">Picos de Férias</h3>
                <div className="space-y-2 text-sm">
                  <p className="text-muted-foreground">Agosto: 4 funcionários (pico sazonal)</p>
                  <p className="text-muted-foreground">Dezembro: 3 funcionários (festivos)</p>
                  <p className="text-muted-foreground">Abril: 2 funcionários (Páscoa)</p>
                </div>
              </div>
            </div>
          )}

          {/* ABA: ANÁLISE CRUZADA */}
          {activeTab === "analise" && (
            <div className="space-y-4">
              <div className="rounded-lg border border-border bg-background p-4">
                <h3 className="text-sm font-semibold text-foreground mb-4">Correlações Departamento vs Métricas</h3>
                <div className="space-y-3">
                  <div className="flex justify-between items-center p-3 bg-muted rounded-lg">
                    <span className="text-sm font-semibold text-muted-foreground">ADM</span>
                    <div className="flex gap-3 text-xs">
                      <span className="text-warning">Absentismo: 3.5%</span>
                      <span className="text-danger">Turnover: 20%</span>
                      <span className="text-success">Conformidade: 95%</span>
                    </div>
                  </div>
                  <div className="flex justify-between items-center p-3 bg-muted rounded-lg">
                    <span className="text-sm font-semibold text-muted-foreground">PRD</span>
                    <div className="flex gap-3 text-xs">
                      <span className="text-success">Absentismo: 2.8%</span>
                      <span className="text-danger">Turnover: 16.7%</span>
                      <span className="text-danger">Acidentes: Alto</span>
                    </div>
                  </div>
                  <div className="flex justify-between items-center p-3 bg-muted rounded-lg">
                    <span className="text-sm font-semibold text-muted-foreground">COM</span>
                    <div className="flex gap-3 text-xs">
                      <span className="text-danger">Absentismo: 4.2%</span>
                      <span className="text-success">Turnover: 0%</span>
                      <span className="text-success">Satisfação: 88%</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ABA: TENURE */}
          {activeTab === "tenure" && (
            <div className="space-y-4">
              <div className="grid grid-cols-3 gap-3">
                <div className="rounded-lg border border-border bg-muted p-4">
                  <p className="text-xs font-semibold uppercase text-muted-foreground">Tempo Médio</p>
                  <p className="mt-2 text-xl font-semibold text-foreground">3.2 anos</p>
                </div>
                <div className="rounded-lg border border-border bg-muted p-4">
                  <p className="text-xs font-semibold uppercase text-muted-foreground">Experiência +5 anos</p>
                  <p className="mt-2 text-xl font-semibold text-success">1 (10%)</p>
                </div>
                <div className="rounded-lg border border-border bg-muted p-4">
                  <p className="text-xs font-semibold uppercase text-muted-foreground">Risco Flight</p>
                  <p className="mt-2 text-xl font-semibold text-danger">3 func.</p>
                </div>
              </div>
              <div className="rounded-lg border border-border bg-background p-4">
                <h3 className="text-sm font-semibold text-foreground mb-4">Distribuição Tenure</h3>
                <div className="space-y-3">
                  <div className="flex items-center gap-3"><div className="h-2 w-16 bg-success rounded"></div><span className="text-sm text-muted-foreground">0-1 ano: 2 (20%)</span></div>
                  <div className="flex items-center gap-3"><div className="h-2 w-32 bg-info rounded"></div><span className="text-sm text-muted-foreground">1-3 anos: 4 (40%)</span></div>
                  <div className="flex items-center gap-3"><div className="h-2 w-24 bg-warning rounded"></div><span className="text-sm text-muted-foreground">3-5 anos (crítico): 3 (30%)</span></div>
                  <div className="flex items-center gap-3"><div className="h-2 w-8 bg-muted-foreground rounded"></div><span className="text-sm text-muted-foreground">5+ anos: 1 (10%)</span></div>
                </div>
              </div>
            </div>
          )}

          {/* ABA: COMPLIANCE */}
          {activeTab === "compliance" && (
            <div className="space-y-4">
              <div className="grid grid-cols-3 gap-3">
                <div className="rounded-lg border border-border bg-muted p-4">
                  <p className="text-xs font-semibold uppercase text-muted-foreground">Taxa Conformidade</p>
                  <p className="mt-2 text-xl font-semibold text-success">96%</p>
                </div>
                <div className="rounded-lg border border-border bg-muted p-4">
                  <p className="text-xs font-semibold uppercase text-muted-foreground">Certificações OK</p>
                  <p className="mt-2 text-xl font-semibold text-foreground">9/10</p>
                </div>
                <div className="rounded-lg border border-border bg-muted p-4">
                  <p className="text-xs font-semibold uppercase text-muted-foreground">Auditorias Passadas</p>
                  <p className="mt-2 text-xl font-semibold text-success">2/2</p>
                </div>
              </div>
              <div className="rounded-lg border border-border bg-background p-4">
                <h3 className="text-sm font-semibold text-foreground mb-4">Status de Conformidade</h3>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between"><span>Segurança no Trabalho (vence 30/06)</span><span className="font-semibold text-success">✓ 90%</span></div>
                  <div className="flex justify-between"><span>RGPD (vence 15/07)</span><span className="font-semibold text-success">✓ 100%</span></div>
                  <div className="flex justify-between"><span>Legislação Laboral</span><span className="font-semibold text-success">✓ 100%</span></div>
                </div>
              </div>
            </div>
          )}

          {/* ABA: DIVERSITY */}
          {activeTab === "diversity" && (
            <div className="space-y-4">
              <div className="grid grid-cols-3 gap-3">
                <div className="rounded-lg border border-border bg-muted p-4">
                  <p className="text-xs font-semibold uppercase text-muted-foreground">Mulheres</p>
                  <p className="mt-2 text-xl font-semibold text-foreground">40% (4)</p>
                </div>
                <div className="rounded-lg border border-border bg-muted p-4">
                  <p className="text-xs font-semibold uppercase text-muted-foreground">Cargos Liderança</p>
                  <p className="mt-2 text-xl font-semibold text-foreground">25% Fem.</p>
                </div>
                <div className="rounded-lg border border-border bg-muted p-4">
                  <p className="text-xs font-semibold uppercase text-muted-foreground">Idade Média</p>
                  <p className="mt-2 text-xl font-semibold text-foreground">36.2 anos</p>
                </div>
              </div>
              <div className="rounded-lg border border-border bg-background p-4">
                <h3 className="text-sm font-semibold text-foreground mb-4">Distribuição Diversidade</h3>
                <div className="space-y-3">
                  <div className="flex justify-between items-center"><span className="text-sm text-muted-foreground">Género (Fem/Masc)</span><span className="text-sm font-semibold">40% / 60%</span></div>
                  <div className="flex justify-between items-center"><span className="text-sm text-muted-foreground">Faixa 25-35</span><span className="text-sm font-semibold">40%</span></div>
                  <div className="flex justify-between items-center"><span className="text-sm text-muted-foreground">Faixa 35-50</span><span className="text-sm font-semibold">50%</span></div>
                  <div className="flex justify-between items-center"><span className="text-sm text-muted-foreground">Faixa 50+</span><span className="text-sm font-semibold">10%</span></div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </PageWrapper>
  );
}
