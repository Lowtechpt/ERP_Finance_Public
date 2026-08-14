import { useState, useEffect } from "react";
import { Sparkles } from "lucide-react";
import { apiUrl } from "@/lib/api";

export default function ExecutiveSummaryPage() {
  const [summary, setSummary] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(apiUrl("/api/ai/chat"), { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ message: "Faz um sumário executivo do estado financeiro atual", history: [] }) })
      .then(r => r.json())
      .then(d => setSummary(d.reply || "Sem resposta"))
      .catch(e => setSummary("Erro: " + e.message))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold flex items-center gap-2">
        <Sparkles className="w-6 h-6 text-yellow-500" />
        Sumário Executivo com IA
      </h1>
      {loading ? (
        <div className="text-center py-12">Gerando com IA...</div>
      ) : (
        <div className="bg-white p-6 rounded shadow prose prose-sm max-w-none">
          <p>{summary}</p>
        </div>
      )}
    </div>
  );
}
