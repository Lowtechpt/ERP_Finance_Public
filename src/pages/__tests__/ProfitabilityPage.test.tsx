import React from "react";
import { render, screen, waitFor } from "@testing-library/react";
import ProfitabilityPage from "../ProfitabilityPage";
import { createMockFetchResponse } from "../../__tests__/mocks/api";

const mockProfitability = {
  products: [
    { Artigo: "ART001", name: "Produto A", qty: 100, revenue: 45000, cogs: 27000, margin: 18000 },
    { Artigo: "ART002", name: "Produto B", qty: 80, revenue: 35000, cogs: 21000, margin: 14000 },
  ],
};

describe("ProfitabilityPage", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (global.fetch as jest.Mock).mockClear();
  });

  it("renders the page title", async () => {
    (global.fetch as jest.Mock).mockResolvedValueOnce(createMockFetchResponse(mockProfitability));
    render(<ProfitabilityPage />);

    await waitFor(() => {
      expect(screen.getByText("Rentabilidade por Produto")).toBeInTheDocument();
    });
  });

  it("displays loading state initially", () => {
    (global.fetch as jest.Mock).mockImplementationOnce(() => new Promise(() => {}));
    render(<ProfitabilityPage />);

    expect(screen.getByText("Carregando rentabilidade...")).toBeInTheDocument();
  });

  it("fetches profitability data on mount", async () => {
    (global.fetch as jest.Mock).mockResolvedValueOnce(createMockFetchResponse(mockProfitability));
    render(<ProfitabilityPage />);

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith(expect.stringContaining("/api/profitability"));
    });
  });

  it("renders profitability KPIs when data loads", async () => {
    (global.fetch as jest.Mock).mockResolvedValueOnce(createMockFetchResponse(mockProfitability));
    render(<ProfitabilityPage />);

    await waitFor(() => {
      expect(screen.getByText("Artigos")).toBeInTheDocument();
      expect(screen.getByText("Receita total")).toBeInTheDocument();
      expect(screen.getByText("COGS total")).toBeInTheDocument();
      expect(screen.getByText("Margem total")).toBeInTheDocument();
      expect(screen.getByText("Margem média")).toBeInTheDocument();
    });
  });

  it("renders the profitability table with products", async () => {
    (global.fetch as jest.Mock).mockResolvedValueOnce(createMockFetchResponse(mockProfitability));
    render(<ProfitabilityPage />);

    await waitFor(() => {
      expect(screen.getByText("Tabela de rentabilidade")).toBeInTheDocument();
      expect(screen.getByText("ART001")).toBeInTheDocument();
      expect(screen.getByText("ART002")).toBeInTheDocument();
    });
  });

  it("shows an empty message when there are no products", async () => {
    (global.fetch as jest.Mock).mockResolvedValueOnce(createMockFetchResponse({ products: [] }));
    render(<ProfitabilityPage />);

    await waitFor(() => {
      expect(screen.getByText("Sem dados de rentabilidade disponíveis.")).toBeInTheDocument();
    });
  });

  it("handles errors with an error empty state", async () => {
    (global.fetch as jest.Mock).mockRejectedValueOnce(new Error("API Error"));
    render(<ProfitabilityPage />);

    await waitFor(() => {
      expect(screen.getByText("Erro")).toBeInTheDocument();
    });
  });
});