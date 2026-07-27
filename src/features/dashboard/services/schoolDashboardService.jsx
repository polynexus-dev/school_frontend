import api from "../../../services/api";

// GET /api/dashboard/school-summary/ — server-side aggregation (see
// school_app/views/dashboard.py), not client-side list-length counting.
const getSchoolSummary = async (params = {}) => {
  const response = await api.get("dashboard/school-summary/", { params });
  return { status: response.status, data: response.data };
};

const schoolDashboardService = { getSchoolSummary };

export default schoolDashboardService;
