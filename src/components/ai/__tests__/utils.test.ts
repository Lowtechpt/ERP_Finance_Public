import { normalizeQuestion, getInsightTopic, getInsightTitle } from "../utils";

describe("ai/utils", () => {
  describe("normalizeQuestion", () => {
    it("lowercases and strips accents", () => {
      expect(normalizeQuestion("CUSTOS DE PRODUÇÃO")).toBe("custos de producao");
    });
  });

  describe("getInsightTopic", () => {
    it("detects personnel topics", () => {
      expect(getInsightTopic("Quais os custos com funcionários?")).toBe("personnel");
      expect(getInsightTopic("Massa salarial")).toBe("personnel");
    });

    it("detects collections topics", () => {
      expect(getInsightTopic("Que clientes devo cobrar primeiro?")).toBe("collections");
      expect(getInsightTopic("Dívida em atraso")).toBe("collections");
    });

    it("detects production topics", () => {
      expect(getInsightTopic("Custos de produção")).toBe("production");
      expect(getInsightTopic("Ordens de fabrico")).toBe("production");
    });

    it("detects cashflow topics", () => {
      expect(getInsightTopic("Resume o fluxo de caixa")).toBe("cashflow");
      expect(getInsightTopic("Há riscos de liquidez?")).toBe("cashflow");
    });

    it("returns general for generic cost questions", () => {
      expect(getInsightTopic("Qual é o custo total?")).toBe("general");
    });

    it("returns general for unknown topics", () => {
      expect(getInsightTopic("Como está a empresa?")).toBe("general");
    });
  });

  describe("getInsightTitle", () => {
    it("returns the title for each topic", () => {
      expect(getInsightTitle("collections")).toBe("Cobranças prioritárias");
      expect(getInsightTitle("production")).toBe("Custos de produção");
      expect(getInsightTitle("cashflow")).toBe("Fluxo e liquidez");
      expect(getInsightTitle("personnel")).toBe("Custos com pessoal");
      expect(getInsightTitle("general")).toBe("Painel de análise assistida");
    });
  });
});