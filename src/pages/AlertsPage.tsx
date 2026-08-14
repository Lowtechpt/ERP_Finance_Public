import { useState, useEffect } from "react";
import { AlertTriangle } from "lucide-react";
import { apiUrl } from "@/lib/api";

export default function AlertsPage() {
  const [alerts, setAlerts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(apiUrl("/api/alerts")).then(r => r.json()).then(d => setAlerts(d.alerts || [])).catch(console.error).finally(() => setLoading(false));
  }, []);

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold flex items-center gap-2">
        <AlertTriangle className="w-6 h-6 text-orange-500" />
        Alertas Prioritários
      </h1>
      {loading ? (
        <div>Carregando...</div>
      ) : (
        <div className="space-y-3">
          {alerts.map((a, i) => (
            <div key={i} className={`p-4 rounded border-l-4 ${a.severity === "high" ? "border-red-500 bg-red-50" : "border-yellow-500 bg-yellow-50"}`}>
              <p className="font-bold">{a.title}</p>
              <p className="text-sm text-gray-600">{a.message}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
