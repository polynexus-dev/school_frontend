import api from "../../../services/api";

// GET /api/academics/exam-question-marks/?exam_paper=&student=
const getEntries = async (params = {}) => {
  const response = await api.get("academics/exam-question-marks/", { params });
  return { status: response.status, data: response.data };
};

// POST /api/academics/exam-question-marks/  — array body, one row per graded question.
// Upserts on (exam_question, student) server-side, so re-saving a correction is safe.
const bulkSaveEntries = async (entries) => {
  const response = await api.post("academics/exam-question-marks/", entries);
  return { status: response.status, data: response.data };
};

// POST /api/academics/exam-question-marks/publish/  {exam_paper}
// Sums each graded student's entries into MarksEntry and regenerates report cards.
const publishPaperMarks = async (examPaperId) => {
  const response = await api.post("academics/exam-question-marks/publish/", { exam_paper: examPaperId });
  return { status: response.status, data: response.data };
};

const examQuestionMarksService = { getEntries, bulkSaveEntries, publishPaperMarks };

export default examQuestionMarksService;
