import React, { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { toast } from "react-toastify";
import { ArrowLeft, CheckCircle2 } from "lucide-react";
import Button from "../../../components/Button";
import SelectBox from "../../../components/SelectBox";
import examPaperService from "../services/examPaperService";
import examQuestionMarksService from "../services/examQuestionMarksService";
import studentService from "../../students/services/studentService";

const asList = (data) => (Array.isArray(data) ? data : data?.results || []);

const GradeExamPaper = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  const [paper, setPaper] = useState(null);
  const [questions, setQuestions] = useState([]);
  const [roster, setRoster] = useState([]);
  const [gradedStudentIds, setGradedStudentIds] = useState(new Set());
  const [loading, setLoading] = useState(true);

  const [selectedStudentId, setSelectedStudentId] = useState("");
  const [marksDraft, setMarksDraft] = useState({}); // {examQuestionId: "marksObtained"}
  const [loadingEntries, setLoadingEntries] = useState(false);
  const [saving, setSaving] = useState(false);
  const [publishing, setPublishing] = useState(false);

  const loadAll = useCallback(async () => {
    setLoading(true);
    try {
      const paperRes = await examPaperService.getExamPaper(id);
      const p = paperRes.data;
      setPaper(p);

      const [panelRes, rosterRes, entriesRes] = await Promise.all([
        examPaperService.getPanel(id),
        studentService.getRoster(p.class_section),
        examQuestionMarksService.getEntries({ exam_paper: id }),
      ]);
      setQuestions(panelRes.data.questions);
      setRoster(asList(rosterRes.data));
      setGradedStudentIds(new Set(asList(entriesRes.data).map((e) => e.student)));
    } catch (err) {
      console.error("Failed to load paper for grading:", err);
      toast.error("Failed to load this exam paper.");
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    loadAll();
  }, [loadAll]);

  const loadStudentEntries = useCallback(
    async (studentId) => {
      setLoadingEntries(true);
      try {
        const res = await examQuestionMarksService.getEntries({ exam_paper: id, student: studentId });
        const draft = {};
        questions.forEach((q) => {
          draft[q.id] = "";
        });
        asList(res.data).forEach((entry) => {
          draft[entry.exam_question] = String(entry.marks_obtained);
        });
        setMarksDraft(draft);
      } catch (err) {
        console.error("Failed to load student's marks:", err);
        toast.error("Failed to load this student's marks.");
      } finally {
        setLoadingEntries(false);
      }
    },
    [id, questions]
  );

  const handleSelectStudent = (studentId) => {
    setSelectedStudentId(studentId);
    if (studentId) loadStudentEntries(studentId);
  };

  const runningTotal = useMemo(
    () => Object.values(marksDraft).reduce((sum, v) => sum + (Number(v) || 0), 0),
    [marksDraft]
  );

  const handleSave = async () => {
    if (!selectedStudentId) return;
    const entries = questions
      .filter((q) => marksDraft[q.id] !== "" && marksDraft[q.id] != null)
      .map((q) => ({
        exam_question: q.id,
        student: Number(selectedStudentId),
        marks_obtained: Number(marksDraft[q.id]),
      }));
    if (entries.length === 0) {
      toast.error("Enter marks for at least one question.");
      return;
    }
    setSaving(true);
    try {
      await examQuestionMarksService.bulkSaveEntries(entries);
      toast.success("Marks saved.");
      setGradedStudentIds((prev) => new Set(prev).add(Number(selectedStudentId)));
    } catch (err) {
      console.error("Failed to save marks:", err);
      toast.error(err?.response?.data?.[0] || err?.response?.data?.error || "Failed to save marks.");
    } finally {
      setSaving(false);
    }
  };

  const handlePublish = async () => {
    if (!window.confirm(`Publish marks for ${gradedStudentIds.size} graded student(s)? This updates their report cards and notifies guardians.`))
      return;
    setPublishing(true);
    try {
      const res = await examQuestionMarksService.publishPaperMarks(id);
      toast.success(`Marks published for ${res.data.published_count} student(s).`);
    } catch (err) {
      console.error("Failed to publish marks:", err);
      toast.error(err?.response?.data?.error || "Failed to publish marks.");
    } finally {
      setPublishing(false);
    }
  };

  const studentLabel = (s) => `${s.full_name || s.name}${s.admission_number ? ` · ${s.admission_number}` : ""}`;

  if (loading || !paper) {
    return <div className="w-full text-center text-ink-400 text-sm py-16">Loading…</div>;
  }

  return (
    <div className="w-full">
      <div className="flex items-center gap-3 pb-4 border-b border-cn-border mb-6 flex-wrap">
        <Button variant="outline" icon={<ArrowLeft size={16} />} onClick={() => navigate(`/paper-setting/${id}`)}>
          Back
        </Button>
        <div className="flex-1 min-w-0">
          <h1 className="font-heading font-bold text-2xl text-violet-950">Grade students</h1>
          <p className="text-ink-500 text-[13px] mt-1">Total marks: {paper.total_marks}</p>
        </div>
        <span className="inline-flex items-center gap-1.5 bg-violet-50 text-violet-700 border border-violet-200 rounded-lg px-3 py-1.5 text-[12px] font-bold">
          <CheckCircle2 size={13} /> {gradedStudentIds.size} / {roster.length} graded
        </span>
        <Button variant="success" onClick={handlePublish} loading={publishing} disabled={gradedStudentIds.size === 0}>
          Publish marks →
        </Button>
      </div>

      <div className="bg-cn-surface border border-cn-border rounded-2xl p-5 max-w-md mb-5">
        <SelectBox
          label="Student"
          fieldName="student"
          value={selectedStudentId}
          onChange={(e) => handleSelectStudent(e.target.value)}
          options={roster.map((s) => ({ label: studentLabel(s), value: String(s.id) }))}
        />
        {gradedStudentIds.has(Number(selectedStudentId)) && (
          <p className="text-[12px] text-success-hex font-semibold mt-2">Already graded — editing will update the saved marks.</p>
        )}
      </div>

      {selectedStudentId && (
        <div className="bg-cn-surface border border-cn-border rounded-2xl p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-heading font-semibold text-[15px] text-ink-900">Question-by-question marks</h2>
            <span className={`text-[13px] font-bold ${runningTotal <= Number(paper.total_marks) ? "text-ink-700" : "text-error-hex"}`}>
              Total: {runningTotal} / {paper.total_marks}
            </span>
          </div>

          {loadingEntries ? (
            <p className="text-ink-400 text-sm py-6 text-center">Loading…</p>
          ) : (
            <div className="flex flex-col gap-2.5">
              {questions.map((q) => (
                <div key={q.id} className="flex items-center gap-3 border border-cn-border rounded-xl px-4 py-3">
                  <span className="font-mono font-semibold text-violet-700 w-9">{q.question_label}</span>
                  <div className="flex-1 min-w-0">
                    <p className="text-[13px] text-ink-700 truncate">{q.question_text_snapshot}</p>
                  </div>
                  <input
                    type="number"
                    min="0"
                    max={q.marks}
                    value={marksDraft[q.id] ?? ""}
                    onChange={(e) => setMarksDraft((p) => ({ ...p, [q.id]: e.target.value }))}
                    placeholder="0"
                    className="w-20 px-3 py-1.5 border border-slate-300 rounded-md bg-transparent text-[0.85rem] text-dark outline-none focus:border-violet-500"
                  />
                  <span className="text-[11px] text-ink-400 w-16">/ {q.marks} marks</span>
                </div>
              ))}
            </div>
          )}

          <div className="flex justify-end mt-5">
            <Button variant="primary" onClick={handleSave} loading={saving}>
              Save marks
            </Button>
          </div>
        </div>
      )}
    </div>
  );
};

export default GradeExamPaper;
