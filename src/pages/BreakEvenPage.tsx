import { useState, useEffect } from "react";
import { AlertTriangle } from "lucide-react";
import { apiUrl } from "@/lib/api";

export default function BreakEvenPage() {
  const [data, setData] = useState<any>(null);
  
  useEffect(() => {
    fetch(apiUrl("/api/breakeven")).then(r => r.json()).then(setData).catch(console.error);
  }, []);

  if (!data) return <div className="py-12 text-center">Carregando...</div>;
  
  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold flex items-center gap-2">
        <AlertTriangle className="w-6 h-6 text-amber-600" />
        Ponto de Equilíbrio (Break-Even)
      </h1>
      <div className="grid grid-cols-2 gap-4">
        <div className="bg-white p-6 rounded shadow">
          <div className="text-gray-600 text-sm">Break-Even</div>
          <div className="text-3xl font-bold text-amber-600">{data.breakeven.toFixed(2)} €</div>
        </div>
        <div className="bg-white p-6 rounded shadow">
          <div className="text-gray-600 text-sm">% das Vendas</div>
          <div className="text-3xl font-bold">{data.beUnidades}%</div>
        </div>
        <div className="bg-white p-6 rounded shadow">
          <div className="text-gray-600 text-sm">Margem Contribuição</div>
          <div className="text-3xl font-bold text-emerald-600">{data.margemPct.toFixed(1)}%</div>
        </div>
        <div className="bg-white p-6 rounded shadow">
          <div className="text-gray-600 text-sm">Custos Fixos</div>
          <div className="text-3xl font-bold">{data.custosFixos.toFixed(2)} €</div>
        </div>
      </div>
    </div>
  );
}
