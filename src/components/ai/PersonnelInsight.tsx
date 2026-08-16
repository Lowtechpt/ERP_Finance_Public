import { formatCurrency } from "@/lib/format";
import { MetricCard, MetricLine, SimpleBar } from "@/components/metrics";

export function PersonnelInsight({ data, dataLoading }: { data: Record<string, any>; dataLoading: boolean }) {
  const personnel = data.personnel ?? {};
  const dre = data.dre ?? {};
  const accounts = Array.isArray(personnel.contabilidade) ? personnel.contabilidade : [];
  const employees = Array.isArray(personnel.detalhe) ? personnel.detalhe : [];
  const totalPersonnel = Number(personnel.totalContabilidade ?? accounts.reduce((sum: number, account: any) => sum + Number(account.total ?? 0), 0));
  const totalEmployees = Number(personnel.funcionarios?.totalFuncionarios ?? 0);
  const activeEmployeesRaw = Number(personnel.funcionarios?.ativos ?? 0);
  const activeEmployees = activeEmployeesRaw > 0 ? activeEmployeesRaw : totalEmployees;
  const monthlyPayroll = Number(personnel.funcionarios?.massaSalarialMensal ?? 0);
  const annualPayroll = Number(personnel.funcionarios?.massaSalarialAnual ?? 0);
  const netSales = Number(dre.vendasLiquidas ?? 0);
  const operatingCosts = Number(dre.custosOperacionais ?? 0);
  const ebitda = Number(dre.ebitda ?? 0);
  const avgCost = activeEmployees > 0 ? totalPersonnel / activeEmployees : 0;
  const personnelSalesPct = netSales > 0 ? (totalPersonnel / netSales) * 100 : 0;
  const payrollGap = totalPersonnel - annualPayroll;
  const barMax = Math.max(totalPersonnel, netSales, operatingCosts, Math.abs(ebitda), 1);
  const personnelOpexPct = operatingCosts > 0 ? (totalPersonnel / operatingCosts) * 100 : 0;
  const demoSupplement = personnel.demoSupplement;
  const headline = netSales > 0
    ? `Custo com pessoal de ${formatCurrency(totalPersonnel)} representa ${personnelSalesPct.toFixed(1)}% das vendas liquidas e pressiona um EBITDA negativo de ${formatCurrency(ebitda)}.`
    : `Custo com pessoal de ${formatCurrency(totalPersonnel)} sem base de vendas liquidas suficiente para avaliar peso operacional.`;

  return (
    <div className="space-y-5 p-6">
      <div className="rounded-lg border border-danger/30 bg-danger/5 p-5">
        <p className="text-xs font-bold uppercase text-danger">Conclusao executiva</p>
        <h3 className="mt-2 text-xl font-bold leading-7">{dataLoading ? "A calcular leitura financeira..." : headline}</h3>
        <div className="mt-4 grid gap-3 md:grid-cols-3">
          <MetricLine label="Peso no OPEX" value={operatingCosts > 0 ? `${personnelOpexPct.toFixed(1)}%` : "Sem OPEX"} tone={personnelOpexPct > 40 ? "danger" : "default"} />
          <MetricLine label="Contabilidade vs payroll anual" value={formatCurrency(payrollGap)} tone={payrollGap > 0 ? "danger" : "success"} />
          <MetricLine label="Acao imediata" value="Mapear centros de custo" tone="danger" />
        </div>
      </div>

      {demoSupplement?.isDemo && (
        <div className="rounded-2xl border border-warning/40 bg-warning/5 p-4">
          <div className="flex items-start gap-3">
            <span className="mt-0.5 shrink-0 rounded bg-warning/20 px-2 py-0.5 text-xs font-bold uppercase tracking-wider text-warning">Demo</span>
            <div>
              <p className="text-sm font-bold text-warning">Dados suplementares de teste</p>
              <p className="mt-1 text-xs leading-5 text-slate-600">{demoSupplement.note}</p>
            </div>
          </div>
        </div>
      )}

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <MetricCard label="Custo contabilistico pessoal" value={dataLoading ? "..." : formatCurrency(totalPersonnel)} tone="danger" />
        <MetricCard label="Funcionarios considerados" value={dataLoading ? "..." : `${activeEmployees} / ${totalEmployees}`} />
        <MetricCard label="Massa salarial mensal" value={dataLoading ? "..." : formatCurrency(monthlyPayroll)} />
        <MetricCard label="Custo medio por ativo" value={dataLoading ? "..." : formatCurrency(avgCost)} />
        <MetricCard label="Massa salarial anual estimada" value={dataLoading ? "..." : formatCurrency(annualPayroll)} />
        <MetricCard label="Peso nas vendas liquidas" value={dataLoading || !netSales ? "Sem vendas" : `${personnelSalesPct.toFixed(1)}%`} tone={personnelSalesPct > 35 ? "danger" : "default"} />
        <MetricCard label="EBITDA" value={dataLoading ? "..." : formatCurrency(ebitda)} tone={ebitda >= 0 ? "success" : "danger"} />
        <MetricCard label="Diferenca vs massa anual" value={dataLoading ? "..." : formatCurrency(payrollGap)} tone={payrollGap > 0 ? "danger" : "success"} />
      </div>

      <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_420px]">
        <div className="rounded-2xl border border-slate-200">
          <div className="border-b border-slate-200 px-5 py-4">
            <h3 className="font-bold">Breakdown contabilistico por conta</h3>
            <p className="mt-1 text-sm text-slate-600">Debitos nas contas de pessoal encontrados no PRIMAVERA.</p>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[720px] text-sm">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50 text-left text-xs text-slate-600">
                  <th className="px-4 py-3">Conta</th>
                  <th className="px-4 py-3">Descricao</th>
                  <th className="px-4 py-3 text-right">Total</th>
                  <th className="px-4 py-3 text-right">Peso</th>
                </tr>
              </thead>
              <tbody>
                {accounts.length ? accounts.map((account: any) => {
                  const value = Number(account.total ?? 0);
                  const pct = totalPersonnel > 0 ? (value / totalPersonnel) * 100 : 0;
                  return (
                    <tr key={account.Conta} className="border-b border-slate-200">
                      <td className="px-4 py-3 font-semibold">{account.Conta}</td>
                      <td className="px-4 py-3">{cleanAccountDescription(account)}</td>
                      <td className="px-4 py-3 text-right font-bold text-danger">{formatCurrency(value)}</td>
                      <td className="px-4 py-3 text-right">{pct.toFixed(1)}%</td>
                    </tr>
                  );
                }) : (
                  <tr>
                    <td colSpan={4} className="px-4 py-6 text-center text-slate-600">Sem contas contabilisticas de pessoal no periodo analisado.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        <div className="space-y-5">
          <div className="rounded-2xl border border-slate-200 p-5">
            <h3 className="mb-4 font-bold">Comparacao executiva</h3>
            <div className="space-y-3">
              <SimpleBar label="Pessoal" value={totalPersonnel} max={barMax} tone="danger" />
              <SimpleBar label="Vendas liquidas" value={netSales} max={barMax} tone="success" />
              <SimpleBar label="Custos operacionais" value={operatingCosts} max={barMax} tone="danger" />
              <SimpleBar label="EBITDA absoluto" value={Math.abs(ebitda)} max={barMax} tone={ebitda >= 0 ? "success" : "danger"} />
            </div>
          </div>

          <div className="rounded-2xl border border-slate-200 p-5">
            <h3 className="font-bold">Leitura CFO</h3>
            <div className="mt-3 space-y-3 text-sm leading-6 text-slate-600">
              <p>O custo contabilistico de pessoal representa {netSales > 0 ? `${personnelSalesPct.toFixed(1)}% das vendas liquidas` : "um peso que nao pode ser calculado sem vendas liquidas"}.</p>
              <p>A diferenca entre contabilidade e massa salarial anual estimada e {formatCurrency(payrollGap)}.</p>
              <p>Prioridade: validar se remuneracoes, encargos e seguros estao corretamente imputados por centro de custo.</p>
            </div>
          </div>
        </div>
      </div>

      <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_420px]">
        <div className="rounded-2xl border border-slate-200">
          <div className="border-b border-slate-200 px-5 py-4">
            <h3 className="font-bold">Top vencimentos base</h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[760px] text-sm">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50 text-left text-xs text-slate-600">
                  <th className="px-4 py-3">Codigo</th>
                  <th className="px-4 py-3">Nome</th>
                  <th className="px-4 py-3">Categoria</th>
                  <th className="px-4 py-3">Situacao</th>
                  <th className="px-4 py-3 text-right">Vencimento</th>
                </tr>
              </thead>
              <tbody>
                {employees.slice(0, 8).map((employee: any) => (
                  <tr key={employee.Codigo} className="border-b border-slate-200">
                    <td className="px-4 py-3 font-semibold">{employee.Codigo}</td>
                    <td className="px-4 py-3">{employee.Nome}</td>
                    <td className="px-4 py-3 text-slate-600">{employee.Categoria || "-"}</td>
                    <td className="px-4 py-3">{employee.Situacao || "-"}</td>
                    <td className="px-4 py-3 text-right font-bold">{formatCurrency(Number(employee.vencimento ?? 0))}</td>
                  </tr>
                ))}
                {!employees.length && (
                  <tr>
                    <td colSpan={5} className="px-4 py-6 text-center text-slate-600">Sem detalhe de funcionarios disponivel.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        <div className="rounded-2xl border border-slate-200 p-5">
          <h3 className="font-bold">Dimensoes disponiveis para teste</h3>
          <div className="mt-3 space-y-2 text-sm leading-6">
            {demoSupplement ? (
              <>
                <p className="text-slate-600">Os dados abaixo foram gerados para simular dimensoes que o PRIMAVERA demo nao fornece. As seguintes dimensoes reais continuam por integrar do ERP:</p>
                <ul className="mt-2 space-y-1">
                  {demoSupplement.missingRealDimensions.map((dim: string) => (
                    <li key={dim} className="flex items-center gap-2 text-slate-600">
                      <span className="size-1.5 shrink-0 rounded-full bg-slate-300" />
                      {dim}
                    </li>
                  ))}
                </ul>
              </>
            ) : (
              <p className="text-slate-600">Sem dados suplementares disponiveis. As dimensoes analiticas dependem da configuracao do PRIMAVERA.</p>
            )}
          </div>
        </div>
      </div>

      {demoSupplement && (
        <>
          <div className="rounded-2xl border border-slate-200">
            <div className="border-b border-slate-200 px-5 py-4">
              <div className="flex items-center gap-2">
                <h3 className="font-bold">Custos por departamento / centro de custo</h3>
                <span className="rounded bg-warning/15 px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wide text-warning">demo</span>
              </div>
              <p className="mt-1 text-sm text-slate-600">Distribuicao estimada do custo com pessoal pelos departamentos.</p>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full min-w-[760px] text-sm">
                <thead>
                  <tr className="border-b border-slate-200 bg-slate-50 text-left text-xs text-slate-600">
                    <th className="px-4 py-3">Departamento</th>
                    <th className="px-4 py-3">Centro Custo</th>
                    <th className="px-4 py-3 text-right">Montante</th>
                    <th className="px-4 py-3 text-right">%</th>
                    <th className="px-4 py-3 text-right">FTE</th>
                    <th className="px-4 py-3" />
                  </tr>
                </thead>
                <tbody>
                  {demoSupplement.departments.map((dep: any) => (
                    <tr key={dep.department} className="border-b border-slate-200">
                      <td className="px-4 py-3 font-semibold">{dep.department}</td>
                      <td className="px-4 py-3 text-slate-600">{dep.costCenter}</td>
                      <td className="px-4 py-3 text-right font-bold">{formatCurrency(dep.amount)}</td>
                      <td className="px-4 py-3 text-right">{dep.percent}%</td>
                      <td className="px-4 py-3 text-right">{dep.fte}</td>
                      <td className="px-4 py-3">
                        <div className="h-2 w-24 overflow-hidden rounded-full bg-slate-100">
                          <div className="h-full rounded-full bg-danger" style={{ width: `${dep.percent}%` }} />
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <div className="rounded-2xl border border-slate-200">
            <div className="border-b border-slate-200 px-5 py-4">
              <div className="flex items-center gap-2">
                <h3 className="font-bold">Mapa mensal e encargos</h3>
                <span className="rounded bg-warning/15 px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wide text-warning">demo</span>
              </div>
              <p className="mt-1 text-sm text-slate-600">Estimativa mensal do custo total, base salarial e encargos patronais com base no contabilistico anual.</p>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full min-w-[820px] text-sm">
                <thead>
                  <tr className="border-b border-slate-200 bg-slate-50 text-left text-xs text-slate-600">
                    <th className="px-4 py-3">Mes</th>
                    <th className="px-4 py-3 text-right">Base salarial</th>
                    <th className="px-4 py-3 text-right">Encargos</th>
                    <th className="px-4 py-3 text-right">Total</th>
                    <th className="px-4 py-3" />
                  </tr>
                </thead>
                <tbody>
                  {demoSupplement.monthlyTrend.map((mt: any) => {
                    const maxMonthly = Math.max(...demoSupplement.monthlyTrend.map((m: any) => m.amount), 1);
                    return (
                      <tr key={mt.month} className="border-b border-slate-200">
                        <td className="px-4 py-3 font-semibold">{mt.month}</td>
                        <td className="px-4 py-3 text-right">{formatCurrency(mt.payrollBase)}</td>
                        <td className="px-4 py-3 text-right">{formatCurrency(mt.employerCharges)}</td>
                        <td className="px-4 py-3 text-right font-bold">{formatCurrency(mt.amount)}</td>
                        <td className="px-4 py-3">
                          <div className="h-2 w-24 overflow-hidden rounded-full bg-slate-100">
                            <div className="h-full rounded-full bg-primary" style={{ width: `${(mt.amount / maxMonthly) * 100}%` }} />
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          <div className="rounded-2xl border border-slate-200">
            <div className="border-b border-slate-200 px-5 py-4">
              <div className="flex items-center gap-2">
                <h3 className="font-bold">Mao de obra imputada a ordens</h3>
                <span className="rounded bg-warning/15 px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wide text-warning">demo</span>
              </div>
              <p className="mt-1 text-sm text-slate-600">Imputacao estimada de mao de obra direta do departamento Producao (42% do total) pelas ordens de fabrico ativas.</p>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full min-w-[760px] text-sm">
                <thead>
                  <tr className="border-b border-slate-200 bg-slate-50 text-left text-xs text-slate-600">
                    <th className="px-4 py-3">Ordem</th>
                    <th className="px-4 py-3">Artigo</th>
                    <th className="px-4 py-3 text-right">Horas</th>
                    <th className="px-4 py-3 text-right">Custo/hora</th>
                    <th className="px-4 py-3 text-right">Mao obra</th>
                    <th className="px-4 py-3">Fonte</th>
                  </tr>
                </thead>
                <tbody>
                  {demoSupplement.productionLabor.map((pl: any) => (
                    <tr key={pl.order} className="border-b border-slate-200">
                      <td className="px-4 py-3 font-semibold">{pl.order}</td>
                      <td className="px-4 py-3">{pl.article}</td>
                      <td className="px-4 py-3 text-right">{pl.hours}</td>
                      <td className="px-4 py-3 text-right">{formatCurrency(pl.costPerHour)}</td>
                      <td className="px-4 py-3 text-right font-bold">{formatCurrency(pl.directLabor)}</td>
                      <td className="px-4 py-3"><span className="rounded bg-warning/10 px-1.5 py-0.5 text-[10px] font-bold uppercase text-warning">demo</span></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}
    </div>
  );
}

function cleanAccountDescription(account: any) {
  const accountCode = String(account?.Conta ?? "");
  if (accountCode === "6421") return "Remuneracoes do Pessoal - Vencimentos";
  if (accountCode === "6452") return "Encargos sobre Remuneracoes - Pessoal";
  return String(account?.Descricao ?? "-").replace(/�/g, "");
}
