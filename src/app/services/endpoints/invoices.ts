// src/app/services/endpoints/invoices.ts

import axios from "@/utils/axios";

// -------------------------
// Shared Types
// -------------------------

export interface InvoiceCompany {
  id: string;
  name: string;
  code: string | null;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface InvoiceUser {
  id: string;
  username: string;
  displayName: string;
  email: string | null;
  adDn: string | null;
  role: string;
  isActive: boolean;
  lastLoginAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface InvoicePeriod {
  id: string;
  code: string;
  title: string;
  year: number;
  month: number;
  status: string;
  description: unknown | null;
  archivedAt: string | null;
  createdBy: InvoiceUser;
  createdAt: string;
  updatedAt: string;
}

export interface InvoiceEmployee {
  id: string;
  personnelCode: string;
  fullName: string;
  company: InvoiceCompany;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  deletedAt: string | null;
}

export interface InvoiceLineItem {
  id: string;
  itemName: string;
  unitName: string | null;
  quantity: string;
  price: string;
  lineTotal: string;
  createdAt: string;
  updatedAt: string;
}

export interface InvoiceItem {
  id: string;
  period: InvoicePeriod;
  employee: InvoiceEmployee;
  invoiceNumber: string;
  issuedAt: string;
  employeeName: string;
  personnelCode: string;
  companyName: string | null;
  periodTitle: string;
  periodCode: string;
  totalAmount: string;
  totalItems: number;
  items: InvoiceLineItem[];
  createdAt: string;
  updatedAt: string;
}

export interface GenerateInvoicesResponse {
  periodId: string;
  generated: number;
  skipped: number;
}

// -------------------------
// API Response Types
// -------------------------

type ApiWrappedResponse<T> = {
  data: T;
};

type MaybeWrappedResponse<T> = T | ApiWrappedResponse<T>;

// -------------------------
// Helpers
// -------------------------

const isObject = (value: unknown): value is Record<string, unknown> => {
  return typeof value === "object" && value !== null;
};

const hasDataProperty = (
  value: unknown
): value is Record<"data", unknown> => {
  return isObject(value) && "data" in value;
};

/**
 * این helper برای این ساخته شده که هر دو حالت را پشتیبانی کند:
 *
 * 1. اگر axios interceptor داری و خودش response.data را برمی‌گرداند
 * 2. اگر axios response کامل برگرداند
 * 3. اگر API مستقیم data بدهد
 * 4. اگر API به شکل wrapper مثل { data: [...] } بدهد
 */
const unwrapResponse = <T>(response: unknown): T => {
  let result = response;

  if (hasDataProperty(result)) {
    result = result.data;
  }

  if (hasDataProperty(result)) {
    result = result.data;
  }

  return result as T;
};

// -------------------------
// API: GET /invoices
// -------------------------

export const getInvoices = async (): Promise<InvoiceItem[]> => {
  const response = await axios.get<MaybeWrappedResponse<InvoiceItem[]>>(
    "/invoices"
  );

  const invoices = unwrapResponse<InvoiceItem[]>(response);

  return Array.isArray(invoices) ? invoices : [];
};

// -------------------------
// API: GET /invoices/period/{periodId}
// -------------------------

export const getInvoicesByPeriod = async (
  periodId: string
): Promise<InvoiceItem[]> => {
  const response = await axios.get<MaybeWrappedResponse<InvoiceItem[]>>(
    `/invoices/period/${periodId}`
  );

  const invoices = unwrapResponse<InvoiceItem[]>(response);

  return Array.isArray(invoices) ? invoices : [];
};

// -------------------------
// API: GET /invoices/{id}
// -------------------------

export const getInvoiceById = async (id: string): Promise<InvoiceItem> => {
  const response = await axios.get<MaybeWrappedResponse<InvoiceItem>>(
    `/invoices/${id}`
  );

  return unwrapResponse<InvoiceItem>(response);
};

// -------------------------
// API: POST /invoices/period/{periodId}/generate
// -------------------------

export const generateInvoicesByPeriod = async (
  periodId: string
): Promise<GenerateInvoicesResponse> => {
  const response = await axios.post<
    MaybeWrappedResponse<GenerateInvoicesResponse>
  >(`/invoices/period/${periodId}/generate`);

  return unwrapResponse<GenerateInvoicesResponse>(response);
};
