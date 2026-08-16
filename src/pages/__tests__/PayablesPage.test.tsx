import React from "react";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import PayablesPage from "../PayablesPage";
import { createMockFetchResponse } from "../../__tests__/mocks/api";

const mockPayables = {
  payables: [
    { doc: "FC001", supplierCode: "FOR1", supplierName: "Fornecedor X", nif: "501234567", docDate: "2026-05-01", dueDate: "2026-05-25", daysOverdue: 12, totalAmount: 3000, currency: "EUR", paymentCondition: "30", status: "Vencido" },
    { doc: "FC002", supplierCode: "FOR2", supplierName: "Fornecedor Y", nif: null, docDate: "2026-06-01", dueDate: "2026-07-10", daysOverdue: -20, totalAmount: 1200, currency: "EUR", paymentCondition: "45", status: "Pendente" },
  ],
};

describe("PayablesPage", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (global.fetch as jest.Mock).mockClear();
  });

  it("renders the page title", async () => {
    (global.fetch as jest.Mock).mockResolvedValueOnce(createMockFetchResponse(mockPayables));
    render(<PayablesPage />);

    await waitFor(() => {
      expect(screen.getByText("Contas a Pagar")).toBeInTheDocument();
    });
  });

  it("displays loading state initially", () => {
    (global.fetch as jest.Mock).mockImplementationOnce(() => new Promise(() => {}));
    render(<PayablesPage />);

    expect(screen.getByText("A carregar contas a pagar...")).toBeInTheDocument();
  });

  it("fetches payables data on mount", async () => {
    (global.fetch as jest.Mock).mockResolvedValueOnce(createMockFetchResponse(mockPayables));
    render(<PayablesPage />);

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith(expect.stringContaining("/api/payables"));
    });
  });

  it("renders payables KPIs when data loads", async () => {
    (global.fetch as jest.Mock).mockResolvedValueOnce(createMockFetchResponse(mockPayables));
    render(<PayablesPage />);

    await waitFor(() => {
      // "Vencido" appears as a KPI label and as a status badge / tab.
      expect(screen.getAllByText("Total a Pagar").length).toBeGreaterThan(0);
      expect(screen.getAllByText("Vencido").length).toBeGreaterThan(0);
      expect(screen.getByText("A Vencer 30d")).toBeInTheDocument();
      expect(screen.getAllByText("Pendente").length).toBeGreaterThan(0);
      expect(screen.getByText("Prazo Médio")).toBeInTheDocument();
    });
  });

  it("renders the payables table with supplier rows", async () => {
    (global.fetch as jest.Mock).mockResolvedValueOnce(createMockFetchResponse(mockPayables));
    render(<PayablesPage />);

    await waitFor(() => {
      expect(screen.getByText("Fornecedor X")).toBeInTheDocument();
      expect(screen.getByText("Fornecedor Y")).toBeInTheDocument();
      expect(screen.getByText("FC001")).toBeInTheDocument();
    });
  });

  it("switches to the Vencidos tab to filter rows", async () => {
    (global.fetch as jest.Mock).mockResolvedValueOnce(createMockFetchResponse(mockPayables));
    render(<PayablesPage />);

    await userEvent.click(await screen.findByText("Vencidos"));

    // The Vencidos tab shows only the overdue payable; the tab label itself
    // also carries the word, so assert via the supplier instead.
    expect(screen.getByText("Fornecedor X")).toBeInTheDocument();
    expect(screen.queryByText("FC002")).not.toBeInTheDocument();
  });

  it("handles API errors by rendering empty defaults", async () => {
    (global.fetch as jest.Mock).mockRejectedValueOnce(new Error("API Error"));
    render(<PayablesPage />);

    await waitFor(() => {
      expect(screen.getByText("Contas a Pagar")).toBeInTheDocument();
      expect(screen.getByText("Total a Pagar")).toBeInTheDocument();
    });
  });
});