import { useState, useEffect } from "react";
import { PieChart } from "lucide-react";
import { apiUrl } from "@/lib/api";

export default function BudgetVsActualPage() {
  const [data, setData] = useState<any>(null);
  
  useEffect(() => {
    fetch(apiUrl("/api/budget-vs-actual")).then(r => r.json()).then(setData).catch(console.error);
  }, []);

  if (!data) return <div className="py-12">Carregando...</div>;
  
  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold flex items-center gap-2">
        <PieChart className="w-6 h-6" />
        Orçado vs Realizado
      </h1>
      <div className="grid grid-cols-1 gap-4">
        <div className="bg-white p-6 rounded shadow">
          <h2 className="font-bold mb-3">Vendas</h2>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between"><span>Orçado:</span><strong>{data.orcamento.vendasOrc.toFixed(2)} €</strong></div>
            <div className="flex justify-between"><span>Realizado:</span><strong>{data.real.vendasLiquidas.toFixed(2)} €</strong></div>
            <div className={`flex justify-between font-bold ${data.desvios.vendas > 0 ? 'text-emerald-600' : 'text-red-600'}`}>
              <span>Desvio:</span>
              <span>{data.desvios.vendas > 0 ? '+' : ''}{data.desvios.vendas}%</span>
            </div>
          </div>
        </div>
        <div className="bg-white p-6 rounded shadow">
          <h2 className="font-bold mb-3">Custos</h2>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between"><span>Orçado:</span><strong>{data.orcamento.custosOrc.toFixed(2)} €</strong></div>
            <div className="flex justify-between"><span>Realizado:</span><strong>{data.real.custoTotal.toFixed(2)} €</strong></div>
            <div className={`flex justify-between font-bold ${data.desvios.custos > 0 ? 'text-red-600' : 'text-emerald-600'}`}>
              <span>Desvio:</span>
              <span>{data.desvios.custos > 0 ? '+' : ''}{data.desvios.custos}%</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
