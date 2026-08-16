/** @type {import('jest').Config} */
export default {
  displayName: "ERP Finance Tests",
  testEnvironment: "jsdom",
  roots: ["<rootDir>/src", "<rootDir>/server"],
  testMatch: [
    "**/__tests__/**/*.test.ts?(x)",
    "**/?(*.)+(spec|test).ts?(x)",
  ],
  moduleFileExtensions: ["ts", "tsx", "js", "jsx", "json"],
  transform: {
    "^.+\\.tsx?$": ["ts-jest", {
      tsconfig: "<rootDir>/tsconfig.jest.json",
      jsx: "react-jsx",
      isolatedModules: true,
    }],
  },
  moduleNameMapper: {
    "^@/lib/api$": "<rootDir>/src/lib/__mocks__/api.ts",
    "^@/(.*)$": "<rootDir>/src/$1",
  },
  setupFilesAfterEnv: ["<rootDir>/jest.setup.cjs"],
  collectCoverageFrom: [
    "src/**/*.{ts,tsx}",
    "server/**/*.{ts,js}",
    "!src/**/*.d.ts",
    "!src/main.tsx",
    "!src/vite-env.d.ts",
    "!server/**/*.test.{ts,js}",
    "!server/**/*.d.ts",
  ],
  // Thresholds are set per file rather than globally: a global figure would
  // average the tested modules together with the 20+ pages that have no unit
  // tests yet, so it would report a number that means nothing. These floors
  // lock in the coverage the current suite actually achieves.
  coverageThreshold: {
    "src/lib/format.ts": { branches: 100, functions: 100, lines: 100, statements: 100 },
    "src/lib/receivables.ts": { branches: 100, functions: 100, lines: 100, statements: 100 },
    "src/lib/utils.ts": { branches: 100, functions: 100, lines: 100, statements: 100 },
    "src/components/PageWrapper.tsx": { branches: 100, functions: 100, lines: 100, statements: 100 },
    "src/components/SectionHeader.tsx": { branches: 80, functions: 100, lines: 100, statements: 100 },
    "src/components/KPIGrid.tsx": { branches: 50, functions: 100, lines: 100, statements: 100 },
  },
  testTimeout: 10000,
  verbose: true,
  clearMocks: true,
};
