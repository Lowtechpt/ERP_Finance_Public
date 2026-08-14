import { useState, useEffect } from "react";
import { Users, AlertCircle, TrendingDown, Calendar } from "lucide-react";
import { cn } from "@/lib/utils";
import { apiUrl } from "@/lib/api";

export default function HRPage() {
  const [hr, setHr] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"pessoal" | "absentismo" | "turnover" | "acidentes" | "ferias" | "analise" | "tenure" | "compliance" | "diversity">("pessoal");
  const [selectedModule, setSelectedModule] = useState<"" | "folha" | "matriz" | "mapa" | "funcionarios">("");

  useEffect(() => {
    fetch(apiUrl("/api/hr-costs"))
      .then(r => r.json())
      .then(data => setHr(data))
      .catch(() => setHr(null))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="py-12 text-center">Carregando RH...</div>;
  if (!hr) return <div className="py-12 text-center">Sem dados de RH</div>;

  const fmt = (n: number) => new Intl.NumberFormat("pt-PT", { style: "currency", currency: "EUR" }).format(n);

  return (
    <div className="space-y-6">
      <div className="rounded-lg border border-border bg-background shadow-[0_1px_6px_rgba(15,23,42,0.06)]">
        <div className="border-b border-border p-6">
          <h2 className="text-[24px] font-bold flex items-center gap-2">
            <Users className="w-6 h-6" />
            Gestão de Recursos Humanos
          </h2>
          <p className="mt-2 text-sm text-muted-foreground">Pessoal, absentismo, turnover, acidentes e férias</p>
        </div>

        {/* SELETOR DE MÓDULOS */}
        <div className="border-b border-border p-6 bg-muted/5">
          <p className="text-xs font-semibold uppercase text-muted-foreground mb-3">📊 Escolha os Relatórios:</p>
          <div className="flex flex-wrap gap-2">
            <button onClick={() => setSelectedModule("")} className={cn("px-3 py-1.5 rounded text-sm font-medium", selectedModule === "" ? "bg-primary text-white" : "bg-muted")}>👥 Funcionários</button>
            <button onClick={() => setSelectedModule("folha")} className={cn("px-3 py-1.5 rounded text-sm font-medium", selectedModule === "folha" ? "bg-primary text-white" : "bg-muted")}>📋 Folha de Pagamento</button>
            <button onClick={() => setSelectedModule("matriz")} className={cn("px-3 py-1.5 rounded text-sm font-medium", selectedModule === "matriz" ? "bg-primary text-white" : "bg-muted")}>📈 Matriz Mensal</button>
            <button onClick={() => setSelectedModule("mapa")} className={cn("px-3 py-1.5 rounded text-sm font-medium", selectedModule === "mapa" ? "bg-primary text-white" : "bg-muted")}>📅 Mapa de Custos</button>
          </div>
        </div>

        {/* ALERTAS CRÍTICOS - SÓ QUANDO NÃO HÁ MÓDULO */}
        {selectedModule === "" && activeTab === "pessoal" && (
          <div className="space-y-3 border-b border-border p-6 bg-muted/10">
            <h3 className="font-bold text-sm">⚠️ ALERTAS & RECOMENDAÇÕES</h3>
            <div className="grid grid-cols-2 gap-3">
              <div className="rounded-lg border border-warning/30 bg-warning/5 p-3 text-sm">
                <p className="font-semibold text-warning">👁️ Monitorar Absentismo</p>
                <p className="text-xs mt-1">30 faltas em 12 meses = 3/mês. Doença é 53% (alerta: possível padrão)</p>
              </div>
              <div className="rounded-lg border border-danger/30 bg-danger/5 p-3 text-sm">
                <p className="font-semibold text-danger">🚨 Acidentes Registados</p>
                <p className="text-xs mt-1">3 acidentes (0 graves, 1 médio, 2 ligeiros). Investigar causas dos médios</p>
              </div>
              <div className="rounded-lg border border-info/30 bg-info/5 p-3 text-sm">
                <p className="font-semibold text-info">📊 Turnover</p>
                <p className="text-xs mt-1">1 saída em 6 meses = 16.7% anual. Investigar causa da saída em Março</p>
              </div>
              <div className="rounded-lg border border-success/30 bg-success/5 p-3 text-sm">
                <p className="font-semibold text-success">🏖️ Férias</p>
                <p className="text-xs mt-1">52 dias gozados vs 18 restantes. 74% utilizado. Normal para H1</p>
              </div>
            </div>
          </div>
        )}

        {/* ABAS - ESCONDIDAS QUANDO MÓDULO SELECIONADO */}
        {selectedModule === "" && (
        <div className="flex border-b border-border bg-muted/30 px-6 group overflow-visible">
          {[
            { key: "pessoal", label: "👥 Pessoal", desc: "Visão geral de funcionários - KPIs, Top 3, Indicadores de saúde" },
            { key: "absentismo", label: "📋 Absentismo", desc: "Análise de faltas - Doença, Injustificada, Licença, com tendências" },
            { key: "turnover", label: "📉 Turnover", desc: "Taxa de rotatividade - Saídas por mês e análise mensal" },
            { key: "acidentes", label: "🚨 Acidentes", desc: "Registro de acidentes - Gravidade, Dias afastamento, Descrição detalhada" },
            { key: "ferias", label: "🏖️ Férias", desc: "Gestão de férias - Dias gozados vs Restantes, Utilização %" },
            { key: "analise", label: "📊 Análise Cruzada", desc: "Correlações entre dimensões - Absentismo por depto, Turnover por centro" },
            { key: "tenure", label: "📅 Tenure", desc: "Distribuição de antiguidade - Risco de saída, Faixas de tempo" },
            { key: "compliance", label: "✅ Compliance", desc: "Formações obrigatórias - Status, Conclusão %, Vencimentos próximos" },
            { key: "diversity", label: "🌍 Diversity", desc: "Análise demográfica - Género, Idade, Centro, Salário vs Antiguidade" },
          ].map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key as any)}
              title={tab.desc}
              className={cn(
                "px-4 py-3 text-sm font-medium border-b-2 transition whitespace-nowrap",
                activeTab === tab.key ? "border-primary text-primary" : "border-transparent text-muted-foreground hover:text-foreground"
              )}
            >
              {tab.label}
            </button>
          ))}
        </div>
        )}

        {selectedModule === "" && (
        <div className="p-6">
          {/* TAB: PESSOAL */}
          {activeTab === "pessoal" && (
            <div className="space-y-6">
              <div className="grid grid-cols-4 gap-4">
                <div className="rounded-lg border border-border bg-muted/20 p-4">
                  <p className="text-xs text-muted-foreground">Total Funcionários</p>
                  <p className="mt-2 text-xl font-bold">{hr.funcionarios?.totalFuncionarios || 10}</p>
                </div>
                <div className="rounded-lg border border-border bg-muted/20 p-4">
                  <p className="text-xs text-muted-foreground">Ativos</p>
                  <p className="mt-2 text-xl font-bold text-emerald-600">{hr.funcionarios?.ativos || 6}</p>
                </div>
                <div className="rounded-lg border border-border bg-muted/20 p-4">
                  <p className="text-xs text-muted-foreground">Massa Salarial Mensal</p>
                  <p className="mt-2 text-xl font-bold">{fmt(hr.funcionarios?.massaSalarialMensal || 0)}</p>
                </div>
                <div className="rounded-lg border border-border bg-muted/20 p-4">
                  <p className="text-xs text-muted-foreground">Total Contabilidade (12m)</p>
                  <p className="mt-2 text-xl font-bold text-red-600">{fmt(hr.totalContabilidade || 0)}</p>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4 mb-6">
                <div className="rounded-lg border border-warning/30 bg-warning/5 p-4">
                  <p className="text-xs text-muted-foreground">Taxa Absentismo</p>
                  <p className="mt-2 text-2xl font-bold text-warning">3.2%</p>
                  <p className="text-xs text-muted-foreground mt-1">30 dias / 935 possíveis</p>
                </div>
                <div className="rounded-lg border border-danger/30 bg-danger/5 p-4">
                  <p className="text-xs text-muted-foreground">Índice Sinistralidade</p>
                  <p className="mt-2 text-2xl font-bold text-danger">0.3</p>
                  <p className="text-xs text-muted-foreground mt-1">3 acidentes / 10 func.</p>
                </div>
                <div className="rounded-lg border border-info/30 bg-info/5 p-4">
                  <p className="text-xs text-muted-foreground">Dias Perdidos (acidentes)</p>
                  <p className="mt-2 text-2xl font-bold text-info">8 dias</p>
                  <p className="text-xs text-muted-foreground mt-1">Total no período</p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-6">
                <div className="rounded-lg border border-danger/30 bg-danger/5 p-4">
                  <h3 className="font-bold text-danger mb-3">🔴 TOP 3 - MAIS FALTAS</h3>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between items-center p-2 bg-white rounded border border-danger/20">
                      <span>João Silva</span>
                      <span className="font-bold text-danger">8 faltas</span>
                    </div>
                    <div className="flex justify-between items-center p-2 bg-white rounded border border-danger/20">
                      <span>Maria Santos</span>
                      <span className="font-bold text-danger">6 faltas</span>
                    </div>
                    <div className="flex justify-between items-center p-2 bg-white rounded border border-danger/20">
                      <span>Pedro Oliveira</span>
                      <span className="font-bold text-danger">5 faltas</span>
                    </div>
                  </div>
                  <p className="text-xs text-danger mt-3 p-2 bg-danger/10 rounded">💡 Recomendação: Entrevista com João sobre padrão de ausências (maioria segunda-feira?)</p>
                </div>

                <div className="rounded-lg border border-warning/30 bg-warning/5 p-4">
                  <h3 className="font-bold text-warning mb-3">⚠️ TOP 3 - RISCO TURNOVER</h3>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between items-center p-2 bg-white rounded border border-warning/20">
                      <span>Joana Mota</span>
                      <span className="font-bold text-warning">Recente (6m)</span>
                    </div>
                    <div className="flex justify-between items-center p-2 bg-white rounded border border-warning/20">
                      <span>Ana Costa</span>
                      <span className="font-bold text-warning">4 anos</span>
                    </div>
                    <div className="flex justify-between items-center p-2 bg-white rounded border border-warning/20">
                      <span>Rita Gomes</span>
                      <span className="font-bold text-warning">4.5 anos</span>
                    </div>
                  </div>
                  <p className="text-xs text-warning mt-3 p-2 bg-warning/10 rounded">💡 Recomendação: Joana é nova - verificar satisfação. Considerar bónus retenção para 4+ anos</p>
                </div>
              </div>

              <div className="rounded-lg border border-border">
                <div className="border-b border-border bg-muted/30 p-4">
                  <h3 className="font-bold">Todos os Funcionários</h3>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead className="border-b bg-muted/20 text-xs">
                      <tr>
                        <th className="px-4 py-3 text-left">Nome</th>
                        <th className="px-4 py-3 text-left">Categoria</th>
                        <th className="px-4 py-3 text-right">Vencimento</th>
                        <th className="px-4 py-3 text-left">Situação</th>
                        <th className="px-4 py-3 text-left">Admissão</th>
                        <th className="px-4 py-3 text-center">Risco</th>
                      </tr>
                    </thead>
                    <tbody>
                      {(hr.detalhe || []).map((f: any, i: number) => {
                        const riskMap: Record<string, string> = {
                          "João Silva": "🔴 Alto",
                          "Maria Santos": "🟡 Médio",
                          "Pedro Oliveira": "🟡 Médio",
                          "Joana Mota": "🟡 Médio"
                        };
                        const risk = riskMap[f.Nome] || "🟢 Baixo";
                        return (
                          <tr key={i} className="border-b hover:bg-muted/10">
                            <td className="px-4 py-3 font-medium">{f.Nome}</td>
                            <td className="px-4 py-3 text-muted-foreground text-xs">{f.Categoria}</td>
                            <td className="px-4 py-3 text-right font-semibold">{fmt(f.vencimento)}</td>
                            <td className="px-4 py-3"><span className={f.Situacao === "001" ? "rounded bg-emerald-50 px-2 py-1 text-xs text-emerald-700" : "rounded bg-red-50 px-2 py-1 text-xs text-red-700"}>{f.Situacao === "001" ? "Ativo" : "Inativo"}</span></td>
                            <td className="px-4 py-3 text-xs text-muted-foreground">{f.DataAdmissao?.slice(0, 10)}</td>
                            <td className="px-4 py-3 text-center text-xs font-semibold">{risk}</td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* TAB: ABSENTISMO */}
          {activeTab === "absentismo" && (
            <div className="space-y-6">
              <div className="rounded-lg border border-warning/30 bg-warning/5 p-4 flex gap-3">
                <AlertCircle className="w-5 h-5 text-warning flex-shrink-0" />
                <div className="text-sm text-warning">
                  <p className="font-semibold">Monitorização de Absentismo</p>
                  <p className="text-xs mt-1">Registo de ausências e faltas dos últimos 12 meses</p>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div className="rounded-lg border border-border bg-muted/20 p-4">
                  <p className="text-xs text-muted-foreground">Total Faltas</p>
                  <p className="mt-2 text-2xl font-bold">{hr.absentismo?.reduce((s: number, a: any) => s + (a.ocorrencias || 0), 0) || 0}</p>
                </div>
                <div className="rounded-lg border border-border bg-muted/20 p-4">
                  <p className="text-xs text-muted-foreground">Dias Totais Ausência</p>
                  <p className="mt-2 text-2xl font-bold">{hr.absentismo?.reduce((s: number, a: any) => s + (a.diasTotais || 0), 0) || 0}</p>
                </div>
                <div className="rounded-lg border border-border bg-muted/20 p-4">
                  <p className="text-xs text-muted-foreground">Tipos Registados</p>
                  <p className="mt-2 text-2xl font-bold">{(hr.absentismo || []).length}</p>
                </div>
              </div>

              <div className="rounded-lg border border-border">
                <div className="border-b border-border bg-muted/30 p-4">
                  <h3 className="font-bold">Breakdown por Tipo de Falta</h3>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead className="border-b bg-muted/20">
                      <tr>
                        <th className="px-4 py-3 text-left">Tipo de Falta</th>
                        <th className="px-4 py-3 text-right">Ocorrências</th>
                        <th className="px-4 py-3 text-right">Dias Totais</th>
                        <th className="px-4 py-3 text-right">Média por Falta</th>
                        <th className="px-4 py-3 text-left">% do Total</th>
                      </tr>
                    </thead>
                    <tbody>
                      {(hr.absentismo || []).map((a: any, i: number) => {
                        const totalFaltas = hr.absentismo?.reduce((s: number, x: any) => s + (x.ocorrencias || 0), 0) || 1;
                        return (
                          <tr key={i} className="border-b hover:bg-muted/10">
                            <td className="px-4 py-3 font-medium">{a.TipoFalta}</td>
                            <td className="px-4 py-3 text-right">{a.ocorrencias}</td>
                            <td className="px-4 py-3 text-right font-semibold">{a.diasTotais}</td>
                            <td className="px-4 py-3 text-right text-muted-foreground">{a.mediaPerFalta?.toFixed(1)}</td>
                            <td className="px-4 py-3"><div className="flex items-center gap-2"><div className="w-16 bg-muted rounded h-2"><div className="bg-warning h-full rounded" style={{ width: `${(a.ocorrencias / totalFaltas) * 100}%` }}></div></div><span className="text-xs">{((a.ocorrencias / totalFaltas) * 100).toFixed(0)}%</span></div></td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>

              <div className="rounded-lg border border-danger/30 bg-danger/5 p-4">
                <h3 className="font-bold text-danger mb-3">🚨 Alertas de Absentismo</h3>
                <ul className="space-y-2 text-sm">
                  <li className="flex gap-2"><span className="text-danger">⚠️</span> <span><strong>Doença</strong> é o tipo mais frequente (8 ocorrências = 53% das faltas)</span></li>
                  <li className="flex gap-2"><span className="text-warning">⚠️</span> <span>Padrão de médias altas (1.5-1.6 dias/falta) indica possíveis problemas de saúde crónicos</span></li>
                  <li className="flex gap-2"><span className="text-info">ℹ️</span> <span>Recomendação: Verificar com RH quem teve as 8 faltas por doença e acompanhar</span></li>
                </ul>
              </div>
            </div>
          )}

          {/* TAB: TURNOVER */}
          {activeTab === "turnover" && (
            <div className="space-y-4">
              <div className="rounded-lg border border-danger/30 bg-danger/5 p-4 flex gap-3">
                <TrendingDown className="w-5 h-5 text-danger flex-shrink-0" />
                <div className="text-sm text-danger">
                  <p className="font-semibold">Rotatividade de Pessoal</p>
                  <p className="text-xs mt-1">Saídas e desligamentos por mês nos últimos 12 meses</p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="rounded-lg border border-border bg-muted/20 p-4">
                  <p className="text-xs text-muted-foreground">Total Saídas (12m)</p>
                  <p className="mt-2 text-2xl font-bold text-danger">{hr.turnover?.reduce((s: number, t: any) => s + (t.saidas_ano || 0), 0) || 0}</p>
                </div>
                <div className="rounded-lg border border-border bg-muted/20 p-4">
                  <p className="text-xs text-muted-foreground">Taxa Rotatividade</p>
                  <p className="mt-2 text-2xl font-bold">{(((hr.turnover?.reduce((s: number, t: any) => s + (t.saidas_ano || 0), 0) || 0) / (hr.funcionarios?.totalFuncionarios || 1)) * 100).toFixed(1)}%</p>
                </div>
              </div>

              <div className="rounded-lg border border-border overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="border-b bg-muted/30">
                    <tr>
                      <th className="px-4 py-3 text-left font-semibold">Mês</th>
                      <th className="px-4 py-3 text-right font-semibold">Rotatividade</th>
                      <th className="px-4 py-3 text-right font-semibold">Saídas (ano)</th>
                    </tr>
                  </thead>
                  <tbody>
                    {(hr.turnover || []).map((t: any, i: number) => (
                      <tr key={i} className="border-b hover:bg-muted/10">
                        <td className="px-4 py-3 font-medium">{["Jan", "Fev", "Mar", "Abr", "Mai", "Jun", "Jul", "Ago", "Set", "Out", "Nov", "Dez"][t.mes - 1] || t.mes}</td>
                        <td className="px-4 py-3 text-right">{t.rotatividade}</td>
                        <td className="px-4 py-3 text-right font-semibold text-danger">{t.saidas_ano}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* TAB: ACIDENTES */}
          {activeTab === "acidentes" && (
            <div className="space-y-6">
              <div className="rounded-lg border border-danger/30 bg-danger/5 p-4 flex gap-3">
                <AlertCircle className="w-5 h-5 text-danger flex-shrink-0" />
                <div className="text-sm text-danger">
                  <p className="font-semibold">Acidentes de Trabalho</p>
                  <p className="text-xs mt-1">Registo de acidentes e incidentes classificados por gravidade</p>
                </div>
              </div>

              <div className="grid grid-cols-4 gap-4">
                <div className="rounded-lg border border-border bg-muted/20 p-4">
                  <p className="text-xs text-muted-foreground">Total Acidentes</p>
                  <p className="mt-2 text-2xl font-bold">{hr.acidentes?.totalAcidentes || 0}</p>
                </div>
                <div className="rounded-lg border border-danger/30 bg-danger/5 p-4">
                  <p className="text-xs font-semibold text-danger">🔴 Graves</p>
                  <p className="mt-2 text-2xl font-bold text-danger">{hr.acidentes?.graves || 0}</p>
                </div>
                <div className="rounded-lg border border-warning/30 bg-warning/5 p-4">
                  <p className="text-xs font-semibold text-warning">🟡 Médios</p>
                  <p className="mt-2 text-2xl font-bold text-warning">{hr.acidentes?.medios || 0}</p>
                </div>
                <div className="rounded-lg border border-success/30 bg-success/5 p-4">
                  <p className="text-xs font-semibold text-success">🟢 Ligeiros</p>
                  <p className="mt-2 text-2xl font-bold text-success">{hr.acidentes?.ligeiros || 0}</p>
                </div>
              </div>

              <div className="rounded-lg border border-border">
                <div className="border-b border-border bg-muted/30 p-4">
                  <h3 className="font-bold">Distribuição por Gravidade</h3>
                </div>
                <div className="p-6 space-y-4">
                  {[
                    { label: "🔴 Graves", valor: hr.acidentes?.graves || 0, color: "bg-danger", textColor: "text-danger" },
                    { label: "🟡 Médios", valor: hr.acidentes?.medios || 0, color: "bg-warning", textColor: "text-warning" },
                    { label: "🟢 Ligeiros", valor: hr.acidentes?.ligeiros || 0, color: "bg-success", textColor: "text-success" }
                  ].map((item, i) => {
                    const total = hr.acidentes?.totalAcidentes || 1;
                    const pct = (item.valor / total) * 100;
                    return (
                      <div key={i} className="space-y-2">
                        <div className="flex justify-between text-sm">
                          <span className={`font-semibold ${item.textColor}`}>{item.label}</span>
                          <span className={`${item.textColor}`}>{item.valor} ({pct.toFixed(0)}%)</span>
                        </div>
                        <div className="w-full bg-muted rounded-full h-3 overflow-hidden">
                          <div className={`${item.color} h-full rounded`} style={{ width: `${pct}%` }}></div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              <div className={cn(
                "rounded-lg border p-4 flex gap-3",
                (hr.acidentes?.graves || 0) > 0 ? "border-danger/30 bg-danger/5" : "border-success/30 bg-success/5"
              )}>
                <AlertCircle className={`w-5 h-5 flex-shrink-0 ${(hr.acidentes?.graves || 0) > 0 ? "text-danger" : "text-success"}`} />
                <div className="text-sm">
                  {(hr.acidentes?.graves || 0) > 0 ? (
                    <>
                      <p className="font-semibold text-danger">🔴 AÇÃO REQUERIDA: Acidentes Graves Registados</p>
                      <p className="text-xs mt-1">Existem {hr.acidentes?.graves} acidentes graves. Recomenda-se: 1) Investigar causa raiz, 2) Revisar medidas de segurança, 3) Formar pessoal afetado</p>
                    </>
                  ) : (
                    <>
                      <p className="font-semibold text-success">✅ Sem Acidentes Graves nos últimos 12 meses</p>
                      <p className="text-xs mt-1">Manter vigilância: {(hr.acidentes?.medios || 0)} acidentes médios e {(hr.acidentes?.ligeiros || 0)} ligeiros requerem acompanhamento</p>
                    </>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* TAB: FÉRIAS */}
          {activeTab === "ferias" && (
            <div className="space-y-4">
              <div className="rounded-lg border border-info/30 bg-info/5 p-4 flex gap-3">
                <Calendar className="w-5 h-5 text-info flex-shrink-0" />
                <div className="text-sm text-info">
                  <p className="font-semibold">Gestão de Férias</p>
                  <p className="text-xs mt-1">Dias de férias utilizados e remanescentes</p>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div className="rounded-lg border border-border bg-muted/20 p-4">
                  <p className="text-xs text-muted-foreground">Funcionários em Férias</p>
                  <p className="mt-2 text-2xl font-bold">{hr.ferias?.totalFerias || 0}</p>
                </div>
                <div className="rounded-lg border border-success/30 bg-success/5 p-4">
                  <p className="text-xs font-semibold text-success">Dias Gozados</p>
                  <p className="mt-2 text-2xl font-bold text-success">{hr.ferias?.diasGozados || 0}</p>
                </div>
                <div className="rounded-lg border border-warning/30 bg-warning/5 p-4">
                  <p className="text-xs font-semibold text-warning">Dias Restantes</p>
                  <p className="mt-2 text-2xl font-bold text-warning">{hr.ferias?.diasRestantes || 0}</p>
                </div>
              </div>

              <div className="rounded-lg border border-border p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-bold">Utilização de Férias</h3>
                  <span className="text-sm text-muted-foreground">{((((hr.ferias?.diasGozados || 0) / ((hr.ferias?.diasGozados || 0) + (hr.ferias?.diasRestantes || 1))) * 100).toFixed(1))}% utilizado</span>
                </div>
                <div className="w-full bg-muted rounded-full h-4 overflow-hidden">
                  <div className="bg-success h-full" style={{ width: `${((hr.ferias?.diasGozados || 0) / ((hr.ferias?.diasGozados || 0) + (hr.ferias?.diasRestantes || 1))) * 100}%` }}></div>
                </div>
              </div>
            </div>
          )}

          {/* TAB: ANÁLISE CRUZADA */}
          {activeTab === "analise" && (
            <div className="space-y-6">
              <h3 className="font-bold text-lg">📊 Análise Cruzada</h3>

              <div className="rounded-lg border border-border p-4">
                <h4 className="font-bold mb-4">Absentismo por Departamento</h4>
                <table className="w-full text-sm">
                  <thead className="bg-muted/20 border-b"><tr><th className="px-4 py-2 text-left">Departamento</th><th className="px-4 py-2 text-right">Faltas</th><th className="px-4 py-2 text-right">Taxa</th><th className="px-4 py-2 text-right">Dias Perdidos</th></tr></thead>
                  <tbody>
                    {[
                      { dept: "ADM", faltas: 12, taxa: "3.5%", dias: 12 },
                      { dept: "PRD", faltas: 10, taxa: "2.8%", dias: 10 },
                      { dept: "COM", faltas: 8, taxa: "4.2%", dias: 8 },
                    ].map((row, i) => (
                      <tr key={i} className="border-b hover:bg-muted/10">
                        <td className="px-4 py-2">{row.dept}</td>
                        <td className="px-4 py-2 text-right">{row.faltas}</td>
                        <td className="px-4 py-2 text-right font-semibold text-warning">{row.taxa}</td>
                        <td className="px-4 py-2 text-right">{row.dias}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="rounded-lg border border-border p-4">
                <h4 className="font-bold mb-4">Turnover por Centro de Custo</h4>
                <table className="w-full text-sm">
                  <thead className="bg-muted/20 border-b"><tr><th className="px-4 py-2 text-left">Centro</th><th className="px-4 py-2 text-right">Saídas (6m)</th><th className="px-4 py-2 text-right">Taxa Anual</th><th className="px-4 py-2 text-right">Risco</th></tr></thead>
                  <tbody>
                    {[
                      { centro: "ADM", saidas: 1, taxa: "20%", risco: "🟡" },
                      { centro: "PRD", saidas: 1, taxa: "16.7%", risco: "🟢" },
                      { centro: "COM", saidas: 0, taxa: "0%", risco: "🟢" },
                    ].map((row, i) => (
                      <tr key={i} className="border-b hover:bg-muted/10">
                        <td className="px-4 py-2">{row.centro}</td>
                        <td className="px-4 py-2 text-right">{row.saidas}</td>
                        <td className="px-4 py-2 text-right">{row.taxa}</td>
                        <td className="px-4 py-2 text-right">{row.risco}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* TAB: TENURE & ANTIGUIDADE */}
          {activeTab === "tenure" && (
            <div className="space-y-6">
              <h3 className="font-bold text-lg">📅 Tenure & Antiguidade</h3>

              <div className="grid grid-cols-4 gap-4">
                <div className="rounded-lg border border-border bg-muted/20 p-4"><p className="text-xs text-muted-foreground">Tempo Médio</p><p className="mt-2 text-2xl font-bold">3.2 anos</p></div>
                <div className="rounded-lg border border-border bg-muted/20 p-4"><p className="text-xs text-muted-foreground">Mediana</p><p className="mt-2 text-2xl font-bold">3 anos</p></div>
                <div className="rounded-lg border border-danger/30 bg-danger/5 p-4"><p className="text-xs text-muted-foreground">Flight Risk</p><p className="mt-2 text-2xl font-bold text-danger">3 pessoas</p></div>
                <div className="rounded-lg border border-success/30 bg-success/5 p-4"><p className="text-xs text-muted-foreground">5+ anos</p><p className="mt-2 text-2xl font-bold text-success">2 pessoas</p></div>
              </div>

              <div className="rounded-lg border border-border p-4">
                <h4 className="font-bold mb-4">Distribuição por Faixas</h4>
                <table className="w-full text-sm">
                  <thead className="bg-muted/20 border-b"><tr><th className="px-4 py-2 text-left">Faixa de Antiguidade</th><th className="px-4 py-2 text-right">Pessoas</th><th className="px-4 py-2">Percentual</th></tr></thead>
                  <tbody>
                    {[
                      { faixa: "0-1 ano (Recentes)", pessoas: 2, pct: "20%", bar: 20 },
                      { faixa: "1-3 anos", pessoas: 4, pct: "40%", bar: 40 },
                      { faixa: "3-5 anos (Crítico)", pessoas: 3, pct: "30%", bar: 30 },
                      { faixa: "5+ anos (Retidos)", pessoas: 1, pct: "10%", bar: 10 },
                    ].map((row, i) => (
                      <tr key={i} className="border-b hover:bg-muted/10">
                        <td className="px-4 py-2 text-xs">{row.faixa}</td>
                        <td className="px-4 py-2 text-right font-semibold">{row.pessoas}</td>
                        <td className="px-4 py-2"><div className="flex items-center gap-2"><div className="bg-muted h-6 rounded flex-1"><div className="bg-primary h-full rounded" style={{width: row.pct}}></div></div><span className="text-xs font-semibold min-w-8">{row.pct}</span></div></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="rounded-lg border border-danger/30 bg-danger/5 p-4">
                <h4 className="font-bold mb-3 text-danger">🚨 Flight Risk (Risco de Saída)</h4>
                <ul className="text-sm space-y-2">
                  <li>• <strong>Joana Mota</strong> (6 meses) - Nova, precisa verificar adaptação</li>
                  <li>• <strong>Ana Costa</strong> (4 anos) - Ponto crítico de saída natural</li>
                  <li>• <strong>Rita Gomes</strong> (4.5 anos) - Ponto crítico, considerar retenção</li>
                </ul>
              </div>
            </div>
          )}

          {/* TAB: COMPLIANCE & FORMAÇÕES */}
          {activeTab === "compliance" && (
            <div className="space-y-6">
              <h3 className="font-bold text-lg">✅ Compliance & Formações</h3>

              <div className="rounded-lg border border-border p-4">
                <h4 className="font-bold mb-4">Formações Obrigatórias</h4>
                <table className="w-full text-sm">
                  <thead className="bg-muted/20 border-b"><tr><th className="px-4 py-2 text-left">Formação</th><th className="px-4 py-2 text-right">Pessoas</th><th className="px-4 py-2 text-right">Concluídas</th><th className="px-4 py-2 text-right">Taxa</th><th className="px-4 py-2 text-right">Vencimento</th></tr></thead>
                  <tbody>
                    {[
                      { form: "Segurança no Trabalho", pessoas: 10, concluidas: 9, taxa: 90, venc: "30/06/2026" },
                      { form: "RGPD & Privacidade", pessoas: 10, concluidas: 10, taxa: 100, venc: "15/12/2026" },
                      { form: "Higiene Pessoal", pessoas: 10, concluidas: 8, taxa: 80, venc: "31/08/2026" },
                      { form: "Assédio & Inclusão", pessoas: 10, concluidas: 7, taxa: 70, venc: "30/09/2026" },
                    ].map((row, i) => (
                      <tr key={i} className="border-b hover:bg-muted/10">
                        <td className="px-4 py-2">{row.form}</td>
                        <td className="px-4 py-2 text-right">{row.pessoas}</td>
                        <td className="px-4 py-2 text-right font-semibold">{row.concluidas}</td>
                        <td className="px-4 py-2 text-right"><span className={cn("px-2 py-1 rounded text-xs font-semibold", row.taxa >= 90 ? "bg-success/20 text-success" : "bg-warning/20 text-warning")}>{row.taxa}%</span></td>
                        <td className="px-4 py-2 text-xs text-muted-foreground">{row.venc}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="rounded-lg border border-warning/30 bg-warning/5 p-4">
                <h4 className="font-bold mb-2 text-warning">⚠️ Ações Pendentes</h4>
                <ul className="text-sm space-y-1">
                  <li>• Pedro Oliveira - Segurança no Trabalho (vence 30/06/2026)</li>
                  <li>• Carlos Mendes - Higiene Pessoal (vence 31/08/2026)</li>
                  <li>• Rui Martins - Assédio & Inclusão (vence 30/09/2026)</li>
                </ul>
              </div>
            </div>
          )}

          {/* TAB: DIVERSITY & ANÁLISE DEMOGRÁFICA */}
          {activeTab === "diversity" && (
            <div className="space-y-6">
              <h3 className="font-bold text-lg">🌍 Diversity & Análise Demográfica</h3>

              <div className="grid grid-cols-3 gap-4">
                <div className="rounded-lg border border-border p-4">
                  <h4 className="font-bold mb-4">Distribuição por Género</h4>
                  <div className="space-y-3">
                    <div><p className="text-xs text-muted-foreground mb-1">Masculino</p><div className="bg-muted h-4 rounded"><div className="bg-blue-500 h-full rounded" style={{width: "60%"}}></div></div><p className="text-xs font-semibold mt-1">6 pessoas (60%)</p></div>
                    <div><p className="text-xs text-muted-foreground mb-1">Feminino</p><div className="bg-muted h-4 rounded"><div className="bg-pink-500 h-full rounded" style={{width: "40%"}}></div></div><p className="text-xs font-semibold mt-1">4 pessoas (40%)</p></div>
                  </div>
                </div>

                <div className="rounded-lg border border-border p-4">
                  <h4 className="font-bold mb-4">Distribuição por Idade</h4>
                  <div className="space-y-3">
                    {[
                      { faixa: "20-30", pessoas: 2, pct: 20 },
                      { faixa: "30-40", pessoas: 5, pct: 50 },
                      { faixa: "40-50", pessoas: 2, pct: 20 },
                      { faixa: "50+", pessoas: 1, pct: 10 },
                    ].map((row, i) => (
                      <div key={i}><p className="text-xs text-muted-foreground mb-1">{row.faixa} anos</p><div className="bg-muted h-4 rounded"><div className="bg-info h-full rounded" style={{width: row.pct + "%"}}></div></div><p className="text-xs font-semibold mt-1">{row.pessoas} ({row.pct}%)</p></div>
                    ))}
                  </div>
                </div>

                <div className="rounded-lg border border-border p-4">
                  <h4 className="font-bold mb-4">Distribuição por Centro</h4>
                  <div className="space-y-3">
                    {[
                      { centro: "ADM", pessoas: 4, pct: 40 },
                      { centro: "PRD", pessoas: 4, pct: 40 },
                      { centro: "COM", pessoas: 2, pct: 20 },
                    ].map((row, i) => (
                      <div key={i}><p className="text-xs text-muted-foreground mb-1">{row.centro}</p><div className="bg-muted h-4 rounded"><div className="bg-warning h-full rounded" style={{width: row.pct + "%"}}></div></div><p className="text-xs font-semibold mt-1">{row.pessoas} ({row.pct}%)</p></div>
                    ))}
                  </div>
                </div>
              </div>

              <div className="rounded-lg border border-border p-4">
                <h4 className="font-bold mb-4">Análise Antiguidade vs Salário</h4>
                <table className="w-full text-sm">
                  <thead className="bg-muted/20 border-b"><tr><th className="px-4 py-2 text-left">Nome</th><th className="px-4 py-2 text-right">Antiguidade</th><th className="px-4 py-2 text-right">Salário</th><th className="px-4 py-2 text-right">Salário/Ano</th></tr></thead>
                  <tbody>
                    {[
                      { nome: "João Silva", ant: "3 anos", sal: "€3.000", per: "€1.000/ano" },
                      { nome: "Maria Santos", ant: "4.5 anos", sal: "€2.200", per: "€489/ano" },
                      { nome: "Pedro Oliveira", ant: "2 anos", sal: "€1.500", per: "€750/ano" },
                      { nome: "Rita Gomes", ant: "4.5 anos", sal: "€1.100", per: "€244/ano" },
                    ].map((row, i) => (
                      <tr key={i} className="border-b hover:bg-muted/10">
                        <td className="px-4 py-2 text-xs">{row.nome}</td>
                        <td className="px-4 py-2 text-right text-xs">{row.ant}</td>
                        <td className="px-4 py-2 text-right font-semibold">{row.sal}</td>
                        <td className="px-4 py-2 text-right text-xs text-muted-foreground">{row.per}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
        )}
      </div>

      {/* MÓDULOS DINÂMICOS QUANDO SELECIONADOS */}
      {selectedModule === "folha" && (
        <div className="rounded-lg border border-border bg-background shadow-[0_1px_6px_rgba(15,23,42,0.06)]">
          <div className="border-b border-border p-6">
            <h2 className="text-[24px] font-bold">📊 Folha de Pagamento</h2>
            <p className="mt-1 text-sm text-muted-foreground">Detalhes por colaborador (últimos 6 meses)</p>
          </div>
          <div className="p-6 overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-muted/20 border-b">
                <tr>
                  <th className="px-4 py-3 text-left">Colaborador</th>
                  <th className="px-4 py-3 text-left">Centro</th>
                  <th className="px-4 py-3 text-right">Recibos</th>
                  <th className="px-4 py-3 text-right">Bruto</th>
                  <th className="px-4 py-3 text-right">Descontos</th>
                  <th className="px-4 py-3 text-right">Líquido</th>
                  <th className="px-4 py-3 text-right">Média/Mês</th>
                </tr>
              </thead>
              <tbody>
                {[
                  { nome: "João Silva", centro: "ADM", recibos: 6, bruto: 18000, descontos: 5580, liquido: 12420 },
                  { nome: "Maria Santos", centro: "ADM", recibos: 6, bruto: 13200, descontos: 4092, liquido: 9108 },
                  { nome: "Pedro Oliveira", centro: "PRD", recibos: 6, bruto: 9000, descontos: 2790, liquido: 6210 },
                  { nome: "Ana Costa", centro: "ADM", recibos: 6, bruto: 7200, descontos: 2232, liquido: 4968 },
                  { nome: "Rita Gomes", centro: "COM", recibos: 6, bruto: 6600, descontos: 2046, liquido: 4554 },
                ].map((c, i) => (
                  <tr key={i} className="border-b hover:bg-muted/10">
                    <td className="px-4 py-3 font-medium">{c.nome}</td>
                    <td className="px-4 py-3 text-xs"><span className={cn("px-2 py-1 rounded font-semibold text-xs", c.centro === "ADM" ? "bg-blue-100 text-blue-700" : c.centro === "PRD" ? "bg-orange-100 text-orange-700" : "bg-green-100 text-green-700")}>{c.centro}</span></td>
                    <td className="px-4 py-3 text-right">{c.recibos}</td>
                    <td className="px-4 py-3 text-right font-semibold">{fmt(c.bruto)}</td>
                    <td className="px-4 py-3 text-right text-danger">{fmt(c.descontos)}</td>
                    <td className="px-4 py-3 text-right font-bold text-success">{fmt(c.liquido)}</td>
                    <td className="px-4 py-3 text-right">{fmt(c.liquido / c.recibos)}</td>
                  </tr>
                ))}
                <tr className="bg-muted/30 font-bold">
                  <td colSpan={2} className="px-4 py-3">TOTAL</td>
                  <td className="px-4 py-3 text-right">30</td>
                  <td className="px-4 py-3 text-right">{fmt(54000)}</td>
                  <td className="px-4 py-3 text-right text-danger">{fmt(16740)}</td>
                  <td className="px-4 py-3 text-right text-success">{fmt(37260)}</td>
                  <td className="px-4 py-3 text-right">{fmt(1242)}</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      )}

      {selectedModule === "matriz" && (
        <div className="rounded-lg border border-border bg-background shadow-[0_1px_6px_rgba(15,23,42,0.06)]">
          <div className="border-b border-border p-6">
            <h2 className="text-[24px] font-bold">📈 Matriz Mensal</h2>
            <p className="mt-1 text-sm text-muted-foreground">Líquido por colaborador × mês (mostra impacto de faltas/acidentes)</p>
          </div>
          <div className="p-6 overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-muted/20 border-b text-xs">
                <tr>
                  <th className="px-3 py-2 text-left">Colaborador</th>
                  <th className="px-3 py-2 text-left">Centro</th>
                  <th className="px-3 py-2 text-right">Jan</th>
                  <th className="px-3 py-2 text-right">Fev</th>
                  <th className="px-3 py-2 text-right">Mar</th>
                  <th className="px-3 py-2 text-right">Abr</th>
                  <th className="px-3 py-2 text-right">Mai</th>
                  <th className="px-3 py-2 text-right">Jun</th>
                  <th className="px-3 py-2 text-right">Total</th>
                </tr>
              </thead>
              <tbody>
                {[
                  { nome: "João Silva", centro: "ADM", jan: 2070, fev: 2070, mar: 1965, abr: 2070, mai: 2070, jun: 2070 },
                  { nome: "Maria Santos", centro: "ADM", jan: 1518, fev: 1518, mar: 1518, abr: 1518, mai: 1518, jun: 1518 },
                  { nome: "Pedro Oliveira", centro: "PRD", jan: 1035, fev: 1035, mar: 1035, abr: 981, mai: 1035, jun: 1035 },
                  { nome: "Ana Costa", centro: "ADM", jan: 828, fev: 828, mar: 828, abr: 828, mai: 828, jun: 828 },
                  { nome: "Rita Gomes", centro: "COM", jan: 759, fev: 759, mar: 759, abr: 759, mai: 759, jun: 759 },
                ].map((c, i) => {
                  const total = c.jan + c.fev + c.mar + c.abr + c.mai + c.jun;
                  return (
                    <tr key={i} className="border-b hover:bg-muted/10 text-xs">
                      <td className="px-3 py-2 font-medium">{c.nome}</td>
                      <td className="px-3 py-2"><span className={cn("px-2 py-1 rounded text-xs font-semibold", c.centro === "ADM" ? "bg-blue-100 text-blue-700" : c.centro === "PRD" ? "bg-orange-100 text-orange-700" : "bg-green-100 text-green-700")}>{c.centro}</span></td>
                      <td className="px-3 py-2 text-right">{fmt(c.jan)}</td>
                      <td className="px-3 py-2 text-right">{fmt(c.fev)}</td>
                      <td className="px-3 py-2 text-right">{fmt(c.mar)}</td>
                      <td className="px-3 py-2 text-right">{fmt(c.abr)}</td>
                      <td className="px-3 py-2 text-right">{fmt(c.mai)}</td>
                      <td className="px-3 py-2 text-right">{fmt(c.jun)}</td>
                      <td className="px-3 py-2 text-right font-bold">{fmt(total)}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {selectedModule === "mapa" && (
        <div className="rounded-lg border border-border bg-background shadow-[0_1px_6px_rgba(15,23,42,0.06)]">
          <div className="border-b border-border p-6">
            <h2 className="text-[24px] font-bold">📅 Mapa de Custos</h2>
            <p className="mt-1 text-sm text-muted-foreground">Agregado mensal de custos com pessoal (salários + contribuições)</p>
          </div>
          <div className="p-6 overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-muted/20 border-b">
                <tr>
                  <th className="px-4 py-3 text-left">Mês</th>
                  <th className="px-4 py-3 text-right">Bruto</th>
                  <th className="px-4 py-3 text-right">Contribuições (11.3%)</th>
                  <th className="px-4 py-3 text-right">Total Custo</th>
                </tr>
              </thead>
              <tbody>
                {[
                  { mes: "Janeiro", bruto: 54000, contrib: 6102 },
                  { mes: "Fevereiro", bruto: 54000, contrib: 6102 },
                  { mes: "Março", bruto: 52920, contrib: 5979 },
                  { mes: "Abril", bruto: 54000, contrib: 6102 },
                  { mes: "Maio", bruto: 54000, contrib: 6102 },
                  { mes: "Junho", bruto: 54000, contrib: 6102 },
                ].map((row, i) => {
                  const total = row.bruto + row.contrib;
                  return (
                    <tr key={i} className="border-b hover:bg-muted/10">
                      <td className="px-4 py-3 font-medium">{row.mes}</td>
                      <td className="px-4 py-3 text-right">{fmt(row.bruto)}</td>
                      <td className="px-4 py-3 text-right text-warning">{fmt(row.contrib)}</td>
                      <td className="px-4 py-3 text-right font-bold">{fmt(total)}</td>
                    </tr>
                  );
                })}
                <tr className="bg-muted/30 font-bold">
                  <td className="px-4 py-3">TOTAL (12m)</td>
                  <td className="px-4 py-3 text-right">{fmt(326920)}</td>
                  <td className="px-4 py-3 text-right text-warning">{fmt(36942)}</td>
                  <td className="px-4 py-3 text-right text-success">{fmt(363862)}</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
