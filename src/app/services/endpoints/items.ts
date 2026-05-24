// src/app/services/endpoints/items.ts
import axios from "@/utils/axios";

// -------------------------
// Item Types
// -------------------------

export interface UnitInfo {
  id: string;
  name: string;
  shortName: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface ItemItem {
  id: string;
  name: string;
  unit: UnitInfo;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CreateItemPayload {
  name: string;
  unitId: string;
  isActive?: boolean;
}

export interface UpdateItemPayload {
  name?: string;
  unitId?: string;
  isActive?: boolean;
}

// -------------------------
// API: POST /items
// -------------------------

export const createItem = async (
  payload: CreateItemPayload
): Promise<ItemItem> => {
  const response = await axios.post("/items", payload);
  return response.data;
};

// -------------------------
// API: GET /items
// -------------------------

export const getItems = async (): Promise<ItemItem[]> => {
  const response = await axios.get("/items");
  return response.data;
};

// -------------------------
// API: GET /items/{id}
// -------------------------

export const getItemById = async (id: string): Promise<ItemItem> => {
  const response = await axios.get(`/items/${id}`);
  return response.data;
};

// -------------------------
// API: PATCH /items/{id}
// -------------------------

export const updateItem = async (
  id: string,
  payload: UpdateItemPayload
): Promise<ItemItem> => {
  const response = await axios.patch(`/items/${id}`, payload);
  return response.data;
};

// -------------------------
// API: DELETE /items/{id}
// -------------------------

export const deleteItem = async (id: string): Promise<void> => {
  await axios.delete(`/items/${id}`);
};
