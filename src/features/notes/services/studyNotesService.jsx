import api from "../../../services/api";

// GET /api/study-notes/
const getStudyNotes = async (params = {}) => {
  const response = await api.get("study-notes/", { params });
  return { status: response.status, data: response.data };
};

// GET /api/study-notes/{id}/
const getStudyNote = async (id) => {
  const response = await api.get(`study-notes/${id}/`);
  return { status: response.status, data: response.data };
};

// POST /api/study-notes/ (formData for file upload support)
const createStudyNote = async (formData) => {
  const response = await api.post("study-notes/", formData, {
    headers: { "Content-Type": "multipart/form-data" },
  });
  return { status: response.status, data: response.data };
};

// PATCH /api/study-notes/{id}/
const updateStudyNote = async (id, formData) => {
  const response = await api.patch(`study-notes/${id}/`, formData, {
    headers: { "Content-Type": "multipart/form-data" },
  });
  return { status: response.status, data: response.data };
};

// DELETE /api/study-notes/{id}/
const deleteStudyNote = async (id) => {
  const response = await api.delete(`study-notes/${id}/`);
  return { status: response.status, data: response.data };
};

const studyNotesService = {
  getStudyNotes,
  getStudyNote,
  createStudyNote,
  updateStudyNote,
  deleteStudyNote,
};

export default studyNotesService;
