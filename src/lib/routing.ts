import { moduleViews } from "@/config/moduleViews";

export const routeAliases: Record<string, string> = {};
export const specialRoutes = ["custos-departamentos", "rhp", "ia", "alertas", "thresholds", "liquidez", "previsao"];

export function getCurrentRoute() {
  const hash = window.location.hash.replace("#", "");
  const route = routeAliases[hash] ?? hash;
  return (route && (moduleViews[route] || specialRoutes.includes(route))) ? route : "receber";
}
