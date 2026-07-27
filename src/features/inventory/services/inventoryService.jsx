import api from "../../../services/api";

// GET/POST /api/inventory/categories/, /assets/, /assignments/ — all Admin-only.
const getCategories = async () => {
  const response = await api.get("inventory/categories/");
  return { status: response.status, data: response.data };
};

const createCategory = async (payload) => {
  const response = await api.post("inventory/categories/", payload);
  return { status: response.status, data: response.data };
};

const getAssets = async (params = {}) => {
  const response = await api.get("inventory/assets/", { params });
  return { status: response.status, data: response.data };
};

const createAsset = async (payload) => {
  const response = await api.post("inventory/assets/", payload);
  return { status: response.status, data: response.data };
};

const updateAsset = async (id, payload) => {
  const response = await api.patch(`inventory/assets/${id}/`, payload);
  return { status: response.status, data: response.data };
};

const getAssignments = async (params = {}) => {
  const response = await api.get("inventory/assignments/", { params });
  return { status: response.status, data: response.data };
};

const createAssignment = async (payload) => {
  const response = await api.post("inventory/assignments/", payload);
  return { status: response.status, data: response.data };
};

const returnAssignment = async (id, notes) => {
  const response = await api.post(`inventory/assignments/${id}/return_asset/`, notes ? { notes } : {});
  return { status: response.status, data: response.data };
};

const inventoryService = {
  getCategories, createCategory,
  getAssets, createAsset, updateAsset,
  getAssignments, createAssignment, returnAssignment,
};

export default inventoryService;
