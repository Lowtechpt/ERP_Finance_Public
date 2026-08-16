import { useState, useEffect } from "react";
import { ShieldAlert } from "lucide-react";
import { apiUrl, isStatic } from "@/lib/api";
import { PageWrapper, SectionHeader, KPIGrid, PageLoadingState } from "@/components";

export default function CreditRiskPage() {
  const [risk, setRisk] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (isStatic) {
      setRisk("Chat IA só está disponível a correr localmente (npm run dev) com GEMINI_API_KEY configurada — ver README.");
      setLoading(false);
      return;
    }
    fetch(apiUrl("/api/ai/chat"), { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ message: "Identifica clientes com risco de crédito elevado baseado no histórico de pagamentos", history: [] }) })
      .then(r => r.json())
      .then(d => setRisk(d.reply || "Sem resposta"))
      .catch(e => setRisk("Erro: " + e.message))
      .finally(() => setLoading(false));
  }, []);

  const kpiItems = [
    { label: "Método", value: "IA Gemini", tone: "default" as const },
    { label: "Fonte", value: isStatic ? "Estática" : "Histórico pagamentos", tone: "default" as const },
    { label: "Atualização", value: "Sob pedido", tone: "warning" as const },
    { label: "Estado", value: "Pronto", tone: "success" as const },
    { label: "Abrangência", value: "Clientes", tone: "default" as const },
  ];

  if (loading) {
    return <PageLoadingState message="Analisando risco..." />;
  }

  return (
    <PageWrapper>
      <div className="space-y-8">
        <KPIGrid items={kpiItems} />

        <SectionHeader
          category="Risco e Crédito"
          title="Risco de Crédito"
          description="Identificação de clientes com risco de crédito elevado baseado no histórico de pagamentos"
        />

        <div className="bg-background rounded-xl shadow-sm border border-border overflow-hidden">
          <div className="border-b border-border px-8 py-3">
            <div className="flex items-center gap-2">
              <ShieldAlert className="h-5 w-5 text-danger" />
              <h2 className="text-sm font-semibold text-muted-foreground tracking-wider">Análise de risco</h2>
            </div>
          </div>
          <div className="p-8">
            <p className="whitespace-pre-wrap text-sm leading-6 text-muted-foreground">{risk}</p>
          </div>
        </div>
      </div>
    </PageWrapper>
  );
}
