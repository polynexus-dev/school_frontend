import api from "../../../services/api";

// GET  /api/notifications/?is_read=true|false -> paginated {count,next,previous,results}
// GET  /api/notifications/unread_count/        -> {unread_count}
// POST /api/notifications/{id}/mark_read/      -> updated Notification
// POST /api/notifications/mark_all_read/       -> {marked_read}
const getNotifications = async (params = {}) => {
  const response = await api.get("notifications/", { params });
  return { status: response.status, data: response.data };
};

const getUnreadCount = async () => {
  const response = await api.get("notifications/unread_count/");
  return { status: response.status, data: response.data };
};

const markRead = async (id) => {
  const response = await api.post(`notifications/${id}/mark_read/`);
  return { status: response.status, data: response.data };
};

const markAllRead = async () => {
  const response = await api.post("notifications/mark_all_read/");
  return { status: response.status, data: response.data };
};

const notificationService = { getNotifications, getUnreadCount, markRead, markAllRead };

export default notificationService;
