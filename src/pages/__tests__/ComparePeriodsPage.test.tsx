import React from "react";
import { render, screen, waitFor } from "@testing-library/react";
import ComparePeriodsPage from "../ComparePeriodsPage";
import { createMockFetchResponse } from "../../__tests__/mocks/api";

const mockPeriods = {
  periods: [
    { mes: "2026-05", vendas: "15000", compras: "8000" },
    { mes: "2026-04", vendas: "12000", compras: "9000" },
  ],
};

describe("ComparePeriodsPage", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (global.fetch as jest.Mock).mockClear();
  });

  it("displays loading state initially", () => {
    (global.fetch as jest.Mock).mockImplementationOnce(() => new Promise(() => {}));
    render(<ComparePeriodsPage />);

    expect(screen.getByText("A carregar comparação de períodos...")).toBeInTheDocument();
  });

  it("fetches compare periods data on mount", async () => {
    (global.fetch as jest.Mock).mockResolvedValueOnce(createMockFetchResponse(mockPeriods));
    render(<ComparePeriodsPage />);

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith(expect.stringContaining("/api/compare-periods"));
    });
  });

  it("renders the period comparison KPIs", async () => {
    (global.fetch as jest.Mock).mockResolvedValueOnce(createMockFetchResponse(mockPeriods));
    render(<ComparePeriodsPage />);

    await waitFor(() => {
      expect(screen.getByText("Períodos")).toBeInTheDocument();
      expect(screen.getByText("Vendas totais")).toBeInTheDocument();
      expect(screen.getByText("Compras totais")).toBeInTheDocument();
      expect(screen.getByText("Saldo (V-C)")).toBeInTheDocument();
      expect(screen.getByText("Melhor mês vendas")).toBeInTheDocument();
    });
  });

  it("renders period rows in the comparison table", async () => {
    (global.fetch as jest.Mock).mockResolvedValueOnce(createMockFetchResponse(mockPeriods));
    render(<ComparePeriodsPage />);

    await waitFor(() => {
      expect(screen.getByText("Comparação mensal")).toBeInTheDocument();
      // The best-sales-month KPI also shows the month value.
      expect(screen.getAllByText("2026-05").length).toBeGreaterThan(0);
      expect(screen.getAllByText("2026-04").length).toBeGreaterThan(0);
    });
  });

  it("shows the empty state when no periods are returned", async () => {
    (global.fetch as jest.Mock).mockResolvedValueOnce(createMockFetchResponse({ periods: [] }));
    render(<ComparePeriodsPage />);

    await waitFor(() => {
      expect(screen.getByText("Sem dados de períodos disponíveis.")).toBeInTheDocument();
    });
  });

  it("shows the error state when the request fails", async () => {
    (global.fetch as jest.Mock).mockRejectedValueOnce(new Error("API Error"));
    render(<ComparePeriodsPage />);

    await waitFor(() => {
      expect(screen.getByText("Erro")).toBeInTheDocument();
      expect(screen.getByText("Falha ao carregar comparação de períodos")).toBeInTheDocument();
    });
  });
});