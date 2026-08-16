/**
 * Pure formatting utilities for currency, numbers, dates, and text.
 * No React or app state dependencies.
 */
import type { PrimaveraModule } from "@/types/primavera";

export function formatCurrency(value: number, currency = "EUR") {
  return new Intl.NumberFormat("pt-PT", {
    style: "currency",
    currency,
    minimumFractionDigits: 2,
  }).format(value);
}

export function formatDate(date: string | null) {
  if (!date) {
    return "-";
  }

  return new Intl.DateTimeFormat("pt-PT").format(new Date(`${date}T00:00:00`));
}

export function formatPercent(value: number, decimals = 1) {
  return `${value.toFixed(decimals)}%`;
}

export function formatNumber(value: number, decimals = 0) {
  return new Intl.NumberFormat("pt-PT", {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  }).format(value);
}

export function formatDays(days: number) {
  if (days === 1) return "1 dia";
  return `${days} dias`;
}

export function parseCurrency(text: string) {
  return Number(text.replace(/[^\d,-]/g, "").replace(",", ".")) || 0;
}

export function moduleDisplayName(module: PrimaveraModule) {
  const names: Record<string, string> = {
    ARM: "Armazéns",
    ART: "Artigos",
    BAS: "Base Aplicacional",
    CBL: "Contabilidade",
    "CBL-PC": "Plano de contas",
    CCT: "Contas Correntes",
    CMP: "Compras",
    CRM: "CRM",
    EAP: "Equipamentos e Activos",
    EPK: "EyePeak",
    ERP: "ERP",
    FIL: "Filiais",
    FOR: "Fornecedores",
    GPR: "Produção",
    "GPR-CMP": "Componentes de produção",
    INT: "Internos",
    INV: module.tableName === "VersaoModulo" ? "Módulo INV" : "Inventário",
    MOB: "Mobile",
    PCM: "Gestão de Contratos",
    PRJ: "Projetos e Serviços",
    RHP: "Recursos Humanos",
    STK: "Stock atual",
    STP: "Serviços Técnicos",
    TES: "Tesouraria",
    TTE: "Track and Trace",
    VDR: "Vendedores",
    VND: "Vendas",
    "VND-LIN": "Linhas de venda",
  };

  return names[module.code] ?? module.name;
}
