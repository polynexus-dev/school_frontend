import api from "../../../services/api";

// GET /api/feedback/
const getFeedbacks = async (params = {}) => {
  const response = await api.get("feedback/", { params });
  return { status: response.status, data: response.data };
};

// GET /api/feedback/{id}/
const getFeedback = async (id) => {
  const response = await api.get(`feedback/${id}/`);
  return { status: response.status, data: response.data };
};

// POST /api/feedback/
const createFeedback = async (payload) => {
  const response = await api.post("feedback/", payload);
  return { status: response.status, data: response.data };
};

// POST /api/feedback/{id}/respond/ (Principal Response)
const respondToFeedback = async (id, payload) => {
  const response = await api.post(`feedback/${id}/respond/`, payload);
  return { status: response.status, data: response.data };
};

// PATCH /api/feedback/{id}/
const updateFeedback = async (id, payload) => {
  const response = await api.patch(`feedback/${id}/`, payload);
  return { status: response.status, data: response.data };
};

const feedbackService = {
  getFeedbacks,
  getFeedback,
  createFeedback,
  respondToFeedback,
  updateFeedback,
};

export default feedbackService;
