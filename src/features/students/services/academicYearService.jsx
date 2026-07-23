import api from "../../../services/api";

// GET /api/academic-years/ -> {id, name, start_date, end_date, is_current}
const getAcademicYears = async (params = {}) => {
  const response = await api.get("academic-years/", { params });
  return { status: response.status, data: response.data };
};

const academicYearService = { getAcademicYears };

export default academicYearService;
