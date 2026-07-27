import React, { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import { Plus, ClipboardList, Layers } from "lucide-react";
import Button from "../../../components/Button";
import Table from "../../../components/Table";
import Modal from "../../../components/Modal";
import SelectBox from "../../../components/SelectBox";
import Pagination from "../../../components/Pagination";
import usePaginatedList from "../../../hooks/usePaginatedList";
import questionBankService from "../services/questionBankService";
import syllabusTopicService from "../services/syllabusTopicService";
import classSectionService from "../../students/services/classSectionService";
import subjectService from "../services/subjectService";

const asList = (data) => (Array.isArray(data) ? data : data?.results || []);
const classSectionLabel = (cs) => cs?.name || `Class ${cs?.grade ?? "?"} - ${cs?.section ?? "?"}`;

const DIFFICULTY_OPTIONS = [
  { label: "Easy", value: "easy" },
  { label: "Medium", value: "medium" },
  { label: "Hard", value: "hard" },
];

const DIFFICULTY_TONE = {
  easy: "bg-success-tint text-success-hex",
  medium: "bg-warning-tint text-warning-hex",
  hard: "bg-error-tint text-error-hex",
};

const emptyForm = { id: null, topic: "", text: "", marks: "", difficulty: "medium" };

const QuestionBank = () => {
  const navigate = useNavigate();

  const [classSections, setClassSections] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [topics, setTopics] = useState([]);
  const [classSection, setClassSection] = useState("");
  const [subject, setSubject] = useState("");
  const [topicFilter, setTopicFilter] = useState("");
  const [difficultyFilter, setDifficultyFilter] = useState("");

  const [showModal, setShowModal] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [errors, setErrors] = useState({});
  const [saving, setSaving] = useState(false);

  const {
    items: questions,
    page,
    setPage,
    totalPages,
    count,
    pageSize,
    loading,
    refetch,
  } = usePaginatedList(questionBankService.getQuestions, {
    class_section: classSection || 0,
    subject: subject || 0,
    topic: topicFilter,
    difficulty: difficultyFilter,
  });

  useEffect(() => {
    const load = async () => {
      try {
        const [csRes, subRes] = await Promise.all([classSectionService.getClassSections(), subjectService.getSubjects()]);
        const csList = asList(csRes.data);
        const subList = asList(subRes.data);
        setClassSections(csList);
        setSubjects(subList);
        if (csList.length > 0) setClassSection(String(csList[0].id));
        if (subList.length > 0) setSubject(String(subList[0].id));
      } catch (err) {
        console.error("Failed to load class sections / subjects:", err);
        toast.error("Failed to load classes / subjects.");
      }
    };
    load();
  }, []);

  useEffect(() => {
    const loadTopics = async () => {
      if (!classSection || !subject) {
        setTopics([]);
        return;
      }
      try {
        const res = await syllabusTopicService.getAllTopics({ class_section: classSection, subject });
        setTopics(asList(res.data));
      } catch (err) {
        console.error("Failed to load topics:", err);
      }
    };
    loadTopics();
    setTopicFilter("");
  }, [classSection, subject]);

  const classSectionOptions = useMemo(() => classSections.map((cs) => ({ label: classSectionLabel(cs), value: String(cs.id) })), [classSections]);
  const subjectOptions = useMemo(() => subjects.map((s) => ({ label: s.name, value: String(s.id) })), [subjects]);
  const topicOptions = useMemo(() => topics.map((t) => ({ label: t.name, value: String(t.id) })), [topics]);
  const topicFilterOptions = useMemo(() => [{ label: "All topics", value: "" }, ...topicOptions], [topicOptions]);
  const difficultyFilterOptions = useMemo(() => [{ label: "All difficulties", value: "" }, ...DIFFICULTY_OPTIONS], []);

  const topicName = (id) => topics.find((t) => String(t.id) === String(id))?.name || "—";

  const columns = [
    { header: "Question", accessor: (row) => <span className="text-ink-900">{row.text?.length > 90 ? `${row.text.slice(0, 90)}…` : row.text}</span> },
    { header: "Topic", accessor: (row) => (row.topic ? topicName(row.topic) : "—") },
    { header: "Marks", accessor: "marks" },
    {
      header: "Difficulty",
      accessor: (row) => (
        <span className={`inline-flex items-center gap-1 text-[11px] font-bold rounded-full px-2.5 py-0.5 uppercase ${DIFFICULTY_TONE[row.difficulty] || ""}`}>
          {row.difficulty}
        </span>
      ),
    },
  ];

  const resetForm = () => {
    setForm(emptyForm);
    setErrors({});
    setIsEditing(false);
  };

  const openCreate = () => {
    resetForm();
    setShowModal(true);
  };

  const openEdit = (row) => {
    setForm({
      id: row.id,
      topic: row.topic ? String(row.topic) : "",
      text: row.text,
      marks: String(row.marks),
      difficulty: row.difficulty,
    });
    setIsEditing(true);
    setErrors({});
    setShowModal(true);
  };

  const handleDelete = async (row) => {
    if (!window.confirm("Remove this question from the active bank? Past papers referencing it are unaffected.")) return;
    try {
      await questionBankService.deleteQuestion(row.id);
      toast.success("Question removed from the active bank.");
      refetch();
    } catch (err) {
      console.error("Failed to delete question:", err);
      toast.error(err?.response?.data?.detail || "Failed to remove question.");
    }
  };

  const validate = () => {
    const newErrors = {};
    if (!form.text.trim()) newErrors.text = "Required";
    if (!form.marks || Number(form.marks) <= 0) newErrors.marks = "Required";
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async () => {
    if (!classSection || !subject) {
      toast.error("Pick a class and subject first.");
      return;
    }
    if (!validate()) {
      toast.error("Please fill in all required fields.");
      return;
    }
    setSaving(true);
    try {
      const payload = {
        class_section: Number(classSection),
        subject: Number(subject),
        topic: form.topic ? Number(form.topic) : null,
        text: form.text.trim(),
        marks: form.marks,
        difficulty: form.difficulty,
      };
      if (isEditing) {
        await questionBankService.updateQuestion(form.id, payload);
        toast.success("Question updated.");
      } else {
        await questionBankService.createQuestion(payload);
        toast.success("Question added to the bank.");
      }
      setShowModal(false);
      resetForm();
      refetch();
    } catch (err) {
      console.error("Failed to save question:", err);
      toast.error(err?.response?.data?.text?.[0] || err?.response?.data?.error || "Failed to save question.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="w-full">
      <div className="flex items-center gap-3 pb-4 border-b border-cn-border mb-6 flex-wrap">
        <div className="flex-1 min-w-0">
          <h1 className="font-heading font-bold text-2xl text-violet-950">Question Bank</h1>
          <p className="text-ink-500 text-[13px] mt-1">Topic-tagged questions used to generate exam papers</p>
        </div>
        <Button variant="outline" icon={<ClipboardList size={16} />} onClick={() => navigate("/paper-setting")}>
          Exam Papers
        </Button>
        <Button variant="outline" icon={<Layers size={16} />} onClick={() => navigate("/paper-setting/syllabus-topics")}>
          Syllabus Topics
        </Button>
        <Button variant="primary" icon={<Plus size={16} />} onClick={openCreate}>
          Add Question
        </Button>
      </div>

      <div className="flex flex-wrap gap-3 mb-4">
        <SelectBox className="w-56" label="Class & Section" fieldName="class_section" value={classSection} onChange={(e) => setClassSection(e.target.value)} options={classSectionOptions} />
        <SelectBox className="w-56" label="Subject" fieldName="subject" value={subject} onChange={(e) => setSubject(e.target.value)} options={subjectOptions} />
        <SelectBox className="w-56" label="Topic" fieldName="topic_filter" value={topicFilter} onChange={(e) => setTopicFilter(e.target.value)} options={topicFilterOptions} />
        <SelectBox className="w-56" label="Difficulty" fieldName="difficulty_filter" value={difficultyFilter} onChange={(e) => setDifficultyFilter(e.target.value)} options={difficultyFilterOptions} />
      </div>

      <Table
        columns={columns}
        data={questions}
        loading={loading}
        onEdit={openEdit}
        onDelete={handleDelete}
        emptyMessage="No questions in the bank yet"
        emptyDescription="Add questions here so they can be drawn into a generated paper."
      />
      <Pagination page={page} totalPages={totalPages} count={count} pageSize={pageSize} onPageChange={setPage} loading={loading} />

      <Modal isOpen={showModal} onClose={() => setShowModal(false)} title={isEditing ? "Edit question" : "Add question"}>
        <div className="flex flex-col gap-3 w-[420px] max-w-full">
          <SelectBox label="Topic (optional)" fieldName="topic" value={form.topic} onChange={(e) => setForm((p) => ({ ...p, topic: e.target.value }))} options={topicOptions} />
          <div>
            <label className="block text-sm font-medium mb-1 text-dark">
              Question text <span className="text-red-600">*</span>
            </label>
            <textarea
              value={form.text}
              onChange={(e) => setForm((p) => ({ ...p, text: e.target.value }))}
              rows={4}
              className={`w-full px-4 py-2 border rounded-md bg-transparent text-[0.85rem] text-dark outline-none focus:border-violet-500 ${errors.text ? "border-error-hex" : "border-slate-300"}`}
            />
            {errors.text && <p className="text-[0.7rem] text-error-hex mt-1">{errors.text}</p>}
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium mb-1 text-dark">
                Marks <span className="text-red-600">*</span>
              </label>
              <input
                type="number"
                value={form.marks}
                onChange={(e) => setForm((p) => ({ ...p, marks: e.target.value }))}
                className={`w-full px-4 py-2 border rounded-md bg-transparent text-[0.85rem] text-dark outline-none focus:border-violet-500 ${errors.marks ? "border-error-hex" : "border-slate-300"}`}
              />
              {errors.marks && <p className="text-[0.7rem] text-error-hex mt-1">{errors.marks}</p>}
            </div>
            <SelectBox label="Difficulty" fieldName="difficulty" value={form.difficulty} onChange={(e) => setForm((p) => ({ ...p, difficulty: e.target.value }))} options={DIFFICULTY_OPTIONS} />
          </div>
          <div className="flex gap-3 justify-end pt-2">
            <Button variant="outline" onClick={() => setShowModal(false)}>
              Cancel
            </Button>
            <Button variant="primary" onClick={handleSubmit} loading={saving}>
              {isEditing ? "Save changes" : "Add question"}
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default QuestionBank;
