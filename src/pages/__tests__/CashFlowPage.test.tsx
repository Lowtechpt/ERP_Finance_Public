import React from "react";
import { render, screen, waitFor } from "@testing-library/react";
import CashFlowPage from "../CashFlowPage";
import { createMockFetchResponse } from "../../__tests__/mocks/api";

const mockCashFlowData = {
  receivablesByMonth: [
    { month: "2026-01", docs: 4, total: 15000 },
    { month: "2026-02", docs: 3, total: 12000 },
  ],
  payablesByMonth: [
    { month: "2026-01", docs: 5, total: 10000 },
    { month: "2026-02", docs: 4, total: 9000 },
  ],
  bankAccounts: [{ Conta: "PT501", DescBanco: "Banco A", Banco: "BANCOA", Moeda: "EUR" }],
  summary: { totalIncoming: 27000, totalOutgoing: 19000, projectedBalance: 8000 },
};

describe("CashFlowPage", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (global.fetch as jest.Mock).mockClear();
  });

  it("renders the page title", async () => {
    (global.fetch as jest.Mock).mockResolvedValueOnce(createMockFetchResponse(mockCashFlowData));
    render(<CashFlowPage />);

    await waitFor(() => {
      expect(screen.getByText("Fluxo de Caixa")).toBeInTheDocument();
    });
  });

  it("displays loading state initially", () => {
    (global.fetch as jest.Mock).mockImplementationOnce(() => new Promise(() => {}));
    render(<CashFlowPage />);

    expect(screen.getByText("A carregar fluxo de caixa...")).toBeInTheDocument();
  });

  it("fetches cashflow data on mount", async () => {
    (global.fetch as jest.Mock).mockResolvedValueOnce(createMockFetchResponse(mockCashFlowData));
    render(<CashFlowPage />);

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith(expect.stringContaining("/api/cashflow"));
    });
  });

  it("renders cashflow KPIs when data loads", async () => {
    (global.fetch as jest.Mock).mockResolvedValueOnce(createMockFetchResponse(mockCashFlowData));
    render(<CashFlowPage />);

    await waitFor(() => {
      expect(screen.getByText("Entradas Previstas")).toBeInTheDocument();
      expect(screen.getByText("Saídas Previstas")).toBeInTheDocument();
      expect(screen.getByText("Saldo Projetado")).toBeInTheDocument();
    });
  });

  it("renders the monthly map and bank accounts sections", async () => {
    (global.fetch as jest.Mock).mockResolvedValueOnce(createMockFetchResponse(mockCashFlowData));
    render(<CashFlowPage />);

    await waitFor(() => {
      expect(screen.getByText("Mapa Mensal")).toBeInTheDocument();
      expect(screen.getByText("Contas Bancárias")).toBeInTheDocument();
      expect(screen.getByText("PT501")).toBeInTheDocument();
    });
  });

  it("renders monthly labels from month numbers", async () => {
    (global.fetch as jest.Mock).mockResolvedValueOnce(createMockFetchResponse(mockCashFlowData));
    render(<CashFlowPage />);

    await waitFor(() => {
      expect(screen.getByText("Jan")).toBeInTheDocument();
      expect(screen.getByText("Fev")).toBeInTheDocument();
    });
  });

  it("shows a fallback message when no bank accounts exist", async () => {
    (global.fetch as jest.Mock).mockResolvedValueOnce(
      createMockFetchResponse({ ...mockCashFlowData, bankAccounts: [] })
    );
    render(<CashFlowPage />);

    await waitFor(() => {
      expect(screen.getByText("Nenhuma conta bancária disponível.")).toBeInTheDocument();
    });
  });

  it("renders with defaults when the API fails", async () => {
    (global.fetch as jest.Mock).mockRejectedValueOnce(new Error("API Error"));
    render(<CashFlowPage />);

    await waitFor(() => {
      expect(screen.getByText("Fluxo de Caixa")).toBeInTheDocument();
      expect(screen.getByText("Entradas Previstas")).toBeInTheDocument();
    });
  });
});