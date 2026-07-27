import api from "../../../services/api";

// GET/POST /api/academics/question-bank/, GET/PUT/DELETE .../{id}/
// DELETE soft-deletes server-side (is_active=False) — never a hard delete.
const getQuestions = async (params = {}) => {
  const response = await api.get("academics/question-bank/", { params });
  return { status: response.status, data: response.data };
};

const createQuestion = async (payload) => {
  const response = await api.post("academics/question-bank/", payload);
  return { status: response.status, data: response.data };
};

const updateQuestion = async (id, payload) => {
  const response = await api.put(`academics/question-bank/${id}/`, payload);
  return { status: response.status, data: response.data };
};

const deleteQuestion = async (id) => {
  const response = await api.delete(`academics/question-bank/${id}/`);
  return { status: response.status, data: response.data };
};

const questionBankService = { getQuestions, createQuestion, updateQuestion, deleteQuestion };

export default questionBankService;
