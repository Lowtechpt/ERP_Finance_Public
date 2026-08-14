import { useState } from "react";
import { Bell } from "lucide-react";

export default function AlertThresholdsPage() {
  const [thresholds, setThresholds] = useState({
    margemMinima: 15,
    diasAtrasoCritico: 30,
    saldoBaixo: 10000,
    custoMaximo: 5000,
  });

  const handleChange = (key: string, value: number) => {
    setThresholds(p => ({ ...p, [key]: value }));
  };

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold flex items-center gap-2">
        <Bell className="w-6 h-6" />
        Configuração de Alertas
      </h1>
      <div className="bg-white p-6 rounded shadow space-y-4">
        <div>
          <label className="block text-sm font-semibold mb-1">Margem Mínima (%)</label>
          <input type="number" value={thresholds.margemMinima} onChange={(e) => handleChange("margemMinima", parseInt(e.target.value))} className="w-full px-3 py-2 border rounded" />
        </div>
        <div>
          <label className="block text-sm font-semibold mb-1">Dias em Atraso Crítico</label>
          <input type="number" value={thresholds.diasAtrasoCritico} onChange={(e) => handleChange("diasAtrasoCritico", parseInt(e.target.value))} className="w-full px-3 py-2 border rounded" />
        </div>
        <div>
          <label className="block text-sm font-semibold mb-1">Saldo Mínimo (€)</label>
          <input type="number" value={thresholds.saldoBaixo} onChange={(e) => handleChange("saldoBaixo", parseInt(e.target.value))} className="w-full px-3 py-2 border rounded" />
        </div>
        <div>
          <label className="block text-sm font-semibold mb-1">Custo Máximo (€)</label>
          <input type="number" value={thresholds.custoMaximo} onChange={(e) => handleChange("custoMaximo", parseInt(e.target.value))} className="w-full px-3 py-2 border rounded" />
        </div>
        <button className="w-full bg-emerald-600 text-white py-2 rounded hover:bg-emerald-700 font-semibold">Guardar Thresholds</button>
      </div>
    </div>
  );
}
