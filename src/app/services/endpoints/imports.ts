import axios from "@/utils/axios";

// -------------------------
// Import Types
// -------------------------

export interface ImportPeriodRecipientsResponse {
  periodId: string;
  imported: number;
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
 * 4. اگر API به شکل wrapper مثل { data: {...} } بدهد
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
// API: POST /imports/periods/{periodId}/recipients
// -------------------------

export const importPeriodRecipients = async (
  periodId: string,
  file: File
): Promise<ImportPeriodRecipientsResponse> => {
  const formData = new FormData();
  formData.append("file", file);

  const response = await axios.post<
    MaybeWrappedResponse<ImportPeriodRecipientsResponse>
  >(`/imports/periods/${periodId}/recipients`, formData, {
    headers: {
      "Content-Type": "multipart/form-data",
    },
  });

  return unwrapResponse<ImportPeriodRecipientsResponse>(response);
};
