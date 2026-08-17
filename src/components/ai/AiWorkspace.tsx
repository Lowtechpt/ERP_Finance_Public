import { useEffect, useState } from "react";
import { apiUrl } from "@/lib/api";
import { formatCurrency } from "@/lib/format";
import { cn } from "@/lib/utils";
import { MetricCard } from "@/components/metrics";
import { PageWrapper } from "@/components";
import { GeminiChatPanel } from "./GeminiChatPanel";
import { CollectionsInsight } from "./CollectionsInsight";
import { CashflowInsight } from "./CashflowInsight";
import { PersonnelInsight } from "./PersonnelInsight";
import { getInsightTopic, getInsightTitle, type InsightTopic } from "./utils";
import type { AiWorkspaceProps } from "@/lib/ai-keys";

export function AiWorkspace({
  messages,
  setMessages,
  input,
  setInput,
  loading,
  setLoading,
}: AiWorkspaceProps) {
  const [data, setData] = useState<Record<string, any>>({});
  const [dataLoading, setDataLoading] = useState(true);

  useEffect(() => {
    let ignore = false;
    const endpoints = [
      ["production", "/api/production-costs"],
      ["costs", "/api/cost-analysis"],
      ["receivables", "/api/receivables"],
      ["customers", "/api/customers"],
      ["cashflow", "/api/cashflow"],
      ["payables", "/api/payables"],
      ["dashboard", "/api/dashboard"],
      ["alerts", "/api/alerts"],
      ["dre", "/api/dre"],
      ["personnel", "/api/hr-costs"],
    ] as const;

    Promise.allSettled(
      endpoints.map(([key, path]) =>
        fetch(apiUrl(path))
          .then((response) => {
            if (!response.ok) throw new Error(`${path} respondeu ${response.status}`);
            return response.json();
          })
          .then((payload) => [key, payload] as const),
      ),
    )
      .then((results) => {
        if (ignore) return;
        const next: Record<string, any> = {};
        results.forEach((result) => {
          if (result.status === "fulfilled") {
            next[result.value[0]] = result.value[1];
          }
        });
        setData(next);
      })
      .finally(() => {
        if (!ignore) setDataLoading(false);
      });

    return () => {
      ignore = true;
    };
  }, []);

  const productionSummary = data.production?.summary ?? {};
  const productionOrders = Array.isArray(data.production?.orders) ? data.production.orders : [];
  const customers = Array.isArray(data.customers?.customers) ? data.customers.customers : [];
  const receivables = Array.isArray(data.receivables?.receivables) ? data.receivables.receivables : [];
  const lastQuestion = [...messages].reverse().find((message) => message.role === "user")?.content ?? "";
  const insightTopic = getInsightTopic(lastQuestion);
  const costCards = [
    { label: "Ordens de fabrico", value: String(productionSummary.totalOrdens ?? 0), tone: "default" },
    { label: "Custo previsto", value: formatCurrency(Number(productionSummary.totalPrevisto ?? 0)), tone: "default" },
    { label: "Custo real", value: formatCurrency(Number(productionSummary.totalReal ?? 0)), tone: "danger" },
    { label: "Desvio total", value: formatCurrency(Number(productionSummary.desvioTotal ?? 0)), tone: Number(productionSummary.desvioTotal ?? 0) < 0 ? "success" : "danger" },
  ];

  return (
    <PageWrapper>
      <section className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_560px]">
        <div className="min-h-[calc(100vh-180px)] rounded-2xl border border-slate-200 bg-white shadow-[0_1px_6px_rgba(15,23,42,0.06)]">
          <div className="border-b border-slate-200 p-6">
            <p className="text-xs font-semibold uppercase tracking-wide text-primary">PRIMAVERA + IA</p>
            <h2 className="mt-2 text-[24px] font-bold">{getInsightTitle(insightTopic)}</h2>
            <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-600">
              {lastQuestion ? `Vista gerada para: "${lastQuestion}"` : "Faz uma pergunta no chat para adaptar esta area com tabelas e graficos."}
            </p>
          </div>

        <AdaptiveInsightPanel
          topic={insightTopic}
          data={data}
          dataLoading={dataLoading}
          costCards={costCards}
          productionOrders={productionOrders}
          customers={customers}
          receivables={receivables}
        />
      </div>

        <GeminiChatPanel
          open
          variant="page"
          insightData={data}
          onClose={() => { window.location.hash = "receber"; }}
          messages={messages}
          setMessages={setMessages}
          input={input}
          setInput={setInput}
          loading={loading}
          setLoading={setLoading}
        />
      </section>
    </PageWrapper>
  );
}

function AdaptiveInsightPanel({
  topic,
  data,
  dataLoading,
  costCards,
  productionOrders,
  customers,
  receivables,
}: {
  topic: InsightTopic;
  data: Record<string, any>;
  dataLoading: boolean;
  costCards: Array<{ label: string; value: string; tone: string }>;
  productionOrders: any[];
  customers: any[];
  receivables: any[];
}) {
  if (topic === "collections") {
    return <CollectionsInsight customers={customers} receivables={receivables} dataLoading={dataLoading} />;
  }

  if (topic === "cashflow") {
    return <CashflowInsight cashflow={data.cashflow} payables={data.payables} dataLoading={dataLoading} />;
  }

  if (topic === "personnel") {
    return <PersonnelInsight data={data} dataLoading={dataLoading} />;
  }

  if (topic !== "production") {
    return <GeneralInsight dataLoading={dataLoading} />;
  }

  return (
    <>
      <div className="grid gap-4 p-6 md:grid-cols-2 xl:grid-cols-4">
        {costCards.map((card) => (
          <div key={card.label} className="rounded-2xl border border-slate-200 bg-slate-50 p-5">
            <p className="text-xs font-semibold text-slate-600">{card.label}</p>
            <p className={cn("mt-2 text-xl font-bold", card.tone === "danger" && "text-danger", card.tone === "success" && "text-success")}>
              {dataLoading ? "..." : card.value}
            </p>
          </div>
        ))}
      </div>
      <ProductionInsight orders={productionOrders} dataLoading={dataLoading} />
    </>
  );
}

function GeneralInsight({ dataLoading }: { dataLoading: boolean }) {
  return (
    <div className="grid gap-4 p-6 md:grid-cols-3">
      <MetricCard label="Contexto PRIMAVERA" value={dataLoading ? "..." : "Disponivel"} />
      <MetricCard label="Analise" value={dataLoading ? "..." : "Financeira"} />
      <MetricCard label="Graficos automaticos" value={dataLoading ? "..." : "Por tema"} />
    </div>
  );
}

function ProductionInsight({ orders, dataLoading }: { orders: any[]; dataLoading: boolean }) {
  const topOrders = orders.slice(0, 8);
  const maxOrderCost = Math.max(
    ...topOrders.map((order: any) => Number(order.CustoMateriaisPrevisto ?? 0) + Number(order.CustoTransformacaoPrevisto ?? 0)),
    1,
  );

  return (
    <div className="grid gap-4 px-6 pb-6 lg:grid-cols-2">
      <div className="rounded-2xl border border-slate-200 p-5">
        <div className="mb-4 flex items-center justify-between">
          <h3 className="font-bold">Custos por ordem</h3>
          <span className="text-xs text-slate-600">previsto vs real</span>
        </div>
        <div className="space-y-4">
          {topOrders.map((order: any) => {
            const previsto = Number(order.CustoMateriaisPrevisto ?? 0) + Number(order.CustoTransformacaoPrevisto ?? 0);
            const real = Number(order.CustoMateriaisReal ?? 0) + Number(order.CustoTransformacaoReal ?? 0);
            return (
              <div key={order.Id ?? order.OrdemFabrico}>
                <div className="mb-1 flex items-center justify-between gap-3 text-xs">
                  <span className="font-semibold">{order.ArtigoDescricao ?? order.Artigo}</span>
                  <span className="text-slate-600">{formatCurrency(real)} / {formatCurrency(previsto)}</span>
                </div>
                <div className="h-3 overflow-hidden rounded-full bg-slate-100">
                  <div className="h-full rounded-full bg-primary" style={{ width: `${Math.min(100, (previsto / maxOrderCost) * 100)}%` }} />
                </div>
                <div className="mt-1 h-2 overflow-hidden rounded-full bg-slate-100">
                  <div className="h-full rounded-full bg-danger" style={{ width: `${Math.min(100, (real / maxOrderCost) * 100)}%` }} />
                </div>
              </div>
            );
          })}
          {!dataLoading && topOrders.length === 0 && (
            <p className="text-sm text-slate-600">Sem ordens devolvidas pelo endpoint de producao.</p>
          )}
        </div>
      </div>
      <div className="rounded-2xl border border-slate-200">
        <div className="border-b border-slate-200 px-4 py-3">
          <h3 className="font-bold">Tabela de ordens de fabrico</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[760px] text-sm">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50 text-left text-xs text-slate-600">
                <th className="px-4 py-3">Ordem</th>
                <th className="px-4 py-3">Artigo</th>
                <th className="px-4 py-3 text-right">Mat. real</th>
                <th className="px-4 py-3 text-right">Total previsto</th>
                <th className="px-4 py-3 text-right">Total real</th>
              </tr>
            </thead>
            <tbody>
              {topOrders.map((order: any) => {
                const previsto = Number(order.CustoMateriaisPrevisto ?? 0) + Number(order.CustoTransformacaoPrevisto ?? 0);
                const real = Number(order.CustoMateriaisReal ?? 0) + Number(order.CustoTransformacaoReal ?? 0);
                return (
                  <tr key={order.Id ?? order.OrdemFabrico} className="border-b border-slate-200">
                    <td className="px-4 py-3 font-semibold">{order.OrdemFabrico}</td>
                    <td className="px-4 py-3">{order.ArtigoDescricao ?? order.Artigo}</td>
                    <td className="px-4 py-3 text-right">{formatCurrency(Number(order.CustoMateriaisReal ?? 0))}</td>
                    <td className="px-4 py-3 text-right">{formatCurrency(previsto)}</td>
                    <td className="px-4 py-3 text-right font-bold">{formatCurrency(real)}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
