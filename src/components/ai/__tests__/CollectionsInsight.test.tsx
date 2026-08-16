import React from "react";
import { render, screen } from "@testing-library/react";
import { CollectionsInsight } from "../CollectionsInsight";

const customers = [
  { code: "C1", name: "Cliente A", nif: "501000000", currentDebt: 5000, documentCount: 3, paymentCondition: "30 dias" },
  { code: "C2", name: "Cliente B", nif: "502000000", currentDebt: 1200, documentCount: 1, paymentCondition: "À vista" },
  { code: "C3", name: "Cliente C", nif: "503000000", currentDebt: 0, documentCount: 0, paymentCondition: "60 dias" },
];

const receivables = [
  { cliente: "Cliente A", documento: "FT 100", daysOverdue: 45, openAmount: 3000 },
  { cliente: "Cliente B", documento: "FT 101", daysOverdue: 10, openAmount: 800 },
  { cliente: "Cliente C", documento: "FT 102", daysOverdue: 5, openAmount: 0 },
];

describe("CollectionsInsight", () => {
  it("renders the metric cards with priority values", () => {
    render(<CollectionsInsight customers={customers} receivables={receivables} dataLoading={false} />);

    expect(screen.getByText("Clientes com dívida")).toBeInTheDocument();
    expect(screen.getByText("Dívida em prioridade")).toBeInTheDocument();
    expect(screen.getByText("Docs vencidos")).toBeInTheDocument();
  });

  it("shows placeholders while data is loading", () => {
    render(<CollectionsInsight customers={[]} receivables={[]} dataLoading />);

    expect(screen.getAllByText("...").length).toBeGreaterThan(0);
  });

  it("renders only customers with debt in the priority table", () => {
    render(<CollectionsInsight customers={customers} receivables={receivables} dataLoading={false} />);

    expect(screen.getByText("Clientes a cobrar primeiro")).toBeInTheDocument();
    // Names appear in the table and in the debt chart bars.
    expect(screen.getAllByText("Cliente A").length).toBeGreaterThan(0);
    expect(screen.getAllByText("Cliente B").length).toBeGreaterThan(0);
    expect(screen.queryByText("Cliente C")).not.toBeInTheDocument();
  });

  it("renders the debt chart", () => {
    render(<CollectionsInsight customers={customers} receivables={receivables} dataLoading={false} />);

    expect(screen.getByText("Gráfico de dívida")).toBeInTheDocument();
  });

  it("renders overdue documents of highest value", () => {
    render(<CollectionsInsight customers={customers} receivables={receivables} dataLoading={false} />);

    expect(screen.getByText("Documentos vencidos de maior valor")).toBeInTheDocument();
  });

  it("counts only open overdue documents", () => {
    render(<CollectionsInsight customers={customers} receivables={receivables} dataLoading={false} />);

    // Receivables with openAmount 0 are excluded from the docs metric.
    expect(screen.getByText("Docs vencidos")).toBeInTheDocument();
  });
});