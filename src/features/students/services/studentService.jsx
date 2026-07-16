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

const updateStudent = async (id, payload) => {
  const response = await api.put(`students/${id}/`, payload);
  return { status: response.status, data: response.data };
};

const deleteStudent = async (id) => {
  const response = await api.delete(`students/${id}/`);
  return { status: response.status, data: response.data };
};

const studentService = {
  getStudents,
  getStudent,
  createStudent,
  updateStudent,
  deleteStudent,
};

export default studentService;
