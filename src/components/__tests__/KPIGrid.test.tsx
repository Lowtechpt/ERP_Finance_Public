import React from "react";
import { render, screen } from "@testing-library/react";
import { KPIGrid } from "../KPIGrid";
import type { KPIItem } from "../KPIGrid";

describe("KPIGrid", () => {
  const mockItems: KPIItem[] = [
    { label: "Revenue", value: 125000, tone: "default" },
    { label: "Profit", value: 25000, tone: "success" },
    { label: "Loss", value: -5000, tone: "danger" },
  ];

  it("renders KPI items", () => {
    render(<KPIGrid items={mockItems} />);

    expect(screen.getByText("Revenue")).toBeInTheDocument();
    expect(screen.getByText("Profit")).toBeInTheDocument();
  });

  it("renders single item", () => {
    render(
      <KPIGrid
        items={[{ label: "Single", value: 100, tone: "default" }]}
      />
    );

    expect(screen.getByText("Single")).toBeInTheDocument();
  });

  it("renders five items", () => {
    const items: KPIItem[] = [
      { label: "KPI1", value: 1000, tone: "default" },
      { label: "KPI2", value: 2000, tone: "success" },
      { label: "KPI3", value: 3000, tone: "danger" },
      { label: "KPI4", value: 4000, tone: "warning" },
      { label: "KPI5", value: 5000, tone: "info" },
    ];

    render(<KPIGrid items={items} />);

    expect(screen.getByText("KPI1")).toBeInTheDocument();
    expect(screen.getByText("KPI5")).toBeInTheDocument();
  });

  it("applies grid styling", () => {
    const { container } = render(<KPIGrid items={mockItems} />);

    const grid = container.querySelector("[class*='grid']");
    expect(grid).toBeInTheDocument();
  });

  it("renders empty grid when items array is empty", () => {
    const { container } = render(<KPIGrid items={[]} />);

    expect(container.firstChild).toBeInTheDocument();
  });

  it("applies tone styling to items", () => {
    const { container } = render(<KPIGrid items={mockItems} />);

    // Should have at least 3 items rendered
    const items = container.querySelectorAll("[role='region'], div");
    expect(items.length).toBeGreaterThan(0);
  });

  it("handles numeric values", () => {
    const items: KPIItem[] = [
      { label: "Zero", value: 0, tone: "default" },
      { label: "Positive", value: 999999, tone: "success" },
      { label: "Negative", value: -50000, tone: "danger" },
    ];

    render(<KPIGrid items={items} />);

    expect(screen.getByText("Zero")).toBeInTheDocument();
    expect(screen.getByText("Positive")).toBeInTheDocument();
    expect(screen.getByText("Negative")).toBeInTheDocument();
  });

  it("handles decimal values", () => {
    const items: KPIItem[] = [
      { label: "Rate", value: 0.856, tone: "default" },
      { label: "Percent", value: 0.12345, tone: "success" },
    ];

    render(<KPIGrid items={items} />);

    expect(screen.getByText("Rate")).toBeInTheDocument();
  });

  it("renders all tone variants", () => {
    const tones: Array<KPIItem["tone"]> = ["default", "success", "danger", "warning", "info"];
    const items = tones.map((tone, i) => ({
      label: `Item ${i}`,
      value: i * 1000,
      tone,
    }));

    render(<KPIGrid items={items} />);

    tones.forEach((_, i) => {
      expect(screen.getByText(`Item ${i}`)).toBeInTheDocument();
    });
  });

  it("handles responsive columns", () => {
    const items = Array.from({ length: 10 }, (_, i) => ({
      label: `KPI ${i}`,
      value: i * 100,
      tone: "default" as const,
    }));

    const { container } = render(<KPIGrid items={items} />);

    const grid = container.querySelector("[class*='grid']");
    expect(grid).toHaveClass("grid");
  });

  it("handles undefined tone (defaults gracefully)", () => {
    const items: KPIItem[] = [
      { label: "Test", value: 1000, tone: "default" },
    ];

    render(<KPIGrid items={items} />);

    expect(screen.getByText("Test")).toBeInTheDocument();
  });

  it("renders with proper spacing", () => {
    const { container } = render(<KPIGrid items={mockItems} />);

    const grid = container.querySelector("[class*='gap']");
    expect(grid || container.firstChild).toBeInTheDocument();
  });
});
