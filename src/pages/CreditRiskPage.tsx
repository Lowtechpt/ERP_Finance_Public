import { useState, useEffect } from "react";
import { ShieldAlert } from "lucide-react";
import { apiUrl } from "@/lib/api";

export default function CreditRiskPage() {
  const [risk, setRisk] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(apiUrl("/api/ai/chat"), { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ message: "Identifica clientes com risco de crédito elevado baseado no histórico de pagamentos", history: [] }) })
      .then(r => r.json())
      .then(d => setRisk(d.reply || "Sem resposta"))
      .catch(e => setRisk("Erro: " + e.message))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold flex items-center gap-2">
        <ShieldAlert className="w-6 h-6 text-red-500" />
        Risco de Crédito
      </h1>
      {loading ? (
        <div className="text-center py-12">Analisando risco...</div>
      ) : (
        <div className="bg-white p-6 rounded shadow">
          <p className="whitespace-pre-wrap text-sm">{risk}</p>
        </div>
      )}
    </div>
  );
}
