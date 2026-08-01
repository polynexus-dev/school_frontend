import api from "../../../services/api";

// GET/POST /api/announcements/
const getAnnouncements = async (params = {}) => {
  const response = await api.get("announcements/", { params });
  return { status: response.status, data: response.data };
};

const createAnnouncement = async (payload) => {
  const response = await api.post("announcements/", payload);
  return { status: response.status, data: response.data };
};

const deleteAnnouncement = async (id) => {
  const response = await api.delete(`announcements/${id}/`);
  return { status: response.status, data: response.data };
};

// POST /api/announcements/{id}/acknowledge/ — idempotent, any recipient.
const acknowledgeAnnouncement = async (id) => {
  const response = await api.post(`announcements/${id}/acknowledge/`);
  return { status: response.status, data: response.data };
};

// GET /api/announcements/{id}/acknowledgments/ — staff-only roster.
const getAcknowledgments = async (id) => {
  const response = await api.get(`announcements/${id}/acknowledgments/`);
  return { status: response.status, data: response.data };
};

const announcementService = {
  getAnnouncements,
  createAnnouncement,
  deleteAnnouncement,
  acknowledgeAnnouncement,
  getAcknowledgments,
};

export default announcementService;
