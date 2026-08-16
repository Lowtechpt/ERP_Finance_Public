import { execFile } from "node:child_process";
import { getReceivables, meta } from "../backends/sqlserver";

jest.mock("node:child_process", () => ({
  execFile: jest.fn(),
}));

const mockExecFile = execFile as unknown as jest.Mock;

describe("sqlserver backend", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("exposes PRIMAVERA SQL metadata", () => {
    expect(meta.source).toBe("PRIMAVERA SQL");
  });

  it("parses JSON rows returned by sqlcmd", async () => {
    const stdout = Buffer.from(
      '[{"clientName":"José","nif":"500000001","openAmount":100.00},{"clientName":"João","nif":"500000002","openAmount":200.00}]',
      "utf8",
    );
    mockExecFile.mockImplementation((_file: string, _args: string[], _opts: unknown, cb: (err: Error | null, stdout: Buffer, stderr: Buffer) => void) => {
      cb(null, stdout, Buffer.from(""));
    });

    const rows = await getReceivables();
    expect(mockExecFile).toHaveBeenCalledWith(
      "sqlcmd",
      expect.arrayContaining(["-S", expect.stringContaining("SQLEXPRESS")]),
      expect.anything(),
      expect.any(Function),
    );
    expect(rows).toHaveLength(2);
    expect(rows[0].clientName).toBe("José");
    expect(rows[1].nif).toBe("500000002");
  });

  it("rejects when sqlcmd fails", async () => {
    mockExecFile.mockImplementation((_file: string, _args: string[], _opts: unknown, cb: (err: Error | null, stdout: Buffer, stderr: Buffer) => void) => {
      cb(new Error("sqlcmd not found"), Buffer.from(""), Buffer.from("Sqlcmd: Error: cannot connect"));
    });

    await expect(getReceivables()).rejects.toThrow();
  });
});