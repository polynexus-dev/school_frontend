import api from "../../../services/api";

// GET academics/exam-papers/available_online_tests/ — the one ExamPaper
// listing a Student account can reach (the ViewSet itself is Teacher+ only).
const getAvailableTests = async () => {
  const response = await api.get("academics/exam-papers/available_online_tests/");
  return { status: response.status, data: response.data };
};

// POST academics/test-sessions/ {exam_paper} — starts a new attempt, or
// rejoins the existing in-progress one (server-side get_or_create).
const startOrResumeSession = async (examPaperId) => {
  const response = await api.post("academics/test-sessions/", { exam_paper: examPaperId });
  return { status: response.status, data: response.data };
};

const getSession = async (sessionId) => {
  const response = await api.get(`academics/test-sessions/${sessionId}/`);
  return { status: response.status, data: response.data };
};

// GET academics/test-sessions/{id}/questions/ — StudentExamQuestionSerializer, never includes is_correct.
const getSessionQuestions = async (sessionId) => {
  const response = await api.get(`academics/test-sessions/${sessionId}/questions/`);
  return { status: response.status, data: response.data };
};

const getMyAnswers = async (sessionId) => {
  const response = await api.get("academics/test-answers/", { params: { session: sessionId } });
  return { status: response.status, data: response.data };
};

// Upserts on (session, exam_question) server-side — safe to call repeatedly as a student changes an answer.
const saveAnswer = async ({ session, examQuestion, selectedOption, textAnswer }) => {
  const response = await api.post("academics/test-answers/", {
    session,
    exam_question: examQuestion,
    selected_option: selectedOption ?? null,
    text_answer: textAnswer ?? "",
  });
  return { status: response.status, data: response.data };
};

const submitSession = async (sessionId) => {
  const response = await api.post(`academics/test-sessions/${sessionId}/submit/`, {});
  return { status: response.status, data: response.data };
};

const onlineTestService = {
  getAvailableTests, startOrResumeSession, getSession, getSessionQuestions, getMyAnswers, saveAnswer, submitSession,
};

export default onlineTestService;
