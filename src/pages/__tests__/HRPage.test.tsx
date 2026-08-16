import React from "react";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import HRPage from "../HRPage";
import { createMockFetchResponse } from "../../__tests__/mocks/api";

const mockHR = {
  funcionarios: { totalFuncionarios: 12, ativos: 11, massaSalarialMensal: 52000 },
  totalContabilidade: 640000,
};

describe("HRPage", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (global.fetch as jest.Mock).mockClear();
  });

  it("renders the page title", async () => {
    (global.fetch as jest.Mock).mockResolvedValueOnce(createMockFetchResponse(mockHR));
    render(<HRPage />);

    await waitFor(() => {
      expect(screen.getByText("Gestão de Recursos Humanos")).toBeInTheDocument();
    });
  });

  it("displays loading state initially", () => {
    (global.fetch as jest.Mock).mockImplementationOnce(() => new Promise(() => {}));
    render(<HRPage />);

    expect(screen.getByText("A carregar dados de RH...")).toBeInTheDocument();
  });

  it("fetches HR data on mount", async () => {
    (global.fetch as jest.Mock).mockResolvedValueOnce(createMockFetchResponse(mockHR));
    render(<HRPage />);

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith(expect.stringContaining("/api/hr-costs"));
    });
  });

  it("renders HR KPIs when data loads", async () => {
    (global.fetch as jest.Mock).mockResolvedValueOnce(createMockFetchResponse(mockHR));
    render(<HRPage />);

    await waitFor(() => {
      // KPI labels are duplicated in the tab panels below.
      expect(screen.getAllByText("Total Funcionários").length).toBeGreaterThan(0);
      expect(screen.getAllByText("Ativos").length).toBeGreaterThan(0);
      expect(screen.getAllByText("Massa Salarial").length).toBeGreaterThan(0);
      expect(screen.getAllByText("Taxa Absentismo").length).toBeGreaterThan(0);
      expect(screen.getAllByText("Turnover Anual").length).toBeGreaterThan(0);
    });
  });

  it("shows the Pessoal tab by default", async () => {
    (global.fetch as jest.Mock).mockResolvedValueOnce(createMockFetchResponse(mockHR));
    render(<HRPage />);

    await waitFor(() => {
      expect(screen.getByText("Total 12m")).toBeInTheDocument();
      expect(screen.getByText("Índice Sinistralidade")).toBeInTheDocument();
    });
  });

  it("switches to the Absentismo tab", async () => {
    (global.fetch as jest.Mock).mockResolvedValueOnce(createMockFetchResponse(mockHR));
    render(<HRPage />);

    await userEvent.click(await screen.findByText("📋 Absentismo"));

    expect(screen.getByText("Absentismo por Departamento")).toBeInTheDocument();
    expect(screen.getByText("Taxa Média")).toBeInTheDocument();
  });

  it("switches to the Turnover tab", async () => {
    (global.fetch as jest.Mock).mockResolvedValueOnce(createMockFetchResponse(mockHR));
    render(<HRPage />);

    await userEvent.click(await screen.findByText("📉 Turnover"));

    expect(screen.getByText("Turnover por Departamento")).toBeInTheDocument();
  });

  it("handles errors with an error empty state", async () => {
    (global.fetch as jest.Mock).mockRejectedValueOnce(new Error("API Error"));
    render(<HRPage />);

    await waitFor(() => {
      expect(screen.getByText("Erro ao carregar RH")).toBeInTheDocument();
    });
  });

  it("shows empty state when no data is returned", async () => {
    (global.fetch as jest.Mock).mockResolvedValueOnce(createMockFetchResponse(null));
    render(<HRPage />);

    await waitFor(() => {
      expect(screen.getByText("Sem dados de RH")).toBeInTheDocument();
    });
  });
});