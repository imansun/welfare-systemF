// src/app/services/endpoints/periods.ts

import axios from "@/utils/axios";

// -------------------------
// Shared / Base Types
// -------------------------

type ApiWrappedResponse<T> = {
  data: T;
};

type MaybeWrappedResponse<T> = T | ApiWrappedResponse<T>;

const isObject = (value: unknown): value is Record<string, unknown> => {
  return typeof value === "object" && value !== null;
};

const hasDataProperty = (
  value: unknown
): value is Record<"data", unknown> => {
  return isObject(value) && "data" in value;
};

/**
 * مشابه units.ts:
 * - اگر axios interceptor فقط response.data را برگرداند
 * - اگر response کامل axios برگردد
 * - اگر API مستقیم data بدهد
 * - اگر API به صورت { data: ... } باشد
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
// Enum Types
// -------------------------

export type PeriodStatus =
  | "DRAFT"
  | "ACTIVE"
  | "CANCELLED"
  | "ARCHIVED"
  | string; // برای آینده اگر status جدید اضافه شد

export type PeriodUserRole =
  | "ADMIN"
  | "OPERATOR"
  | "VIEWER"
  | string; // بسته به سیستم شما

// -------------------------
// Domain Types
// -------------------------

export interface PeriodUser {
  id: string;
  username: string;
  displayName: string;
  email: string | null;
  adDn: string | null;
  role: PeriodUserRole;
  isActive: boolean;
  lastLoginAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface DistributionPeriod {
  id: string;
  code: string;
  title: string;
  year: number;
  month: number;
  status: PeriodStatus;
  description: string | null;
  archivedAt: string | null;
  createdBy: PeriodUser;
  createdAt: string;
  updatedAt: string;
}

// item + unit از swagger‌ی که برای package-items آمده:
export interface PeriodItemUnit {
  id: string;
  name: string;
  shortName: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface PeriodItem {
  id: string;
  name: string;
  unit: PeriodItemUnit;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface PeriodPackageItem {
  id: string;
  period: DistributionPeriod;
  item: PeriodItem;
  quantity: string;
  note: string | null;
  createdAt: string;
  updatedAt: string;
}

// -------------------------
// Payload Types
// -------------------------

export interface CreatePeriodPayload {
  code: string;
  title: string;
  year: number;
  month: number;
  description?: string;
  createdById: string;
}

export interface UpdatePeriodPayload {
  code?: string;
  title?: string;
  year?: number;
  month?: number;
  description?: string;
  createdById?: string;
}

export interface CreatePeriodPackageItemPayload {
  itemId: string;
  quantity: string;
  price: string;
  note?: string;
}

export interface UpdatePeriodPackageItemPayload {
  itemId?: string;
  quantity?: string;
  price?: string;
  note?: string;
}

// -------------------------
// API: /periods
// -------------------------

// POST /periods
export const createPeriod = async (
  payload: CreatePeriodPayload
): Promise<DistributionPeriod> => {
  const response = await axios.post<MaybeWrappedResponse<DistributionPeriod>>(
    "/periods",
    payload
  );

  return unwrapResponse<DistributionPeriod>(response);
};

// GET /periods
export const getPeriods = async (): Promise<DistributionPeriod[]> => {
  const response =
    await axios.get<MaybeWrappedResponse<DistributionPeriod[]>>("/periods");

  const periods = unwrapResponse<DistributionPeriod[]>(response);

  return Array.isArray(periods) ? periods : [];
};

// GET /periods/{id}
export const getPeriodById = async (
  id: string
): Promise<DistributionPeriod> => {
  const response =
    await axios.get<MaybeWrappedResponse<DistributionPeriod>>(`/periods/${id}`);

  return unwrapResponse<DistributionPeriod>(response);
};

// PATCH /periods/{id}
export const updatePeriod = async (
  id: string,
  payload: UpdatePeriodPayload
): Promise<DistributionPeriod> => {
  const response =
    await axios.patch<MaybeWrappedResponse<DistributionPeriod>>(
      `/periods/${id}`,
      payload
    );

  return unwrapResponse<DistributionPeriod>(response);
};

// DELETE /periods/{id}
export const deletePeriod = async (id: string): Promise<void> => {
  await axios.delete(`/periods/${id}`);
};

// POST /periods/{id}/archive
export const archivePeriod = async (
  id: string
): Promise<DistributionPeriod> => {
  const response =
    await axios.post<MaybeWrappedResponse<DistributionPeriod>>(
      `/periods/${id}/archive`
    );

  return unwrapResponse<DistributionPeriod>(response);
};

// POST /periods/{id}/cancel
export const cancelPeriod = async (
  id: string
): Promise<DistributionPeriod> => {
  const response =
    await axios.post<MaybeWrappedResponse<DistributionPeriod>>(
      `/periods/${id}/cancel`
    );

  return unwrapResponse<DistributionPeriod>(response);
};

// -------------------------
// API: /periods/{periodId}/package-items
// -------------------------

// POST /periods/{periodId}/package-items
export const createPeriodPackageItem = async (
  periodId: string,
  payload: CreatePeriodPackageItemPayload
): Promise<PeriodPackageItem> => {
  const response =
    await axios.post<MaybeWrappedResponse<PeriodPackageItem>>(
      `/periods/${periodId}/package-items`,
      payload
    );

  return unwrapResponse<PeriodPackageItem>(response);
};

// GET /periods/{periodId}/package-items
export const getPeriodPackageItems = async (
  periodId: string
): Promise<PeriodPackageItem[]> => {
  const response =
    await axios.get<MaybeWrappedResponse<PeriodPackageItem[]>>(
      `/periods/${periodId}/package-items`
    );

  const items = unwrapResponse<PeriodPackageItem[]>(response);

  return Array.isArray(items) ? items : [];
};

// GET /periods/{periodId}/package-items/{packageItemId}
export const getPeriodPackageItemById = async (
  periodId: string,
  packageItemId: string
): Promise<PeriodPackageItem> => {
  const response =
    await axios.get<MaybeWrappedResponse<PeriodPackageItem>>(
      `/periods/${periodId}/package-items/${packageItemId}`
    );

  return unwrapResponse<PeriodPackageItem>(response);
};

// PATCH /periods/{periodId}/package-items/{packageItemId}
export const updatePeriodPackageItem = async (
  periodId: string,
  packageItemId: string,
  payload: UpdatePeriodPackageItemPayload
): Promise<PeriodPackageItem> => {
  const response =
    await axios.patch<MaybeWrappedResponse<PeriodPackageItem>>(
      `/periods/${periodId}/package-items/${packageItemId}`,
      payload
    );

  return unwrapResponse<PeriodPackageItem>(response);
};

// DELETE /periods/{periodId}/package-items/{packageItemId}
export const deletePeriodPackageItem = async (
  periodId: string,
  packageItemId: string
): Promise<void> => {
  await axios.delete(`/periods/${periodId}/package-items/${packageItemId}`);
};
