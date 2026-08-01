import api from "../../../services/api";

// ── Exam Rooms (master data) ────────────────────────────────────────────
const getRooms = async (params = {}) => {
  const response = await api.get("academics/exam-rooms/", { params });
  return { status: response.status, data: response.data };
};

const createRoom = async (payload) => {
  const response = await api.post("academics/exam-rooms/", payload);
  return { status: response.status, data: response.data };
};

const updateRoom = async (id, payload) => {
  const response = await api.patch(`academics/exam-rooms/${id}/`, payload);
  return { status: response.status, data: response.data };
};

const deleteRoom = async (id) => {
  const response = await api.delete(`academics/exam-rooms/${id}/`);
  return { status: response.status, data: response.data };
};

// ── Exam Schedule (datesheet) ───────────────────────────────────────────
const getSchedules = async (params = {}) => {
  const response = await api.get("academics/exam-schedule/", { params });
  return { status: response.status, data: response.data };
};

const createSchedule = async (payload) => {
  const response = await api.post("academics/exam-schedule/", payload);
  return { status: response.status, data: response.data };
};

const updateSchedule = async (id, payload) => {
  const response = await api.patch(`academics/exam-schedule/${id}/`, payload);
  return { status: response.status, data: response.data };
};

const deleteSchedule = async (id) => {
  const response = await api.delete(`academics/exam-schedule/${id}/`);
  return { status: response.status, data: response.data };
};

// ── Seating Arrangements ────────────────────────────────────────────────
const getSeatingArrangements = async (params = {}) => {
  const response = await api.get("academics/seating-arrangements/", { params });
  return { status: response.status, data: response.data };
};

const createSeatingArrangement = async (payload) => {
  const response = await api.post("academics/seating-arrangements/", payload);
  return { status: response.status, data: response.data };
};

// POST .../{id}/generate/  {class_section_ids: [...]} -> {allocated_count, seating_arrangement}
const generateSeating = async (id, classSectionIds) => {
  const response = await api.post(`academics/seating-arrangements/${id}/generate/`, { class_section_ids: classSectionIds });
  return { status: response.status, data: response.data };
};

const publishSeatingArrangement = async (id) => {
  const response = await api.post(`academics/seating-arrangements/${id}/publish/`, {});
  return { status: response.status, data: response.data };
};

// ── Hall Ticket (rendered on demand, not stored) ────────────────────────
// GET /api/academics/hall-ticket/{student_id}/{exam_term_id}/ — returns a raw PDF blob.
const downloadHallTicket = async (studentId, examTermId) => {
  const response = await api.get(`academics/hall-ticket/${studentId}/${examTermId}/`, { responseType: "blob" });
  return { status: response.status, data: response.data };
};

const examSchedulingService = {
  getRooms,
  createRoom,
  updateRoom,
  deleteRoom,
  getSchedules,
  createSchedule,
  updateSchedule,
  deleteSchedule,
  getSeatingArrangements,
  createSeatingArrangement,
  generateSeating,
  publishSeatingArrangement,
  downloadHallTicket,
};

export default examSchedulingService;
