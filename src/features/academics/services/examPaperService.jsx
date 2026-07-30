import api from "../../../services/api";

// GET/POST /api/academics/exam-papers/, GET .../{id}/
const getExamPapers = async (params = {}) => {
  const response = await api.get("academics/exam-papers/", { params });
  return { status: response.status, data: response.data };
};

const getExamPaper = async (id) => {
  const response = await api.get(`academics/exam-papers/${id}/`);
  return { status: response.status, data: response.data };
};

const createExamPaper = async (payload) => {
  const response = await api.post("academics/exam-papers/", payload);
  return { status: response.status, data: response.data };
};

// PUT .../{id}/blueprint/  {"topics": [{topic, target_marks}, ...]} -> list of PaperBlueprintTopic
const setBlueprint = async (id, topics) => {
  const response = await api.put(`academics/exam-papers/${id}/blueprint/`, { topics });
  return { status: response.status, data: response.data };
};

// POST .../{id}/generate/ -> {created, warnings}
const generatePaper = async (id) => {
  const response = await api.post(`academics/exam-papers/${id}/generate/`, {});
  return { status: response.status, data: response.data };
};

// GET .../{id}/panel/ -> {exam_paper_id, total_marks_target, total_marks_actual, is_balanced, paper_finalized, topics, questions}
const getPanel = async (id) => {
  const response = await api.get(`academics/exam-papers/${id}/panel/`);
  return { status: response.status, data: response.data };
};

// POST .../{id}/finalize/ -> ExamPaper (locked)
const finalizePaper = async (id) => {
  const response = await api.post(`academics/exam-papers/${id}/finalize/`, {});
  return { status: response.status, data: response.data };
};

const initSets = async (id) => {
  const response = await api.post(`academics/exam-papers/${id}/init_sets/`, {});
  return { status: response.status, data: response.data };
};

const lockEncryptSet = async (id, setCode, passcode) => {
  const response = await api.post(`academics/exam-papers/${id}/lock_encrypt_set/`, {
    set_code: setCode,
    passcode,
  });
  return { status: response.status, data: response.data };
};

const unlockDecryptSet = async (id, setCode, passcode) => {
  const response = await api.post(`academics/exam-papers/${id}/unlock_decrypt_set/`, {
    set_code: setCode,
    passcode,
  });
  return { status: response.status, data: response.data };
};

const setDistributionPolicy = async (id, policy) => {
  const response = await api.post(`academics/exam-papers/${id}/distribution_policy/`, { policy });
  return { status: response.status, data: response.data };
};

const examPaperService = {
  getExamPapers,
  getExamPaper,
  createExamPaper,
  setBlueprint,
  generatePaper,
  getPanel,
  finalizePaper,
  initSets,
  lockEncryptSet,
  unlockDecryptSet,
  setDistributionPolicy,
};

export default examPaperService;
