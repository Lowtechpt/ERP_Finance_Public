import React from "react";
import { render, screen } from "@testing-library/react";
import { AiInlineCharts } from "../AiInlineCharts";

const baseData = {
  customers: {
    customers: [
      { code: "C1", name: "Cliente A", currentDebt: 5000 },
      { code: "C2", name: "Cliente B", currentDebt: 1200 },
      { code: "C3", name: "Cliente C", currentDebt: 0 },
    ],
  },
  production: {
    summary: { totalPrevisto: 10000, totalReal: 9500, desvioTotal: -500 },
    orders: [
      {
        Id: "O1",
        OrdemFabrico: "OF001",
        Artigo: "ART-1",
        ArtigoDescricao: "Artigo Um",
        CustoMateriaisPrevisto: 2000,
        CustoTransformacaoPrevisto: 500,
        CustoMateriaisReal: 1800,
        CustoTransformacaoReal: 450,
      },
    ],
  },
  cashflow: {
    summary: { totalIncoming: 8000, totalOutgoing: 6000, projectedBalance: 2000 },
  },
};

describe("AiInlineCharts", () => {
  it("returns null for personnel questions", () => {
    const { container } = render(<AiInlineCharts question="Quais os salários do pessoal?" data={baseData} />);
    expect(container.firstChild).toBeNull();
  });

  it("returns null for generic cost questions without production keywords", () => {
    const { container } = render(<AiInlineCharts question="Qual é o custo total?" data={baseData} />);
    expect(container.firstChild).toBeNull();
  });

  it("renders the customers-to-collect table for collections questions", () => {
    render(<AiInlineCharts question="Que clientes devo cobrar primeiro?" data={baseData} />);

    expect(screen.getByText("Tabela automatica")).toBeInTheDocument();
    expect(screen.getByText("clientes a cobrar")).toBeInTheDocument();
    // Names appear in the table and in the chart bars.
    expect(screen.getAllByText("Cliente A").length).toBeGreaterThan(0);
    expect(screen.getAllByText("Cliente B").length).toBeGreaterThan(0);
    // Customer with zero debt is filtered out.
    expect(screen.queryByText("Cliente C")).not.toBeInTheDocument();
  });

  it("renders the production chart for production questions", () => {
    render(<AiInlineCharts question="Quais os custos de produção?" data={baseData} />);

    expect(screen.getByText("Grafico automatico")).toBeInTheDocument();
    expect(screen.getByText("custos de producao")).toBeInTheDocument();
    expect(screen.getByText("Previsto")).toBeInTheDocument();
    expect(screen.getByText("Real")).toBeInTheDocument();
    expect(screen.getByText("Desvio")).toBeInTheDocument();
    expect(screen.getByText("Artigo Um")).toBeInTheDocument();
  });

  it("renders the cashflow chart for cashflow questions", () => {
    render(<AiInlineCharts question="Resume o fluxo de caixa" data={baseData} />);

    expect(screen.getByText("Grafico automatico")).toBeInTheDocument();
    expect(screen.getByText("Entradas")).toBeInTheDocument();
    expect(screen.getByText("Saidas")).toBeInTheDocument();
    expect(screen.getByText("Saldo projetado")).toBeInTheDocument();
  });

  it("returns null when the matching data is missing", () => {
    const { container } = render(<AiInlineCharts question="Que clientes devo cobrar?" data={{}} />);
    expect(container.firstChild).toBeNull();
  });
});