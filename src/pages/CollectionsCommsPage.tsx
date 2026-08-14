import { useState, useEffect } from "react";
import { Phone } from "lucide-react";
import { apiUrl } from "@/lib/api";

export default function CollectionsCommsPage() {
  const [overdue, setOverdue] = useState<any[]>([]);
  
  useEffect(() => {
    fetch(apiUrl("/api/collections")).then(r => r.json()).then(d => setOverdue(d.overdue || [])).catch(console.error);
  }, []);

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold flex items-center gap-2">
        <Phone className="w-6 h-6 text-red-600" />
        Comunicações de Cobrança
      </h1>
      <div className="bg-white rounded shadow overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 border-b">
            <tr><th className="px-4 py-3 text-left">Cliente</th><th className="px-4 py-3 text-right">Docs</th><th className="px-4 py-3 text-right">Total em Atraso</th><th className="px-4 py-3 text-right">Dias em Atraso</th></tr>
          </thead>
          <tbody>
            {overdue.map((c, i) => (
              <tr key={i} className="border-b hover:bg-gray-50">
                <td className="px-4 py-3"><strong>{c.Nome}</strong></td>
                <td className="px-4 py-3 text-right">{c.docs}</td>
                <td className="px-4 py-3 text-right font-bold text-red-600">{parseFloat(c.total).toFixed(2)} €</td>
                <td className="px-4 py-3 text-right text-red-600">{c.diasAtraso} dias</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
