import React from "react";
import { render, screen } from "@testing-library/react";
import { AlertCircle } from "lucide-react";
import { PageEmptyState } from "../PageEmptyState";

describe("PageEmptyState", () => {
  it("renders the default title and description", () => {
    render(<PageEmptyState />);

    expect(screen.getByRole("heading", { name: "Sem dados" })).toBeInTheDocument();
    expect(screen.getByText("Nenhum documento encontrado neste período")).toBeInTheDocument();
  });

  it("renders a custom title and description", () => {
    render(<PageEmptyState title="Erro ao carregar" description="Não foi possível obter os dados" />);

    expect(screen.getByRole("heading", { name: "Erro ao carregar" })).toBeInTheDocument();
    expect(screen.getByText("Não foi possível obter os dados")).toBeInTheDocument();
  });

  it("renders the icon when provided", () => {
    const { container } = render(<PageEmptyState icon={AlertCircle} title="Sem dados" />);

    expect(container.querySelector("svg")).toBeInTheDocument();
  });

  it("does not render an icon wrapper when no icon is provided", () => {
    const { container } = render(<PageEmptyState title="Sem dados" />);

    expect(container.querySelector("svg")).not.toBeInTheDocument();
  });

  it("renders the title as a heading for accessibility", () => {
    render(<PageEmptyState title="Sem dados de produção" description="Nenhum dado disponível" />);

    expect(screen.getByRole("heading", { name: "Sem dados de produção" })).toBeInTheDocument();
  });

  it("is wrapped in a page shell", () => {
    const { container } = render(<PageEmptyState title="Sem dados" />);

    expect(container.querySelector(".w-full")).toBeInTheDocument();
  });
});