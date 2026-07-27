import api from "../../../services/api";

// GET/POST /api/hr/staff-attendance/ — non-admins only ever see their own
// records (server-scoped); create is self-check-in for non-admins.
const getAttendance = async (params = {}) => {
  const response = await api.get("hr/staff-attendance/", { params });
  return { status: response.status, data: response.data };
};

const checkIn = async (payload) => {
  const response = await api.post("hr/staff-attendance/", payload);
  return { status: response.status, data: response.data };
};

const staffAttendanceService = { getAttendance, checkIn };

export default staffAttendanceService;
