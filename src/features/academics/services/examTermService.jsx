import api from "../../../services/api";

// GET /api/academics/exam-terms/ — walks every page, flat array (dropdown data).
const getExamTerms = async () => {
  let url = "academics/exam-terms/";
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

const examTermService = { getExamTerms };

export default examTermService;
