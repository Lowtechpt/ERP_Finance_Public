import { useState, useEffect } from "react";
import { AlertTriangle, AlertCircle } from "lucide-react";
import { apiUrl } from "@/lib/api";
import { cn } from "@/lib/utils";
import { PageWrapper, SectionHeader, KPIGrid, PageLoadingState, PageEmptyState } from "@/components";

interface Alert {
  severity: "high" | "medium" | "low" | "info";
  title: string;
  message: string;
}

interface AlertsResponse {
  alerts: Alert[];
}

export default function AlertsPage() {
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let ignore = false;
    fetch(apiUrl("/api/alerts"))
      .then((r) => r.json() as Promise<AlertsResponse>)
      .then((d) => {
        if (!ignore) setAlerts(d.alerts || []);
      })
      .catch(() => {
        if (!ignore) setError("Falha ao carregar alertas");
      })
      .finally(() => {
        if (!ignore) setLoading(false);
      });
    return () => {
      ignore = true;
    };
  }, []);

  const high = alerts.filter(a => a.severity === "high");
  const medium = alerts.filter(a => a.severity === "medium");
  const low = alerts.filter(a => a.severity === "low" || a.severity === "info");

  if (loading) {
    return <PageLoadingState message="A carregar alertas..." />;
  }

  if (error) {
    return <PageEmptyState title="Erro ao carregar alertas" description={error} icon={AlertCircle} />;
  }

  const kpis = [
    { label: "Total alertas", value: String(alerts.length), tone: "default" as const },
    { label: "Críticos", value: String(high.length), tone: "danger" as const },
    { label: "Atenção", value: String(medium.length), tone: "warning" as const },
    { label: "Informativo", value: String(low.length), tone: "default" as const },
    { label: "Estado", value: "Ativo", tone: "success" as const },
  ];

  return (
    <PageWrapper>
      <SectionHeader
        category="Monitorização"
        categoryIcon={AlertTriangle}
        title="Alertas Prioritários"
        description="Sinais críticos de cobrança, stock, orçamento e liquidez vindos do PRIMAVERA"
      />

      <KPIGrid items={kpis} className="mb-5" />

      <div className="bg-background rounded-xl shadow-sm border border-border overflow-hidden">
          <div className="border-b border-border px-8 py-3">
            <div className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-warning" />
              <h2 className="text-sm font-semibold text-muted-foreground tracking-wider">Lista de alertas</h2>
            </div>
          </div>
          {alerts.length === 0 ? (
            <div className="px-8 py-12 text-center text-muted-foreground">Sem alertas ativos.</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-border bg-muted/60">
                    <th className="px-8 py-6 text-left text-xs font-semibold text-muted-foreground tracking-wider">Severidade</th>
                    <th className="px-8 py-6 text-left text-xs font-semibold text-muted-foreground tracking-wider">Título</th>
                    <th className="px-8 py-6 text-left text-xs font-semibold text-muted-foreground tracking-wider">Mensagem</th>
                  </tr>
                </thead>
                <tbody>
                  {alerts.map((a) => (
                    <tr
                      key={`${a.severity}-${a.title}`}
                      className={cn("border-b border-border hover:bg-muted/40 transition-colors text-sm",
                        a.severity === "high" ? "bg-danger-soft/30" :
                        a.severity === "medium" ? "bg-warning-soft/30" :
                        "bg-info-soft/30")}
                    >
                      <td className="px-8 py-5">
                        <span className={cn("inline-block rounded-md px-2 py-0.5 text-xs font-semibold",
                          a.severity === "high" ? "bg-danger-soft text-danger" :
                          a.severity === "medium" ? "bg-warning-soft text-warning" :
                          "bg-info-soft text-info"
                        )}>
                          {a.severity === "high" ? "Crítico" : a.severity === "medium" ? "Atenção" : "Informativo"}
                        </span>
                      </td>
                      <td className="px-8 py-5 font-medium text-foreground">{a.title}</td>
                      <td className="px-8 py-5 text-muted-foreground">{a.message}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
    </PageWrapper>
  );
}
