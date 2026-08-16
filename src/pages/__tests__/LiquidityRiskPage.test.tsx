import React from "react";
import { render, screen, waitFor } from "@testing-library/react";
import LiquidityRiskPage from "../LiquidityRiskPage";
import { createMockFetchResponse } from "../../__tests__/mocks/api";

const cashflow = {
  summary: { totalIncoming: 30000, totalOutgoing: 35000, projectedBalance: -5000 },
  bankAccounts: [{ Conta: "PT501", DescBanco: "Banco A", Moeda: "EUR" }],
};

const alerts = {
  alerts: [{ type: "receivables", severity: "high", title: "Cobranças vencidas", message: "5 docs vencidos" }],
  counts: { total: 3, high: 1, medium: 2 },
};

const dashboard = {
  kpis: { totalOverdue: 15000, totalOpen: 80000, docCount: 25, clientCount: 12 },
  payablesAlert: [{ doc: "FC1", supplier: "Fornecedor X", dueDate: "2026-06-01", daysOverdue: 5, total: 3000 }],
};

describe("LiquidityRiskPage", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (global.fetch as jest.Mock).mockClear();
  });

  it("renders the page title", async () => {
    (global.fetch as jest.Mock)
      .mockResolvedValueOnce(createMockFetchResponse(cashflow))
      .mockResolvedValueOnce(createMockFetchResponse(alerts))
      .mockResolvedValueOnce(createMockFetchResponse(dashboard));
    render(<LiquidityRiskPage />);

    await waitFor(() => {
      expect(screen.getByText("Risco de liquidez")).toBeInTheDocument();
    });
  });

  it("displays loading state initially", () => {
    (global.fetch as jest.Mock).mockImplementation(() => new Promise(() => {}));
    render(<LiquidityRiskPage />);

    expect(screen.getByText("A carregar risco de liquidez...")).toBeInTheDocument();
  });

  it("fetches the three data endpoints on mount", async () => {
    (global.fetch as jest.Mock)
      .mockResolvedValueOnce(createMockFetchResponse(cashflow))
      .mockResolvedValueOnce(createMockFetchResponse(alerts))
      .mockResolvedValueOnce(createMockFetchResponse(dashboard));
    render(<LiquidityRiskPage />);

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith(expect.stringContaining("/api/cashflow"));
      expect(global.fetch).toHaveBeenCalledWith(expect.stringContaining("/api/alerts"));
      expect(global.fetch).toHaveBeenCalledWith(expect.stringContaining("/api/dashboard"));
    });
  });

  it("shows a high risk banner when critical alerts exist", async () => {
    (global.fetch as jest.Mock)
      .mockResolvedValueOnce(createMockFetchResponse(cashflow))
      .mockResolvedValueOnce(createMockFetchResponse(alerts))
      .mockResolvedValueOnce(createMockFetchResponse(dashboard));
    render(<LiquidityRiskPage />);

    await waitFor(() => {
      expect(screen.getByText("RISCO ALTO DE LIQUIDEZ")).toBeInTheDocument();
      expect(screen.getByText(/1 alertas críticos/)).toBeInTheDocument();
    });
  });

  it("renders liquidity KPIs when data loads", async () => {
    (global.fetch as jest.Mock)
      .mockResolvedValueOnce(createMockFetchResponse(cashflow))
      .mockResolvedValueOnce(createMockFetchResponse(alerts))
      .mockResolvedValueOnce(createMockFetchResponse(dashboard));
    render(<LiquidityRiskPage />);

    await waitFor(() => {
      expect(screen.getByText("Saldo Projetado")).toBeInTheDocument();
      expect(screen.getByText("Recebíveis em Atraso")).toBeInTheDocument();
      expect(screen.getByText("Total em Aberto")).toBeInTheDocument();
      expect(screen.getByText("Alertas Críticos")).toBeInTheDocument();
      expect(screen.getByText("Alertas Totais")).toBeInTheDocument();
    });
  });

  it("shows critical payment alerts and payables due", async () => {
    (global.fetch as jest.Mock)
      .mockResolvedValueOnce(createMockFetchResponse(cashflow))
      .mockResolvedValueOnce(createMockFetchResponse(alerts))
      .mockResolvedValueOnce(createMockFetchResponse(dashboard));
    render(<LiquidityRiskPage />);

    await waitFor(() => {
      expect(screen.getByText("Alertas de Liquidez")).toBeInTheDocument();
      expect(screen.getByText("Próximos Pagamentos Críticos")).toBeInTheDocument();
      expect(screen.getByText("Fornecedor X")).toBeInTheDocument();
    });
  });

  it("falls back to zeros when the APIs fail", async () => {
    (global.fetch as jest.Mock).mockRejectedValue(new Error("API Error"));
    render(<LiquidityRiskPage />);

    await waitFor(() => {
      expect(screen.getByText("Liquidez controlada")).toBeInTheDocument();
      expect(screen.getByText("Saldo Projetado")).toBeInTheDocument();
    });
  });
});