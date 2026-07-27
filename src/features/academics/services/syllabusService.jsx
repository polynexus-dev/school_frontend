import api from "../../../services/api";

// GET /api/academics/syllabus-topics/
const getSyllabusTopics = async (params = {}) => {
  const response = await api.get("academics/syllabus-topics/", { params });
  return { status: response.status, data: response.data };
};

// GET /api/academics/syllabus-topics/progress-summary/
const getProgressSummary = async (params = {}) => {
  const response = await api.get("academics/syllabus-topics/progress-summary/", { params });
  return { status: response.status, data: response.data };
};

// POST /api/academics/syllabus-topics/
const createSyllabusTopic = async (payload) => {
  const response = await api.post("academics/syllabus-topics/", payload);
  return { status: response.status, data: response.data };
};

// PATCH /api/academics/syllabus-topics/{id}/
const updateSyllabusTopic = async (id, payload) => {
  const response = await api.patch(`academics/syllabus-topics/${id}/`, payload);
  return { status: response.status, data: response.data };
};

// DELETE /api/academics/syllabus-topics/{id}/
const deleteSyllabusTopic = async (id) => {
  const response = await api.delete(`academics/syllabus-topics/${id}/`);
  return { status: response.status, data: response.data };
};

const syllabusService = {
  getSyllabusTopics,
  getProgressSummary,
  createSyllabusTopic,
  updateSyllabusTopic,
  deleteSyllabusTopic,
};

export default syllabusService;
