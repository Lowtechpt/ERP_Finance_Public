import {
  toReceivableRow,
  toReceivableView,
  type PrimaveraReceivable,
} from "../receivables";

// pt-PT groups thousands with a non-breaking space; normalising keeps the
// expected strings readable.
const normalize = (value: string) => value.replace(/\s/g, " ");

// Column positions in the ReceivableRow tuple, mirroring the type definition.
const CLIENT = 0;
const NIF = 1;
const DOCUMENT = 2;
const DUE_DATE = 3;
const DAYS_OVERDUE = 4;
const TOTAL = 5;
const PAID = 6;
const OPEN = 7;
const STATUS = 8;
const LAST_CONTACT = 9;

const baseReceivable: PrimaveraReceivable = {
  clientName: "Cliente A",
  nif: "501234567",
  documentNumber: "FT001",
  dueDate: "2026-09-15",
  daysOverdue: 12,
  totalAmount: 1500,
  paidAmount: 500,
  openAmount: 1000,
  currency: "EUR",
  status: "Aberta",
  paymentCondition: "30 dias",
  collector: "Equipa A",
  reference: "REF-1",
};

describe("toReceivableRow", () => {
  it("produces the full ten-column tuple", () => {
    const row = toReceivableRow(baseReceivable);
    expect(row).toHaveLength(10);
  });

  it("maps each field to its column", () => {
    const row = toReceivableRow(baseReceivable);

    expect(row[CLIENT]).toBe("Cliente A");
    expect(row[NIF]).toBe("501234567");
    expect(row[DOCUMENT]).toBe("FT001");
    expect(row[DUE_DATE]).toBe("15/09/2026");
    expect(row[DAYS_OVERDUE]).toBe("12");
    expect(row[STATUS]).toBe("Aberta");
  });

  it("formats the three amounts as currency", () => {
    const row = toReceivableRow(baseReceivable);

    expect(normalize(row[TOTAL])).toBe("1500,00 €");
    expect(normalize(row[PAID])).toBe("500,00 €");
    expect(normalize(row[OPEN])).toBe("1000,00 €");
  });

  it("honours a non-euro currency", () => {
    const row = toReceivableRow({ ...baseReceivable, currency: "USD" });
    expect(normalize(row[TOTAL])).toBe("1500,00 US$");
  });

  it("falls back to euro when the currency is missing", () => {
    const row = toReceivableRow({ ...baseReceivable, currency: null });
    expect(normalize(row[TOTAL])).toBe("1500,00 €");
  });

  it("substitutes placeholders for missing client data", () => {
    const row = toReceivableRow({ ...baseReceivable, clientName: null, nif: null });

    expect(row[CLIENT]).toBe("Cliente sem nome");
    expect(row[NIF]).toBe("-");
  });

  it("treats a missing overdue count as zero", () => {
    const row = toReceivableRow({ ...baseReceivable, daysOverdue: null });
    expect(row[DAYS_OVERDUE]).toBe("0");
  });

  it("renders a dash for a missing due date", () => {
    const row = toReceivableRow({ ...baseReceivable, dueDate: null });
    expect(row[DUE_DATE]).toBe("-");
  });

  it("always leaves last contact empty", () => {
    const row = toReceivableRow(baseReceivable);
    expect(row[LAST_CONTACT]).toBe("-");
  });

  it("formats zero and negative amounts", () => {
    const row = toReceivableRow({ ...baseReceivable, totalAmount: 0, openAmount: -500 });

    expect(normalize(row[TOTAL])).toBe("0,00 €");
    expect(normalize(row[OPEN])).toBe("-500,00 €");
  });

  it("groups large amounts", () => {
    const row = toReceivableRow({ ...baseReceivable, totalAmount: 999999.99 });
    expect(normalize(row[TOTAL])).toBe("999 999,99 €");
  });

  it("keeps an empty client name distinct from a null one", () => {
    // "" is falsy, so it takes the same placeholder as null.
    const row = toReceivableRow({ ...baseReceivable, clientName: "" });
    expect(row[CLIENT]).toBe("Cliente sem nome");
  });

  it("passes long and special-character names through unchanged", () => {
    const longName = "A".repeat(200);

    expect(toReceivableRow({ ...baseReceivable, clientName: longName })[CLIENT]).toBe(longName);
    expect(toReceivableRow({ ...baseReceivable, clientName: "Cliente & Co. Ltda." })[CLIENT])
      .toBe("Cliente & Co. Ltda.");
  });
});

describe("toReceivableView", () => {
  it("wraps the row and keeps the original record as source", () => {
    const view = toReceivableView(baseReceivable);

    expect(view.row).toEqual(toReceivableRow(baseReceivable));
    expect(view.source).toBe(baseReceivable);
  });

  it("exposes fields that the row drops, for the detail panel", () => {
    const view = toReceivableView(baseReceivable);

    expect(view.source?.paymentCondition).toBe("30 dias");
    expect(view.source?.collector).toBe("Equipa A");
    expect(view.source?.reference).toBe("REF-1");
  });
});
