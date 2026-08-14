import { useEffect, useState } from "react";
import { apiUrl } from "@/lib/api";

type Payable = {
  doc: string;
  supplierCode: string;
  supplierName: string;
  nif: string | null;
  docDate: string;
  dueDate: string;
  daysOverdue: number;
  totalAmount: number;
  currency: string;
  paymentCondition: string;
  status: "Vencido" | "Pendente";
};

type Tab = "Todos" | "Vencidos" | "A vencer";

function formatCurrency(value: number) {
  return new Intl.NumberFormat("pt-PT", {
    style: "currency",
    currency: "EUR",
    minimumFractionDigits: 2,
  }).format(value);
}

function StatusBadge({ status }: { status: Payable["status"] }) {
  const colors =
    status === "Vencido"
      ? "bg-red-100 text-red-700"
      : "bg-blue-100 text-blue-700";
  return (
    <span className={`inline-block rounded-md px-2 py-0.5 text-xs font-semibold ${colors}`}>
      {status}
    </span>
  );
}

export default function PayablesPage() {
  const [allPayables, setAllPayables] = useState<Payable[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<Tab>("Todos");
  const [toastMsg, setToastMsg] = useState<string | null>(null);

  useEffect(() => {
    let ignore = false;
    fetch(apiUrl("/api/payables"))
      .then((r) => {
        if (!r.ok) throw new Error(`API payables respondeu ${r.status}`);
        return r.json() as Promise<{ payables: Payable[] }>;
      })
      .then((d) => {
        if (!ignore) setAllPayables(d.payables);
      })
      .catch(() => {
        if (!ignore) setAllPayables([]);
      })
      .finally(() => {
        if (!ignore) setLoading(false);
      });
    return () => { ignore = true; };
  }, []);

  const totalAll = allPayables.reduce((s, p) => s + p.totalAmount, 0);
  const totalOverdue = allPayables
    .filter((p) => p.status === "Vencido")
    .reduce((s, p) => s + p.totalAmount, 0);
  const totalDue30 = allPayables
    .filter((p) => p.daysOverdue >= -30 && p.daysOverdue <= 0)
    .reduce((s, p) => s + p.totalAmount, 0);

  const filtered = allPayables.filter((p) => {
    if (activeTab === "Vencidos") return p.status === "Vencido";
    if (activeTab === "A vencer") return p.daysOverdue >= -30 && p.daysOverdue <= 0;
    return true;
  });

  const totalFiltered = filtered.reduce((s, p) => s + p.totalAmount, 0);

  const tabs: Tab[] = ["Todos", "Vencidos", "A vencer"];

  if (loading) {
    return (
      <div className="flex min-h-[400px] items-center justify-center">
        <p className="text-sm text-muted-foreground">A carregar contas a pagar...</p>
      </div>
    );
  }

  return (
    <section className="rounded-lg border border-border bg-background shadow-[0_1px_6px_rgba(15,23,42,0.06)]">
      <div className="border-b border-border p-6">
        <p className="text-xs font-semibold uppercase tracking-wide text-primary">
          Tesouraria
        </p>
        <div className="mt-2 flex items-center gap-3">
          <h2 className="text-[24px] font-bold">Contas a pagar</h2>
          <span className="rounded-md bg-success-soft px-2 py-1 text-xs font-semibold text-success">
            PRIMAVERA SQL
          </span>
        </div>
        <p className="mt-2 max-w-3xl text-sm leading-6 text-muted-foreground">
          Compromissos de fornecedores, vencimentos e prioridades de pagamento.
        </p>
      </div>

      <div className="grid gap-4 p-6 md:grid-cols-3">
        <div className="rounded-lg border border-border bg-muted/20 p-5 shadow-sm">
          <p className="text-xs font-semibold text-muted-foreground">Total a pagar</p>
          <p className="mt-2 text-2xl font-bold text-danger">{formatCurrency(totalAll)}</p>
        </div>
        <div className="rounded-lg border border-border bg-muted/20 p-5 shadow-sm">
          <p className="text-xs font-semibold text-muted-foreground">Vencido</p>
          <p className="mt-2 text-2xl font-bold text-danger">{formatCurrency(totalOverdue)}</p>
        </div>
        <div className="rounded-lg border border-border bg-muted/20 p-5 shadow-sm">
          <p className="text-xs font-semibold text-muted-foreground">A vencer 30 dias</p>
          <p className="mt-2 text-2xl font-bold text-amber-600">{formatCurrency(totalDue30)}</p>
        </div>
      </div>

      <div className="border-t border-border px-6 py-3">
        <div className="flex gap-1 rounded-lg bg-muted p-1">
          {tabs.map((tab) => (
            <button
              key={tab}
              type="button"
              onClick={() => setActiveTab(tab)}
              className={`rounded-md px-4 py-1.5 text-sm font-medium transition-colors ${
                activeTab === tab
                  ? "bg-background text-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              {tab}
            </button>
          ))}
        </div>
      </div>

      <div className="overflow-x-auto border-t border-border">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border bg-muted/30 text-left text-xs text-muted-foreground">
              <th className="px-4 py-3">Documento</th>
              <th className="px-4 py-3">Fornecedor</th>
              <th className="px-4 py-3">NIF</th>
              <th className="px-4 py-3">Vencimento</th>
              <th className="px-4 py-3">Dias v.</th>
              <th className="px-4 py-3 text-right">Total</th>
              <th className="px-4 py-3">Estado</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((p, i) => (
              <tr
                key={`${p.doc}-${i}`}
                onClick={() => setToastMsg(`${p.doc} — ${p.supplierName}`)}
                className="cursor-pointer border-b border-border transition-colors hover:bg-muted/50"
              >
                <td className="px-4 py-3 font-medium">{p.doc}</td>
                <td className="px-4 py-3">{p.supplierName}</td>
                <td className="px-4 py-3">{p.nif ?? "—"}</td>
                <td className="px-4 py-3">{p.dueDate}</td>
                <td
                  className={`px-4 py-3 font-medium ${
                    p.daysOverdue > 0 ? "text-danger" : ""
                  }`}
                >
                  {p.daysOverdue}
                </td>
                <td className="px-4 py-3 text-right font-semibold">
                  {formatCurrency(p.totalAmount)}
                </td>
                <td className="px-4 py-3">
                  <StatusBadge status={p.status} />
                </td>
              </tr>
            ))}
            {filtered.length === 0 && (
              <tr>
                <td colSpan={7} className="px-4 py-8 text-center text-sm text-muted-foreground">
                  Nenhum documento encontrado.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <div className="border-t border-border bg-muted/20 px-6 py-3">
        <div className="flex justify-between text-sm font-semibold">
          <span>{filtered.length} documento{filtered.length !== 1 ? "s" : ""}</span>
          <span>{formatCurrency(totalFiltered)}</span>
        </div>
      </div>

      {toastMsg && (
        <div className="fixed bottom-6 left-1/2 z-50 -translate-x-1/2 rounded-lg bg-foreground px-5 py-3 text-sm text-background shadow-lg">
          {toastMsg}
          <button
            type="button"
            onClick={() => setToastMsg(null)}
            className="ml-4 text-xs font-semibold uppercase opacity-60 hover:opacity-100"
          >
            Fechar
          </button>
        </div>
      )}
    </section>
  );
}
