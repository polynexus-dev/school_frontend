import api from "../../../services/api";

// GET/POST /api/class-sections/ — shared across Students, Face registration,
// Promote class and Announcement audience-by-class.
const getClassSections = async () => {
  const response = await api.get("class-sections/");
  return { status: response.status, data: response.data };
};

const createClassSection = async (payload) => {
  const response = await api.post("class-sections/", payload);
  return { status: response.status, data: response.data };
};

const classSectionService = {
  getClassSections,
  createClassSection,
};

export default classSectionService;
