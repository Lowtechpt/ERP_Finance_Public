import { Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { type NavItemType } from "@/components/ui/navigation-menu";
import { PageWrapper, SectionHeader } from "@/components";
import { StatusBadge } from "@/components/metrics";
import { cn } from "@/lib/utils";
import { formatCurrency, moduleDisplayName, parseCurrency } from "@/lib/format";
import type { ReceivableView } from "@/lib/receivables";
import type { PrimaveraCustomer, PrimaveraModule } from "@/types/primavera";

export function ModulePage({
  route,
  routeKey,
  modules,
  customers,
  customersLoaded,
  receivables,
  onNotify,
}: {
  route: { title: string; eyebrow: string; description: string; links: NavItemType[] };
  routeKey: string;
  modules: PrimaveraModule[];
  customers: PrimaveraCustomer[];
  customersLoaded: boolean;
  receivables: ReceivableView[];
  onNotify: (message: string) => void;
}) {
  const routeCode = route.eyebrow.toUpperCase();
  const moduleFamilies: Record<string, string[]> = {
    BAS: ["BAS", "ART", "ARM", "FOR", "VDR"],
    CBL: ["CBL", "CBL-PC"],
    CCT: ["CCT", "TES"],
    CMP: ["CMP", "FOR"],
    CRM: ["CRM"],
    EAP: ["EAP"],
    EPK: ["EPK"],
    ERP: ["BAS", "VND", "CMP", "CCT", "TES", "INV", "GPR", "CBL"],
    GPR: ["GPR", "GPR-CMP"],
    INT: ["BAS", "VND", "CMP"],
    INV: ["INV", "STK", "ART", "ARM"],
    MOB: ["BAS", "VND", "INV"],
    PCM: ["BAS", "CRM"],
    PRJ: ["PRJ"],
    RHP: ["RHP"],
    STP: ["STP"],
    TES: ["TES", "CCT"],
    TTE: ["TTE"],
    VND: ["VND", "VND-LIN", "BAS", "VDR"],
    "VISÃO GERAL": ["VND", "CCT", "TES", "INV", "GPR", "CBL"],
    "ANÁLISE FINANCEIRA": ["CBL", "CCT", "TES", "VND", "CMP"],
    CLIENTES: ["BAS", "CCT", "VND"],
    RELATÓRIOS: ["CBL", "CCT", "TES", "VND", "CMP", "INV"],
    PLANEAMENTO: ["VND", "CMP", "GPR", "INV"],
    INTEGRAÇÃO: ["BAS", "VND", "CMP", "INV", "GPR", "CBL"],
  };
  const relevantCodes = moduleFamilies[routeCode] ?? [routeCode];
  const relevantModules = modules.filter((module) =>
    relevantCodes.some((code) => module.code === code || module.code.startsWith(`${code}-`)),
  );
  const visibleModules = relevantModules.length ? relevantModules : modules.slice(0, 6);
  const customerRoutes = new Set([
    "clientes",
    "top-clientes",
    "aging",
    "risco-credito",
    "historico",
    "concentracao",
    "comunicacoes",
  ]);
  const showCustomerWorkspace = customerRoutes.has(routeKey);
  const customerWorkspaceTitle: Record<string, string> = {
    clientes: "Carteira de clientes",
    "top-clientes": "Clientes por faturacao e divida",
    aging: "Aging de recebimentos por cliente",
    "risco-credito": "Risco de credito",
    historico: "Historico de documentos",
    concentracao: "Concentracao de risco",
    comunicacoes: "Comunicacoes de cobranca",
  };
  const topCustomers = [...customers].sort((a, b) => b.currentDebt - a.currentDebt).slice(0, 8);
  const totalDebt = customers.reduce((sum, customer) => sum + customer.currentDebt, 0);
  const agingBuckets = [
    { label: "0-30 dias", min: 0, max: 30 },
    { label: "31-60 dias", min: 31, max: 60 },
    { label: "61-90 dias", min: 61, max: 90 },
    { label: "+90 dias", min: 91, max: Number.POSITIVE_INFINITY },
  ].map((bucket) => {
    const rows = receivables.filter(({ row }) => {
      const days = Number(row[4]) || 0;
      return days >= bucket.min && days <= bucket.max;
    });
    return {
      label: bucket.label,
      count: rows.length,
      amount: rows.reduce((sum, { row }) => sum + parseCurrency(row[7]), 0),
    };
  });
  const recentReceivables = receivables.slice(0, 8);

  return (
    <PageWrapper>
      <SectionHeader
        category={route.eyebrow}
        title={route.title}
        description={route.description}
      />
      <div className="grid-fluid mb-6">
        {route.links.map((link) => {
          const linkRoute = link.href.replace(/^#/, "");
          const isActiveLink = linkRoute === routeKey;
          return (
          <a
            key={link.href}
            href={link.href}
            aria-current={isActiveLink ? "page" : undefined}
            className={cn(
              "rounded-lg border bg-background p-4 shadow-sm transition hover:border-primary/40 hover:bg-muted",
              isActiveLink ? "border-primary/60 bg-muted ring-1 ring-primary/30" : "border-border",
            )}
          >
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="font-semibold">{link.title}</p>
                <p className="mt-2 text-sm leading-5 text-muted-foreground">
                  {link.description ?? "Abrir vista operacional deste módulo."}
                </p>
              </div>
              {link.icon && <link.icon className="size-5 text-primary" />}
            </div>
          </a>
          );
        })}
      </div>
      {showCustomerWorkspace && routeKey !== "top-clientes" && (
        <div className="rounded-lg border border-border bg-background shadow-sm p-4">
          <div className="mb-6 flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Dados reais</p>
              <h3 className="mt-2 text-lg font-semibold text-foreground">{customerWorkspaceTitle[routeKey] ?? "Carteira de clientes"}</h3>
            </div>
            <span className="rounded-md bg-success-soft px-2 py-1 text-xs font-semibold text-success">
              PRIMAVERA SQL
            </span>
          </div>
          {routeKey === "aging" && (
            <div className="mb-4 grid-fluid">
              {agingBuckets.map((bucket) => (
                <button
                  key={bucket.label}
                  className="rounded-lg border border-border bg-muted p-4 text-left transition hover:border-primary/40 hover:bg-muted"
                  onClick={() => onNotify(`${bucket.label}: ${bucket.count} documentos, ${formatCurrency(bucket.amount)}.`)}
                >
                  <p className="text-xs font-semibold text-primary">{bucket.label}</p>
                  <p className="mt-2 text-xl font-semibold">{formatCurrency(bucket.amount)}</p>
                  <p className="mt-1 text-xs text-muted-foreground">{bucket.count} documentos em aberto</p>
                </button>
              ))}
            </div>
          )}
          {routeKey === "concentracao" && (
            <div className="mb-4 grid-fluid">
              {topCustomers.slice(0, 3).map((customer) => {
                const share = totalDebt > 0 ? (customer.currentDebt / totalDebt) * 100 : 0;
                return (
                  <button
                    key={customer.code}
                    className="rounded-lg border border-border bg-muted p-4 text-left transition hover:border-primary/40 hover:bg-muted"
                    onClick={() => onNotify(`${customer.name}: ${share.toFixed(1)}% da divida aberta.`)}
                  >
                    <p className="font-semibold">{customer.name}</p>
                    <p className="mt-2 text-xl font-semibold">{share.toFixed(1)}%</p>
                    <p className="mt-1 text-xs text-muted-foreground">{formatCurrency(customer.currentDebt, customer.currency ?? "EUR")}</p>
                  </button>
                );
              })}
            </div>
          )}
          {routeKey === "comunicacoes" && (
            <div className="mb-4 grid-fluid">
              <button
                className="rounded-lg border border-border bg-muted p-4 text-left transition hover:border-primary/40 hover:bg-muted"
                onClick={() => onNotify("Fila de lembretes preparada a partir dos documentos vencidos.")}
              >
                <p className="font-semibold">Lembretes de pagamento</p>
                <p className="mt-2 text-xl font-semibold">{receivables.filter(({ row }) => row[8] === "Vencido").length}</p>
                <p className="mt-1 text-xs text-muted-foreground">Documentos vencidos com acao possivel</p>
              </button>
              <button
                className="rounded-lg border border-border bg-muted p-4 text-left transition hover:border-primary/40 hover:bg-muted"
                onClick={() => onNotify("Historico de contactos filtrado por cliente/documento.")}
              >
                <p className="font-semibold">Contactos registados</p>
                <p className="mt-2 text-xl font-semibold">{receivables.filter(({ row }) => row[9] !== "-").length}</p>
                <p className="mt-1 text-xs text-muted-foreground">Documentos com ultimo contacto</p>
              </button>
              <button
                className="rounded-lg border border-primary/30 bg-primary p-4 text-left text-primary-foreground shadow-sm transition hover:bg-primary/90"
                onClick={() => onNotify("Integracao real de e-mail/SMS fica no backend de operacoes.")}
              >
                <p className="font-semibold">Nova comunicacao</p>
                <p className="mt-2 text-sm">Criar contacto para o cliente selecionado</p>
              </button>
            </div>
          )}
          {routeKey === "historico" && (
            <div className="mb-4 overflow-x-auto rounded-lg border border-border">
              <table className="w-full min-w-[760px] text-sm">
                <thead>
                  <tr className="border-b border-border bg-muted text-left text-xs text-muted-foreground">
                    <th className="px-4 py-3">Documento</th>
                    <th className="px-4 py-3">Cliente</th>
                    <th className="px-4 py-3">Vencimento</th>
                    <th className="px-4 py-3 text-right">Em aberto</th>
                    <th className="px-4 py-3">Estado</th>
                  </tr>
                </thead>
                <tbody>
                  {recentReceivables.map(({ row }) => (
                    <tr
                      className="border-b border-border transition hover:bg-muted"
                      key={`${row[2]}-${row[0]}`}
                      onClick={() => onNotify(`${row[2]} de ${row[0]}: ${row[7]} em aberto.`)}
                    >
                      <td className="px-4 py-3 font-semibold">{row[2]}</td>
                      <td className="px-4 py-3">{row[0]}</td>
                      <td className="px-4 py-3">{row[3]}</td>
                      <td className="px-4 py-3 text-right font-semibold">{row[7]}</td>
                      <td className="px-4 py-3"><StatusBadge status={row[8] ?? ""} /></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
          <div className="overflow-x-auto rounded-lg border border-border">
            <table className="w-full min-w-[840px] text-sm">
              <thead>
                <tr className="border-b border-border bg-muted text-left text-xs text-muted-foreground">
                  <th className="px-4 py-3">Cliente</th>
                  <th className="px-4 py-3">NIF</th>
                  <th className="px-4 py-3 text-right">Faturacao</th>
                  <th className="px-4 py-3 text-right">Divida</th>
                  <th className="px-4 py-3 text-right">Docs</th>
                  <th className="px-4 py-3">{routeKey === "risco-credito" ? "Risco" : "Condicao"}</th>
                </tr>
              </thead>
              <tbody>
                {topCustomers.map((customer) => {
                  const creditUse = customer.creditLimit > 0 ? (customer.currentDebt / customer.creditLimit) * 100 : null;
                  const riskLabel = creditUse === null
                    ? (customer.currentDebt > 0 ? "Sem limite definido" : "Sem divida")
                    : `${creditUse.toFixed(0)}% do limite`;
                  return (
                    <tr
                      className="border-b border-border transition hover:bg-muted"
                      key={customer.code}
                      onClick={() => onNotify(`Cliente ${customer.name}: ${customer.documentCount} documentos.`)}
                    >
                      <td className="px-4 py-3">
                        <p className="font-semibold">{customer.name}</p>
                        <p className="text-xs text-muted-foreground">{customer.code}</p>
                      </td>
                      <td className="px-4 py-3">{customer.nif ?? "-"}</td>
                      <td className="px-4 py-3 text-right font-semibold">
                        {formatCurrency(customer.salesAmount, customer.currency ?? "EUR")}
                      </td>
                      <td className={cn("px-4 py-3 text-right", customer.currentDebt > 0 && "font-semibold text-danger")}>
                        {formatCurrency(customer.currentDebt, customer.currency ?? "EUR")}
                      </td>
                      <td className="px-4 py-3 text-right">{customer.documentCount}</td>
                      <td className="px-4 py-3">
                        {routeKey === "risco-credito" ? riskLabel : customer.paymentCondition || "-"}
                      </td>
                    </tr>
                  );
                })}
                {!customersLoaded && (
                  <tr>
                    <td className="px-4 py-6 text-muted-foreground" colSpan={6}>
                      A carregar clientes do PRIMAVERA...
                    </td>
                  </tr>
                )}
                {customersLoaded && !topCustomers.length && (
                  <tr>
                    <td className="px-4 py-6 text-muted-foreground" colSpan={6}>
                      Sem clientes devolvidos pelo endpoint /api/customers.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
      {routeKey === "top-clientes" && (
        <div className="rounded-lg border border-border bg-background shadow-sm p-4">
          <div className="mb-6 flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Dados reais</p>
              <h3 className="mt-2 text-lg font-semibold text-foreground">Clientes por faturação e dívida</h3>
            </div>
            <span className="rounded-md bg-success-soft px-2 py-1 text-xs font-semibold text-success">
              PRIMAVERA SQL
            </span>
          </div>
          <div className="overflow-x-auto rounded-lg border border-border">
            <table className="w-full min-w-[840px] text-sm">
              <thead>
                <tr className="border-b border-border bg-muted text-left text-xs text-muted-foreground">
                  <th className="px-4 py-3">Cliente</th>
                  <th className="px-4 py-3">NIF</th>
                  <th className="px-4 py-3 text-right">Faturação</th>
                  <th className="px-4 py-3 text-right">Dívida</th>
                  <th className="px-4 py-3 text-right">Docs</th>
                  <th className="px-4 py-3">Condição</th>
                </tr>
              </thead>
              <tbody>
                {customers.map((customer) => (
                  <tr
                    className="border-b border-border transition hover:bg-muted"
                    key={customer.code}
                    onClick={() => onNotify(`Cliente ${customer.name}: ${customer.documentCount} documentos.`)}
                  >
                    <td className="px-4 py-3">
                      <p className="font-semibold">{customer.name}</p>
                      <p className="text-xs text-muted-foreground">{customer.code}</p>
                    </td>
                    <td className="px-4 py-3">{customer.nif ?? "-"}</td>
                    <td className="px-4 py-3 text-right font-semibold">
                      {formatCurrency(customer.salesAmount, customer.currency ?? "EUR")}
                    </td>
                    <td className="px-4 py-3 text-right">
                      {formatCurrency(customer.currentDebt, customer.currency ?? "EUR")}
                    </td>
                    <td className="px-4 py-3 text-right">{customer.documentCount}</td>
                    <td className="px-4 py-3">{customer.paymentCondition || "-"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
      {!showCustomerWorkspace && (
      <div className="rounded-lg border border-border bg-background shadow-sm p-4">
        <div className="mb-6">
          <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Origem dos dados</p>
          <p className="mt-2 text-lg font-semibold text-foreground">PRIMAVERA SQL / PRIDEMO</p>
        </div>
        <div className="grid-fluid">
          {visibleModules.map((module) => (
            <button
              key={`${module.code}-${module.tableName}`}
              className="rounded-lg border border-border bg-muted p-4 text-left transition hover:border-primary/40 hover:bg-muted"
              onClick={() => onNotify(`${module.name}: ${module.records.toLocaleString("pt-PT")} registos em ${module.tableName}.`)}
            >
              <p className="text-xs font-semibold text-primary">{module.code}</p>
              <p className="mt-2 font-semibold">{moduleDisplayName(module)}</p>
              <p className="mt-2 text-xl font-semibold">{module.records.toLocaleString("pt-PT")}</p>
              <p className="mt-1 text-xs text-muted-foreground">{module.tableName}</p>
            </button>
          ))}
        </div>
        <div className="mt-6 pt-6 border-t border-border">
          <Button
            variant="outline"
            onClick={() => onNotify(`Vista "${route.title}" atualizada com dados locais do PRIMAVERA.`)}
          >
            <Sparkles /> Atualizar vista
          </Button>
        </div>
      </div>
      )}
    </PageWrapper>
  );
}
