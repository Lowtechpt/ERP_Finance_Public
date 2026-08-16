import React from "react";
import { render, screen, waitFor } from "@testing-library/react";
import RootCauseAnalysisPage from "../RootCauseAnalysisPage";
import { createMockFetchResponse } from "../../__tests__/mocks/api";

describe("RootCauseAnalysisPage", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (global.fetch as jest.Mock).mockClear();
  });

  it("displays loading state initially", () => {
    (global.fetch as jest.Mock).mockImplementationOnce(() => new Promise(() => {}));
    render(<RootCauseAnalysisPage />);

    expect(screen.getByText("Analisando causas...")).toBeInTheDocument();
  });

  it("posts to the AI chat endpoint on mount", async () => {
    (global.fetch as jest.Mock).mockResolvedValueOnce(createMockFetchResponse({ reply: "Causas identificadas." }));
    render(<RootCauseAnalysisPage />);

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining("/api/ai/chat"),
        expect.objectContaining({ method: "POST" })
      );
    });
  });

  it("renders the root cause analysis reply", async () => {
    (global.fetch as jest.Mock).mockResolvedValueOnce(createMockFetchResponse({ reply: "O desvio deve-se ao custo da matéria-prima." }));
    render(<RootCauseAnalysisPage />);

    await waitFor(() => {
      expect(screen.getByText("O desvio deve-se ao custo da matéria-prima.")).toBeInTheDocument();
      expect(screen.getByText("Análise de Causas Raiz")).toBeInTheDocument();
    });
  });

  it("renders KPI items with the AI metadata", async () => {
    (global.fetch as jest.Mock).mockResolvedValueOnce(createMockFetchResponse({ reply: "ok" }));
    render(<RootCauseAnalysisPage />);

    await waitFor(() => {
      expect(screen.getByText("Método")).toBeInTheDocument();
      expect(screen.getByText("IA Gemini")).toBeInTheDocument();
      expect(screen.getByText("Foco")).toBeInTheDocument();
      expect(screen.getByText("Margens e custos")).toBeInTheDocument();
    });
  });

  it("shows the fallback text when the reply is empty", async () => {
    (global.fetch as jest.Mock).mockResolvedValueOnce(createMockFetchResponse({ reply: "" }));
    render(<RootCauseAnalysisPage />);

    await waitFor(() => {
      expect(screen.getByText("Sem resposta")).toBeInTheDocument();
    });
  });

  it("shows the error message when the AI request fails", async () => {
    (global.fetch as jest.Mock).mockRejectedValueOnce(new Error("API Error"));
    render(<RootCauseAnalysisPage />);

    await waitFor(() => {
      expect(screen.getByText("Erro: API Error")).toBeInTheDocument();
    });
  });
});