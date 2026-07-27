import api from "../../../services/api";

// GET/POST/PUT/DELETE /api/events/ — audience-scoped read for everyone,
// Teacher+ write.
const getEvents = async (params = {}) => {
  const response = await api.get("events/", { params });
  return { status: response.status, data: response.data };
};

const createEvent = async (payload) => {
  const response = await api.post("events/", payload);
  return { status: response.status, data: response.data };
};

const updateEvent = async (id, payload) => {
  const response = await api.patch(`events/${id}/`, payload);
  return { status: response.status, data: response.data };
};

const deleteEvent = async (id) => {
  const response = await api.delete(`events/${id}/`);
  return { status: response.status, data: response.data };
};

const eventService = { getEvents, createEvent, updateEvent, deleteEvent };

export default eventService;
