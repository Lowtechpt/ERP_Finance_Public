import React from "react";
import { render, screen, waitFor } from "@testing-library/react";
import CreditRiskPage from "../CreditRiskPage";
import { createMockFetchResponse } from "../../__tests__/mocks/api";

describe("CreditRiskPage", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (global.fetch as jest.Mock).mockClear();
  });

  it("displays loading state initially", () => {
    (global.fetch as jest.Mock).mockImplementationOnce(() => new Promise(() => {}));
    render(<CreditRiskPage />);

    expect(screen.getByText("Analisando risco...")).toBeInTheDocument();
  });

  it("posts to the AI chat endpoint on mount", async () => {
    (global.fetch as jest.Mock).mockResolvedValueOnce(createMockFetchResponse({ reply: "Risco identificado." }));
    render(<CreditRiskPage />);

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining("/api/ai/chat"),
        expect.objectContaining({ method: "POST" })
      );
    });
  });

  it("renders the AI analysis reply", async () => {
    (global.fetch as jest.Mock).mockResolvedValueOnce(createMockFetchResponse({ reply: "Cliente PT5001 apresenta risco elevado." }));
    render(<CreditRiskPage />);

    await waitFor(() => {
      expect(screen.getByText("Cliente PT5001 apresenta risco elevado.")).toBeInTheDocument();
      expect(screen.getByText("Análise de risco")).toBeInTheDocument();
    });
  });

  it("renders KPI items with the AI metadata", async () => {
    (global.fetch as jest.Mock).mockResolvedValueOnce(createMockFetchResponse({ reply: "ok" }));
    render(<CreditRiskPage />);

    await waitFor(() => {
      expect(screen.getByText("Método")).toBeInTheDocument();
      expect(screen.getByText("IA Gemini")).toBeInTheDocument();
      expect(screen.getByText("Estado")).toBeInTheDocument();
      expect(screen.getByText("Pronto")).toBeInTheDocument();
    });
  });

  it("shows the fallback text when the reply is empty", async () => {
    (global.fetch as jest.Mock).mockResolvedValueOnce(createMockFetchResponse({ reply: "" }));
    render(<CreditRiskPage />);

    await waitFor(() => {
      expect(screen.getByText("Sem resposta")).toBeInTheDocument();
    });
  });

  it("shows the error message when the AI request fails", async () => {
    (global.fetch as jest.Mock).mockRejectedValueOnce(new Error("API Error"));
    render(<CreditRiskPage />);

    await waitFor(() => {
      expect(screen.getByText("Erro: API Error")).toBeInTheDocument();
    });
  });
});