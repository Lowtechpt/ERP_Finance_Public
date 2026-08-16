import React from "react";
import { render, screen, waitFor, fireEvent } from "@testing-library/react";
import IndustrialCostsPage from "../IndustrialCostsPage";
import { createMockFetchResponse } from "../../__tests__/mocks/api";

const mockCostAnalysis = {
  fixedCosts: [
    { Conta: "62", Descricao: "Rendas", total: 5000 },
    { Conta: "63", Descricao: "Seguros", total: 800 },
  ],
  variableCosts: [
    { Conta: "61", Descricao: "Matéria-prima", total: 22000 },
  ],
  energyCosts: [
    { Conta: "622", Descricao: "Eletricidade", total: 3200 },
  ],
  waste: { totalOrdens: 50, ordensRefugo: 6, custoRefugo: 1500, taxaRefugo: 12 },
  suppliers: [
    { code: "FOR001", name: "Fornecedor X", docCount: 8, totalCompras: 18000, prazoMedio: 45.5 },
  ],
};

describe("IndustrialCostsPage", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (global.fetch as jest.Mock).mockClear();
  });

  it("displays loading state initially", () => {
    (global.fetch as jest.Mock).mockImplementationOnce(() => new Promise(() => {}));
    render(<IndustrialCostsPage />);

    expect(screen.getByText("A carregar dados...")).toBeInTheDocument();
  });

  it("fetches cost analysis data on mount", async () => {
    (global.fetch as jest.Mock).mockResolvedValueOnce(createMockFetchResponse(mockCostAnalysis));
    render(<IndustrialCostsPage />);

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith(expect.stringContaining("/api/cost-analysis"));
    });
  });

  it("renders cost KPIs when data loads", async () => {
    (global.fetch as jest.Mock).mockResolvedValueOnce(createMockFetchResponse(mockCostAnalysis));
    render(<IndustrialCostsPage />);

    await waitFor(() => {
      // "Custos Fixos", "Custos Variáveis", "Energia" and "Fornecedores" also
      // appear as tab labels (with icons), so accept multiple matches.
      expect(screen.getAllByText("Custos Fixos").length).toBeGreaterThan(0);
      expect(screen.getAllByText("Custos Variáveis").length).toBeGreaterThan(0);
      expect(screen.getAllByText("Energia").length).toBeGreaterThan(0);
      expect(screen.getAllByText("Fornecedores").length).toBeGreaterThan(0);
      expect(screen.getAllByText("Taxa de Refugo").length).toBeGreaterThan(0);
    });
  });

  it("renders fixed cost rows in the default tab", async () => {
    (global.fetch as jest.Mock).mockResolvedValueOnce(createMockFetchResponse(mockCostAnalysis));
    render(<IndustrialCostsPage />);

    await waitFor(() => {
      expect(screen.getByText("Rendas")).toBeInTheDocument();
      expect(screen.getByText("Seguros")).toBeInTheDocument();
    });
  });

  it("switches to the waste tab and shows waste metrics", async () => {
    (global.fetch as jest.Mock).mockResolvedValueOnce(createMockFetchResponse(mockCostAnalysis));
    render(<IndustrialCostsPage />);

    await waitFor(() => {
      expect(screen.getByText("Rendas")).toBeInTheDocument();
    });

    fireEvent.click(screen.getByText(/Refugo\/Retrabalho/));

    await waitFor(() => {
      expect(screen.getByText("Total Ordens")).toBeInTheDocument();
      expect(screen.getByText("Ordens Refugo")).toBeInTheDocument();
      expect(screen.getByText("Custo Refugo")).toBeInTheDocument();
      expect(screen.getByText("Taxa Refugo")).toBeInTheDocument();
    });
  });

  it("switches to the suppliers tab and shows supplier rows", async () => {
    (global.fetch as jest.Mock).mockResolvedValueOnce(createMockFetchResponse(mockCostAnalysis));
    render(<IndustrialCostsPage />);

    await waitFor(() => {
      expect(screen.getByText("Rendas")).toBeInTheDocument();
    });

    fireEvent.click(screen.getByRole("button", { name: /Fornecedores/ }));

    await waitFor(() => {
      expect(screen.getByText("Fornecedor X")).toBeInTheDocument();
      expect(screen.getByText("FOR001")).toBeInTheDocument();
      expect(screen.getByText("45.5 dias")).toBeInTheDocument();
    });
  });

  it("shows the empty state when no data is available", async () => {
    (global.fetch as jest.Mock).mockResolvedValueOnce(createMockFetchResponse(null));
    render(<IndustrialCostsPage />);

    await waitFor(() => {
      expect(screen.getByText("Sem dados")).toBeInTheDocument();
      expect(screen.getByText("Dados de custos não disponíveis.")).toBeInTheDocument();
    });
  });
});