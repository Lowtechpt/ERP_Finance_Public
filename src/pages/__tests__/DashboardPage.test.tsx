import React from "react";
import { render, screen, waitFor } from "@testing-library/react";
import DashboardPage from "../DashboardPage";
import { mockDashboard, mockFinancialKpis, createMockFetchResponse } from "../../__tests__/mocks/api";

// DashboardPage fires two fetches in one Promise.all([...]) — financial-kpis
// first, dashboard second, in source order — so queuing two mockResolvedValueOnce
// calls in that order mocks both real requests distinctly.
function mockBothEndpoints() {
  (global.fetch as jest.Mock)
    .mockResolvedValueOnce(createMockFetchResponse(mockFinancialKpis))
    .mockResolvedValueOnce(createMockFetchResponse(mockDashboard));
}

describe("DashboardPage", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (global.fetch as jest.Mock).mockClear();
  });

  it("renders the page title once data loads", async () => {
    mockBothEndpoints();

    render(<DashboardPage />);

    await waitFor(() => {
      expect(screen.getByText("Dashboard Financeiro")).toBeInTheDocument();
    });
  });

  it("shows the loading message before data arrives", () => {
    (global.fetch as jest.Mock).mockImplementation(() => new Promise(() => {}));

    render(<DashboardPage />);

    expect(screen.getByText("A carregar dashboard...")).toBeInTheDocument();
  });

  it("fetches dashboard data on mount", async () => {
    mockBothEndpoints();

    render(<DashboardPage />);

    // The page loads its KPIs and its panels from two endpoints, each called
    // with a URL and no request options.
    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith(expect.stringContaining("/api/financial-kpis"));
      expect(global.fetch).toHaveBeenCalledWith(expect.stringContaining("/api/dashboard"));
    });
  });

  it("formats and displays real KPI values", async () => {
    mockBothEndpoints();

    render(<DashboardPage />);

    // EBITDA appears twice: once in the header KPI grid, once in the hero card.
    await waitFor(() => {
      expect(screen.getAllByText(/26\s?928,69\s?€/).length).toBeGreaterThan(0);
      expect(screen.getByText(/91 dias/)).toBeInTheDocument(); // DSO
      expect(screen.getByText(/40\.4%/)).toBeInTheDocument(); // Margem bruta
    });
  });

  it("does not crash when the fetch rejects, and stops showing the loading state", async () => {
    (global.fetch as jest.Mock).mockRejectedValue(new Error("API Error"));

    render(<DashboardPage />);

    await waitFor(() => {
      expect(screen.queryByText("A carregar dashboard...")).not.toBeInTheDocument();
    });
    // KPIs fall back to their zero defaults rather than showing an error UI —
    // there is no dedicated error state in this component today.
    expect(screen.getByText("Dashboard Financeiro")).toBeInTheDocument();
    expect(screen.getAllByText(/^0,00 €$/).length).toBeGreaterThan(0);
  });

  it("renders the monthly sales trend as sized bars, not a chart library element", async () => {
    mockBothEndpoints();

    render(<DashboardPage />);

    await waitFor(() => {
      expect(screen.getByText(/Vendas mensais/)).toBeInTheDocument();
    });
    // The trend is a plain div sized by inline `width`, not an <svg> — assert
    // the real markup instead of a chart-library element that doesn't exist.
    const bar = document.querySelector(".bg-primary.transition-all") as HTMLElement | null;
    expect(bar).not.toBeNull();
    expect(bar?.style.width).toBe("100%"); // the mock's single month is its own max
  });

  it("lists top clients with formatted amounts", async () => {
    mockBothEndpoints();

    render(<DashboardPage />);

    await waitFor(() => {
      expect(screen.getByText("Cliente A")).toBeInTheDocument();
      expect(screen.getByText("CL001")).toBeInTheDocument();
      expect(screen.getByText(/35\s?000,00\s?€/)).toBeInTheDocument();
    });
  });

  it("renders multiple headings across the KPI, hero and panel sections", async () => {
    mockBothEndpoints();

    render(<DashboardPage />);

    await waitFor(() => {
      expect(screen.getAllByRole("heading").length).toBeGreaterThan(1);
    });
  });
});
