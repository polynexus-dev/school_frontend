import api from "../../../services/api";

// Full list for one (exam_term, class_section, subject) — same "walk every
// page" pattern as studentService.getRoster, needed since a class roster can
// exceed the default PAGE_SIZE=25 and the backend has no page_size override.
const getMarksEntries = async ({ examTerm, classSection, subject }) => {
  let url = `academics/marks/?exam_term=${examTerm}&class_section=${classSection}&subject=${subject}`;
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

// Bulk upsert — POST academics/marks/ [{ exam_term, student, subject, class_section, marks_obtained, max_marks }, ...]
// Returns { results: [...saved], locked_student_ids: [...] } — see MarksEntryViewSet.create().
const saveMarksEntries = async (entries) => {
  const response = await api.post("academics/marks/", entries);
  return { status: response.status, data: response.data };
};

// POST academics/marks/publish/ {exam_term, class_section, subject} -> bulk-publishes drafts, notifies guardians.
const publishMarksEntries = async (examTerm, classSection, subject) => {
  const response = await api.post("academics/marks/publish/", { exam_term: examTerm, class_section: classSection, subject });
  return { status: response.status, data: response.data };
};

const marksEntryService = { getMarksEntries, saveMarksEntries, publishMarksEntries };

export default marksEntryService;
