import api from "../../../services/api";

// GET/POST /api/message-threads/, GET/POST /api/messages/?thread=<id>
const getThreads = async (params = {}) => {
  const response = await api.get("message-threads/", { params });
  return { status: response.status, data: response.data };
};

const createThread = async (payload) => {
  const response = await api.post("message-threads/", payload);
  return { status: response.status, data: response.data };
};

const getEligibleTeachers = async (studentId) => {
  const response = await api.get("message-threads/eligible-teachers/", { params: { student: studentId } });
  return { status: response.status, data: response.data };
};

const getMessages = async (threadId) => {
  const response = await api.get("messages/", { params: { thread: threadId } });
  return { status: response.status, data: response.data };
};

const sendMessage = async (threadId, body) => {
  const response = await api.post("messages/", { thread: threadId, body });
  return { status: response.status, data: response.data };
};

// GET /api/guardian-links/ — for a Parent this now returns only their own
// children (see GuardianStudentLinkViewSet fix); used here to populate the
// "which child is this about" picker for a new thread.
const getMyChildren = async () => {
  const response = await api.get("guardian-links/", { params: { status: "verified" } });
  return { status: response.status, data: response.data };
};

const messagingService = { getThreads, createThread, getEligibleTeachers, getMessages, sendMessage, getMyChildren };

export default messagingService;
