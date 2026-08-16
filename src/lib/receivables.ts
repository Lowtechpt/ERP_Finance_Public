/**
 * Receivables data transformation utilities.
 * Converts PRIMAVERA API responses to typed row structures.
 */

import { formatCurrency, formatDate } from "./format";

export type PrimaveraReceivable = {
  clientName: string | null;
  nif: string | null;
  documentNumber: string;
  dueDate: string | null;
  daysOverdue: number | null;
  totalAmount: number;
  paidAmount: number;
  openAmount: number;
  currency: string | null;
  status: string;
  paymentCondition: string | null;
  collector: string | null;
  reference: string | null;
};

export type ReceivableRow = [
  clientName: string,
  nif: string,
  documentNumber: string,
  dueDate: string,
  daysOverdue: string,
  totalAmount: string,
  paidAmount: string,
  openAmount: string,
  status: string,
  lastContact: string,
];

export type ReceivableView = {
  row: ReceivableRow;
  source?: PrimaveraReceivable;
};

export function toReceivableRow(item: PrimaveraReceivable): ReceivableRow {
  const currency = item.currency || "EUR";

  return [
    item.clientName || "Cliente sem nome",
    item.nif || "-",
    item.documentNumber,
    formatDate(item.dueDate),
    String(item.daysOverdue ?? 0),
    formatCurrency(item.totalAmount, currency),
    formatCurrency(item.paidAmount, currency),
    formatCurrency(item.openAmount, currency),
    item.status,
    "-",
  ];
}

export function toReceivableView(item: PrimaveraReceivable): ReceivableView {
  return {
    row: toReceivableRow(item),
    source: item,
  };
}
