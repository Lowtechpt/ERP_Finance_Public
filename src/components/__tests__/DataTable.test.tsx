import React from "react";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { DataTable, type ColumnDef } from "../DataTable";

type Row = { id: number; name: string; value: number };

const columns: ColumnDef<Row>[] = [
  { header: "Nome", accessorKey: "name" },
  { header: "Valor", accessorKey: "value", sortable: true },
];

const rows: Row[] = [
  { id: 1, name: "Alfa", value: 100 },
  { id: 2, name: "Bravo", value: 200 },
];

describe("DataTable", () => {
  it("renders column headers and rows", () => {
    render(<DataTable columns={columns} data={rows} />);

    expect(screen.getByText("Nome")).toBeInTheDocument();
    expect(screen.getByText("Valor")).toBeInTheDocument();
    expect(screen.getByText("Alfa")).toBeInTheDocument();
    expect(screen.getByText("Bravo")).toBeInTheDocument();
  });

  it("shows an empty-state row when there is no data", () => {
    render(<DataTable columns={columns} data={[]} />);

    expect(screen.getByText("Sem dados para exibir")).toBeInTheDocument();
  });

  it("hides columns marked as hidden", () => {
    const withHidden: ColumnDef<Row>[] = [
      { header: "Nome", accessorKey: "name" },
      { header: "Segredo", accessorKey: "value", hidden: true },
    ];

    render(<DataTable columns={withHidden} data={rows} />);

    expect(screen.getByText("Nome")).toBeInTheDocument();
    expect(screen.queryByText("Segredo")).not.toBeInTheDocument();
  });

  it("uses the render callback to customise cell content", () => {
    const withRender: ColumnDef<Row>[] = [
      { header: "Nome", accessorKey: "name" },
      { header: "Valor", accessorKey: "value", render: (value) => `€${value}` },
    ];

    render(<DataTable columns={withRender} data={rows} />);

    expect(screen.getByText("€100")).toBeInTheDocument();
  });

  it("invokes onSort when clicking a sortable header", async () => {
    const onSort = jest.fn();
    render(<DataTable columns={columns} data={rows} sortBy="value" onSort={onSort} />);

    await userEvent.click(screen.getByRole("button", { name: /valor/i }));

    expect(onSort).toHaveBeenCalledWith("value", "desc");
  });

  it("toggles sort order when clicking the active column again", async () => {
    const onSort = jest.fn();
    render(<DataTable columns={columns} data={rows} sortBy="value" sortOrder="desc" onSort={onSort} />);

    await userEvent.click(screen.getByRole("button", { name: /valor/i }));

    expect(onSort).toHaveBeenCalledWith("value", "asc");
  });

  it("invokes onRowClick when a row is clicked", async () => {
    const onRowClick = jest.fn();
    render(<DataTable columns={columns} data={rows} onRowClick={onRowClick} />);

    await userEvent.click(screen.getByText("Alfa"));

    expect(onRowClick).toHaveBeenCalledWith(rows[0]);
  });

  it("renders the summary footer when provided", () => {
    render(<DataTable columns={columns} data={rows} summary={<span>Total: 300</span>} />);

    expect(screen.getByText("Total: 300")).toBeInTheDocument();
  });
});