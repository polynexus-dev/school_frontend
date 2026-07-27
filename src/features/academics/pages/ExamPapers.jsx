import React, { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import { Plus, BookOpen, Layers } from "lucide-react";
import Button from "../../../components/Button";
import Table from "../../../components/Table";
import Modal from "../../../components/Modal";
import SelectBox from "../../../components/SelectBox";
import BlackInputField from "../../../components/BlackInputField";
import Pagination from "../../../components/Pagination";
import usePaginatedList from "../../../hooks/usePaginatedList";
import examPaperService from "../services/examPaperService";
import examTermService from "../services/examTermService";
import classSectionService from "../../students/services/classSectionService";
import subjectService from "../services/subjectService";

const asList = (data) => (Array.isArray(data) ? data : data?.results || []);

const classSectionLabel = (cs) => cs?.name || `Class ${cs?.grade ?? "?"} - ${cs?.section ?? "?"}`;

const emptyForm = { exam_term: "", class_section: "", subject: "", total_marks: "" };

const ExamPapers = () => {
  const navigate = useNavigate();

  const [examTerms, setExamTerms] = useState([]);
  const [classSections, setClassSections] = useState([]);
  const [subjects, setSubjects] = useState([]);

  const [filterExamTerm, setFilterExamTerm] = useState("");
  const [filterClassSection, setFilterClassSection] = useState("");
  const [filterSubject, setFilterSubject] = useState("");

  const [showCreate, setShowCreate] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [errors, setErrors] = useState({});
  const [saving, setSaving] = useState(false);

  const {
    items: papers,
    page,
    setPage,
    totalPages,
    count,
    pageSize,
    loading,
  } = usePaginatedList(examPaperService.getExamPapers, {
    exam_term: filterExamTerm,
    class_section: filterClassSection,
    subject: filterSubject,
  });

  useEffect(() => {
    const load = async () => {
      try {
        const [etRes, csRes, subRes] = await Promise.all([
          examTermService.getExamTerms(),
          classSectionService.getClassSections(),
          subjectService.getSubjects(),
        ]);
        setExamTerms(asList(etRes.data));
        setClassSections(asList(csRes.data));
        setSubjects(asList(subRes.data));
      } catch (err) {
        console.error("Failed to load exam-paper filter data:", err);
        toast.error("Failed to load exam terms / classes / subjects.");
      }
    };
    load();
  }, []);

  const examTermOptions = useMemo(
    () => [{ label: "All terms", value: "" }, ...examTerms.map((t) => ({ label: t.name, value: String(t.id) }))],
    [examTerms]
  );
  const classSectionOptions = useMemo(
    () => [{ label: "All classes", value: "" }, ...classSections.map((cs) => ({ label: classSectionLabel(cs), value: String(cs.id) }))],
    [classSections]
  );
  const subjectOptions = useMemo(
    () => [{ label: "All subjects", value: "" }, ...subjects.map((s) => ({ label: s.name, value: String(s.id) }))],
    [subjects]
  );

  const formClassSectionOptions = useMemo(
    () => classSections.map((cs) => ({ label: classSectionLabel(cs), value: String(cs.id) })),
    [classSections]
  );
  const formSubjectOptions = useMemo(() => subjects.map((s) => ({ label: s.name, value: String(s.id) })), [subjects]);
  const formExamTermOptions = useMemo(() => examTerms.map((t) => ({ label: t.name, value: String(t.id) })), [examTerms]);

  const examTermName = (id) => examTerms.find((t) => String(t.id) === String(id))?.name || "—";
  const classSectionName = (id) => {
    const cs = classSections.find((c) => String(c.id) === String(id));
    return cs ? classSectionLabel(cs) : "—";
  };
  const subjectName = (id) => subjects.find((s) => String(s.id) === String(id))?.name || "—";

  const columns = [
    { header: "Exam Term", accessor: (row) => <span className="font-semibold text-ink-900">{examTermName(row.exam_term)}</span> },
    { header: "Class & Section", accessor: (row) => classSectionName(row.class_section) },
    { header: "Subject", accessor: (row) => subjectName(row.subject) },
    { header: "Total Marks", accessor: (row) => row.total_marks },
    {
      header: "Status",
      accessor: (row) => (
        <span
          className={`inline-flex items-center gap-1 text-[11.5px] font-bold rounded-full px-2.5 py-0.5 ${
            row.paper_finalized ? "bg-success-tint text-success-hex" : "bg-warning-tint text-warning-hex"
          }`}
        >
          {row.paper_finalized ? "FINALIZED" : "DRAFT"}
        </span>
      ),
    },
    {
      header: "",
      accessor: (row) => (
        <Button variant="outline" size="compact" onClick={() => navigate(`/paper-setting/${row.id}`)}>
          Open builder →
        </Button>
      ),
    },
  ];

  const resetForm = () => {
    setForm(emptyForm);
    setErrors({});
  };

  const validate = () => {
    const newErrors = {};
    if (!form.exam_term) newErrors.exam_term = "Required";
    if (!form.class_section) newErrors.class_section = "Required";
    if (!form.subject) newErrors.subject = "Required";
    if (!form.total_marks || Number(form.total_marks) <= 0) newErrors.total_marks = "Required";
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleCreate = async () => {
    if (!validate()) {
      toast.error("Please fill in all required fields.");
      return;
    }
    setSaving(true);
    try {
      const res = await examPaperService.createExamPaper({
        exam_term: Number(form.exam_term),
        class_section: Number(form.class_section),
        subject: Number(form.subject),
        total_marks: form.total_marks,
      });
      toast.success("Exam paper created — set a blueprint next.");
      setShowCreate(false);
      resetForm();
      navigate(`/paper-setting/${res.data.id}`);
    } catch (err) {
      console.error("Failed to create exam paper:", err);
      toast.error(
        err?.response?.data?.non_field_errors?.[0] ||
          err?.response?.data?.error ||
          "Failed to create exam paper (an exam paper may already exist for this term/class/subject)."
      );
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="w-full">
      <div className="flex items-center gap-3 pb-4 border-b border-cn-border mb-6 flex-wrap">
        <div className="flex-1 min-w-0">
          <h1 className="font-heading font-bold text-2xl text-violet-950">Paper Setting</h1>
          <p className="text-ink-500 text-[13px] mt-1">Syllabus-driven exam paper composition</p>
        </div>
        <Button variant="outline" icon={<Layers size={16} />} onClick={() => navigate("/paper-setting/syllabus-topics")}>
          Syllabus Topics
        </Button>
        <Button variant="outline" icon={<BookOpen size={16} />} onClick={() => navigate("/paper-setting/question-bank")}>
          Question Bank
        </Button>
        <Button
          variant="primary"
          icon={<Plus size={16} />}
          onClick={() => {
            resetForm();
            setShowCreate(true);
          }}
        >
          New Exam Paper
        </Button>
      </div>

      <div className="flex flex-wrap gap-3 mb-4">
        <SelectBox className="w-56" fieldName="filter_exam_term" value={filterExamTerm} onChange={(e) => setFilterExamTerm(e.target.value)} options={examTermOptions} />
        <SelectBox className="w-56" fieldName="filter_class_section" value={filterClassSection} onChange={(e) => setFilterClassSection(e.target.value)} options={classSectionOptions} />
        <SelectBox className="w-56" fieldName="filter_subject" value={filterSubject} onChange={(e) => setFilterSubject(e.target.value)} options={subjectOptions} />
      </div>

      <Table
        columns={columns}
        data={papers}
        loading={loading}
        emptyMessage="No exam papers yet"
        emptyDescription="Click “New Exam Paper” to start composing one from the syllabus."
      />
      <Pagination page={page} totalPages={totalPages} count={count} pageSize={pageSize} onPageChange={setPage} loading={loading} />

      <Modal isOpen={showCreate} onClose={() => setShowCreate(false)} title="New exam paper">
        <div className="flex flex-col gap-3 w-[380px] max-w-full">
          <SelectBox label="Exam Term" fieldName="exam_term" value={form.exam_term} onChange={(e) => setForm((p) => ({ ...p, exam_term: e.target.value }))} options={formExamTermOptions} required error={errors.exam_term} />
          <SelectBox label="Class & Section" fieldName="class_section" value={form.class_section} onChange={(e) => setForm((p) => ({ ...p, class_section: e.target.value }))} options={formClassSectionOptions} required error={errors.class_section} />
          <SelectBox label="Subject" fieldName="subject" value={form.subject} onChange={(e) => setForm((p) => ({ ...p, subject: e.target.value }))} options={formSubjectOptions} required error={errors.subject} />
          <BlackInputField label="Total Marks" fieldName="total_marks" type="number" value={form.total_marks} onChange={(e) => setForm((p) => ({ ...p, total_marks: e.target.value }))} required error={errors.total_marks} />
          <div className="flex gap-3 justify-end pt-2">
            <Button variant="outline" onClick={() => setShowCreate(false)}>
              Cancel
            </Button>
            <Button variant="primary" onClick={handleCreate} loading={saving}>
              Create & build paper →
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default ExamPapers;
