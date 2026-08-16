import type { Dispatch, SetStateAction } from "react";

export const geminiModels = [
  { id: "gemini-3.1-flash-lite", label: "Gemini 3.1 Flash Lite — 500 req/dia ✓ recomendado" },
  { id: "gemini-2.5-flash", label: "Gemini 2.5 Flash — 20 req/dia" },
  { id: "gemini-2.5-flash-lite", label: "Gemini 2.5 Flash Lite — 20 req/dia" },
  { id: "gemini-3.5-flash", label: "Gemini 3.5 Flash — 20 req/dia" },
  { id: "gemini-3-flash", label: "Gemini 3 Flash — 20 req/dia" },
];

export type AiKeySlot = {
  name: string;
  value: string;
};

export function readAiKeySlots(): AiKeySlot[] {
  try {
    const stored = localStorage.getItem("erp-finance-gemini-key-slots");
    if (stored) {
      const parsed = JSON.parse(stored) as AiKeySlot[];
      if (Array.isArray(parsed) && parsed.length) {
        return [0, 1, 2].map((index) => ({
          name: parsed[index]?.name || `Key ${index + 1}`,
          value: parsed[index]?.value || "",
        }));
      }
    }
  } catch {
    localStorage.removeItem("erp-finance-gemini-key-slots");
  }

  return [
    { name: "Key 1", value: localStorage.getItem("erp-finance-gemini-key") ?? "" },
    { name: "Key 2", value: "" },
    { name: "Key 3", value: "" },
  ];
}

export type AiWorkspaceProps = {
  messages: Array<{ role: "user" | "assistant"; content: string }>;
  setMessages: Dispatch<SetStateAction<Array<{ role: "user" | "assistant"; content: string }>>>;
  input: string;
  setInput: (v: string) => void;
  loading: boolean;
  setLoading: (v: boolean) => void;
};
