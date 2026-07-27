import api from "../../../services/api";

// GET/POST /api/academics/homework/, GET/PUT/DELETE /api/academics/homework/{id}/
const getHomework = async (params = {}) => {
  const response = await api.get("academics/homework/", { params });
  return { status: response.status, data: response.data };
};

const createHomework = async (payload) => {
  const response = await api.post("academics/homework/", payload);
  return { status: response.status, data: response.data };
};

const updateHomework = async (id, payload) => {
  const response = await api.put(`academics/homework/${id}/`, payload);
  return { status: response.status, data: response.data };
};

const deleteHomework = async (id) => {
  const response = await api.delete(`academics/homework/${id}/`);
  return { status: response.status, data: response.data };
};

const homeworkService = { getHomework, createHomework, updateHomework, deleteHomework };

export default homeworkService;
