import React from "react";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import ProductionPage from "../ProductionPage";
import { createMockFetchResponse } from "../../__tests__/mocks/api";

const mockProductionData = {
  summary: {
    totalOrdens: 3,
    totalMatPrevisto: 20000,
    totalMatReal: 22000,
    totalTransfPrevisto: 8000,
    totalTransfReal: 8500,
    totalPrevisto: 28000,
    totalReal: 30500,
    desvioTotal: 2500,
  },
  orders: [
    { Id: "1", OrdemFabrico: "OF001", Artigo: "ART1", ArtigoDescricao: "Artigo A", Quantidade: 100, CustoMateriaisPrevisto: 10000, CustoMateriaisReal: 11000, CustoTransformacaoPrevisto: 4000, CustoTransformacaoReal: 4500, OutrosCustosPrevito: 0, OutrosCustosReal: 0, DataOrdemFabrico: "2026-05-01", Estado: 2 },
    { Id: "2", OrdemFabrico: "OF002", Artigo: "ART2", ArtigoDescricao: "Artigo B", Quantidade: 50, CustoMateriaisPrevisto: 5000, CustoMateriaisReal: 5000, CustoTransformacaoPrevisto: 2000, CustoTransformacaoReal: 2000, OutrosCustosPrevito: 0, OutrosCustosReal: 0, DataOrdemFabrico: "2026-05-10", Estado: 4 },
  ],
  components: [],
  articleCosts: [],
};

describe("ProductionPage", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (global.fetch as jest.Mock).mockClear();
  });

  it("renders the page title", async () => {
    (global.fetch as jest.Mock).mockResolvedValueOnce(createMockFetchResponse(mockProductionData));
    render(<ProductionPage />);

    await waitFor(() => {
      expect(screen.getByText("Custos industriais")).toBeInTheDocument();
    });
  });

  it("displays loading state initially", () => {
    (global.fetch as jest.Mock).mockImplementationOnce(() => new Promise(() => {}));
    render(<ProductionPage />);

    expect(screen.getByText("A carregar dados de produção...")).toBeInTheDocument();
  });

  it("fetches production costs on mount", async () => {
    (global.fetch as jest.Mock).mockResolvedValueOnce(createMockFetchResponse(mockProductionData));
    render(<ProductionPage />);

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith(expect.stringContaining("/api/production-costs"));
    });
  });

  it("renders production KPIs when data loads", async () => {
    (global.fetch as jest.Mock).mockResolvedValueOnce(createMockFetchResponse(mockProductionData));
    render(<ProductionPage />);

    await waitFor(() => {
      // "Ordens de fabrico" is both a KPI label and a table heading.
      expect(screen.getAllByText("Ordens de fabrico").length).toBeGreaterThan(0);
      expect(screen.getByText("Custo materiais real")).toBeInTheDocument();
      expect(screen.getByText("Custo transformação real")).toBeInTheDocument();
      expect(screen.getByText("Desvio total")).toBeInTheDocument();
    });
  });

  it("renders the article cost table with order rows", async () => {
    (global.fetch as jest.Mock).mockResolvedValueOnce(createMockFetchResponse(mockProductionData));
    render(<ProductionPage />);

    await waitFor(() => {
      expect(screen.getByText("Custo por artigo produzido")).toBeInTheDocument();
      expect(screen.getByText("Artigo A")).toBeInTheDocument();
      expect(screen.getByText("Artigo B")).toBeInTheDocument();
    });
  });

  it("shows the empty state when no data is available", async () => {
    (global.fetch as jest.Mock).mockResolvedValueOnce(createMockFetchResponse(null));
    render(<ProductionPage />);

    await waitFor(() => {
      expect(screen.getByText("Sem dados de produção")).toBeInTheDocument();
    });
  });

  it("keeps the page shell after an API error", async () => {
    (global.fetch as jest.Mock).mockRejectedValueOnce(new Error("API Error"));
    render(<ProductionPage />);

    await waitFor(() => {
      expect(screen.getByText("Sem dados de produção")).toBeInTheDocument();
    });
  });
});