import React, { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { toast } from "react-toastify";
import { ArrowLeft, Plus, RefreshCw, Sparkles, Lock, GraduationCap } from "lucide-react";
import Button from "../../../components/Button";
import Table from "../../../components/Table";
import Modal from "../../../components/Modal";
import examPaperService from "../services/examPaperService";
import examQuestionService from "../services/examQuestionService";
import syllabusTopicService from "../services/syllabusTopicService";
import examTermService from "../services/examTermService";
import classSectionService from "../../students/services/classSectionService";
import subjectService from "../services/subjectService";
import QuestionPickerModal from "../components/QuestionPickerModal";

const asList = (data) => (Array.isArray(data) ? data : data?.results || []);
const classSectionLabel = (cs) => cs?.name || `Class ${cs?.grade ?? "?"} - ${cs?.section ?? "?"}`;

const ExamPaperBuilder = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  const [paper, setPaper] = useState(null);
  const [panel, setPanel] = useState(null);
  const [topics, setTopics] = useState([]);
  const [examTerms, setExamTerms] = useState([]);
  const [classSections, setClassSections] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [loading, setLoading] = useState(true);

  const [blueprintDraft, setBlueprintDraft] = useState({}); // {topicId: "targetMarks"}
  const [savingBlueprint, setSavingBlueprint] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [finalizing, setFinalizing] = useState(false);

  const [picker, setPicker] = useState(null); // {mode: 'add'|'replace', lockedTopicId, examQuestionId}
  const [editTarget, setEditTarget] = useState(null); // examQuestion row being edited
  const [editForm, setEditForm] = useState({ marks: "", order: "" });
  const [savingEdit, setSavingEdit] = useState(false);

  const isFinalized = !!paper?.paper_finalized;

  const loadAll = useCallback(async () => {
    setLoading(true);
    try {
      const paperRes = await examPaperService.getExamPaper(id);
      const p = paperRes.data;
      setPaper(p);

      const [topicsRes, panelRes, etRes, csRes, subRes] = await Promise.all([
        syllabusTopicService.getAllTopics({ class_section: p.class_section, subject: p.subject }),
        examPaperService.getPanel(id),
        examTermService.getExamTerms(),
        classSectionService.getClassSections(),
        subjectService.getSubjects(),
      ]);
      const topicList = asList(topicsRes.data);
      setTopics(topicList);
      setPanel(panelRes.data);
      setExamTerms(asList(etRes.data));
      setClassSections(asList(csRes.data));
      setSubjects(asList(subRes.data));

      const draft = {};
      topicList.forEach((t) => {
        const existing = panelRes.data.topics.find((row) => row.topic_id === t.id);
        draft[t.id] = existing ? String(existing.target_marks) : "";
      });
      setBlueprintDraft(draft);
    } catch (err) {
      console.error("Failed to load exam paper:", err);
      toast.error("Failed to load this exam paper.");
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    loadAll();
  }, [loadAll]);

  const refetchPanel = async () => {
    try {
      const res = await examPaperService.getPanel(id);
      setPanel(res.data);
    } catch (err) {
      console.error("Failed to refresh panel:", err);
    }
  };

  const examTermName = examTerms.find((t) => String(t.id) === String(paper?.exam_term))?.name || "—";
  const classSectionName = (() => {
    const cs = classSections.find((c) => String(c.id) === String(paper?.class_section));
    return cs ? classSectionLabel(cs) : "—";
  })();
  const subjectName = subjects.find((s) => String(s.id) === String(paper?.subject))?.name || "—";
  const topicNameById = (topicId) => topics.find((t) => t.id === topicId)?.name || "—";

  const blueprintSum = useMemo(
    () => Object.values(blueprintDraft).reduce((sum, v) => sum + (Number(v) || 0), 0),
    [blueprintDraft]
  );

  const handleSaveBlueprint = async () => {
    const items = Object.entries(blueprintDraft)
      .filter(([, v]) => v !== "" && Number(v) > 0)
      .map(([topic, target_marks]) => ({ topic: Number(topic), target_marks: Number(target_marks) }));
    if (items.length === 0) {
      toast.error("Set a target for at least one topic.");
      return;
    }
    setSavingBlueprint(true);
    try {
      await examPaperService.setBlueprint(id, items);
      toast.success("Blueprint saved.");
      await refetchPanel();
    } catch (err) {
      console.error("Failed to save blueprint:", err);
      toast.error(err?.response?.data?.error || "Failed to save blueprint.");
    } finally {
      setSavingBlueprint(false);
    }
  };

  const handleGenerate = async () => {
    setGenerating(true);
    try {
      const res = await examPaperService.generatePaper(id);
      toast.success(`Draft generated — ${res.data.created} question(s) added.`);
      (res.data.warnings || []).forEach((w) => toast.warning(w));
      await refetchPanel();
    } catch (err) {
      console.error("Failed to generate paper:", err);
      toast.error(err?.response?.data?.error || "Failed to generate paper.");
    } finally {
      setGenerating(false);
    }
  };

  const handleFinalize = async () => {
    if (!window.confirm("Finalize this paper? It will be locked and can no longer be edited.")) return;
    setFinalizing(true);
    try {
      const res = await examPaperService.finalizePaper(id);
      setPaper(res.data);
      toast.success("Paper finalized and locked.");
      await refetchPanel();
    } catch (err) {
      console.error("Failed to finalize paper:", err);
      toast.error(err?.response?.data?.error || "Failed to finalize paper.");
    } finally {
      setFinalizing(false);
    }
  };

  const handlePick = async (question) => {
    try {
      if (picker.mode === "add") {
        await examQuestionService.addQuestion({ exam_paper: Number(id), question: question.id, topic: question.topic });
        toast.success(`Added as ${panel?.questions?.length ? "next question" : "Q1"}.`);
      } else {
        await examQuestionService.replaceQuestion(picker.examQuestionId, question.id);
        toast.success("Question replaced.");
      }
      setPicker(null);
      await refetchPanel();
    } catch (err) {
      console.error("Failed to save question:", err);
      toast.error(err?.response?.data?.error || "Failed to save question.");
    }
  };

  const openEdit = (row) => {
    setEditTarget(row);
    setEditForm({ marks: String(row.marks), order: String(row.order) });
  };

  const handleEditSubmit = async () => {
    setSavingEdit(true);
    try {
      await examQuestionService.updateQuestion(editTarget.id, {
        marks: editForm.marks,
        order: Number(editForm.order),
      });
      toast.success("Question updated.");
      setEditTarget(null);
      await refetchPanel();
    } catch (err) {
      console.error("Failed to update question:", err);
      toast.error(err?.response?.data?.error || "Failed to update question.");
    } finally {
      setSavingEdit(false);
    }
  };

  const handleRemove = async (row) => {
    if (!window.confirm(`Remove ${row.question_label} from this paper?`)) return;
    try {
      await examQuestionService.deleteQuestion(row.id);
      toast.success("Question removed.");
      await refetchPanel();
    } catch (err) {
      console.error("Failed to remove question:", err);
      toast.error(err?.response?.data?.error || "Failed to remove question.");
    }
  };

  const questionColumns = [
    { header: "Label", accessor: (row) => <span className="font-mono font-semibold text-violet-700">{row.question_label}</span> },
    { header: "Topic", accessor: (row) => (row.topic ? topicNameById(row.topic) : "—") },
    { header: "Marks", accessor: "marks" },
    {
      header: "Question",
      accessor: (row) => (
        <span className="text-ink-700">{row.question_text_snapshot?.length > 80 ? `${row.question_text_snapshot.slice(0, 80)}…` : row.question_text_snapshot}</span>
      ),
    },
  ];

  if (loading || !paper || !panel) {
    return <div className="w-full text-center text-ink-400 text-sm py-16">Loading exam paper…</div>;
  }

  return (
    <div className="w-full">
      <div className="flex items-center gap-3 pb-4 border-b border-cn-border mb-6 flex-wrap">
        <Button variant="outline" icon={<ArrowLeft size={16} />} onClick={() => navigate("/paper-setting")}>
          Back
        </Button>
        <div className="flex-1 min-w-0">
          <h1 className="font-heading font-bold text-2xl text-violet-950">
            {examTermName} — {classSectionName} — {subjectName}
          </h1>
          <p className="text-ink-500 text-[13px] mt-1">Total marks target: {paper.total_marks}</p>
        </div>
        {isFinalized && (
          <span className="inline-flex items-center gap-1.5 bg-success-tint text-success-hex border border-green-200 rounded-lg px-3 py-1.5 text-[12px] font-bold">
            <Lock size={13} /> FINALIZED {paper.paper_finalized_at ? `· ${new Date(paper.paper_finalized_at).toLocaleString()}` : ""}
          </span>
        )}
        {isFinalized && (
          <Button variant="secondary" icon={<GraduationCap size={16} />} onClick={() => navigate(`/paper-setting/${id}/grade`)}>
            Grade Students →
          </Button>
        )}
      </div>

      {/* Blueprint editor */}
      <div className="bg-cn-surface border border-cn-border rounded-2xl p-5 mb-5">
        <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
          <h2 className="font-heading font-semibold text-[15px] text-ink-900">Blueprint — target marks per topic</h2>
          <span className={`text-[13px] font-bold ${blueprintSum === Number(paper.total_marks) ? "text-success-hex" : "text-warning-hex"}`}>
            Sum: {blueprintSum} / {paper.total_marks}
          </span>
        </div>

        {topics.length === 0 ? (
          <p className="text-ink-500 text-[13px]">
            No syllabus topics for this class/subject yet.{" "}
            <button className="text-violet-700 font-semibold underline cursor-pointer" onClick={() => navigate("/paper-setting/syllabus-topics")}>
              Add some first
            </button>
            .
          </p>
        ) : (
          <div className="flex flex-col gap-2 mb-4">
            {topics.map((t) => (
              <div key={t.id} className="flex items-center gap-3">
                <span className="flex-1 text-[13.5px] text-ink-700">{t.name}</span>
                <input
                  type="number"
                  disabled={isFinalized}
                  value={blueprintDraft[t.id] ?? ""}
                  onChange={(e) => setBlueprintDraft((p) => ({ ...p, [t.id]: e.target.value }))}
                  placeholder="0"
                  className="w-28 px-3 py-1.5 border border-slate-300 rounded-md bg-transparent text-[0.85rem] text-dark outline-none focus:border-violet-500 disabled:opacity-50"
                />
                <span className="text-[11px] text-ink-400 w-10">marks</span>
              </div>
            ))}
          </div>
        )}

        <div className="flex gap-3 justify-end">
          <Button variant="outline" onClick={handleSaveBlueprint} loading={savingBlueprint} disabled={isFinalized || topics.length === 0}>
            Save Blueprint
          </Button>
          <Button
            variant="primary"
            icon={<Sparkles size={16} />}
            onClick={handleGenerate}
            loading={generating}
            disabled={isFinalized || !panel.topics.length}
          >
            Generate Draft Paper
          </Button>
        </div>
      </div>

      {/* Panel / review */}
      <div className="bg-cn-surface border border-cn-border rounded-2xl p-5">
        <div className="flex items-center justify-between mb-4 flex-wrap gap-3">
          <h2 className="font-heading font-semibold text-[15px] text-ink-900">Composed paper</h2>
          <span
            className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-[12px] font-bold ${
              panel.is_balanced ? "bg-success-tint text-success-hex" : "bg-warning-tint text-warning-hex"
            }`}
          >
            {panel.total_marks_actual} / {panel.total_marks_target} marks {panel.is_balanced ? "· BALANCED" : "· UNBALANCED"}
          </span>
        </div>

        {panel.topics.length > 0 && (
          <div className="flex flex-wrap gap-2 mb-4">
            {panel.topics.map((row) => (
              <span
                key={row.topic_id ?? row.topic_name}
                className={`text-[11.5px] font-semibold rounded-lg px-2.5 py-1 border ${
                  row.balanced ? "bg-success-tint text-success-hex border-green-200" : "bg-warning-tint text-warning-hex border-amber-200"
                }`}
              >
                {row.topic_name || "Untagged"}: {row.actual_marks}
                {row.target_marks != null ? ` / ${row.target_marks}` : ""}
              </span>
            ))}
          </div>
        )}

        <div className="flex justify-end mb-3">
          <Button variant="secondary" icon={<Plus size={16} />} onClick={() => setPicker({ mode: "add", lockedTopicId: null })} disabled={isFinalized}>
            Add Question
          </Button>
        </div>

        <Table
          columns={questionColumns}
          data={panel.questions}
          onView={isFinalized ? undefined : (row) => setPicker({ mode: "replace", lockedTopicId: row.topic, examQuestionId: row.id })}
          viewLabel="Replace"
          viewIcon={RefreshCw}
          onEdit={isFinalized ? undefined : openEdit}
          onDelete={isFinalized ? undefined : handleRemove}
          emptyMessage="No questions composed yet"
          emptyDescription="Save a blueprint and generate a draft, or add questions manually."
        />

        <div className="flex justify-end mt-5">
          <Button variant="success" onClick={handleFinalize} loading={finalizing} disabled={isFinalized || !panel.is_balanced}>
            Finalize Paper
          </Button>
        </div>
      </div>

      <QuestionPickerModal
        isOpen={!!picker}
        onClose={() => setPicker(null)}
        classSection={paper.class_section}
        subject={paper.subject}
        topics={topics}
        lockedTopicId={picker?.lockedTopicId}
        title={picker?.mode === "replace" ? "Replace question" : "Add question"}
        onPick={handlePick}
      />

      <Modal isOpen={!!editTarget} onClose={() => setEditTarget(null)} title={`Edit ${editTarget?.question_label || ""}`}>
        <div className="flex flex-col gap-3 w-[300px] max-w-full">
          <div>
            <label className="block text-sm font-medium mb-1 text-dark">Marks</label>
            <input
              type="number"
              value={editForm.marks}
              onChange={(e) => setEditForm((p) => ({ ...p, marks: e.target.value }))}
              className="w-full px-4 py-2 border border-slate-300 rounded-md bg-transparent text-[0.85rem] text-dark outline-none focus:border-violet-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1 text-dark">Order</label>
            <input
              type="number"
              value={editForm.order}
              onChange={(e) => setEditForm((p) => ({ ...p, order: e.target.value }))}
              className="w-full px-4 py-2 border border-slate-300 rounded-md bg-transparent text-[0.85rem] text-dark outline-none focus:border-violet-500"
            />
          </div>
          <div className="flex gap-3 justify-end pt-2">
            <Button variant="outline" onClick={() => setEditTarget(null)}>
              Cancel
            </Button>
            <Button variant="primary" onClick={handleEditSubmit} loading={savingEdit}>
              Save
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default ExamPaperBuilder;
