import { useEffect, useRef, useState } from "react";
import { Sparkles, Settings, XIcon, Send } from "lucide-react";
import { apiUrl } from "@/lib/api";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { geminiModels, type AiKeySlot, readAiKeySlots } from "@/lib/ai-keys";
import { AiInlineCharts } from "./AiInlineCharts";

export function GeminiChatPanel({
  open,
  variant = "floating",
  insightData,
  onClose,
  messages,
  setMessages,
  input,
  setInput,
  loading,
  setLoading,
}: {
  open: boolean;
  variant?: "floating" | "page";
  insightData?: Record<string, any>;
  onClose: () => void;
  messages: Array<{ role: "user" | "assistant"; content: string }>;
  setMessages: React.Dispatch<React.SetStateAction<Array<{ role: "user" | "assistant"; content: string }>>>;
  input: string;
  setInput: (v: string) => void;
  loading: boolean;
  setLoading: (v: boolean) => void;
}) {
  const [error, setError] = useState<string | null>(null);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [selectedModel, setSelectedModel] = useState(
    () => localStorage.getItem("erp-finance-gemini-model") ?? geminiModels[0]?.id ?? "",
  );
  const [activeKeyIndex, setActiveKeyIndex] = useState(() => Number(localStorage.getItem("erp-finance-gemini-active-key") ?? "0"));
  const [keySlots, setKeySlots] = useState<AiKeySlot[]>(readAiKeySlots);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, loading, error]);

  const activeKey = keySlots[activeKeyIndex]?.value.trim() ?? "";
  const selectedModelLabel = geminiModels.find((model) => model.id === selectedModel)?.label ?? selectedModel;

  function saveSelectedModel(value: string) {
    setSelectedModel(value);
    localStorage.setItem("erp-finance-gemini-model", value);
  }

  function saveKeySlot(index: number, value: string) {
    setKeySlots((current) => {
      const next = current.map((slot, slotIndex) => (slotIndex === index ? { ...slot, value } : slot));
      localStorage.setItem("erp-finance-gemini-key-slots", JSON.stringify(next));
      localStorage.setItem("erp-finance-gemini-key", next[0]?.value.trim() ?? "");
      return next;
    });
  }

  function activateKey(index: number) {
    setActiveKeyIndex(index);
    localStorage.setItem("erp-finance-gemini-active-key", String(index));
  }

  async function fetchContextPart(path: string) {
    const response = await fetch(apiUrl(path));
    if (!response.ok) {
      throw new Error(`${path} respondeu ${response.status}`);
    }

    return response.json();
  }

  async function collectPrimaveraContext() {
    const endpoints = [
      "/api/production-costs",
      "/api/cost-analysis",
      "/api/dashboard",
      "/api/receivables",
      "/api/customers",
      "/api/cashflow",
      "/api/payables",
      "/api/banks",
      "/api/dre",
      "/api/alerts",
    ];
    const results = await Promise.allSettled(endpoints.map((path) => fetchContextPart(path)));
    const data: Record<string, unknown> = {};
    const failures: string[] = [];

    endpoints.forEach((path, index) => {
      const key = path.replace("/api/", "").replace(/-/g, "_");
      const result = results[index];
      if (!result) return;

      if (result.status === "fulfilled") {
        data[key] = compactPrimaveraPayload(key, result.value);
      } else {
        failures.push(result.reason instanceof Error ? result.reason.message : String(result.reason));
      }
    });

    return {
      generatedAt: new Date().toISOString(),
      source: "Endpoints locais da app ERP Finance ligados ao PRIMAVERA",
      failures,
      data,
    };
  }

  function compactPrimaveraPayload(key: string, payload: unknown) {
    if (!payload || typeof payload !== "object") return payload;
    const value = payload as Record<string, unknown>;

    if (key === "production_costs") {
      return {
        source: value.source,
        database: value.database,
        summary: value.summary,
        orders: Array.isArray(value.orders) ? value.orders.slice(0, 12) : [],
        materialComponents: Array.isArray(value.components) ? value.components.slice(0, 30) : [],
        operations: Array.isArray(value.operations) ? value.operations.slice(0, 20) : [],
      };
    }

    if (key === "cost_analysis") {
      return {
        source: value.source,
        database: value.database,
        production: value.production,
        debitCosts: Array.isArray(value.debitCosts) ? value.debitCosts.slice(0, 12) : [],
        creditCosts: Array.isArray(value.creditCosts) ? value.creditCosts.slice(0, 8) : [],
        suppliers: Array.isArray(value.suppliers) ? value.suppliers.slice(0, 8) : [],
      };
    }

    if (key === "receivables") {
      return {
        source: value.source,
        database: value.database,
        summary: value.summary,
        receivables: Array.isArray(value.receivables) ? value.receivables.slice(0, 20) : [],
      };
    }

    if (key === "customers") {
      return {
        source: value.source,
        database: value.database,
        customers: Array.isArray(value.customers) ? value.customers.slice(0, 20) : [],
      };
    }

    if (key === "payables") {
      return {
        source: value.source,
        database: value.database,
        summary: value.summary,
        payables: Array.isArray(value.payables) ? value.payables.slice(0, 20) : [],
      };
    }

    return value;
  }

  async function askGemini(question: string, history: Array<{ role: "user" | "assistant"; content: string }>) {
    const key = activeKey;
    if (!key) {
      throw new Error("Cola primeiro uma Gemini API key nas configuracoes e ativa essa key.");
    }

    const primaveraContext = await collectPrimaveraContext();
    const prompt = [
      "Es o assistente IA financeiro da app ERP Finance.",
      "Responde em portugues de Portugal, direto e operacional.",
      "Usa apenas os dados do contexto PRIMAVERA recebido.",
      "Para perguntas sobre custos de producao, usa primeiro data.production_costs.summary, data.production_costs.orders, data.production_costs.materialComponents e data.cost_analysis.production.",
      "Para perguntas sobre funcionarios, pessoal, salarios, vencimentos ou remuneracoes, nao uses custos de producao nem artigos como grafico automatico; usa a leitura contabilistica disponivel.",
      "Se os dados forem insuficientes, diz exatamente o que falta.",
      "Nao inventes valores, clientes, stocks, producao, custos, compras, vendas ou contabilidade.",
      "Quando fizer sentido, aponta documentos, clientes, totais e prioridades praticas.",
      "",
      "Historico recente:",
      JSON.stringify(history.slice(-8), null, 2),
      "",
      "Pergunta do utilizador:",
      question,
      "",
      "Contexto PRIMAVERA disponivel:",
      JSON.stringify(primaveraContext, null, 2).slice(0, 45000),
    ].join("\n");

    let lastError = "Gemini nao respondeu.";

    for (const model of [selectedModel, "gemini-2.0-flash", "gemini-2.0-flash-lite"]) {
      const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${encodeURIComponent(key)}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            contents: [{ role: "user", parts: [{ text: prompt }] }],
            generationConfig: {
              temperature: 0.2,
              maxOutputTokens: 1400,
            },
          }),
        },
      );
      const responseData = await response.json();

      if (!response.ok) {
        lastError = responseData?.error?.message || `Gemini respondeu ${response.status}`;
        continue;
      }

      const reply = responseData?.candidates?.[0]?.content?.parts
        ?.map((part: { text?: string }) => part.text)
        .filter(Boolean)
        .join("\n")
        .trim();

      if (reply) {
        return reply;
      }
    }

    throw new Error(lastError);
  }

  async function sendMessage() {
    const text = input.trim();
    if (!text || loading) return;

    const userMsg = { role: "user" as const, content: text };
    const nextMessages = [...messages, userMsg];
    setMessages(nextMessages);
    setInput("");
    setLoading(true);
    setError(null);

    try {
      const reply = await askGemini(text, nextMessages);
      setMessages((prev) => [...prev, { role: "assistant", content: reply }]);
    } catch (sendError) {
      setError(sendError instanceof Error ? sendError.message : "Erro ao falar com a IA.");
    } finally {
      setLoading(false);
    }
  }

  if (!open) return null;

  return (
    <div
      className={cn(
        "flex min-h-0 flex-col rounded-xl border border-border bg-background shadow-2xl",
        variant === "page"
          ? "h-[calc(100vh-150px)] min-h-[760px] w-full"
          : "fixed bottom-20 right-5 z-50 w-[420px] max-w-[calc(100vw-2rem)]",
      )}
      style={variant === "floating" ? { height: "580px" } : undefined}
    >
      <div className="flex items-center justify-between border-b border-border px-4 py-3">
        <div className="flex items-center gap-2">
          <Sparkles className="size-4 text-primary" />
          <span className="text-sm font-semibold">Assistente IA Gemini</span>
        </div>
        <div className="flex items-center gap-1">
          <Button variant="ghost" size="icon" className="size-7" onClick={() => setSettingsOpen((value) => !value)} aria-label="Configurar IA">
            <Settings className="size-4" />
          </Button>
          <Button variant="ghost" size="icon" className="size-7" onClick={onClose} aria-label="Fechar chat">
            <XIcon className="size-4" />
          </Button>
        </div>
      </div>
      {settingsOpen ? (
        <div className="border-b border-border px-4 py-3">
          <div className="mb-3 flex items-start justify-between gap-3">
            <div>
              <p className="text-sm font-semibold">Configuracoes de API</p>
              <p className="mt-1 text-[11px] leading-4 text-muted-foreground">
                Insere as tuas keys Gemini. Ativa a que queres usar; quando uma esgotar, troca aqui.
              </p>
            </div>
            <span className={cn("rounded-md px-2 py-1 text-[11px] font-semibold", activeKey ? "bg-success-soft text-success" : "bg-warning-soft text-warning")}>
              {activeKey ? `Key ${activeKeyIndex + 1} ativa` : "sem key"}
            </span>
          </div>
          <label className="mb-1 flex items-center justify-between text-xs font-semibold text-muted-foreground">
            <span>Modelo</span>
            <span className="font-normal">escolhe conforme a tua quota</span>
          </label>
          <select
            value={selectedModel}
            onChange={(event) => saveSelectedModel(event.target.value)}
            className="mb-3 h-9 w-full rounded-md border border-border bg-background px-3 text-sm shadow-sm outline-none focus:border-primary"
          >
            {geminiModels.map((model) => (
              <option key={model.id} value={model.id}>
                {model.label}
              </option>
            ))}
          </select>
          <div className="space-y-2">
            {keySlots.map((slot, index) => (
              <div key={slot.name}>
                <label className="mb-1 block text-xs font-semibold text-muted-foreground">
                  {slot.name}
                </label>
                <div className="flex gap-2">
                  <Input
                    type="password"
                    value={slot.value}
                    onChange={(event) => saveKeySlot(index, event.target.value)}
                    placeholder="AIza..."
                    className="h-9 text-sm"
                  />
                  <Button
                    type="button"
                    variant={activeKeyIndex === index ? "default" : "outline"}
                    className="h-9 px-3 text-xs"
                    onClick={() => activateKey(index)}
                    disabled={!slot.value.trim()}
                  >
                    {activeKeyIndex === index ? "Ativa" : "Ativar"}
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </div>
      ) : (
        <div className="flex items-center justify-between gap-3 border-b border-border px-4 py-2 text-xs text-muted-foreground">
          <span className="truncate">{selectedModelLabel}</span>
          <Button variant="outline" size="sm" className="h-7 gap-1.5 text-xs" onClick={() => setSettingsOpen(true)}>
            <Settings className="size-3.5" />
            Configurar
          </Button>
        </div>
      )}
      <div ref={scrollRef} className="min-h-0 flex-1 overflow-y-auto px-4 py-3 text-sm">
        {messages.length === 0 && !error && (
          <div className="flex h-full items-center justify-center text-center text-muted-foreground">
            <div>
              <Sparkles className="mx-auto mb-2 size-8 text-primary/40" />
              <p className="font-semibold">Pergunte sobre os dados PRIMAVERA</p>
              <p className="mt-1 text-xs">Ex: "Quais sao os clientes com mais divida?"</p>
            </div>
          </div>
        )}
        {messages.map((msg, i) => {
          const previousUserMessage = [...messages]
            .slice(0, i)
            .reverse()
            .find((item) => item.role === "user")?.content ?? "";

          return (
            <div key={i} className={cn("mb-4 flex", msg.role === "user" ? "justify-end" : "justify-start")}>
              <div className={cn("max-w-[92%] rounded-lg px-3 py-2", msg.role === "user" ? "bg-primary text-primary-foreground" : "bg-muted")}>
                {msg.role === "assistant" ? <FormattedAiMessage content={msg.content} /> : msg.content}
                {variant === "page" && msg.role === "assistant" && (
                  <AiInlineCharts question={previousUserMessage} data={insightData} />
                )}
              </div>
            </div>
          );
        })}
        {loading && (
          <div className="flex justify-start">
            <div className="rounded-lg bg-muted px-3 py-2 text-muted-foreground">A consultar PRIMAVERA e Gemini...</div>
          </div>
        )}
        {error && (
          <div className="mb-3 rounded-lg border border-danger/30 bg-danger-soft px-3 py-2 text-xs text-danger">
            {error}
          </div>
        )}
      </div>
      <div className="border-t border-border p-3">
        <div className="mb-2 flex flex-wrap gap-2">
          {["Resume o fluxo de caixa", "Que clientes devo cobrar primeiro?", "Quais os custos de producao?", "Ha riscos de liquidez?"].map((suggestion) => (
            <Button
              key={suggestion}
              type="button"
              variant="outline"
              size="sm"
              className="h-7 text-xs"
              onClick={() => setInput(suggestion)}
              disabled={loading}
            >
              {suggestion}
            </Button>
          ))}
        </div>
        <form
          onSubmit={(event) => { event.preventDefault(); sendMessage(); }}
          className="flex gap-2"
        >
          <Input
            value={input}
            onChange={(event) => setInput(event.target.value)}
            placeholder="Pergunte ao assistente..."
            className="h-9 text-sm"
            disabled={loading}
          />
          <Button type="submit" size="icon" className="h-9 w-9 shrink-0" disabled={loading || !input.trim()}>
            <Send className="size-4" />
          </Button>
        </form>
      </div>
    </div>
  );
}

function FormattedAiMessage({ content }: { content: string }) {
  const lines = content.split("\n");

  return (
    <div className="space-y-2 leading-5">
      {lines.map((rawLine, index) => {
        const line = rawLine.trim();
        if (!line) return <div key={index} className="h-1" />;

        if (line.startsWith("### ")) {
          return <h4 key={index} className="pt-1 text-sm font-bold">{renderInlineMarkdown(line.replace(/^###\s+/, ""))}</h4>;
        }

        if (line.startsWith("## ")) {
          return <h3 key={index} className="pt-1 text-base font-bold">{renderInlineMarkdown(line.replace(/^##\s+/, ""))}</h3>;
        }

        if (line.startsWith("# ")) {
          return <h3 key={index} className="pt-1 text-base font-bold">{renderInlineMarkdown(line.replace(/^#\s+/, ""))}</h3>;
        }

        if (/^[-*]\s+/.test(line)) {
          return (
            <div key={index} className="flex gap-2">
              <span className="mt-2 size-1.5 shrink-0 rounded-full bg-primary" />
              <p>{renderInlineMarkdown(line.replace(/^[-*]\s+/, ""))}</p>
            </div>
          );
        }

        if (/^\d+\.\s+/.test(line)) {
          return <p key={index}>{renderInlineMarkdown(line.replace(/^\d+\.\s+/, ""))}</p>;
        }

        return <p key={index}>{renderInlineMarkdown(line)}</p>;
      })}
    </div>
  );
}

function renderInlineMarkdown(text: string) {
  const clean = text.replace(/\*\*/g, "");
  return clean;
}
