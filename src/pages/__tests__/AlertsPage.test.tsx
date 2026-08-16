import React from "react";
import { render, screen, waitFor } from "@testing-library/react";
import AlertsPage from "../AlertsPage";
import { createMockFetchResponse } from "../../__tests__/mocks/api";

const mockAlertsData = {
  alerts: [
    { severity: "high", title: "Cobranças vencidas", message: "5 documentos vencidos" },
    { severity: "medium", title: "Stock baixo", message: "3 artigos abaixo do mínimo" },
    { severity: "low", title: "Orçamento", message: "Desvio de 2%" },
  ],
};

describe("AlertsPage", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (global.fetch as jest.Mock).mockClear();
  });

  it("renders the page title", async () => {
    (global.fetch as jest.Mock).mockResolvedValueOnce(createMockFetchResponse(mockAlertsData));
    render(<AlertsPage />);

    await waitFor(() => {
      expect(screen.getByText("Alertas Prioritários")).toBeInTheDocument();
    });
  });

  it("displays loading state initially", () => {
    (global.fetch as jest.Mock).mockImplementationOnce(() => new Promise(() => {}));
    render(<AlertsPage />);

    expect(screen.getByText("A carregar alertas...")).toBeInTheDocument();
  });

  it("fetches alerts from the API on mount", async () => {
    (global.fetch as jest.Mock).mockResolvedValueOnce(createMockFetchResponse(mockAlertsData));
    render(<AlertsPage />);

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith(expect.stringContaining("/api/alerts"));
    });
  });

  it("renders alert KPIs and list when data loads", async () => {
    (global.fetch as jest.Mock).mockResolvedValueOnce(createMockFetchResponse(mockAlertsData));
    render(<AlertsPage />);

    await waitFor(() => {
      expect(screen.getByText("Total alertas")).toBeInTheDocument();
      expect(screen.getByText("Críticos")).toBeInTheDocument();
      expect(screen.getByText("Cobranças vencidas")).toBeInTheDocument();
      expect(screen.getByText("Stock baixo")).toBeInTheDocument();
    });
  });

  it("shows empty message when there are no alerts", async () => {
    (global.fetch as jest.Mock).mockResolvedValueOnce(createMockFetchResponse({ alerts: [] }));
    render(<AlertsPage />);

    await waitFor(() => {
      expect(screen.getByText("Sem alertas ativos.")).toBeInTheDocument();
    });
  });

  it("handles API errors with an error state", async () => {
    (global.fetch as jest.Mock).mockRejectedValueOnce(new Error("API Error"));
    render(<AlertsPage />);

    await waitFor(() => {
      expect(screen.getByText("Erro ao carregar alertas")).toBeInTheDocument();
    });
  });

  it("maps severity to human labels", async () => {
    (global.fetch as jest.Mock).mockResolvedValueOnce(createMockFetchResponse(mockAlertsData));
    render(<AlertsPage />);

    await waitFor(() => {
      // "Atenção" and "Informativo" appear both as KPI labels and severity badges.
      expect(screen.getAllByText("Crítico").length).toBeGreaterThan(0);
      expect(screen.getAllByText("Atenção").length).toBeGreaterThan(0);
      expect(screen.getAllByText("Informativo").length).toBeGreaterThan(0);
    });
  });
});