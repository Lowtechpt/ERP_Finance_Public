import React, { useState } from "react";
import { render, screen, waitFor } from "@testing-library/react";
import { AiWorkspace } from "../AiWorkspace";

function Harness({ initialMessages = [] }: { initialMessages?: Array<{ role: "user" | "assistant"; content: string }> }) {
  const [messages, setMessages] = useState(initialMessages);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  return (
    <AiWorkspace
      messages={messages}
      setMessages={setMessages}
      input={input}
      setInput={setInput}
      loading={loading}
      setLoading={setLoading}
    />
  );
}

describe("AiWorkspace", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (global.fetch as jest.Mock).mockClear();
    localStorage.clear();
  });

  it("fetches all insight endpoints on mount", async () => {
    render(<Harness />);

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith("/api/production-costs");
      expect(global.fetch).toHaveBeenCalledWith("/api/cost-analysis");
      expect(global.fetch).toHaveBeenCalledWith("/api/receivables");
      expect(global.fetch).toHaveBeenCalledWith("/api/customers");
      expect(global.fetch).toHaveBeenCalledWith("/api/cashflow");
      expect(global.fetch).toHaveBeenCalledWith("/api/payables");
      expect(global.fetch).toHaveBeenCalledWith("/api/dashboard");
      expect(global.fetch).toHaveBeenCalledWith("/api/alerts");
      expect(global.fetch).toHaveBeenCalledWith("/api/dre");
      expect(global.fetch).toHaveBeenCalledWith("/api/hr-costs");
    });
  });

  it("renders the general insight panel by default", async () => {
    render(<Harness />);

    await waitFor(() => {
      expect(screen.getByText("PRIMAVERA + IA")).toBeInTheDocument();
      expect(screen.getByText("Painel de análise assistida")).toBeInTheDocument();
      expect(screen.getByText("Contexto PRIMAVERA")).toBeInTheDocument();
    });
  });

  it("renders the embedded chat panel", async () => {
    render(<Harness />);

    await waitFor(() => {
      expect(screen.getByText("Assistente IA Gemini")).toBeInTheDocument();
    });
  });

  it("renders the production insight panel for production questions", async () => {
    render(<Harness initialMessages={[{ role: "user", content: "Quais os custos de produção?" }]} />);

    await waitFor(() => {
      expect(screen.getByText("Custos de produção")).toBeInTheDocument();
      expect(screen.getByText("Custos por ordem")).toBeInTheDocument();
      expect(screen.getByText("Tabela de ordens de fabrico")).toBeInTheDocument();
      expect(screen.getByText("Sem ordens devolvidas pelo endpoint de producao.")).toBeInTheDocument();
    });
  });

  it("renders the collections insight panel for collections questions", async () => {
    render(<Harness initialMessages={[{ role: "user", content: "Que clientes devo cobrar primeiro?" }]} />);

    await waitFor(() => {
      expect(screen.getByText("Cobranças prioritárias")).toBeInTheDocument();
      expect(screen.getByText("Clientes a cobrar primeiro")).toBeInTheDocument();
    });
  });
});