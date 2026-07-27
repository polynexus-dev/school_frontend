import api from "../../../services/api";

// GET/POST /api/academics/syllabus-topics/, GET/PUT/DELETE .../{id}/
const getTopics = async (params = {}) => {
  const response = await api.get("academics/syllabus-topics/", { params });
  return { status: response.status, data: response.data };
};

// Fetches every page as a flat array — used to populate the blueprint editor
// and topic-filter dropdowns, which need the complete topic list.
const getAllTopics = async (params = {}) => {
  let url = "academics/syllabus-topics/";
  let all = [];
  let lastResponse = null;
  let first = true;
  while (url) {
    const response = await api.get(url, first ? { params } : undefined);
    first = false;
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

const createTopic = async (payload) => {
  const response = await api.post("academics/syllabus-topics/", payload);
  return { status: response.status, data: response.data };
};

const updateTopic = async (id, payload) => {
  const response = await api.put(`academics/syllabus-topics/${id}/`, payload);
  return { status: response.status, data: response.data };
};

const deleteTopic = async (id) => {
  const response = await api.delete(`academics/syllabus-topics/${id}/`);
  return { status: response.status, data: response.data };
};

const syllabusTopicService = { getTopics, getAllTopics, createTopic, updateTopic, deleteTopic };

export default syllabusTopicService;
