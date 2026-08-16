import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import AlertThresholdsPage from "../AlertThresholdsPage";

describe("AlertThresholdsPage", () => {
  it("renders the page title", () => {
    render(<AlertThresholdsPage />);

    expect(screen.getByText("Configuração de Alertas")).toBeInTheDocument();
  });

  it("renders the threshold KPIs with default values", () => {
    render(<AlertThresholdsPage />);

    expect(screen.getByText("Margem mínima")).toBeInTheDocument();
    expect(screen.getByText("15%")).toBeInTheDocument();
    expect(screen.getByText("Dias atraso crítico")).toBeInTheDocument();
    expect(screen.getByText("30 dias")).toBeInTheDocument();
    expect(screen.getByText("Saldo mínimo")).toBeInTheDocument();
    expect(screen.getByText("Custo máximo")).toBeInTheDocument();
    expect(screen.getByText("Configurável")).toBeInTheDocument();
  });

  it("renders the four threshold inputs", () => {
    render(<AlertThresholdsPage />);

    // The labels are not associated with the inputs (no htmlFor), so select by
    // role. The inputs are ordered: margemMinima, diasAtrasoCritico, saldoBaixo, custoMaximo.
    const inputs = screen.getAllByRole("spinbutton");
    expect(inputs).toHaveLength(4);
    expect((inputs[0] as HTMLInputElement).value).toBe("15");
    expect((inputs[1] as HTMLInputElement).value).toBe("30");
    expect((inputs[2] as HTMLInputElement).value).toBe("10000");
    expect((inputs[3] as HTMLInputElement).value).toBe("5000");
  });

  it("updates the KPI when a threshold input changes", () => {
    render(<AlertThresholdsPage />);

    const input = screen.getAllByRole("spinbutton")[0] as HTMLInputElement;
    fireEvent.change(input, { target: { value: "20" } });

    expect(input.value).toBe("20");
    expect(screen.getByText("20%")).toBeInTheDocument();
  });

  it("updates the currency KPI when the minimum balance changes", () => {
    render(<AlertThresholdsPage />);

    const input = screen.getAllByRole("spinbutton")[2] as HTMLInputElement;
    fireEvent.change(input, { target: { value: "20000" } });

    expect(screen.getByText("20 000 €")).toBeInTheDocument();
  });

  it("renders the save button", () => {
    render(<AlertThresholdsPage />);

    expect(screen.getByText("Guardar Thresholds")).toBeInTheDocument();
  });

  it("does not perform any fetch on mount", () => {
    render(<AlertThresholdsPage />);

    expect(global.fetch).not.toHaveBeenCalled();
  });
});