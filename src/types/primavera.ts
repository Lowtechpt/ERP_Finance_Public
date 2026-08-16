import type { PrimaveraReceivable } from "@/lib/receivables";

export type PrimaveraReceivablesResponse = {
  source: string;
  server: string;
  database: string;
  generatedAt: string;
  receivables: PrimaveraReceivable[];
};

export type PrimaveraModule = {
  code: string;
  name: string;
  tableName: string;
  records: number;
};

export type PrimaveraModulesResponse = {
  source: string;
  server: string;
  database: string;
  generatedAt: string;
  modules: PrimaveraModule[];
};

export type PrimaveraCustomer = {
  code: string;
  name: string;
  email: string;
  telefone: string;
  nif: string | null;
  currency: string | null;
  salesAmount: number;
  documentCount: number;
  currentDebt: number;
  creditLimit: number;
  paymentCondition: string | null;
  seller: string | null;
};

export type PrimaveraCustomersResponse = {
  source: string;
  server: string;
  database: string;
  generatedAt: string;
  customers: PrimaveraCustomer[];
};

export type ForecastColumn = {
  title: string;
  date: string;
  value: string;
  count: string;
  names: string[];
};
