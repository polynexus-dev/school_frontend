import api from "../../../services/api";

// GET/POST /api/students/, GET/PUT/DELETE /api/students/{id}/
const getStudents = async (params = {}) => {
  const response = await api.get("students/", { params });
  return { status: response.status, data: response.data };
};

const getStudent = async (id) => {
  const response = await api.get(`students/${id}/`);
  return { status: response.status, data: response.data };
};

const createStudent = async (payload) => {
  const response = await api.post("students/", payload);
  return { status: response.status, data: response.data };
};

// PATCH (not PUT) — the edit form only sends a handful of fields
// (full_name/date_of_birth/class_section), and a full PUT requires every
// required field on the serializer (admission_no, user, ...) or the backend
// 400s even though nothing about those fields actually changed.
const updateStudent = async (id, payload) => {
  const response = await api.patch(`students/${id}/`, payload);
  return { status: response.status, data: response.data };
};

const deleteStudent = async (id) => {
  const response = await api.delete(`students/${id}/`);
  return { status: response.status, data: response.data };
};

// GET /api/students/{id}/topic-mastery/?subject= — per-topic marks obtained/total,
// computed from graded exam questions. subjectId is optional (omit for all subjects).
const getTopicMastery = async (id, subjectId) => {
  const params = subjectId ? { subject: subjectId } : {};
  const response = await api.get(`students/${id}/topic-mastery/`, { params });
  return { status: response.status, data: response.data };
};

// Full class roster (flat array, every page) — same "walk every page" pattern
// as classSectionService.getClassSections, needed for a <select> that must
// list every student, not just page 1.
const getRoster = async (classSectionId) => {
  let url = `students/?class_section=${classSectionId}`;
  let all = [];
  let lastResponse = null;
  while (url) {
    const response = await api.get(url);
    lastResponse = response;
    const data = response.data;
    if (Array.isArray(data)) {
      all = data;
      break;
    }
    all = all.concat(data?.results || []);
    url = data?.next || null;
  }
  return { status: lastResponse.status, data: all };
};

const studentService = {
  getStudents,
  getStudent,
  createStudent,
  updateStudent,
  deleteStudent,
  getTopicMastery,
  getRoster,
};

export default studentService;
