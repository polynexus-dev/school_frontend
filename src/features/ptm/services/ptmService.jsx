import api from "../../../services/api";

// GET/POST/DELETE /api/ptm-slots/, plus book/cancel actions
const getSlots = async (params = {}) => {
  const response = await api.get("ptm-slots/", { params });
  return { status: response.status, data: response.data };
};

const createSlot = async (payload) => {
  const response = await api.post("ptm-slots/", payload);
  return { status: response.status, data: response.data };
};

const deleteSlot = async (id) => {
  const response = await api.delete(`ptm-slots/${id}/`);
  return { status: response.status, data: response.data };
};

const bookSlot = async (id, studentId) => {
  const response = await api.post(`ptm-slots/${id}/book/`, { student: studentId });
  return { status: response.status, data: response.data };
};

const cancelSlot = async (id) => {
  const response = await api.post(`ptm-slots/${id}/cancel/`);
  return { status: response.status, data: response.data };
};

const ptmService = { getSlots, createSlot, deleteSlot, bookSlot, cancelSlot };

export default ptmService;
