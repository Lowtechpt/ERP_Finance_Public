import React, { ReactElement } from "react";
import { render, RenderOptions } from "@testing-library/react";

// Optional: Wrap with any providers your app uses
// For now, just render normally
const AllTheProviders = ({ children }: { children: React.ReactNode }) => {
  return <>{children}</>;
};

const customRender = (
  ui: ReactElement,
  options?: Omit<RenderOptions, "wrapper">
) => render(ui, { wrapper: AllTheProviders, ...options });

export * from "@testing-library/react";
export { customRender as render };

// Common test helpers
export const waitForLoadingToFinish = async () => {
  const loaders = document.querySelectorAll("[data-testid='loading']");
  for (const loader of loaders) {
    await new Promise((resolve) => setTimeout(resolve, 100));
  }
};

export const mockLocalStorage = () => {
  const store: Record<string, string> = {};
  return {
    getItem: (key: string) => store[key] || null,
    setItem: (key: string, value: string) => {
      store[key] = value.toString();
    },
    removeItem: (key: string) => {
      delete store[key];
    },
    clear: () => {
      Object.keys(store).forEach((key) => delete store[key]);
    },
  };
};

export const mockIntersectionObserver = () => {
  global.IntersectionObserver = class IntersectionObserver {
    constructor() {}
    disconnect() {}
    observe() {}
    takeRecords() {
      return [];
    }
    unobserve() {}
  } as any;
};

export const formatCurrencyForTest = (value: number, currency = "EUR") => {
  return new Intl.NumberFormat("pt-PT", {
    style: "currency",
    currency,
  }).format(value);
};

export const formatPercentForTest = (value: number, decimals = 1) => {
  return `${(value * 100).toFixed(decimals)}%`;
};

// API fetch mock helper
export const mockApiCall = (endpoint: string, data: unknown = {}) => {
  return (global.fetch as jest.Mock).mockResolvedValueOnce({
    ok: true,
    status: 200,
    json: () => Promise.resolve(data),
  });
};

export const mockApiError = (endpoint: string, status = 500) => {
  return (global.fetch as jest.Mock).mockResolvedValueOnce({
    ok: false,
    status,
    json: () => Promise.resolve({ error: "API Error" }),
  });
};
