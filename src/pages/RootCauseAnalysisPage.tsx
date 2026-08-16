import { useState, useEffect } from "react";
import { Lightbulb } from "lucide-react";
import { apiUrl, isStatic } from "@/lib/api";
import { PageWrapper, SectionHeader, KPIGrid, PageLoadingState } from "@/components";

export default function RootCauseAnalysisPage() {
  const [analysis, setAnalysis] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (isStatic) {
      setAnalysis("Chat IA só está disponível a correr localmente (npm run dev) com GEMINI_API_KEY configurada — ver README.");
      setLoading(false);
      return;
    }
    fetch(apiUrl("/api/ai/chat"), { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ message: "Analisa as causas raiz dos desvios negativos em margens e custos", history: [] }) })
      .then(r => r.json())
      .then(d => setAnalysis(d.reply || "Sem resposta"))
      .catch(e => setAnalysis("Erro: " + e.message))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return <PageLoadingState message="Analisando causas..." />;
  }

  const kpiItems = [
    { label: "Método", value: "IA Gemini", tone: "default" as const },
    { label: "Foco", value: "Margens e custos", tone: "default" as const },
    { label: "Atualização", value: "Sob pedido", tone: "warning" as const },
    { label: "Estado", value: "Pronto", tone: "success" as const },
    { label: "Abrangência", value: "Desvios globais", tone: "default" as const },
  ];

  return (
    <PageWrapper>
      <div className="w-full space-y-8">
        <SectionHeader
          category="Diagnóstico"
          title="Análise de Causas Raiz"
          description="Causas raiz dos desvios negativos em margens e custos, com recomendações de ação"
        />

        <KPIGrid items={kpiItems} />

        <div className="bg-background rounded-xl shadow-sm border border-border overflow-hidden">
          <div className="border-b border-border px-8 py-3">
            <div className="flex items-center gap-2">
              <Lightbulb className="h-5 w-5 text-info" />
              <h2 className="text-sm font-semibold text-muted-foreground tracking-wider">Análise</h2>
            </div>
          </div>
          <div className="p-8">
            <p className="whitespace-pre-wrap text-sm leading-6 text-muted-foreground">{analysis}</p>
          </div>
        </div>
      </div>
    </PageWrapper>
  );
}
