import { useEffect, useState } from "react";
import { apiUrl } from "@/lib/api";

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

function formatCurrency(value: number) {
  return new Intl.NumberFormat("pt-PT", {
    style: "currency",
    currency: "EUR",
    minimumFractionDigits: 2,
  }).format(value);
}

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
    return (
      <div className="flex min-h-[400px] items-center justify-center">
        <p className="text-sm text-muted-foreground">A carregar bancos...</p>
      </div>
    );
  }

  const accounts = data?.accounts ?? [];
  const movements = data?.movements ?? [];

  const filteredMovements = selectedAccount
    ? movements.filter(
        (m) => m.contaOrigem === selectedAccount || m.contaDestino === selectedAccount,
      )
    : movements;

  const last30 = filteredMovements.slice(0, 30);

  return (
    <section className="rounded-lg border border-border bg-background shadow-[0_1px_6px_rgba(15,23,42,0.06)]">
      <div className="border-b border-border p-6">
        <p className="text-xs font-semibold uppercase tracking-wide text-primary">
          Tesouraria
        </p>
        <div className="mt-2 flex items-center gap-3">
          <h2 className="text-[24px] font-bold">Contas bancarias</h2>
          <span className="rounded-md bg-success-soft px-2 py-1 text-xs font-semibold text-success">
            PRIMAVERA SQL
          </span>
        </div>
      </div>

      <div className="grid gap-4 p-6 md:grid-cols-3">
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
              className={`rounded-lg border p-5 text-left shadow-sm transition hover:shadow-md ${
                selectedAccount === acc.Conta
                  ? "border-primary bg-primary/5"
                  : "border-border bg-muted/20"
              }`}
            >
              <p className="font-bold">{acc.Conta}</p>
              <p className="mt-1 text-sm text-muted-foreground">
                {acc.descBanco}
              </p>
              <div className="mt-3 flex items-center gap-2">
                <span className="rounded-md bg-muted px-2 py-0.5 text-xs font-medium">
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

      <div className="border-t border-border p-6">
        <div className="mb-4 flex items-baseline gap-3">
          <h3 className="font-bold">Movimentos de tesouraria</h3>
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
              <thead>
                <tr className="border-b border-border bg-muted/30 text-left text-xs text-muted-foreground">
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
                    className="border-b border-border"
                  >
                    <td className="px-4 py-3 font-medium">{m.doc}</td>
                    <td className="px-4 py-3">{m.TipoDoc}</td>
                    <td className="px-4 py-3">{m.entidade}</td>
                    <td className="px-4 py-3">{m.TipoEntidade}</td>
                    <td
                      className={`px-4 py-3 text-right font-semibold ${
                        m.debit > 0 ? "text-danger" : ""
                      }`}
                    >
                      {m.debit > 0 ? formatCurrency(m.debit) : "—"}
                    </td>
                    <td
                      className={`px-4 py-3 text-right font-semibold ${
                        m.credit > 0 ? "text-success" : ""
                      }`}
                    >
                      {m.credit > 0 ? formatCurrency(m.credit) : "—"}
                    </td>
                    <td className="px-4 py-3">{m.contaOrigem}</td>
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
    </section>
  );
}
