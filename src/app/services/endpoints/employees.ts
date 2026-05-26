// src/app/services/endpoints/employees.ts

import axios from "@/utils/axios";

// -------------------------
// Employee Types
// -------------------------

export interface EmployeeCompany {
  id: string;
  name: string;
  code: unknown;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface EmployeeItem {
  id: string;
  personnelCode: string;
  fullName: string;
  company: EmployeeCompany;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  deletedAt: unknown;
}

export interface CreateEmployeePayload {
  personnelCode: string;
  fullName: string;
  companyId: string;
  isActive?: boolean;
}

export interface UpdateEmployeePayload {
  personnelCode?: string;
  fullName?: string;
  companyId?: string;
  isActive?: boolean;
}

export interface ImportEmployeesResponse {
  totalRows: number;
  imported: number;
  updated: number;
  skipped: number;
  errors: string[];
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
// API: POST /employees
// -------------------------

export const createEmployee = async (
  payload: CreateEmployeePayload
): Promise<EmployeeItem> => {
  const response = await axios.post<MaybeWrappedResponse<EmployeeItem>>(
    "/employees",
    payload
  );

  return unwrapResponse<EmployeeItem>(response);
};

// -------------------------
// API: GET /employees
// -------------------------

export const getEmployees = async (): Promise<EmployeeItem[]> => {
  const response = await axios.get<MaybeWrappedResponse<EmployeeItem[]>>(
    "/employees"
  );

  const employees = unwrapResponse<EmployeeItem[]>(response);

  return Array.isArray(employees) ? employees : [];
};

// -------------------------
// API: POST /employees/import
// -------------------------

export const importEmployees = async (
  file: File
): Promise<ImportEmployeesResponse> => {
  const formData = new FormData();
  formData.append("file", file);

  const response = await axios.post<
    MaybeWrappedResponse<ImportEmployeesResponse>
  >("/employees/import", formData, {
    headers: {
      "Content-Type": "multipart/form-data",
    },
  });

  return unwrapResponse<ImportEmployeesResponse>(response);
};

// -------------------------
// API: GET /employees/{id}
// -------------------------

export const getEmployeeById = async (id: string): Promise<EmployeeItem> => {
  const response = await axios.get<MaybeWrappedResponse<EmployeeItem>>(
    `/employees/${id}`
  );

  return unwrapResponse<EmployeeItem>(response);
};

// -------------------------
// API: PATCH /employees/{id}
// -------------------------

export const updateEmployee = async (
  id: string,
  payload: UpdateEmployeePayload
): Promise<EmployeeItem> => {
  const response = await axios.patch<MaybeWrappedResponse<EmployeeItem>>(
    `/employees/${id}`,
    payload
  );

  return unwrapResponse<EmployeeItem>(response);
};

// -------------------------
// API: DELETE /employees/{id}
// -------------------------

export const deleteEmployee = async (id: string): Promise<void> => {
  await axios.delete(`/employees/${id}`);
};
