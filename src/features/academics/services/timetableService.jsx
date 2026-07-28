import api from "../../../services/api";

// GET/POST /api/timetable/, GET/PUT/DELETE /api/timetable/{id}/
// Reads are open to any authenticated user (server scopes per role); writes
// require School/SaaS Admin (CanManageTimetable) — enforced server-side.
const getSlots = async (params = {}) => {
  const response = await api.get("timetable/", { params });
  return { status: response.status, data: response.data };
};

const createSlot = async (payload) => {
  const response = await api.post("timetable/", payload);
  return { status: response.status, data: response.data };
};

const updateSlot = async (id, payload) => {
  const response = await api.put(`timetable/${id}/`, payload);
  return { status: response.status, data: response.data };
};

const deleteSlot = async (id) => {
  const response = await api.delete(`timetable/${id}/`);
  return { status: response.status, data: response.data };
};

const getSubstituteSuggestions = async (params = {}) => {
  const response = await api.get("substitute-allocations/suggest/", { params });
  return { status: response.status, data: response.data };
};

const confirmSubstitutes = async (payload) => {
  const response = await api.post("substitute-allocations/confirm/", payload);
  return { status: response.status, data: response.data };
};

const getSubstituteAssignments = async (params = {}) => {
  const response = await api.get("substitute-allocations/", { params });
  return { status: response.status, data: response.data };
};

const timetableService = {
  getSlots,
  createSlot,
  updateSlot,
  deleteSlot,
  getSubstituteSuggestions,
  confirmSubstitutes,
  getSubstituteAssignments,
};

export default timetableService;
