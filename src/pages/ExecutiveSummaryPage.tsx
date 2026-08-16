import { useState, useEffect } from "react";
import { Sparkles } from "lucide-react";
import { apiUrl, isStatic } from "@/lib/api";
import { PageWrapper, SectionHeader, KPIGrid, PageLoadingState } from "@/components";

export default function ExecutiveSummaryPage() {
  const [summary, setSummary] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (isStatic) {
      setSummary("Chat IA só está disponível a correr localmente (npm run dev) com GEMINI_API_KEY configurada — ver README.");
      setLoading(false);
      return;
    }
    fetch(apiUrl("/api/ai/chat"), { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ message: "Faz um sumário executivo do estado financeiro atual", history: [] }) })
      .then(r => r.json())
      .then(d => setSummary(d.reply || "Sem resposta"))
      .catch(e => setSummary("Erro: " + e.message))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return <PageWrapper><PageLoadingState /></PageWrapper>;
  }

  const items = [
    { label: "Status", value: "Pronto", tone: "success" as const },
    { label: "Método", value: "IA Gemini", tone: "default" as const },
    { label: "Tipo", value: "Executivo", tone: "default" as const },
    { label: "Atualização", value: "Sob pedido", tone: "warning" as const },
    { label: "Abrangência", value: "Completa", tone: "default" as const },
  ];

  return (
    <PageWrapper>
      <SectionHeader category="Análise com IA" title="Sumário Executivo" description="Análise gerada por IA do estado financeiro atual com insights e recomendações" />
      <div className="mt-5"><KPIGrid items={items} /></div>

        <div className="bg-background rounded-xl shadow-sm border border-border overflow-hidden">
          <div className="border-b border-border px-8 py-3 flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-yellow-500" />
            <h2 className="text-sm font-semibold text-muted-foreground tracking-wider">Análise Executiva</h2>
          </div>
          <div className="p-8">
            <p className="whitespace-pre-wrap text-sm leading-6 text-muted-foreground">{summary}</p>
          </div>
      </div>
    </PageWrapper>
  );
}
