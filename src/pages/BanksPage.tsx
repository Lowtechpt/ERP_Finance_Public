import { useEffect, useState } from "react";
import { Banknote } from "lucide-react";
import { apiUrl } from "@/lib/api";
import { PageWrapper, SectionHeader, KPIGrid, PageLoadingState, PageEmptyState } from "@/components";
import { formatCurrency } from "@/lib/format";

type Account = {
  Conta: string;
  descBanco: string;
  banco: string;
  Moeda: string;
  TipoConta: number;
  limite: number;
};

type Movement = {
  doc: string;
  TipoDoc: string;
  entidade: string;
  TipoEntidade: string;
  debit: number;
  credit: number;
  contaOrigem: string;
  contaDestino: string;
  Moeda: string;
  obs: string;
};

type BanksResponse = {
  accounts: Account[];
  movements: Movement[];
};

const tipoContaLabels: Record<number, string> = {
  0: "Conta Ordem",
  1: "Conta Credito",
  2: "Deposito Prazo",
  3: "Cartao Credito",
  4: "Caixa",
  5: "Ponto Venda",
};

export default function BanksPage() {
  const [data, setData] = useState<BanksResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedAccount, setSelectedAccount] = useState<string | null>(null);

  useEffect(() => {
    let ignore = false;
    fetch(apiUrl("/api/banks"))
      .then((r) => {
        if (!r.ok) throw new Error(`API bancos respondeu ${r.status}`);
        return r.json() as Promise<BanksResponse>;
      })
      .then((d) => {
        if (!ignore) setData(d);
      })
      .catch(() => {
        if (!ignore) setData(null);
      })
      .finally(() => {
        if (!ignore) setLoading(false);
      });
    return () => { ignore = true; };
  }, []);

  if (loading) {
    return <PageLoadingState message="A carregar dados bancários..." />;
  }

  if (!data) {
    return <PageEmptyState title="Sem dados bancários" description="Nenhum dado de contas bancárias disponível" icon={Banknote} />;
  }

  const accounts = data.accounts ?? [];
  const movements = data.movements ?? [];

  const filteredMovements = selectedAccount
    ? movements.filter(
        (m) => m.contaOrigem === selectedAccount || m.contaDestino === selectedAccount,
      )
    : movements;

  const last30 = filteredMovements.slice(0, 30);
  const totalDebit = filteredMovements.reduce((s, m) => s + (m.debit || 0), 0);
  const totalCredit = filteredMovements.reduce((s, m) => s + (m.credit || 0), 0);
  const saldo = totalCredit - totalDebit;

  const kpis = [
    { label: "Contas", value: String(accounts.length), tone: "default" as const },
    { label: "Movimentos", value: String(last30.length), tone: "default" as const },
    { label: "Débitos", value: formatCurrency(totalDebit), tone: "danger" as const },
    { label: "Créditos", value: formatCurrency(totalCredit), tone: "success" as const },
    { label: "Saldo (C-D)", value: formatCurrency(saldo), tone: saldo >= 0 ? "success" as const : "danger" as const },
  ];

  return (
    <PageWrapper>
      <SectionHeader
        category="Tesouraria"
        categoryIcon={Banknote}
        title="Contas bancárias"
        description="Contas, movimentos e limites com dados do PRIMAVERA SQL"
      />

      <KPIGrid items={kpis} className="mb-5" />

      <div className="mt-5 rounded-xl border border-border bg-background p-4">
        <h3 className="mb-4 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">Contas</h3>
        <div className="grid gap-3 md:grid-cols-3">
          {accounts.length === 0 ? (
            <p className="col-span-full text-sm text-muted-foreground">
              Nenhuma conta bancaria disponivel.
            </p>
          ) : (
            accounts.map((acc) => (
              <button
                key={acc.Conta}
                type="button"
                onClick={() =>
                  setSelectedAccount(
                    selectedAccount === acc.Conta ? null : acc.Conta,
                  )
                }
                className={`rounded-xl border p-4 text-left shadow-sm transition hover:shadow-md ${
                  selectedAccount === acc.Conta
                    ? "border-info/20 bg-info-soft/40"
                    : "border-border bg-background"
                }`}
              >
                <p className="font-bold text-foreground">{acc.Conta}</p>
                <p className="mt-1 text-sm text-muted-foreground">
                  {acc.descBanco}
                </p>
                <div className="mt-3 flex items-center gap-2">
                  <span className="rounded-md bg-muted px-2 py-0.5 text-xs font-medium text-muted-foreground">
                    {tipoContaLabels[acc.TipoConta] ?? `Tipo ${acc.TipoConta}`}
                  </span>
                  <span className="rounded-md bg-info-soft px-2 py-0.5 text-xs font-semibold text-info">
                    {acc.Moeda}
                  </span>
                </div>
                {acc.limite > 0 && (
                  <p className="mt-2 text-xs text-muted-foreground">
                    Limite: {formatCurrency(acc.limite)}
                  </p>
                )}
              </button>
            ))
          )}
        </div>
      </div>

      <div className="mt-5 rounded-xl border border-border bg-background p-4">
        <div className="mb-4 flex items-baseline gap-3">
          <h3 className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">Movimentos de tesouraria</h3>
          <span className="text-sm text-muted-foreground">
            {last30.length} movimentos
            {selectedAccount && ` · conta ${selectedAccount}`}
          </span>
        </div>

        {last30.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            Nenhum movimento encontrado.
          </p>
        ) : (
          <div className="overflow-x-auto rounded-lg border border-border">
            <table className="w-full text-sm">
              <thead className="bg-muted/60">
                <tr className="border-b border-border text-left text-xs font-medium uppercase tracking-wide text-muted-foreground">
                  <th className="px-4 py-3">Documento</th>
                  <th className="px-4 py-3">Tipo</th>
                  <th className="px-4 py-3">Entidade</th>
                  <th className="px-4 py-3">Tipo Ent</th>
                  <th className="px-4 py-3 text-right">Debito</th>
                  <th className="px-4 py-3 text-right">Credito</th>
                  <th className="px-4 py-3">Conta Origem</th>
                  <th className="px-4 py-3">Obs</th>
                </tr>
              </thead>
              <tbody>
                {last30.map((m, i) => (
                  <tr
                    key={`${m.doc}-${i}`}
                    className="border-b border-border hover:bg-muted/40"
                  >
                    <td className="px-4 py-3 font-medium text-muted-foreground">{m.doc}</td>
                    <td className="px-4 py-3 text-muted-foreground">{m.TipoDoc}</td>
                    <td className="px-4 py-3 text-muted-foreground">{m.entidade}</td>
                    <td className="px-4 py-3 text-muted-foreground">{m.TipoEntidade}</td>
                    <td
                      className={`px-4 py-3 text-right font-semibold tabular-nums ${
                        m.debit > 0 ? "text-danger" : ""
                      }`}
                    >
                      {m.debit > 0 ? formatCurrency(m.debit) : "—"}
                    </td>
                    <td
                      className={`px-4 py-3 text-right font-semibold tabular-nums ${
                        m.credit > 0 ? "text-success" : ""
                      }`}
                    >
                      {m.credit > 0 ? formatCurrency(m.credit) : "—"}
                    </td>
                    <td className="px-4 py-3 text-muted-foreground">{m.contaOrigem}</td>
                    <td className="px-4 py-3 text-muted-foreground">
                      {m.obs || "—"}
                    </td>
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
