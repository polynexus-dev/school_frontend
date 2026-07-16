import api from "../../../services/api";

// GET/POST /api/attendance/
const getAttendance = async (params = {}) => {
  const response = await api.get("attendance/", { params });
  return { status: response.status, data: response.data };
};

const markAttendance = async (payload) => {
  const response = await api.post("attendance/", payload);
  return { status: response.status, data: response.data };
};

const attendanceService = {
  getAttendance,
  markAttendance,
};

export default attendanceService;
