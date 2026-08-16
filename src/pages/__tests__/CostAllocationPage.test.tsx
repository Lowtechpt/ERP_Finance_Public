import React from "react";
import { render, screen } from "@testing-library/react";
import CostAllocationPage from "../CostAllocationPage";

describe("CostAllocationPage", () => {
  it("renders the page title", () => {
    render(<CostAllocationPage />);

    expect(screen.getByText("Análise de Custos por Departamento")).toBeInTheDocument();
  });

  it("renders allocation KPIs", () => {
    render(<CostAllocationPage />);

    expect(screen.getByText("Custo RH/Mês")).toBeInTheDocument();
    expect(screen.getByText("Receita Total")).toBeInTheDocument();
    expect(screen.getByText("Custo Operacional")).toBeInTheDocument();
    expect(screen.getByText("Margem Contribuição")).toBeInTheDocument();
    expect(screen.getByText("Margem %")).toBeInTheDocument();
  });

  it("renders a card for each department", () => {
    render(<CostAllocationPage />);

    expect(screen.getByText("Administração")).toBeInTheDocument();
    expect(screen.getByText("Produção")).toBeInTheDocument();
    expect(screen.getByText("Comercial")).toBeInTheDocument();
  });

  it("shows department financial fields", () => {
    render(<CostAllocationPage />);

    expect(screen.getAllByText("Pessoal:").length).toBeGreaterThan(0);
    expect(screen.getAllByText("Encargos:").length).toBeGreaterThan(0);
    expect(screen.getAllByText("Custo Total:").length).toBeGreaterThan(0);
    expect(screen.getAllByText("Receita:").length).toBeGreaterThan(0);
    expect(screen.getAllByText("Margem:").length).toBeGreaterThan(0);
  });

  it("does not perform any fetch on mount", () => {
    render(<CostAllocationPage />);

    expect(global.fetch).not.toHaveBeenCalled();
  });
});