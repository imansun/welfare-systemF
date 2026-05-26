// src/app/services/endpoints/companies.ts
import axios from "@/utils/axios";

// -------------------------
// Company Types
// -------------------------

export interface CompanyItem {
  id: string;
  name: string;
  code: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CompaniesParams {
  limit?: number;
  page?: number;
  search?: string;
  isActive?: boolean;
}

export interface CompanyListResponse {
  data: CompanyItem[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface CreateCompanyPayload {
  name: string;
  code: string;
  isActive?: boolean;
}

export interface UpdateCompanyPayload {
  name?: string;
  code?: string;
  isActive?: boolean;
}

export interface ImportCompaniesResponse {
  imported: number;
  skipped: number;
  errors: string[];
}

export interface CompanyActionResponse {
  message: string;
}

// -------------------------
// API: POST /companies
// -------------------------

export const createCompany = async (
  payload: CreateCompanyPayload
): Promise<CompanyItem> => {
  const response = await axios.post("/companies", payload);
  return response.data;
};

// -------------------------
// API: GET /companies
// -------------------------

export const getCompanies = async (
  params?: CompaniesParams
): Promise<CompanyListResponse> => {
  const response = await axios.get("/companies", {
    params: {
      limit: params?.limit ?? 10,
      page: params?.page ?? 1,
      search: params?.search,
      isActive: params?.isActive,
    },
  });

  return response.data;
};

// -------------------------
// API: GET /companies/{id}
// -------------------------

export const getCompanyById = async (
  id: string
): Promise<CompanyItem> => {
  const response = await axios.get(`/companies/${id}`);
  return response.data;
};

// -------------------------
// API: PATCH /companies/{id}
// -------------------------

export const updateCompany = async (
  id: string,
  payload: UpdateCompanyPayload
): Promise<CompanyItem> => {
  const response = await axios.patch(`/companies/${id}`, payload);
  return response.data;
};

// -------------------------
// API: DELETE /companies/{id}
// -------------------------

export const deleteCompany = async (
  id: string
): Promise<CompanyActionResponse> => {
  const response = await axios.delete(`/companies/${id}`);
  return response.data;
};

// -------------------------
// API: POST /companies/import
// -------------------------

export const importCompanies = async (
  file: File
): Promise<ImportCompaniesResponse> => {
  const formData = new FormData();
  formData.append("file", file);

  const response = await axios.post("/companies/import", formData, {
    headers: {
      "Content-Type": "multipart/form-data",
    },
  });

  return response.data;
};
