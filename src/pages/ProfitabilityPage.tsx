import { useState, useEffect } from "react";
import { TrendingUp } from "lucide-react";
import { apiUrl } from "@/lib/api";

export default function ProfitabilityPage() {
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(apiUrl("/api/profitability"))
      .then(r => r.json())
      .then(d => setProducts(d.products || []))
      .catch(e => console.error(e))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold flex items-center gap-2">
        <TrendingUp className="w-6 h-6 text-emerald-600" />
        Rentabilidade por Produto
      </h1>
      {loading ? (
        <div className="text-center py-12">Carregando...</div>
      ) : (
        <table className="w-full text-sm bg-white rounded shadow">
          <thead className="bg-gray-50 border-b"><tr><th className="px-4 py-3 text-left">Artigo</th><th className="px-4 py-3 text-right">Quantidade</th><th className="px-4 py-3 text-right">Receita</th><th className="px-4 py-3 text-right">COGS</th><th className="px-4 py-3 text-right">Margem €</th><th className="px-4 py-3 text-right">Margem %</th></tr></thead>
          <tbody>
            {products.map((p, i) => {
              const marginPct = p.revenue > 0 ? ((p.margin / p.revenue) * 100) : 0;
              return <tr key={i} className="border-b"><td className="px-4 py-3">{p.Artigo}</td><td className="px-4 py-3 text-right">{p.qty}</td><td className="px-4 py-3 text-right">{parseFloat(p.revenue).toFixed(2)} €</td><td className="px-4 py-3 text-right">{parseFloat(p.cogs).toFixed(2)} €</td><td className="px-4 py-3 text-right text-emerald-600 font-semibold">{parseFloat(p.margin).toFixed(2)} €</td><td className="px-4 py-3 text-right font-semibold">{marginPct.toFixed(1)}%</td></tr>;
            })}
          </tbody>
        </table>
      )}
    </div>
  );
}
