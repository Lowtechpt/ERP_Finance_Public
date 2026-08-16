import React from "react";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import CashFlowForecastPage from "../CashFlowForecastPage";
import { createMockFetchResponse } from "../../__tests__/mocks/api";

const mockForecastData = {
  receivablesByMonth: [
    { month: "2026-01", docs: 4, total: 15000 },
    { month: "2026-02", docs: 3, total: 12000 },
    { month: "2026-03", docs: 2, total: 8000 },
    { month: "2026-04", docs: 2, total: 7000 },
  ],
  payablesByMonth: [
    { month: "2026-01", docs: 5, total: 10000 },
    { month: "2026-02", docs: 4, total: 9000 },
    { month: "2026-03", docs: 3, total: 5000 },
  ],
  bankAccounts: [{ Conta: "PT501", DescBanco: "Banco A", Banco: "BANCOA", Moeda: "EUR" }],
  summary: { totalIncoming: 27000, totalOutgoing: 19000, projectedBalance: 8000 },
  dailyFlow: [],
};

describe("CashFlowForecastPage", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (global.fetch as jest.Mock).mockClear();
  });

  it("renders the page title", async () => {
    (global.fetch as jest.Mock).mockResolvedValueOnce(createMockFetchResponse(mockForecastData));
    render(<CashFlowForecastPage />);

    await waitFor(() => {
      expect(screen.getByText("Previsão 30/60/90 dias")).toBeInTheDocument();
    });
  });

  it("displays loading state initially", () => {
    (global.fetch as jest.Mock).mockImplementationOnce(() => new Promise(() => {}));
    render(<CashFlowForecastPage />);

    expect(screen.getByText("A carregar previsão...")).toBeInTheDocument();
  });

  it("fetches cashflow data on mount", async () => {
    (global.fetch as jest.Mock).mockResolvedValueOnce(createMockFetchResponse(mockForecastData));
    render(<CashFlowForecastPage />);

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith(expect.stringContaining("/api/cashflow"));
    });
  });

  it("renders forecast KPIs for the 30-day horizon by default", async () => {
    (global.fetch as jest.Mock).mockResolvedValueOnce(createMockFetchResponse(mockForecastData));
    render(<CashFlowForecastPage />);

    await waitFor(() => {
      expect(screen.getByText("Entradas previstas (30d)")).toBeInTheDocument();
      expect(screen.getByText("Saídas previstas (30d)")).toBeInTheDocument();
      expect(screen.getByText("Meses com fluxo")).toBeInTheDocument();
    });
  });

  it("offers the horizon selector buttons", async () => {
    (global.fetch as jest.Mock).mockResolvedValueOnce(createMockFetchResponse(mockForecastData));
    render(<CashFlowForecastPage />);

    await waitFor(() => {
      expect(screen.getByRole("button", { name: "30 dias" })).toBeInTheDocument();
      expect(screen.getByRole("button", { name: "60 dias" })).toBeInTheDocument();
      expect(screen.getByRole("button", { name: "90 dias" })).toBeInTheDocument();
    });
  });

  it("switches the KPI label when changing the horizon", async () => {
    (global.fetch as jest.Mock).mockResolvedValueOnce(createMockFetchResponse(mockForecastData));
    render(<CashFlowForecastPage />);

    await waitFor(() => {
      expect(screen.getByText("Entradas previstas (30d)")).toBeInTheDocument();
    });

    await userEvent.click(screen.getByRole("button", { name: "60 dias" }));

    expect(screen.getByText("Entradas previstas (60d)")).toBeInTheDocument();
  });

  it("shows the empty state when no data is returned", async () => {
    (global.fetch as jest.Mock).mockResolvedValueOnce(createMockFetchResponse(null));
    render(<CashFlowForecastPage />);

    await waitFor(() => {
      expect(screen.getByText("Sem dados")).toBeInTheDocument();
    });
  });
});