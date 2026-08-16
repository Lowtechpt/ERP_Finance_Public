import {
  formatCurrency,
  formatPercent,
  formatNumber,
  formatDate,
  formatDays,
  parseCurrency,
  moduleDisplayName,
} from "../format";
import type { PrimaveraModule } from "@/types/primavera";

// pt-PT groups with a non-breaking space and only from five digits up
// (ICU minimumGroupingDigits = 2), so "15 000,00 €" is correct and
// "1500,00 €" is too. Normalising the separator keeps assertions readable.
const normalize = (value: string) => value.replace(/\s/g, " ");

describe("formatCurrency", () => {
  it("formats positive numbers with the euro symbol", () => {
    expect(normalize(formatCurrency(1500))).toBe("1500,00 €");
  });

  it("formats zero", () => {
    expect(normalize(formatCurrency(0))).toBe("0,00 €");
  });

  it("formats negative numbers", () => {
    expect(normalize(formatCurrency(-500))).toBe("-500,00 €");
  });

  it("groups thousands from five digits up", () => {
    expect(normalize(formatCurrency(15000))).toBe("15 000,00 €");
    expect(normalize(formatCurrency(1000000))).toBe("1 000 000,00 €");
  });

  it("always shows two decimal places", () => {
    expect(normalize(formatCurrency(1234.56))).toBe("1234,56 €");
  });

  it("uses USD currency when specified", () => {
    expect(normalize(formatCurrency(1500, "USD"))).toBe("1500,00 US$");
  });
});

describe("formatPercent", () => {
  // Callers pass values that are already percentages (margemPct, ebitdaPct),
  // so the function appends "%" rather than multiplying by 100.
  it("appends a percent sign to an already-scaled value", () => {
    expect(formatPercent(50)).toBe("50.0%");
  });

  it("formats with custom decimals", () => {
    expect(formatPercent(33.3, 2)).toBe("33.30%");
  });

  it("formats zero", () => {
    expect(formatPercent(0)).toBe("0.0%");
  });

  it("formats negative percentages", () => {
    expect(formatPercent(-25)).toBe("-25.0%");
  });

  it("does not rescale fractional values", () => {
    expect(formatPercent(1.5)).toBe("1.5%");
  });
});

describe("formatNumber", () => {
  it("formats integers without decimals by default", () => {
    expect(normalize(formatNumber(1000))).toBe("1000");
  });

  it("groups thousands from five digits up", () => {
    expect(normalize(formatNumber(15000))).toBe("15 000");
  });

  it("rounds to the requested decimals", () => {
    expect(normalize(formatNumber(1234.56789, 2))).toBe("1234,57");
  });

  it("formats zero", () => {
    expect(formatNumber(0)).toBe("0");
  });

  it("handles negative numbers", () => {
    expect(normalize(formatNumber(-5000))).toBe("-5000");
  });
});

describe("formatDate", () => {
  it("formats an ISO date string as DD/MM/YYYY", () => {
    expect(formatDate("2026-08-15")).toBe("15/08/2026");
  });

  it("keeps the calendar day regardless of timezone", () => {
    expect(formatDate("2026-12-25")).toBe("25/12/2026");
  });

  it("returns a dash for null", () => {
    expect(formatDate(null)).toBe("-");
  });

  it("returns a dash for an empty string", () => {
    expect(formatDate("")).toBe("-");
  });
});

describe("formatDays", () => {
  it("uses the singular for one day", () => {
    expect(formatDays(1)).toBe("1 dia");
  });

  it("uses the plural for other values", () => {
    expect(formatDays(5)).toBe("5 dias");
    expect(formatDays(0)).toBe("0 dias");
    expect(formatDays(365)).toBe("365 dias");
  });
});

describe("parseCurrency", () => {
  // Inverse of formatCurrency: reads back a pt-PT formatted string, where "."
  // is a group separator and "," is the decimal point.
  it("reads back a formatted euro amount", () => {
    expect(parseCurrency("1500,00 €")).toBe(1500);
  });

  it("keeps decimals", () => {
    expect(parseCurrency("1 234,56 €")).toBe(1234.56);
  });

  it("reads negative amounts", () => {
    expect(parseCurrency("-500,00 €")).toBe(-500);
  });

  it("drops group separators", () => {
    expect(parseCurrency("1.000.000,00 €")).toBe(1000000);
  });

  it("falls back to zero for unparseable text", () => {
    expect(parseCurrency("abc")).toBe(0);
    expect(parseCurrency("")).toBe(0);
  });

  it("round-trips through formatCurrency", () => {
    expect(parseCurrency(formatCurrency(4321.99))).toBe(4321.99);
  });
});

describe("moduleDisplayName", () => {
  const module = (overrides: Partial<PrimaveraModule>): PrimaveraModule => ({
    code: "CBL",
    name: "Fallback name",
    tableName: "Movimentos",
    records: 0,
    ...overrides,
  });

  it("translates a known PRIMAVERA module code", () => {
    expect(moduleDisplayName(module({ code: "CBL" }))).toBe("Contabilidade");
    expect(moduleDisplayName(module({ code: "RHP" }))).toBe("Recursos Humanos");
  });

  it("handles compound codes", () => {
    expect(moduleDisplayName(module({ code: "VND-LIN" }))).toBe("Linhas de venda");
  });

  it("disambiguates INV by table name", () => {
    expect(moduleDisplayName(module({ code: "INV", tableName: "VersaoModulo" }))).toBe("Módulo INV");
    expect(moduleDisplayName(module({ code: "INV", tableName: "Artigo" }))).toBe("Inventário");
  });

  it("falls back to the raw name for unknown codes", () => {
    expect(moduleDisplayName(module({ code: "ZZZ", name: "Custom Module" }))).toBe("Custom Module");
  });
});

describe("Format edge cases", () => {
  it("does not throw on NaN", () => {
    expect(normalize(formatCurrency(NaN))).toBe("NaN €");
  });

  it("does not throw on Infinity", () => {
    expect(normalize(formatCurrency(Infinity))).toBe("∞ €");
  });

  it("keeps precision for very small decimals", () => {
    expect(normalize(formatNumber(0.000001, 6))).toBe("0,000001");
  });
});
