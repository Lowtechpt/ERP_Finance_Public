import React from "react";
import { render, screen, waitFor } from "@testing-library/react";
import DREPage from "../DREPage";
import { createMockFetchResponse } from "../../__tests__/mocks/api";

const mockDRE = {
  period: "2026-06",
  vendasMercadorias: 150000,
  descontos: 1500,
  vendasLiquidas: 148500,
  custoMercadoriasVendidas: 80000,
  custoProducaoReal: 12000,
  custoProducaoPrevisto: 11000,
  custoTotal: 92000,
  margemBruta: 56500,
  margemBrutaPct: 38,
  custosOperacionais: 30000,
  ebitda: 26500,
  ebitdaPct: 17.8,
  lucroLiquido: 18000,
  lucroLiquidoPct: 12.1,
};

describe("DREPage", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (global.fetch as jest.Mock).mockClear();
  });

  it("renders the page title with the period", async () => {
    (global.fetch as jest.Mock).mockResolvedValueOnce(createMockFetchResponse(mockDRE));
    render(<DREPage />);

    await waitFor(() => {
      expect(screen.getByText("DRE e Margens")).toBeInTheDocument();
      expect(screen.getByText(/2026-06/)).toBeInTheDocument();
    });
  });

  it("displays loading state initially", () => {
    (global.fetch as jest.Mock).mockImplementationOnce(() => new Promise(() => {}));
    render(<DREPage />);

    expect(screen.getByText("A carregar dados de DRE...")).toBeInTheDocument();
  });

  it("fetches DRE data on mount", async () => {
    (global.fetch as jest.Mock).mockResolvedValueOnce(createMockFetchResponse(mockDRE));
    render(<DREPage />);

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith(expect.stringContaining("/api/dre"));
    });
  });

  it("renders DRE KPIs when data loads", async () => {
    (global.fetch as jest.Mock).mockResolvedValueOnce(createMockFetchResponse(mockDRE));
    render(<DREPage />);

    await waitFor(() => {
      // "Margem Bruta" appears both as a KPI and as a DRE line item.
      expect(screen.getAllByText("Vendas Líquidas").length).toBeGreaterThan(0);
      expect(screen.getAllByText("Custos Totais").length).toBeGreaterThan(0);
      expect(screen.getAllByText("Margem Bruta").length).toBeGreaterThan(0);
      expect(screen.getAllByText("EBITDA %").length).toBeGreaterThan(0);
    });
  });

  it("renders DRE line items in the table", async () => {
    (global.fetch as jest.Mock).mockResolvedValueOnce(createMockFetchResponse(mockDRE));
    render(<DREPage />);

    await waitFor(() => {
      expect(screen.getByText("Vendas de mercadorias")).toBeInTheDocument();
      expect(screen.getByText("Vendas líquidas")).toBeInTheDocument();
      expect(screen.getByText("Custos operacionais")).toBeInTheDocument();
      expect(screen.getByText("Lucro líquido")).toBeInTheDocument();
    });
  });

  it("shows the empty state when no data is available", async () => {
    (global.fetch as jest.Mock).mockResolvedValueOnce(createMockFetchResponse(null));
    render(<DREPage />);

    await waitFor(() => {
      expect(screen.getByText("Sem dados de DRE")).toBeInTheDocument();
    });
  });

  it("keeps the page shell after an API error", async () => {
    (global.fetch as jest.Mock).mockRejectedValueOnce(new Error("API Error"));
    render(<DREPage />);

    await waitFor(() => {
      expect(screen.getByText("Sem dados de DRE")).toBeInTheDocument();
    });
  });
});