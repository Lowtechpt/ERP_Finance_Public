import React from "react";
import { render, screen } from "@testing-library/react";
import { SectionHeader } from "../SectionHeader";

describe("SectionHeader", () => {
  it("renders title", () => {
    render(
      <SectionHeader
        category="Financeiro"
        title="Dashboard"
        description="Visão geral"
      />
    );

    expect(screen.getByText("Dashboard")).toBeInTheDocument();
  });

  it("renders category", () => {
    render(
      <SectionHeader
        category="Financeiro"
        title="Dashboard"
        description="Visão geral"
      />
    );

    expect(screen.getByText("Financeiro")).toBeInTheDocument();
  });

  it("renders description", () => {
    render(
      <SectionHeader
        category="Financeiro"
        title="Dashboard"
        description="Visão geral financeira da empresa"
      />
    );

    expect(screen.getByText("Visão geral financeira da empresa")).toBeInTheDocument();
  });

  it("renders with all props", () => {
    render(
      <SectionHeader
        category="Vendas"
        title="Relatório de Vendas"
        description="Análise detalhada de vendas"
      />
    );

    expect(screen.getByText("Vendas")).toBeInTheDocument();
    expect(screen.getByText("Relatório de Vendas")).toBeInTheDocument();
    expect(screen.getByText("Análise detalhada de vendas")).toBeInTheDocument();
  });

  it("applies proper styling classes", () => {
    const { container } = render(
      <SectionHeader
        category="Test"
        title="Title"
        description="Desc"
      />
    );

    const header = container.firstChild as HTMLElement;
    expect(header).toHaveClass("mb-5");
  });

  it("renders the category as an accented paragraph above the title", () => {
    render(
      <SectionHeader
        category="Financeiro"
        title="Title"
        description="Desc"
      />
    );

    const category = screen.getByText("Financeiro");
    expect(category.tagName).toBe("P");
    expect(category).toHaveClass("uppercase", "text-primary");
  });

  it("renders title as h1", () => {
    const { container } = render(
      <SectionHeader
        category="Cat"
        title="Main Title"
        description="Desc"
      />
    );

    const title = container.querySelector("h1");
    expect(title).toHaveTextContent("Main Title");
  });

  it("renders description as p", () => {
    render(
      <SectionHeader
        category="Cat"
        title="Title"
        description="Test description text"
      />
    );

    // Selected by text rather than by tag: the category is also a <p> and
    // comes first in the document.
    const desc = screen.getByText("Test description text");
    expect(desc.tagName).toBe("P");
    expect(desc).toHaveClass("text-sm", "text-muted-foreground");
  });

  it("handles long text", () => {
    const longDescription = "A".repeat(200);
    render(
      <SectionHeader
        category="Test"
        title="Title"
        description={longDescription}
      />
    );

    expect(screen.getByText(longDescription)).toBeInTheDocument();
  });

  it("handles special characters in text", () => {
    render(
      <SectionHeader
        category="Financeiro & Análise"
        title="Dashboard > Detalhes"
        description="Análise & Relatórios (2026)"
      />
    );

    expect(screen.getByText("Financeiro & Análise")).toBeInTheDocument();
    expect(screen.getByText("Dashboard > Detalhes")).toBeInTheDocument();
  });
});
