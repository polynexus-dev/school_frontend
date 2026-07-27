import api from "../../../services/api";

const getLeaveTypes = async () => {
  const response = await api.get("hr/leave-types/");
  return { status: response.status, data: response.data };
};

// GET/POST /api/hr/leave-requests/ — non-admins only ever see their own (server-scoped).
const getLeaveRequests = async (params = {}) => {
  const response = await api.get("hr/leave-requests/", { params });
  return { status: response.status, data: response.data };
};

const createLeaveRequest = async (payload) => {
  const response = await api.post("hr/leave-requests/", payload);
  return { status: response.status, data: response.data };
};

const approveLeaveRequest = async (id, reviewNote) => {
  const response = await api.post(`hr/leave-requests/${id}/approve/`, { review_note: reviewNote || "" });
  return { status: response.status, data: response.data };
};

const rejectLeaveRequest = async (id, reviewNote) => {
  const response = await api.post(`hr/leave-requests/${id}/reject/`, { review_note: reviewNote || "" });
  return { status: response.status, data: response.data };
};

// GET /api/hr/leave-requests/{id}/affected_slots/ — timetable slots this
// teacher's leave leaves uncovered (the substitute-coverage list).
const getAffectedSlots = async (id) => {
  const response = await api.get(`hr/leave-requests/${id}/affected_slots/`);
  return { status: response.status, data: response.data };
};

const leaveService = { getLeaveTypes, getLeaveRequests, createLeaveRequest, approveLeaveRequest, rejectLeaveRequest, getAffectedSlots };

export default leaveService;
