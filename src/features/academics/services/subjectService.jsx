import api from "../../../services/api";

// GET /api/subjects/ — walks every page (dropdown data needs the complete
// list, not one page of it), same pattern as classSectionService.
const getSubjects = async () => {
  let url = "subjects/";
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

const subjectService = { getSubjects };

export default subjectService;
