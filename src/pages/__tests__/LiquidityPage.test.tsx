import React from "react";
import { render, screen, waitFor } from "@testing-library/react";
import LiquidityPage from "../LiquidityPage";
import { createMockFetchResponse } from "../../__tests__/mocks/api";

const kpis = {
  saldoBancario: 50000,
  recebiveis: 20000,
  aPagar: 15000,
  stock: 8000,
  capitalCirculante: 63000,
  dso: 45,
  vendas: 125000,
};

const cashflow = {
  summary: { totalIncoming: 30000, totalOutgoing: 25000, projectedBalance: 5000 },
  receivablesByMonth: [],
  payablesByMonth: [],
};

const payables = {
  payables: [
    { doc: "FC1", supplierName: "Fornecedor X", dueDate: "2026-06-01", daysOverdue: 5, totalAmount: 3000, status: "Vencido" },
    { doc: "FC2", supplierName: "Fornecedor Y", dueDate: "2026-07-01", daysOverdue: -20, totalAmount: 1200, status: "Pendente" },
  ],
};

const receivables = {
  receivables: [
    { clientName: "Cliente A", dueDate: "2026-06-15", daysOverdue: 3, openAmount: 2500, status: "Vencido" },
  ],
};

describe("LiquidityPage", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (global.fetch as jest.Mock).mockClear();
  });

  it("renders the page title", async () => {
    (global.fetch as jest.Mock)
      .mockResolvedValueOnce(createMockFetchResponse(kpis))
      .mockResolvedValueOnce(createMockFetchResponse(cashflow))
      .mockResolvedValueOnce(createMockFetchResponse(payables))
      .mockResolvedValueOnce(createMockFetchResponse(receivables));
    render(<LiquidityPage />);

    await waitFor(() => {
      expect(screen.getByText("Risco de liquidez")).toBeInTheDocument();
    });
  });

  it("displays loading state initially", () => {
    (global.fetch as jest.Mock).mockImplementation(() => new Promise(() => {}));
    render(<LiquidityPage />);

    expect(screen.getByText("A carregar...")).toBeInTheDocument();
  });

  it("fetches the four data endpoints on mount", async () => {
    (global.fetch as jest.Mock)
      .mockResolvedValueOnce(createMockFetchResponse(kpis))
      .mockResolvedValueOnce(createMockFetchResponse(cashflow))
      .mockResolvedValueOnce(createMockFetchResponse(payables))
      .mockResolvedValueOnce(createMockFetchResponse(receivables));
    render(<LiquidityPage />);

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith(expect.stringContaining("/api/financial-kpis"));
      expect(global.fetch).toHaveBeenCalledWith(expect.stringContaining("/api/cashflow"));
      expect(global.fetch).toHaveBeenCalledWith(expect.stringContaining("/api/payables"));
      expect(global.fetch).toHaveBeenCalledWith(expect.stringContaining("/api/receivables"));
    });
  });

  it("renders liquidity ratio KPIs when data loads", async () => {
    (global.fetch as jest.Mock)
      .mockResolvedValueOnce(createMockFetchResponse(kpis))
      .mockResolvedValueOnce(createMockFetchResponse(cashflow))
      .mockResolvedValueOnce(createMockFetchResponse(payables))
      .mockResolvedValueOnce(createMockFetchResponse(receivables));
    render(<LiquidityPage />);

    await waitFor(() => {
      expect(screen.getByText("Liquidez imediata")).toBeInTheDocument();
      expect(screen.getByText("Liquidez reduzida")).toBeInTheDocument();
      expect(screen.getByText("Liquidez geral")).toBeInTheDocument();
      expect(screen.getByText("Cobertura vencido")).toBeInTheDocument();
      expect(screen.getByText("Saldo bancário")).toBeInTheDocument();
    });
  });

  it("shows overdue and upcoming payables", async () => {
    (global.fetch as jest.Mock)
      .mockResolvedValueOnce(createMockFetchResponse(kpis))
      .mockResolvedValueOnce(createMockFetchResponse(cashflow))
      .mockResolvedValueOnce(createMockFetchResponse(payables))
      .mockResolvedValueOnce(createMockFetchResponse(receivables));
    render(<LiquidityPage />);

    await waitFor(() => {
      // The heading appears once; "Pagamentos vencidos" may appear in both a
      // panel title and a KPI/empty hint, so accept multiple matches.
      expect(screen.getAllByText(/Pagamentos vencidos/).length).toBeGreaterThan(0);
      expect(screen.getByText("Fornecedor X")).toBeInTheDocument();
    });
  });

  it("handles API failures by falling back to zeros", async () => {
    (global.fetch as jest.Mock).mockRejectedValue(new Error("API Error"));
    render(<LiquidityPage />);

    await waitFor(() => {
      expect(screen.getByText("Risco de liquidez")).toBeInTheDocument();
      expect(screen.getByText("Liquidez imediata")).toBeInTheDocument();
    });
  });
});