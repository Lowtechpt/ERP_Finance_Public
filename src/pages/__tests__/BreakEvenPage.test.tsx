import React from "react";
import { render, screen, waitFor } from "@testing-library/react";
import BreakEvenPage from "../BreakEvenPage";
import { createMockFetchResponse } from "../../__tests__/mocks/api";

const mockBreakEven = {
  breakeven: 125000,
  beUnidades: 65,
  margemPct: 35.5,
  custosFixos: 43750,
};

describe("BreakEvenPage", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (global.fetch as jest.Mock).mockClear();
  });

  it("renders the page title", async () => {
    (global.fetch as jest.Mock).mockResolvedValueOnce(createMockFetchResponse(mockBreakEven));
    render(<BreakEvenPage />);

    await waitFor(() => {
      expect(screen.getByText("Ponto de Equilíbrio")).toBeInTheDocument();
    });
  });

  it("displays loading state initially", () => {
    (global.fetch as jest.Mock).mockImplementationOnce(() => new Promise(() => {}));
    render(<BreakEvenPage />);

    expect(screen.getByText("A carregar dados...")).toBeInTheDocument();
  });

  it("fetches break-even data on mount", async () => {
    (global.fetch as jest.Mock).mockResolvedValueOnce(createMockFetchResponse(mockBreakEven));
    render(<BreakEvenPage />);

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith(expect.stringContaining("/api/breakeven"));
    });
  });

  it("renders KPIs when data loads", async () => {
    (global.fetch as jest.Mock).mockResolvedValueOnce(createMockFetchResponse(mockBreakEven));
    render(<BreakEvenPage />);

    await waitFor(() => {
      // KPI labels are duplicated in the indicator panel below.
      expect(screen.getAllByText("Break-Even").length).toBeGreaterThan(0);
      expect(screen.getAllByText("Margem Contribuição").length).toBeGreaterThan(0);
      expect(screen.getAllByText("Custos Fixos").length).toBeGreaterThan(0);
    });
  });

  it("shows 'Cobre custos' when margin is positive", async () => {
    (global.fetch as jest.Mock).mockResolvedValueOnce(createMockFetchResponse(mockBreakEven));
    render(<BreakEvenPage />);

    await waitFor(() => {
      expect(screen.getByText("Cobre custos")).toBeInTheDocument();
    });
  });

  it("shows 'Atenção' when margin is not positive", async () => {
    (global.fetch as jest.Mock).mockResolvedValueOnce(
      createMockFetchResponse({ ...mockBreakEven, margemPct: -5 })
    );
    render(<BreakEvenPage />);

    await waitFor(() => {
      expect(screen.getByText("Atenção")).toBeInTheDocument();
    });
  });

  it("renders the equilibrium indicators panel", async () => {
    (global.fetch as jest.Mock).mockResolvedValueOnce(createMockFetchResponse(mockBreakEven));
    render(<BreakEvenPage />);

    await waitFor(() => {
      expect(screen.getByText("Indicadores de equilíbrio")).toBeInTheDocument();
    });
  });

  it("handles errors with an error empty state", async () => {
    (global.fetch as jest.Mock).mockRejectedValueOnce(new Error("API Error"));
    render(<BreakEvenPage />);

    await waitFor(() => {
      expect(screen.getByText("Erro")).toBeInTheDocument();
    });
  });

  it("shows empty state when no data returned", async () => {
    (global.fetch as jest.Mock).mockResolvedValueOnce(createMockFetchResponse(null));
    render(<BreakEvenPage />);

    await waitFor(() => {
      expect(screen.getByText("Sem dados")).toBeInTheDocument();
    });
  });
});