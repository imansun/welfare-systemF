// src/app/services/endpoints/units.ts

import axios from "@/utils/axios";

// -------------------------
// Unit Types
// -------------------------

export interface UnitItem {
  id: string;
  name: string;
  shortName: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CreateUnitPayload {
  name: string;
  shortName: string;
  isActive?: boolean;
}

export interface UpdateUnitPayload {
  name?: string;
  shortName?: string;
  isActive?: boolean;
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
// API: POST /units
// -------------------------

export const createUnit = async (
  payload: CreateUnitPayload
): Promise<UnitItem> => {
  const response = await axios.post<MaybeWrappedResponse<UnitItem>>(
    "/units",
    payload
  );

  return unwrapResponse<UnitItem>(response);
};

// -------------------------
// API: GET /units
// -------------------------

export const getUnits = async (): Promise<UnitItem[]> => {
  const response = await axios.get<MaybeWrappedResponse<UnitItem[]>>("/units");

  const units = unwrapResponse<UnitItem[]>(response);

  return Array.isArray(units) ? units : [];
};

// -------------------------
// API: GET /units/{id}
// -------------------------

export const getUnitById = async (id: string): Promise<UnitItem> => {
  const response = await axios.get<MaybeWrappedResponse<UnitItem>>(
    `/units/${id}`
  );

  return unwrapResponse<UnitItem>(response);
};

// -------------------------
// API: PATCH /units/{id}
// -------------------------

export const updateUnit = async (
  id: string,
  payload: UpdateUnitPayload
): Promise<UnitItem> => {
  const response = await axios.patch<MaybeWrappedResponse<UnitItem>>(
    `/units/${id}`,
    payload
  );

  return unwrapResponse<UnitItem>(response);
};

// -------------------------
// API: DELETE /units/{id}
// -------------------------

export const deleteUnit = async (id: string): Promise<void> => {
  await axios.delete(`/units/${id}`);
};
