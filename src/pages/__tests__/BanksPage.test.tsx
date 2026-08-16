import React from "react";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import BanksPage from "../BanksPage";
import { createMockFetchResponse } from "../../__tests__/mocks/api";

const mockBanksData = {
  accounts: [
    { Conta: "PT501", descBanco: "Banco A", banco: "BANCOA", Moeda: "EUR", TipoConta: 0, limite: 10000 },
    { Conta: "PT502", descBanco: "Banco B", banco: "BANCOB", Moeda: "EUR", TipoConta: 2, limite: 0 },
  ],
  movements: [
    { doc: "TRX1", TipoDoc: "Pag", entidade: "Fornecedor X", TipoEntidade: "FOR", debit: 500, credit: 0, contaOrigem: "PT501", contaDestino: "", Moeda: "EUR", obs: "Pagamento" },
    { doc: "TRX2", TipoDoc: "Rec", entidade: "Cliente Y", TipoEntidade: "CLI", debit: 0, credit: 1200, contaOrigem: "", contaDestino: "PT501", Moeda: "EUR", obs: "" },
  ],
};

describe("BanksPage", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (global.fetch as jest.Mock).mockClear();
  });

  it("renders the page title", async () => {
    (global.fetch as jest.Mock).mockResolvedValueOnce(createMockFetchResponse(mockBanksData));
    render(<BanksPage />);

    await waitFor(() => {
      expect(screen.getByText("Contas bancárias")).toBeInTheDocument();
    });
  });

  it("displays loading state initially", () => {
    (global.fetch as jest.Mock).mockImplementationOnce(() => new Promise(() => {}));
    render(<BanksPage />);

    expect(screen.getByText("A carregar dados bancários...")).toBeInTheDocument();
  });

  it("fetches banks data on mount", async () => {
    (global.fetch as jest.Mock).mockResolvedValueOnce(createMockFetchResponse(mockBanksData));
    render(<BanksPage />);

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith(expect.stringContaining("/api/banks"));
    });
  });

  it("renders accounts and movements when data loads", async () => {
    (global.fetch as jest.Mock).mockResolvedValueOnce(createMockFetchResponse(mockBanksData));
    render(<BanksPage />);

    await waitFor(() => {
      // "Contas" is both a KPI label and a section heading.
      expect(screen.getAllByText("Contas").length).toBeGreaterThan(0);
      // PT501 appears in the account card and as the movement origin account.
      expect(screen.getAllByText("PT501").length).toBeGreaterThan(0);
      expect(screen.getByText("PT502")).toBeInTheDocument();
      expect(screen.getByText("Movimentos de tesouraria")).toBeInTheDocument();
      expect(screen.getByText("TRX1")).toBeInTheDocument();
    });
  });

  it("shows fallback messages when no accounts or movements exist", async () => {
    (global.fetch as jest.Mock).mockResolvedValueOnce(createMockFetchResponse({ accounts: [], movements: [] }));
    render(<BanksPage />);

    await waitFor(() => {
      expect(screen.getByText("Nenhuma conta bancaria disponivel.")).toBeInTheDocument();
      expect(screen.getByText("Nenhum movimento encontrado.")).toBeInTheDocument();
    });
  });

  it("filters movements by selected account", async () => {
    (global.fetch as jest.Mock).mockResolvedValueOnce(createMockFetchResponse(mockBanksData));
    render(<BanksPage />);

    await waitFor(() => {
      expect(screen.getAllByText("PT501").length).toBeGreaterThan(0);
    });

    // Click the account card (the first PT501 match) to filter movements.
    await userEvent.click(screen.getAllByText("PT501")[0]);
    expect(screen.getByText(/conta PT501/)).toBeInTheDocument();
  });

  it("handles API errors by falling back to empty state", async () => {
    (global.fetch as jest.Mock).mockRejectedValueOnce(new Error("API Error"));
    render(<BanksPage />);

    await waitFor(() => {
      expect(screen.getByText("Sem dados bancários")).toBeInTheDocument();
    });
  });
});