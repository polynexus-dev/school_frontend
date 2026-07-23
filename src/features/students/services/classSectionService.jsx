import api from "../../../services/api";

// GET/POST /api/class-sections/ — shared across Students, Face registration,
// Promote class and Announcement audience-by-class. These are all populating
// <select> dropdowns that need the *complete* roster of class sections, not
// one page of it, so this walks every page of the (now paginated) endpoint
// and hands back a plain flat array — a school with >25 class sections
// (e.g. 12 grades x 3 sections) would otherwise silently lose options past
// page 1.
const getClassSections = async () => {
  let url = "class-sections/";
  let all = [];
  let lastResponse = null;
  while (url) {
    const response = await api.get(url);
    lastResponse = response;
    const data = response.data;
    if (Array.isArray(data)) {
      all = data;
      break;
    }
    all = all.concat(data?.results || []);
    url = data?.next || null;
  }
  return { status: lastResponse.status, data: all };
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
