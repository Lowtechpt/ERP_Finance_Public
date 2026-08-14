import { useState, useEffect } from "react";
import { BarChart3 } from "lucide-react";
import { apiUrl } from "@/lib/api";

export default function ComparePeriodsPage() {
  const [periods, setPeriods] = useState<any[]>([]);
  
  useEffect(() => {
    fetch(apiUrl("/api/compare-periods?meses=12")).then(r => r.json()).then(d => setPeriods(d.periods || [])).catch(console.error);
  }, []);

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold flex items-center gap-2">
        <BarChart3 className="w-6 h-6" />
        Comparar Períodos
      </h1>
      <div className="bg-white rounded shadow overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 border-b">
            <tr><th className="px-4 py-3 text-left">Período</th><th className="px-4 py-3 text-right">Vendas</th><th className="px-4 py-3 text-right">Compras</th></tr>
          </thead>
          <tbody>
            {periods.map((p, i) => (
              <tr key={i} className="border-b"><td className="px-4 py-3 font-semibold">{p.mes}</td><td className="px-4 py-3 text-right text-emerald-600">{parseFloat(p.vendas).toFixed(2)} €</td><td className="px-4 py-3 text-right text-red-600">{parseFloat(p.compras).toFixed(2)} €</td></tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
