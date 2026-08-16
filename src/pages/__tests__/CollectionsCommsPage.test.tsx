import React from "react";
import { render, screen, waitFor } from "@testing-library/react";
import CollectionsCommsPage from "../CollectionsCommsPage";
import { createMockFetchResponse } from "../../__tests__/mocks/api";

const mockCollections = {
  overdue: [
    { Nome: "Cliente A", docs: 3, total: "4500.00", diasAtraso: 45 },
    { Nome: "Cliente B", docs: 1, total: "1200.00", diasAtraso: 12 },
  ],
};

describe("CollectionsCommsPage", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (global.fetch as jest.Mock).mockClear();
  });

  it("displays loading state initially", () => {
    (global.fetch as jest.Mock).mockImplementationOnce(() => new Promise(() => {}));
    render(<CollectionsCommsPage />);

    expect(screen.getByText("A carregar cobranças...")).toBeInTheDocument();
  });

  it("fetches collections data on mount", async () => {
    (global.fetch as jest.Mock).mockResolvedValueOnce(createMockFetchResponse(mockCollections));
    render(<CollectionsCommsPage />);

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith(expect.stringContaining("/api/collections"));
    });
  });

  it("renders the collections KPIs", async () => {
    (global.fetch as jest.Mock).mockResolvedValueOnce(createMockFetchResponse(mockCollections));
    render(<CollectionsCommsPage />);

    await waitFor(() => {
      // "Clientes em atraso" appears as a KPI label and as the panel heading.
      expect(screen.getAllByText("Clientes em atraso").length).toBeGreaterThan(0);
      expect(screen.getByText("Documentos")).toBeInTheDocument();
      expect(screen.getByText("Total em atraso")).toBeInTheDocument();
      expect(screen.getByText("Máx. dias atraso")).toBeInTheDocument();
      // "45 dias" appears in the KPI and in the max-days table row.
      expect(screen.getAllByText("45 dias").length).toBeGreaterThan(0);
    });
  });

  it("renders overdue clients in the table", async () => {
    (global.fetch as jest.Mock).mockResolvedValueOnce(createMockFetchResponse(mockCollections));
    render(<CollectionsCommsPage />);

    await waitFor(() => {
      expect(screen.getAllByText("Clientes em atraso").length).toBeGreaterThan(0);
      expect(screen.getByText("Cliente A")).toBeInTheDocument();
      expect(screen.getByText("Cliente B")).toBeInTheDocument();
      expect(screen.getByText("12 dias")).toBeInTheDocument();
    });
  });

  it("shows the empty state when no clients are overdue", async () => {
    (global.fetch as jest.Mock).mockResolvedValueOnce(createMockFetchResponse({ overdue: [] }));
    render(<CollectionsCommsPage />);

    await waitFor(() => {
      expect(screen.getByText("Sem clientes em atraso.")).toBeInTheDocument();
    });
  });

  it("shows the error state when the request fails", async () => {
    (global.fetch as jest.Mock).mockRejectedValueOnce(new Error("API Error"));
    render(<CollectionsCommsPage />);

    await waitFor(() => {
      expect(screen.getByText("Erro")).toBeInTheDocument();
      expect(screen.getByText("Falha ao carregar cobranças")).toBeInTheDocument();
    });
  });
});