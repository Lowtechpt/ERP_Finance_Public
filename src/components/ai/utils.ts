export type InsightTopic = "collections" | "production" | "cashflow" | "personnel" | "general";

export function normalizeQuestion(text: string) {
  return text
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "");
}

export function getInsightTopic(question: string): InsightTopic {
  const normalized = normalizeQuestion(question);
  if (/funcion|pessoal|salari|venciment|remuner|ordenad|recursos humanos|colaborador/.test(normalized)) return "personnel";
  if (/custo/.test(normalized) && !/produc|materia|fabrico|ordem|mao de obra direta|industrial/.test(normalized)) return "general";
  if (/cliente|cobrar|cobran|divida|d[ií]vida|receber|vencid|aging/.test(normalized)) return "collections";
  if (/produ|custo|materia|mat[eé]ria|fabrico|ordem/.test(normalized)) return "production";
  if (/fluxo|caixa|liquidez|tesouraria|saldo|pagar/.test(normalized)) return "cashflow";
  return "general";
}

export function getInsightTitle(topic: InsightTopic) {
  const titles: Record<InsightTopic, string> = {
    collections: "Cobranças prioritárias",
    production: "Custos de produção",
    cashflow: "Fluxo e liquidez",
    personnel: "Custos com pessoal",
    general: "Painel de análise assistida",
  };

  return titles[topic];
}
