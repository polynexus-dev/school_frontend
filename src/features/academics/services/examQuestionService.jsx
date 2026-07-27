import api from "../../../services/api";

// POST /api/academics/exam-questions/  {exam_paper, question, topic?, marks?, question_label?, order?}
// marks/question_label default server-side from the picked bank question when omitted.
const addQuestion = async (payload) => {
  const response = await api.post("academics/exam-questions/", payload);
  return { status: response.status, data: response.data };
};

// PATCH /api/academics/exam-questions/{id}/  {marks?, order?, topic?}
const updateQuestion = async (id, payload) => {
  const response = await api.patch(`academics/exam-questions/${id}/`, payload);
  return { status: response.status, data: response.data };
};

const deleteQuestion = async (id) => {
  const response = await api.delete(`academics/exam-questions/${id}/`);
  return { status: response.status, data: response.data };
};

// POST /api/academics/exam-questions/{id}/replace/  {question: bankQuestionId} -> same label/order, new content
const replaceQuestion = async (id, questionId) => {
  const response = await api.post(`academics/exam-questions/${id}/replace/`, { question: questionId });
  return { status: response.status, data: response.data };
};

const examQuestionService = { addQuestion, updateQuestion, deleteQuestion, replaceQuestion };

export default examQuestionService;
