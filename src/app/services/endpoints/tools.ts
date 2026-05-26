// src/app/services/endpoints/tools.ts

import axios from "@/utils/axios";

// -------------------------
// Salary Receipt Types
// -------------------------

export interface SalaryReceiptLoan {
  remainder: string;
  installmentAmount: string;
  loanName: string;
}

export interface SalaryReceiptDeduction {
  value: string;
  title: string;
}

export interface SalaryReceiptPayment {
  value: string;
  title: string;
}

export interface SalaryReceiptAttendance {
  value: string;
  title: string;
}

export interface SalaryReceiptEmployee {
  companyName: string;
  year: string;
  monthTitle: string;
  receiptType: string;
  fullName: string;
  personnelCode: string;
  organizationUnit: string;
  jobTitle: string;
  periodTitle: string;
  loans: SalaryReceiptLoan[];
  deductions: SalaryReceiptDeduction[];
  payments: SalaryReceiptPayment[];
  attendance: SalaryReceiptAttendance[];
  totalLoanInstallments: string;
  totalBenefits: string;
  totalDeductions: string;
  accountNumber: string;
  netPayment: string;
}

export interface ParseSalaryReceiptResponse {
  count: number;
  data: SalaryReceiptEmployee[];
}

export type SalaryReceiptReportFormat = "excel" | "pdf";

export interface GenerateSalaryReceiptReportPayload {
  file: File;
  format: SalaryReceiptReportFormat;
  fields?: string[];
}

export interface ParseSalaryReceiptPayload {
  file: File;
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

const hasDataProperty = (value: unknown): value is Record<"data", unknown> => {
  return isObject(value) && "data" in value;
};

const isParseSalaryReceiptResponse = (
  value: unknown
): value is ParseSalaryReceiptResponse => {
  return (
    isObject(value) &&
    typeof value.count === "number" &&
    Array.isArray(value.data)
  );
};

/**
 * نکته مهم:
 * خروجی واقعی endpoint طبق Swagger این است:
 *
 * {
 *   count: number,
 *   data: SalaryReceiptEmployee[]
 * }
 *
 * پس نباید هر آبجکتی که data دارد را کورکورانه unwrap کنیم.
 * چون خود response اصلی هم data دارد.
 */
const unwrapParseSalaryReceiptResponse = (
  response: unknown
): ParseSalaryReceiptResponse => {
  console.groupCollapsed("[tools.ts] unwrapParseSalaryReceiptResponse");
  console.log("Raw response:", response);

  // حالت 1:
  // اگر interceptor پروژه مستقیم payload اصلی را برگردانده باشد:
  // { count, data }
  if (isParseSalaryReceiptResponse(response)) {
    console.log("Detected direct ParseSalaryReceiptResponse:", response);
    console.groupEnd();
    return response;
  }

  // حالت 2:
  // اگر axios response کامل برگشته باشد:
  // AxiosResponse<{ count, data }>
  if (hasDataProperty(response)) {
    const firstData = response.data;

    console.log("First response.data:", firstData);

    if (isParseSalaryReceiptResponse(firstData)) {
      console.log("Detected AxiosResponse.data as ParseSalaryReceiptResponse");
      console.groupEnd();
      return firstData;
    }

    // حالت 3:
    // اگر API یا interceptor دوباره wrap کرده باشد:
    // { data: { count, data } }
    if (hasDataProperty(firstData)) {
      const secondData = firstData.data;

      console.log("Second data unwrap:", secondData);

      if (isParseSalaryReceiptResponse(secondData)) {
        console.log("Detected nested data as ParseSalaryReceiptResponse");
        console.groupEnd();
        return secondData;
      }
    }
  }

  console.error("Invalid parse salary receipt response shape:", response);
  console.groupEnd();

  throw new Error("Invalid parse salary receipt response shape");
};

const unwrapBlobResponse = (response: unknown): Blob => {
  console.groupCollapsed("[tools.ts] unwrapBlobResponse");
  console.log("Raw blob response:", response);

  if (response instanceof Blob) {
    console.log("Detected direct Blob:", response);
    console.groupEnd();
    return response;
  }

  if (hasDataProperty(response) && response.data instanceof Blob) {
    console.log("Detected AxiosResponse.data as Blob:", response.data);
    console.groupEnd();
    return response.data;
  }

  console.error("Invalid blob response shape:", response);
  console.groupEnd();

  throw new Error("Invalid blob response shape");
};

// -------------------------
// Helpers: FormData
// -------------------------

const createSalaryReceiptFormData = (
  payload: ParseSalaryReceiptPayload
): FormData => {
  console.groupCollapsed("[tools.ts] createSalaryReceiptFormData");
  console.log("Payload:", payload);
  console.log("File:", payload.file);
  console.log("File name:", payload.file?.name);
  console.log("File size:", payload.file?.size);
  console.log("File type:", payload.file?.type);
  console.groupEnd();

  const formData = new FormData();

  formData.append("file", payload.file);

  return formData;
};

const createSalaryReceiptReportFormData = (
  payload: GenerateSalaryReceiptReportPayload
): FormData => {
  console.groupCollapsed("[tools.ts] createSalaryReceiptReportFormData");
  console.log("Payload:", payload);
  console.log("File:", payload.file);
  console.log("File name:", payload.file?.name);
  console.log("File size:", payload.file?.size);
  console.log("File type:", payload.file?.type);
  console.log("Format:", payload.format);
  console.log("Fields:", payload.fields);
  console.groupEnd();

  const formData = new FormData();

  formData.append("file", payload.file);
  formData.append("format", payload.format);

  payload.fields?.forEach((field) => {
    formData.append("fields", field);
  });

  return formData;
};

// -------------------------
// API: POST /tools/salary-receipt/parse
// -------------------------

export const parseSalaryReceipt = async (
  payload: ParseSalaryReceiptPayload
): Promise<ParseSalaryReceiptResponse> => {
  console.groupCollapsed("[tools.ts] parseSalaryReceipt START");
  console.log("Endpoint:", "/tools/salary-receipt/parse");
  console.log("Payload:", payload);
  console.groupEnd();

  const formData = createSalaryReceiptFormData(payload);

  console.groupCollapsed("[tools.ts] parseSalaryReceipt FormData entries");
  for (const [key, value] of formData.entries()) {
    console.log(key, value);
  }
  console.groupEnd();

  try {
    /**
     * طبق endpoint:
     * POST /tools/salary-receipt/parse
     * Content-Type: multipart/form-data
     * body:
     *   file: binary
     *
     * نکته:
     * Content-Type را دستی ست نمی‌کنیم تا browser/axios خودش boundary را اضافه کند.
     */
    const response = await axios.post<
      MaybeWrappedResponse<ParseSalaryReceiptResponse>
    >("/tools/salary-receipt/parse", formData, {
      headers: {
        Accept: "application/json",
      },
    });

    console.groupCollapsed("[tools.ts] parseSalaryReceipt RESPONSE");
    console.log("Raw axios/interceptor response:", response);
    console.groupEnd();

    const result = unwrapParseSalaryReceiptResponse(response);

    console.groupCollapsed("[tools.ts] parseSalaryReceipt FINAL RESULT");
    console.log("Final parsed result:", result);
    console.log("Count:", result.count);
    console.log("Data:", result.data);
    console.log("Data length:", result.data?.length);
    console.groupEnd();

    return result;
  } catch (error) {
    console.groupCollapsed("[tools.ts] parseSalaryReceipt ERROR");
    console.error("Error:", error);
    console.groupEnd();

    throw error;
  }
};

// -------------------------
// API: POST /tools/salary-receipt/report
// -------------------------

export const generateSalaryReceiptReport = async (
  payload: GenerateSalaryReceiptReportPayload
): Promise<Blob> => {
  console.groupCollapsed("[tools.ts] generateSalaryReceiptReport START");
  console.log("Endpoint:", "/tools/salary-receipt/report");
  console.log("Payload:", payload);
  console.groupEnd();

  const formData = createSalaryReceiptReportFormData(payload);

  console.groupCollapsed("[tools.ts] generateSalaryReceiptReport FormData entries");
  for (const [key, value] of formData.entries()) {
    console.log(key, value);
  }
  console.groupEnd();

  try {
    const response = await axios.post<Blob>(
      "/tools/salary-receipt/report",
      formData,
      {
        headers: {
          Accept:
            payload.format === "pdf"
              ? "application/pdf"
              : "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        },
        responseType: "blob",
      }
    );

    console.groupCollapsed("[tools.ts] generateSalaryReceiptReport RESPONSE");
    console.log("Raw axios/interceptor response:", response);
    console.groupEnd();

    const blob = unwrapBlobResponse(response);

    console.groupCollapsed("[tools.ts] generateSalaryReceiptReport FINAL BLOB");
    console.log("Blob:", blob);
    console.log("Blob size:", blob.size);
    console.log("Blob type:", blob.type);
    console.groupEnd();

    return blob;
  } catch (error) {
    console.groupCollapsed("[tools.ts] generateSalaryReceiptReport ERROR");
    console.error("Error:", error);
    console.groupEnd();

    throw error;
  }
};
