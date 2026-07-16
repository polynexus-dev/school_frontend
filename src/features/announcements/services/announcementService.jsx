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

const announcementService = {
  getAnnouncements,
  createAnnouncement,
};

export default announcementService;
