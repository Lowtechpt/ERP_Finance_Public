import React, { useState } from "react";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { GeminiChatPanel } from "../GeminiChatPanel";

function Harness({ open = true }: { open?: boolean }) {
  const [messages, setMessages] = useState<Array<{ role: "user" | "assistant"; content: string }>>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  return (
    <GeminiChatPanel
      open={open}
      variant="floating"
      insightData={{}}
      onClose={jest.fn()}
      messages={messages}
      setMessages={setMessages}
      input={input}
      setInput={setInput}
      loading={loading}
      setLoading={setLoading}
    />
  );
}

describe("GeminiChatPanel", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (global.fetch as jest.Mock).mockClear();
    localStorage.clear();
  });

  it("renders nothing when closed", () => {
    const { container } = render(<Harness open={false} />);
    expect(container.firstChild).toBeNull();
  });

  it("renders the chat header and empty state when open", () => {
    render(<Harness />);

    expect(screen.getByText("Assistente IA Gemini")).toBeInTheDocument();
    expect(screen.getByText("Pergunte sobre os dados PRIMAVERA")).toBeInTheDocument();
  });

  it("opens the settings panel with the model select and key slots", () => {
    render(<Harness />);

    fireEvent.click(screen.getByLabelText("Configurar IA"));

    expect(screen.getByText("Configuracoes de API")).toBeInTheDocument();
    expect(screen.getByText("sem key")).toBeInTheDocument();
    expect(screen.getAllByPlaceholderText("AIza...")).toHaveLength(3);
  });

  it("fills the input from a suggestion button", () => {
    render(<Harness />);

    fireEvent.click(screen.getByText("Resume o fluxo de caixa"));

    expect((screen.getByPlaceholderText("Pergunte ao assistente...") as HTMLInputElement).value).toBe(
      "Resume o fluxo de caixa",
    );
  });

  it("shows an error when sending without an API key", async () => {
    render(<Harness />);

    const input = screen.getByPlaceholderText("Pergunte ao assistente...") as HTMLInputElement;
    fireEvent.change(input, { target: { value: "Olá" } });
    fireEvent.click(screen.getByRole("button", { name: "" }));

    await waitFor(() => {
      expect(screen.getByText("Cola primeiro uma Gemini API key nas configuracoes e ativa essa key.")).toBeInTheDocument();
    });
  });

  it("sends a message and renders the AI reply", async () => {
    localStorage.setItem("erp-finance-gemini-key", "AIzaFAKEKEY");
    (global.fetch as jest.Mock).mockImplementation((url: string) => {
      if (url.includes("generativelanguage")) {
        return Promise.resolve({
          ok: true,
          status: 200,
          json: () => Promise.resolve({ candidates: [{ content: { parts: [{ text: "Resposta da IA" }] } }] }),
        });
      }
      return Promise.resolve({ ok: true, status: 200, json: () => Promise.resolve({}) });
    });

    render(<Harness />);

    const input = screen.getByPlaceholderText("Pergunte ao assistente...") as HTMLInputElement;
    fireEvent.change(input, { target: { value: "Qual é o saldo?" } });
    fireEvent.click(screen.getByRole("button", { name: "" }));

    await waitFor(() => {
      expect(screen.getByText("Qual é o saldo?")).toBeInTheDocument();
      expect(screen.getByText("Resposta da IA")).toBeInTheDocument();
    });
  });

  it("shows the Gemini error message when the API call fails", async () => {
    localStorage.setItem("erp-finance-gemini-key", "AIzaFAKEKEY");
    (global.fetch as jest.Mock).mockImplementation((url: string) => {
      if (url.includes("generativelanguage")) {
        return Promise.resolve({
          ok: false,
          status: 429,
          json: () => Promise.resolve({ error: { message: "Quota esgotada" } }),
        });
      }
      return Promise.resolve({ ok: true, status: 200, json: () => Promise.resolve({}) });
    });

    render(<Harness />);

    const input = screen.getByPlaceholderText("Pergunte ao assistente...") as HTMLInputElement;
    fireEvent.change(input, { target: { value: "Olá" } });
    fireEvent.click(screen.getByRole("button", { name: "" }));

    await waitFor(() => {
      expect(screen.getByText(/Quota esgotada/)).toBeInTheDocument();
    });
  });
});