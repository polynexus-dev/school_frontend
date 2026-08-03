import React, { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import { Plus, DoorOpen, IdCard, Send } from "lucide-react";
import Button from "../../../components/Button";
import Table from "../../../components/Table";
import Modal from "../../../components/Modal";
import SelectBox from "../../../components/SelectBox";
import BlackInputField from "../../../components/BlackInputField";
import Pagination from "../../../components/Pagination";
import usePaginatedList from "../../../hooks/usePaginatedList";
import examSchedulingService from "../services/examSchedulingService";
import examTermService from "../services/examTermService";
import classSectionService from "../../students/services/classSectionService";
import subjectService from "../services/subjectService";

const asList = (data) => (Array.isArray(data) ? data : data?.results || []);
const classSectionLabel = (cs) => cs?.display_name || cs?.name || `Class ${cs?.grade ?? "?"} - ${cs?.section ?? "?"}`;

const emptyForm = {
  id: null,
  exam_term: "",
  class_section: "",
  subject: "",
  exam_date: "",
  start_time: "",
  end_time: "",
  room: "",
  max_marks: "100",
  instructions: "",
};

const ExamDatesheet = () => {
  const navigate = useNavigate();

  const [examTerms, setExamTerms] = useState([]);
  const [classSections, setClassSections] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [rooms, setRooms] = useState([]);

  const [filterExamTerm, setFilterExamTerm] = useState("");
  const [filterClassSection, setFilterClassSection] = useState("");

  const [showModal, setShowModal] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [errors, setErrors] = useState({});
  const [saving, setSaving] = useState(false);
  const [publishing, setPublishing] = useState(false);

  const {
    items: schedules,
    page,
    setPage,
    totalPages,
    count,
    pageSize,
    loading,
    refetch,
  } = usePaginatedList(examSchedulingService.getSchedules, {
    exam_term: filterExamTerm,
    class_section: filterClassSection,
  });

  useEffect(() => {
    const load = async () => {
      try {
        const [etRes, csRes, subRes, roomRes] = await Promise.all([
          examTermService.getExamTerms(),
          classSectionService.getClassSections(),
          subjectService.getSubjects(),
          examSchedulingService.getRooms(),
        ]);
        setExamTerms(asList(etRes.data));
        setClassSections(asList(csRes.data));
        setSubjects(asList(subRes.data));
        setRooms(asList(roomRes.data));
      } catch (err) {
        console.error("Failed to load datesheet filter data:", err);
        toast.error("Failed to load exam terms / classes / subjects / rooms.");
      }
    };
    load();
  }, []);

  const examTermOptions = useMemo(() => [{ label: "All terms", value: "" }, ...examTerms.map((t) => ({ label: t.name, value: String(t.id) }))], [examTerms]);
  const classSectionOptions = useMemo(() => [{ label: "All classes", value: "" }, ...classSections.map((cs) => ({ label: classSectionLabel(cs), value: String(cs.id) }))], [classSections]);

  const formExamTermOptions = useMemo(() => examTerms.map((t) => ({ label: t.name, value: String(t.id) })), [examTerms]);
  const formClassSectionOptions = useMemo(() => classSections.map((cs) => ({ label: classSectionLabel(cs), value: String(cs.id) })), [classSections]);
  const formSubjectOptions = useMemo(() => subjects.map((s) => ({ label: s.name, value: String(s.id) })), [subjects]);
  const formRoomOptions = useMemo(() => [{ label: "Unassigned", value: "" }, ...rooms.map((r) => ({ label: r.name, value: String(r.id) }))], [rooms]);

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
      exam_term: String(row.exam_term),
      class_section: String(row.class_section),
      subject: String(row.subject),
      exam_date: row.exam_date,
      start_time: row.start_time?.slice(0, 5) || "",
      end_time: row.end_time?.slice(0, 5) || "",
      room: row.room ? String(row.room) : "",
      max_marks: String(row.max_marks),
      instructions: row.instructions || "",
    });
    setIsEditing(true);
    setErrors({});
    setShowModal(true);
  };

  const handleDelete = async (row) => {
    if (!window.confirm("Remove this datesheet entry?")) return;
    try {
      await examSchedulingService.deleteSchedule(row.id);
      toast.success("Datesheet entry removed.");
      refetch();
    } catch (err) {
      console.error("Failed to delete schedule entry:", err);
      toast.error(err?.response?.data?.detail || "Failed to remove datesheet entry.");
    }
  };

  const handlePublish = async () => {
    setPublishing(true);
    try {
      const res = await examSchedulingService.publishSchedule(Number(filterExamTerm), Number(filterClassSection));
      toast.success(`Datesheet published — ${res.data.notified_students} guardian(s) notified.`);
    } catch (err) {
      console.error("Failed to publish datesheet:", err);
      toast.error(err?.response?.data?.error || "Failed to publish datesheet.");
    } finally {
      setPublishing(false);
    }
  };

  const validate = () => {
    const newErrors = {};
    if (!form.exam_term) newErrors.exam_term = "Required";
    if (!form.class_section) newErrors.class_section = "Required";
    if (!form.subject) newErrors.subject = "Required";
    if (!form.exam_date) newErrors.exam_date = "Required";
    if (!form.start_time) newErrors.start_time = "Required";
    if (!form.end_time) newErrors.end_time = "Required";
    if (!form.max_marks || Number(form.max_marks) <= 0) newErrors.max_marks = "Required";
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async () => {
    if (!validate()) {
      toast.error("Please fill in all required fields.");
      return;
    }
    setSaving(true);
    try {
      const payload = {
        exam_term: Number(form.exam_term),
        class_section: Number(form.class_section),
        subject: Number(form.subject),
        exam_date: form.exam_date,
        start_time: form.start_time,
        end_time: form.end_time,
        room: form.room ? Number(form.room) : null,
        max_marks: form.max_marks,
        instructions: form.instructions.trim() || null,
      };
      if (isEditing) {
        await examSchedulingService.updateSchedule(form.id, payload);
        toast.success("Datesheet entry updated.");
      } else {
        await examSchedulingService.createSchedule(payload);
        toast.success("Datesheet entry added.");
      }
      setShowModal(false);
      resetForm();
      refetch();
    } catch (err) {
      console.error("Failed to save datesheet entry:", err);
      toast.error(
        err?.response?.data?.non_field_errors?.[0] || err?.response?.data?.error || "Failed to save (an entry may already exist for this term/class/subject)."
      );
    } finally {
      setSaving(false);
    }
  };

  const columns = [
    { header: "Date", accessor: (row) => row.exam_date },
    { header: "Time", accessor: (row) => `${row.start_time?.slice(0, 5)} - ${row.end_time?.slice(0, 5)}` },
    { header: "Class & Section", accessor: (row) => row.class_section_name || "—" },
    { header: "Subject", accessor: (row) => row.subject_name || "—" },
    { header: "Room", accessor: (row) => row.room_name || "—" },
    { header: "Max Marks", accessor: (row) => row.max_marks },
  ];

  return (
    <div className="w-full">
      <div className="flex items-center gap-3 pb-4 border-b border-cn-border mb-6 flex-wrap">
        <div className="flex-1 min-w-0">
          <h1 className="font-heading font-bold text-2xl text-violet-950">Exam Datesheet</h1>
          <p className="text-ink-500 text-[13px] mt-1">Exam-day schedule — date, time and room per class/subject</p>
        </div>
        <Button variant="outline" icon={<DoorOpen size={16} />} onClick={() => navigate("/academics/exam-rooms")}>
          Exam Rooms
        </Button>
        <Button variant="outline" icon={<IdCard size={16} />} onClick={() => navigate("/academics/seating-arrangements")}>
          Seating Arrangement
        </Button>
        <Button variant="primary" icon={<Plus size={16} />} onClick={openCreate}>
          Add Datesheet Entry
        </Button>
      </div>

      <div className="flex flex-wrap items-center gap-3 mb-4">
        <SelectBox className="w-56" fieldName="filter_exam_term" value={filterExamTerm} onChange={(e) => setFilterExamTerm(e.target.value)} options={examTermOptions} />
        <SelectBox className="w-56" fieldName="filter_class_section" value={filterClassSection} onChange={(e) => setFilterClassSection(e.target.value)} options={classSectionOptions} />
        <Button
          variant="outline"
          icon={<Send size={15} />}
          onClick={handlePublish}
          loading={publishing}
          disabled={!filterExamTerm || !filterClassSection}
          title={!filterExamTerm || !filterClassSection ? "Pick a specific exam term and class/section to publish" : undefined}
        >
          Publish datesheet
        </Button>
      </div>

      <Table
        columns={columns}
        data={schedules}
        loading={loading}
        onEdit={openEdit}
        onDelete={handleDelete}
        emptyMessage="No datesheet entries yet"
        emptyDescription="Click “Add Datesheet Entry” to schedule an exam date/time/room for a class & subject."
      />
      <Pagination page={page} totalPages={totalPages} count={count} pageSize={pageSize} onPageChange={setPage} loading={loading} />

      <Modal isOpen={showModal} onClose={() => setShowModal(false)} title={isEditing ? "Edit datesheet entry" : "Add datesheet entry"}>
        <div className="flex flex-col gap-3 w-[420px] max-w-full">
          <SelectBox label="Exam Term" fieldName="exam_term" value={form.exam_term} onChange={(e) => setForm((p) => ({ ...p, exam_term: e.target.value }))} options={formExamTermOptions} required error={errors.exam_term} />
          <SelectBox label="Class & Section" fieldName="class_section" value={form.class_section} onChange={(e) => setForm((p) => ({ ...p, class_section: e.target.value }))} options={formClassSectionOptions} required error={errors.class_section} />
          <SelectBox label="Subject" fieldName="subject" value={form.subject} onChange={(e) => setForm((p) => ({ ...p, subject: e.target.value }))} options={formSubjectOptions} required error={errors.subject} />
          <BlackInputField label="Exam Date" fieldName="exam_date" type="date" value={form.exam_date} onChange={(e) => setForm((p) => ({ ...p, exam_date: e.target.value }))} required error={errors.exam_date} />
          <div className="grid grid-cols-2 gap-3">
            <BlackInputField label="Start Time" fieldName="start_time" type="time" value={form.start_time} onChange={(e) => setForm((p) => ({ ...p, start_time: e.target.value }))} required error={errors.start_time} />
            <BlackInputField label="End Time" fieldName="end_time" type="time" value={form.end_time} onChange={(e) => setForm((p) => ({ ...p, end_time: e.target.value }))} required error={errors.end_time} />
          </div>
          <SelectBox label="Room (optional)" fieldName="room" value={form.room} onChange={(e) => setForm((p) => ({ ...p, room: e.target.value }))} options={formRoomOptions} />
          <BlackInputField label="Max Marks" fieldName="max_marks" type="number" value={form.max_marks} onChange={(e) => setForm((p) => ({ ...p, max_marks: e.target.value }))} required error={errors.max_marks} />
          <div>
            <label className="block text-sm font-medium mb-1 text-dark">Instructions (optional)</label>
            <textarea
              value={form.instructions}
              onChange={(e) => setForm((p) => ({ ...p, instructions: e.target.value }))}
              rows={2}
              placeholder="e.g. Bring calculator, No electronic devices"
              className="w-full px-4 py-2 border border-slate-300 rounded-md bg-transparent text-[0.85rem] text-dark outline-none focus:border-violet-500"
            />
          </div>
          <div className="flex gap-3 justify-end pt-2">
            <Button variant="outline" onClick={() => setShowModal(false)}>
              Cancel
            </Button>
            <Button variant="primary" onClick={handleSubmit} loading={saving}>
              {isEditing ? "Save changes" : "Add entry"}
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default ExamDatesheet;
