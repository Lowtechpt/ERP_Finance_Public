import { formatCurrency } from "@/lib/format";
import { MetricMini, SimpleBar } from "@/components/metrics";
import { normalizeQuestion } from "./utils";

export function AiInlineCharts({ question, data }: { question: string; data?: Record<string, any> | undefined }) {
  const normalized = normalizeQuestion(question);
  const wantsPersonnel = /funcion|pessoal|salari|venciment|remuner|ordenad|recursos humanos|colaborador/.test(normalized);
  const wantsCollections = /cliente|cobrar|cobran|divida|receber|vencid|aging/.test(normalized);
  const wantsProduction = /produ|custo|materia|mat[eé]ria|fabrico|ordem/.test(normalized);
  const wantsCashflow = /fluxo|caixa|liquidez|tesouraria|saldo/.test(normalized);

  if (wantsPersonnel) return null;
  if (/custo/.test(normalized) && !/produc|materia|fabrico|ordem|mao de obra direta|industrial/.test(normalized)) return null;

  if (wantsCollections && data?.customers) {
    const customers = Array.isArray(data.customers.customers) ? data.customers.customers : [];
    const topCustomers = customers
      .filter((customer: any) => Number(customer.currentDebt ?? 0) > 0)
      .sort((a: any, b: any) => Number(b.currentDebt ?? 0) - Number(a.currentDebt ?? 0))
      .slice(0, 5);
    const maxDebt = Math.max(...topCustomers.map((customer: any) => Number(customer.currentDebt ?? 0)), 1);

    return (
      <div className="mt-4 rounded-2xl border border-slate-200 bg-white p-3">
        <div className="mb-3 flex items-center justify-between">
          <p className="text-xs font-bold uppercase text-primary">Tabela automatica</p>
          <p className="text-xs text-slate-600">clientes a cobrar</p>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr className="border-b border-slate-200 text-left text-slate-600">
                <th className="py-2 pr-2">Cliente</th>
                <th className="py-2 text-right">Divida</th>
              </tr>
            </thead>
            <tbody>
              {topCustomers.map((customer: any) => (
                <tr key={customer.code} className="border-b border-slate-200">
                  <td className="py-2 pr-2 font-semibold">{customer.name}</td>
                  <td className="py-2 text-right font-bold text-danger">{formatCurrency(Number(customer.currentDebt ?? 0), customer.currency ?? "EUR")}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="mt-3 space-y-2">
          {topCustomers.map((customer: any) => (
            <SimpleBar key={`${customer.code}-bar`} label={customer.name} value={Number(customer.currentDebt ?? 0)} max={maxDebt} tone="danger" />
          ))}
        </div>
      </div>
    );
  }

  if (wantsProduction && data?.production) {
    const summary = data.production.summary ?? {};
    const orders = Array.isArray(data.production.orders) ? data.production.orders.slice(0, 5) : [];
    const max = Math.max(
      ...orders.map((order: any) => Number(order.CustoMateriaisPrevisto ?? 0) + Number(order.CustoTransformacaoPrevisto ?? 0)),
      1,
    );

    return (
      <div className="mt-4 rounded-2xl border border-slate-200 bg-white p-3">
        <div className="mb-3 flex items-center justify-between">
          <p className="text-xs font-bold uppercase text-primary">Grafico automatico</p>
          <p className="text-xs text-slate-600">custos de producao</p>
        </div>
        <div className="mb-3 grid grid-cols-3 gap-2 text-xs">
          <MetricMini label="Previsto" value={formatCurrency(Number(summary.totalPrevisto ?? 0))} />
          <MetricMini label="Real" value={formatCurrency(Number(summary.totalReal ?? 0))} tone="danger" />
          <MetricMini label="Desvio" value={formatCurrency(Number(summary.desvioTotal ?? 0))} tone={Number(summary.desvioTotal ?? 0) < 0 ? "success" : "danger"} />
        </div>
        <div className="space-y-3">
          {orders.map((order: any) => {
            const previsto = Number(order.CustoMateriaisPrevisto ?? 0) + Number(order.CustoTransformacaoPrevisto ?? 0);
            const real = Number(order.CustoMateriaisReal ?? 0) + Number(order.CustoTransformacaoReal ?? 0);
            return (
              <div key={order.Id ?? order.OrdemFabrico}>
                <div className="mb-1 flex justify-between gap-2 text-[11px]">
                  <span className="truncate font-semibold">{order.ArtigoDescricao ?? order.Artigo}</span>
                  <span className="shrink-0 text-slate-600">{formatCurrency(real)}</span>
                </div>
                <div className="h-2 rounded-full bg-slate-100">
                  <div className="h-2 rounded-full bg-primary" style={{ width: `${Math.min(100, (previsto / max) * 100)}%` }} />
                </div>
                <div className="mt-1 h-2 rounded-full bg-slate-100">
                  <div className="h-2 rounded-full bg-danger" style={{ width: `${Math.min(100, (real / max) * 100)}%` }} />
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  }

  if (wantsCashflow && data?.cashflow) {
    const summary = data.cashflow.summary ?? {};
    const incoming = Number(summary.totalIncoming ?? 0);
    const outgoing = Number(summary.totalOutgoing ?? 0);
    const max = Math.max(incoming, outgoing, 1);

    return (
      <div className="mt-4 rounded-2xl border border-slate-200 bg-white p-3">
        <p className="mb-3 text-xs font-bold uppercase text-primary">Grafico automatico</p>
        <SimpleBar label="Entradas" value={incoming} max={max} tone="success" />
        <SimpleBar label="Saidas" value={outgoing} max={max} tone="danger" />
        <MetricMini label="Saldo projetado" value={formatCurrency(Number(summary.projectedBalance ?? 0))} tone={Number(summary.projectedBalance ?? 0) >= 0 ? "success" : "danger"} />
      </div>
    );
  }

  return null;
}
