// Manual mock for `@/lib/api`.
// The real module reads `import.meta.env` (Vite-only), which jest cannot evaluate
// in CommonJS mode. This mock mirrors `src/lib/api.ts` behavior exactly, driven by
// `globalThis.__VITE_TEST_ENV__` so tests can exercise both dynamic and static modes.
//
// api.test.ts validates this contract; page/component tests get it automatically
// via jest.config moduleNameMapper (no per-test boilerplate).

interface ViteTestEnv {
  VITE_STATIC?: string;
  BASE_URL?: string;
}

const getEnv = (): ViteTestEnv =>
  ((globalThis as Record<string, unknown>).__VITE_TEST_ENV__ as ViteTestEnv | undefined) ?? {
    VITE_STATIC: undefined,
    BASE_URL: "/",
  };

export const isStatic = false;

export function apiUrl(path: string): string {
  const env = getEnv();
  if (env.VITE_STATIC === "true") {
    const siteBase = String(env.BASE_URL ?? "/").replace(/\/$/, "");
    const [pathname, query] = path.split("?");
    const joined = `${siteBase}${pathname}.json`;
    return query ? `${joined}?${query}` : joined;
  }
  return path;
}
