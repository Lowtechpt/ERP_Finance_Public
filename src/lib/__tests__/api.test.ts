import { apiUrl, isStatic } from "@/lib/api";

// NOTE: the real `src/lib/api.ts` reads `import.meta.env` (Vite-only), which jest
// cannot evaluate in CommonJS mode. jest.config moduleNameMapper redirects
// `@/lib/api` to the manual mock in `src/lib/__mocks__/api.ts`, which mirrors the
// same contract driven by `globalThis.__VITE_TEST_ENV__`. These tests validate
// that contract (dynamic vs static mode).

describe("apiUrl (contract via mock)", () => {
  beforeEach(() => {
    delete (globalThis as Record<string, unknown>).__VITE_TEST_ENV__;
  });

  it("returns API path unchanged in dynamic mode", () => {
    (globalThis as Record<string, unknown>).__VITE_TEST_ENV__ = {
      VITE_STATIC: undefined,
      BASE_URL: "/",
    };

    const result = apiUrl("/api/dashboard");
    expect(result).toBe("/api/dashboard");
  });

  it("converts path to JSON in static mode", () => {
    (globalThis as Record<string, unknown>).__VITE_TEST_ENV__ = {
      VITE_STATIC: "true",
      BASE_URL: "/",
    };

    const result = apiUrl("/api/dashboard");
    expect(result).toContain(".json");
    expect(result).toContain("/api/dashboard");
  });

  it("handles base URL with trailing slash", () => {
    (globalThis as Record<string, unknown>).__VITE_TEST_ENV__ = {
      VITE_STATIC: "true",
      BASE_URL: "/app/",
    };

    const result = apiUrl("/api/dashboard");
    expect(result).toContain("/app");
    expect(result).toContain(".json");
  });

  it("handles base URL without trailing slash", () => {
    (globalThis as Record<string, unknown>).__VITE_TEST_ENV__ = {
      VITE_STATIC: "true",
      BASE_URL: "/app",
    };

    const result = apiUrl("/api/dashboard");
    expect(result).toContain("/app");
    expect(result).toContain(".json");
  });

  it("preserves query parameters in static mode", () => {
    (globalThis as Record<string, unknown>).__VITE_TEST_ENV__ = {
      VITE_STATIC: "true",
      BASE_URL: "/",
    };

    const result = apiUrl("/api/dashboard?format=json");
    expect(result).toContain("?format=json");
    expect(result).toContain(".json");
  });

  it("handles multiple query parameters", () => {
    (globalThis as Record<string, unknown>).__VITE_TEST_ENV__ = {
      VITE_STATIC: "true",
      BASE_URL: "/",
    };

    const result = apiUrl("/api/data?start=1&end=10");
    expect(result).toContain("?start=1&end=10");
  });

  it("handles paths without leading slash", () => {
    (globalThis as Record<string, unknown>).__VITE_TEST_ENV__ = {
      VITE_STATIC: undefined,
      BASE_URL: "/",
    };

    const result = apiUrl("api/dashboard");
    expect(result).toBe("api/dashboard");
  });

  it("handles root path in static mode", () => {
    (globalThis as Record<string, unknown>).__VITE_TEST_ENV__ = {
      VITE_STATIC: "true",
      BASE_URL: "/",
    };

    const result = apiUrl("/");
    expect(result).toContain(".json");
  });

  it("handles complex nested paths", () => {
    (globalThis as Record<string, unknown>).__VITE_TEST_ENV__ = {
      VITE_STATIC: "true",
      BASE_URL: "/",
    };

    const result = apiUrl("/api/v1/financial/dashboard/summary");
    expect(result).toContain("api/v1/financial/dashboard/summary");
    expect(result).toContain(".json");
  });
});

describe("isStatic", () => {
  it("is a boolean", () => {
    expect(typeof isStatic).toBe("boolean");
  });
});
