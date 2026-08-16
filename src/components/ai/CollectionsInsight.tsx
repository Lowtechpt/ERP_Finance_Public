import { formatCurrency } from "@/lib/format";
import { MetricCard, SimpleBar } from "@/components/metrics";

export function CollectionsInsight({ customers, receivables, dataLoading }: { customers: any[]; receivables: any[]; dataLoading: boolean }) {
  const priorityCustomers = [...customers]
    .filter((customer) => Number(customer.currentDebt ?? 0) > 0)
    .sort((a, b) => Number(b.currentDebt ?? 0) - Number(a.currentDebt ?? 0))
    .slice(0, 10);
  const overdueDocs = [...receivables]
    .filter((doc) => Number(doc.daysOverdue ?? 0) > 0 && Number(doc.openAmount ?? 0) > 0)
    .sort((a, b) => Number(b.openAmount ?? 0) - Number(a.openAmount ?? 0))
    .slice(0, 8);
  const totalDebt = priorityCustomers.reduce((sum, customer) => sum + Number(customer.currentDebt ?? 0), 0);
  const maxDebt = Math.max(...priorityCustomers.map((customer) => Number(customer.currentDebt ?? 0)), 1);

  return (
    <div className="space-y-4 p-6">
      <div className="grid gap-4 md:grid-cols-3">
        <MetricCard label="Clientes com dívida" value={dataLoading ? "..." : String(priorityCustomers.length)} />
        <MetricCard label="Dívida em prioridade" value={formatCurrency(totalDebt)} tone="danger" />
        <MetricCard label="Docs vencidos" value={String(overdueDocs.length)} />
      </div>
      <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_420px]">
        <div className="rounded-2xl border border-slate-200">
          <div className="border-b border-slate-200 px-4 py-3">
            <h3 className="font-bold">Clientes a cobrar primeiro</h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[760px] text-sm">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50 text-left text-xs text-slate-600">
                  <th className="px-4 py-3">Cliente</th>
                  <th className="px-4 py-3">NIF</th>
                  <th className="px-4 py-3 text-right">Dívida</th>
                  <th className="px-4 py-3 text-right">Docs</th>
                  <th className="px-4 py-3">Condição</th>
                </tr>
              </thead>
              <tbody>
                {priorityCustomers.map((customer) => (
                  <tr key={customer.code} className="border-b border-slate-200">
                    <td className="px-4 py-3 font-semibold">{customer.name}</td>
                    <td className="px-4 py-3 text-slate-600">{customer.nif ?? "-"}</td>
                    <td className="px-4 py-3 text-right font-bold text-danger">{formatCurrency(Number(customer.currentDebt ?? 0), customer.currency ?? "EUR")}</td>
                    <td className="px-4 py-3 text-right">{customer.documentCount ?? 0}</td>
                    <td className="px-4 py-3">{customer.paymentCondition || "-"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
        <div className="rounded-2xl border border-slate-200 p-5">
          <h3 className="mb-4 font-bold">Gráfico de dívida</h3>
          <div className="space-y-3">
            {priorityCustomers.slice(0, 7).map((customer) => (
              <SimpleBar
                key={customer.code}
                label={customer.name}
                value={Number(customer.currentDebt ?? 0)}
                max={maxDebt}
                tone="danger"
              />
            ))}
          </div>
        </div>
      </div>
      <div className="rounded-2xl border border-slate-200">
        <div className="border-b border-slate-200 px-4 py-3">
          <h3 className="font-bold">Documentos vencidos de maior valor</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[760px] text-sm">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50 text-left text-xs text-slate-600">
                <th className="px-4 py-3">Cliente</th>
                <th className="px-4 py-3">Documento</th>
                <th className="px-4 py-3 text-right">Dias vencido</th>
                <th className="px-4 py-3 text-right">Em aberto</th>
              </tr>
            </thead>
            <tbody>
              {overdueDocs.map((doc) => (
                <tr key={`${doc.documentNumber}-${doc.clientName}`} className="border-b border-slate-200">
                  <td className="px-4 py-3 font-semibold">{doc.clientName ?? "Cliente indiferenciado"}</td>
                  <td className="px-4 py-3">{doc.documentNumber}</td>
                  <td className="px-4 py-3 text-right text-danger">{doc.daysOverdue ?? 0}</td>
                  <td className="px-4 py-3 text-right font-bold">{formatCurrency(Number(doc.openAmount ?? 0), doc.currency ?? "EUR")}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
