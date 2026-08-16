import React from "react";
import { render, screen, waitFor } from "@testing-library/react";
import BudgetVsActualPage from "../BudgetVsActualPage";
import { createMockFetchResponse } from "../../__tests__/mocks/api";

const mockBudget = {
  orcamento: { vendasOrc: 150000, custosOrc: 90000 },
  real: { vendasLiquidas: 162000, custoTotal: 88000 },
  desvios: { vendas: 8, custos: -2 },
};

describe("BudgetVsActualPage", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (global.fetch as jest.Mock).mockClear();
  });

  it("renders the page title", async () => {
    (global.fetch as jest.Mock).mockResolvedValueOnce(createMockFetchResponse(mockBudget));
    render(<BudgetVsActualPage />);

    await waitFor(() => {
      expect(screen.getByText("Orçado vs Realizado")).toBeInTheDocument();
    });
  });

  it("displays loading state initially", () => {
    (global.fetch as jest.Mock).mockImplementationOnce(() => new Promise(() => {}));
    render(<BudgetVsActualPage />);

    expect(screen.getByText("A carregar dados...")).toBeInTheDocument();
  });

  it("fetches budget data on mount", async () => {
    (global.fetch as jest.Mock).mockResolvedValueOnce(createMockFetchResponse(mockBudget));
    render(<BudgetVsActualPage />);

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith(expect.stringContaining("/api/budget-vs-actual"));
    });
  });

  it("renders budget KPIs when data loads", async () => {
    (global.fetch as jest.Mock).mockResolvedValueOnce(createMockFetchResponse(mockBudget));
    render(<BudgetVsActualPage />);

    await waitFor(() => {
      expect(screen.getByText("Vendas orçado")).toBeInTheDocument();
      expect(screen.getByText("Vendas realizado")).toBeInTheDocument();
      expect(screen.getByText("Custos orçado")).toBeInTheDocument();
      expect(screen.getByText("Custos realizado")).toBeInTheDocument();
    });
  });

  it("renders the comparison table with deviation signs", async () => {
    (global.fetch as jest.Mock).mockResolvedValueOnce(createMockFetchResponse(mockBudget));
    render(<BudgetVsActualPage />);

    await waitFor(() => {
      expect(screen.getByText("Comparativo Vendas e Custos")).toBeInTheDocument();
      // The +8% deviation appears in both the KPI grid and the table.
      expect(screen.getAllByText("+8%").length).toBeGreaterThan(0);
    });
  });

  it("handles errors with an error empty state", async () => {
    (global.fetch as jest.Mock).mockRejectedValueOnce(new Error("API Error"));
    render(<BudgetVsActualPage />);

    await waitFor(() => {
      expect(screen.getByText("Erro")).toBeInTheDocument();
    });
  });

  it("shows empty state when no data returned", async () => {
    (global.fetch as jest.Mock).mockResolvedValueOnce(createMockFetchResponse(null));
    render(<BudgetVsActualPage />);

    await waitFor(() => {
      expect(screen.getByText("Sem dados")).toBeInTheDocument();
    });
  });
});