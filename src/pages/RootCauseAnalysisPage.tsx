import { useState, useEffect } from "react";
import { Lightbulb } from "lucide-react";
import { apiUrl, isStatic } from "@/lib/api";

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

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold flex items-center gap-2">
        <Lightbulb className="w-6 h-6 text-blue-500" />
        Análise de Causas Raiz
      </h1>
      {loading ? (
        <div className="text-center py-12">Analisando causas...</div>
      ) : (
        <div className="bg-white p-6 rounded shadow">
          <p className="whitespace-pre-wrap text-sm">{analysis}</p>
        </div>
      )}
    </div>
  );
}
