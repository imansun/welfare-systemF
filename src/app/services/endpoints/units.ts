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
// API: POST /units
// -------------------------

export const createUnit = async (
  payload: CreateUnitPayload
): Promise<UnitItem> => {
  const response = await axios.post("/units", payload);
  return response.data;
};

// -------------------------
// API: GET /units
// -------------------------

export const getUnits = async (): Promise<UnitItem[]> => {
  const response = await axios.get("/units");
  return response.data;
};

// -------------------------
// API: GET /units/{id}
// -------------------------

export const getUnitById = async (id: string): Promise<UnitItem> => {
  const response = await axios.get(`/units/${id}`);
  return response.data;
};

// -------------------------
// API: PATCH /units/{id}
// -------------------------

export const updateUnit = async (
  id: string,
  payload: UpdateUnitPayload
): Promise<UnitItem> => {
  const response = await axios.patch(`/units/${id}`, payload);
  return response.data;
};

// -------------------------
// API: DELETE /units/{id}
// -------------------------

export const deleteUnit = async (id: string): Promise<void> => {
  await axios.delete(`/units/${id}`);
};
