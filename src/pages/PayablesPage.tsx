import { useEffect, useState } from "react";
import { apiUrl } from "@/lib/api";
import { formatCurrency } from "@/lib/format";
import { PageWrapper, SectionHeader, PageLoadingState, KPIGrid, DataTable, StatusBadge, TabGroup, TabButton } from "@/components";
import type { ColumnDef } from "@/components";

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
  const totalPending = allPayables
    .filter((p) => p.status === "Pendente")
    .reduce((s, p) => s + p.totalAmount, 0);
  const avgPaymentTerm = allPayables.length > 0
    ? Math.round(allPayables.reduce((s, p) => s + parseInt(p.paymentCondition || "0"), 0) / allPayables.length)
    : 0;

  const filtered = allPayables.filter((p) => {
    if (activeTab === "Vencidos") return p.status === "Vencido";
    if (activeTab === "A vencer") return p.daysOverdue >= -30 && p.daysOverdue <= 0;
    return true;
  });

  const totalFiltered = filtered.reduce((s, p) => s + p.totalAmount, 0);

  const tabs: Tab[] = ["Todos", "Vencidos", "A vencer"];

  const kpis = [
    { label: "Total a Pagar", value: formatCurrency(totalAll), tone: "default" as const },
    { label: "Vencido", value: formatCurrency(totalOverdue), tone: "danger" as const },
    { label: "A Vencer 30d", value: formatCurrency(totalDue30), tone: "warning" as const },
    { label: "Pendente", value: formatCurrency(totalPending), tone: "default" as const },
    { label: "Prazo Médio", value: `${avgPaymentTerm} dias`, tone: "default" as const },
  ];

  const columns: ColumnDef<Payable>[] = [
    { header: "Documento", accessorKey: "doc" },
    { header: "Fornecedor", accessorKey: "supplierName" },
    {
      header: "NIF",
      accessorKey: "nif",
      render: (value: string | null) => <span className="text-muted-foreground">{value ?? "—"}</span>,
    },
    { header: "Vencimento", accessorKey: "dueDate" },
    {
      header: "Dias v.",
      accessorKey: "daysOverdue",
      render: (value: number) => (
        <span className={value > 0 ? "font-medium text-danger" : "font-medium text-foreground"}>
          {value}
        </span>
      ),
    },
    {
      header: "Total",
      accessorKey: "totalAmount",
      render: (value: number) => <span className="font-semibold tabular-nums">{formatCurrency(value)}</span>,
    },
    {
      header: "Estado",
      accessorKey: "status",
      render: (value: Payable["status"]) => <StatusBadge status={value} />,
    },
  ];

  if (loading) {
    return <PageLoadingState message="A carregar contas a pagar..." />;
  }

  return (
    <PageWrapper>
      <div className="space-y-8">
        <KPIGrid items={kpis} />

        <SectionHeader
          category="Tesouraria"
          title="Contas a Pagar"
          description="Compromissos de fornecedores, vencimentos e prioridades de pagamento"
        />

        <div className="bg-background rounded-xl shadow-sm border border-border overflow-hidden">
          <div className="border-b border-border px-6 py-3">
            <TabGroup className="w-fit">
              {tabs.map((tab) => (
                <TabButton key={tab} active={activeTab === tab} onClick={() => setActiveTab(tab)}>
                  {tab}
                </TabButton>
              ))}
            </TabGroup>
          </div>

          <DataTable
            columns={columns}
            data={filtered}
            onRowClick={(p) => setToastMsg(`${p.doc} — ${p.supplierName}`)}
            summary={
              <div className="flex justify-between text-sm font-semibold text-foreground">
                <span>{filtered.length} documento{filtered.length !== 1 ? "s" : ""}</span>
                <span className="tabular-nums">{formatCurrency(totalFiltered)}</span>
              </div>
            }
          />
        </div>
      </div>

      {toastMsg && (
        <div className="fixed bottom-6 left-1/2 z-50 -translate-x-1/2 rounded-lg bg-foreground px-5 py-3 text-sm text-white shadow-lg">
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
    </PageWrapper>
  );
}
