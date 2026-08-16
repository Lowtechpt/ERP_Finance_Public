import React from "react";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import RiskConcentrationPage from "../RiskConcentrationPage";
import { createMockFetchResponse } from "../../__tests__/mocks/api";

const customers = {
  customers: [
    { code: "C1", name: "Cliente A", salesAmount: 50000, currentDebt: 10000 },
    { code: "C2", name: "Cliente B", salesAmount: 30000, currentDebt: 5000 },
  ],
};

const products = [
  { code: "P1", name: "Produto A", revenue: 45000, margin: 18000 },
  { code: "P2", name: "Produto B", revenue: 35000, margin: 14000 },
];

describe("RiskConcentrationPage", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (global.fetch as jest.Mock).mockClear();
  });

  it("renders the page title", async () => {
    (global.fetch as jest.Mock)
      .mockResolvedValueOnce(createMockFetchResponse(customers))
      .mockResolvedValueOnce(createMockFetchResponse(products));
    render(<RiskConcentrationPage />);

    await waitFor(() => {
      expect(screen.getByText("Concentração de risco")).toBeInTheDocument();
    });
  });

  it("displays loading state initially", () => {
    (global.fetch as jest.Mock).mockImplementation(() => new Promise(() => {}));
    render(<RiskConcentrationPage />);

    expect(screen.getByText("A carregar concentração de risco...")).toBeInTheDocument();
  });

  it("fetches customers and product profitability on mount", async () => {
    (global.fetch as jest.Mock)
      .mockResolvedValueOnce(createMockFetchResponse(customers))
      .mockResolvedValueOnce(createMockFetchResponse(products));
    render(<RiskConcentrationPage />);

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith(expect.stringContaining("/api/customers"));
      expect(global.fetch).toHaveBeenCalledWith(expect.stringContaining("/api/profitability/product"));
    });
  });

  it("renders concentration KPIs when data loads", async () => {
    (global.fetch as jest.Mock)
      .mockResolvedValueOnce(createMockFetchResponse(customers))
      .mockResolvedValueOnce(createMockFetchResponse(products));
    render(<RiskConcentrationPage />);

    await waitFor(() => {
      expect(screen.getByText("Top 5 Faturação")).toBeInTheDocument();
      expect(screen.getByText("Top 5 Dívida")).toBeInTheDocument();
      expect(screen.getByText("HHI Vendas")).toBeInTheDocument();
      expect(screen.getByText("HHI Dívida")).toBeInTheDocument();
      expect(screen.getByText("Top 5 Margem")).toBeInTheDocument();
    });
  });

  it("renders the client concentration table by default", async () => {
    (global.fetch as jest.Mock)
      .mockResolvedValueOnce(createMockFetchResponse(customers))
      .mockResolvedValueOnce(createMockFetchResponse(products));
    render(<RiskConcentrationPage />);

    await waitFor(() => {
      expect(screen.getByText("Cliente A")).toBeInTheDocument();
      expect(screen.getByText("Cliente B")).toBeInTheDocument();
    });
  });

  it("switches to the product view", async () => {
    (global.fetch as jest.Mock)
      .mockResolvedValueOnce(createMockFetchResponse(customers))
      .mockResolvedValueOnce(createMockFetchResponse(products));
    render(<RiskConcentrationPage />);

    await userEvent.click(await screen.findByText("Por Produto"));

    expect(screen.getByText("Produto A")).toBeInTheDocument();
    expect(screen.getByText("Produto B")).toBeInTheDocument();
  });

  it("falls back to empty data when the APIs fail", async () => {
    (global.fetch as jest.Mock).mockRejectedValue(new Error("API Error"));
    render(<RiskConcentrationPage />);

    await waitFor(() => {
      expect(screen.getByText("Concentração de risco")).toBeInTheDocument();
      expect(screen.getByText("Top 5 Faturação")).toBeInTheDocument();
    });
  });
});