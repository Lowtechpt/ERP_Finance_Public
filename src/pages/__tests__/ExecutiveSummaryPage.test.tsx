import React from "react";
import { render, screen, waitFor } from "@testing-library/react";
import ExecutiveSummaryPage from "../ExecutiveSummaryPage";
import { createMockFetchResponse } from "../../__tests__/mocks/api";

describe("ExecutiveSummaryPage", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (global.fetch as jest.Mock).mockClear();
  });

  it("displays loading state initially", () => {
    (global.fetch as jest.Mock).mockImplementationOnce(() => new Promise(() => {}));
    render(<ExecutiveSummaryPage />);

    expect(screen.getByText("A carregar dados...")).toBeInTheDocument();
  });

  it("posts to the AI chat endpoint on mount", async () => {
    (global.fetch as jest.Mock).mockResolvedValueOnce(createMockFetchResponse({ reply: "Sumário gerado." }));
    render(<ExecutiveSummaryPage />);

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining("/api/ai/chat"),
        expect.objectContaining({ method: "POST" })
      );
    });
  });

  it("renders the executive summary reply", async () => {
    (global.fetch as jest.Mock).mockResolvedValueOnce(createMockFetchResponse({ reply: "A empresa está saudável financeiramente." }));
    render(<ExecutiveSummaryPage />);

    await waitFor(() => {
      expect(screen.getByText("A empresa está saudável financeiramente.")).toBeInTheDocument();
      expect(screen.getByText("Análise Executiva")).toBeInTheDocument();
    });
  });

  it("renders KPI items with the AI metadata", async () => {
    (global.fetch as jest.Mock).mockResolvedValueOnce(createMockFetchResponse({ reply: "ok" }));
    render(<ExecutiveSummaryPage />);

    await waitFor(() => {
      expect(screen.getByText("Status")).toBeInTheDocument();
      expect(screen.getByText("Pronto")).toBeInTheDocument();
      expect(screen.getByText("Tipo")).toBeInTheDocument();
      expect(screen.getByText("Executivo")).toBeInTheDocument();
    });
  });

  it("shows the fallback text when the reply is empty", async () => {
    (global.fetch as jest.Mock).mockResolvedValueOnce(createMockFetchResponse({ reply: "" }));
    render(<ExecutiveSummaryPage />);

    await waitFor(() => {
      expect(screen.getByText("Sem resposta")).toBeInTheDocument();
    });
  });

  it("shows the error message when the AI request fails", async () => {
    (global.fetch as jest.Mock).mockRejectedValueOnce(new Error("API Error"));
    render(<ExecutiveSummaryPage />);

    await waitFor(() => {
      expect(screen.getByText("Erro: API Error")).toBeInTheDocument();
    });
  });
});