import React from "react";
import { render, screen } from "@testing-library/react";
import { PersonnelInsight } from "../PersonnelInsight";

const personnelData = {
  personnel: {
    totalContabilidade: 15000,
    contabilidade: [
      { Conta: "6421", Descricao: "Vencimentos", total: 12000 },
      { Conta: "6452", Descricao: "Encargos", total: 3000 },
    ],
    funcionarios: {
      totalFuncionarios: 10,
      ativos: 8,
      massaSalarialMensal: 12000,
      massaSalarialAnual: 144000,
    },
    detalhe: [
      { Codigo: "F1", Nome: "Funcionário Um", Categoria: "Produção", Situacao: "Ativo", vencimento: 1500 },
    ],
    demoSupplement: {
      isDemo: true,
      note: "Dados gerados para teste.",
      missingRealDimensions: ["Centros de custo"],
      departments: [{ department: "Produção", costCenter: "CC1", amount: 6000, percent: 40, fte: 4 }],
      monthlyTrend: [{ month: "Jun", payrollBase: 10000, employerCharges: 2000, amount: 12000 }],
      productionLabor: [{ order: "OF001", article: "ART-1", hours: 20, costPerHour: 15, directLabor: 300 }],
    },
  },
  dre: { vendasLiquidas: 50000, custosOperacionais: 30000, ebitda: -5000 },
};

describe("PersonnelInsight", () => {
  it("renders the executive conclusion headline", () => {
    render(<PersonnelInsight data={personnelData} dataLoading={false} />);

    expect(screen.getByText("Conclusao executiva")).toBeInTheDocument();
    expect(screen.getByText(/Custo com pessoal de/)).toBeInTheDocument();
  });

  it("renders the financial metric cards", () => {
    render(<PersonnelInsight data={personnelData} dataLoading={false} />);

    expect(screen.getByText("Custo contabilistico pessoal")).toBeInTheDocument();
    expect(screen.getByText("Funcionarios considerados")).toBeInTheDocument();
    expect(screen.getByText("Massa salarial mensal")).toBeInTheDocument();
    expect(screen.getByText("Custo medio por ativo")).toBeInTheDocument();
    expect(screen.getByText("Massa salarial anual estimada")).toBeInTheDocument();
    expect(screen.getByText("Peso nas vendas liquidas")).toBeInTheDocument();
    expect(screen.getByText("EBITDA")).toBeInTheDocument();
    expect(screen.getByText("Diferenca vs massa anual")).toBeInTheDocument();
  });

  it("renders the accounting breakdown table", () => {
    render(<PersonnelInsight data={personnelData} dataLoading={false} />);

    expect(screen.getByText("Breakdown contabilistico por conta")).toBeInTheDocument();
    // Account 6421 maps to the "Vencimentos" description.
    expect(screen.getByText("Remuneracoes do Pessoal - Vencimentos")).toBeInTheDocument();
    expect(screen.getByText("Encargos sobre Remuneracoes - Pessoal")).toBeInTheDocument();
  });

  it("renders the top base salaries table", () => {
    render(<PersonnelInsight data={personnelData} dataLoading={false} />);

    expect(screen.getByText("Top vencimentos base")).toBeInTheDocument();
    expect(screen.getByText("Funcionário Um")).toBeInTheDocument();
  });

  it("shows the demo supplement sections when present", () => {
    render(<PersonnelInsight data={personnelData} dataLoading={false} />);

    expect(screen.getByText("Dados suplementares de teste")).toBeInTheDocument();
    expect(screen.getByText("Custos por departamento / centro de custo")).toBeInTheDocument();
    expect(screen.getByText("Mapa mensal e encargos")).toBeInTheDocument();
    expect(screen.getByText("Mao de obra imputada a ordens")).toBeInTheDocument();
  });

  it("shows the CFO reading section", () => {
    render(<PersonnelInsight data={personnelData} dataLoading={false} />);

    expect(screen.getByText("Leitura CFO")).toBeInTheDocument();
  });

  it("handles missing data gracefully", () => {
    render(<PersonnelInsight data={{}} dataLoading={false} />);

    expect(screen.getByText("Sem contas contabilisticas de pessoal no periodo analisado.")).toBeInTheDocument();
    expect(screen.getByText("Sem detalhe de funcionarios disponivel.")).toBeInTheDocument();
    expect(screen.getByText("Sem dados suplementares disponiveis. As dimensoes analiticas dependem da configuracao do PRIMAVERA.")).toBeInTheDocument();
  });
});