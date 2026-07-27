import React, { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import { Plus, ClipboardList, BookOpen } from "lucide-react";
import Button from "../../../components/Button";
import Table from "../../../components/Table";
import Modal from "../../../components/Modal";
import SelectBox from "../../../components/SelectBox";
import BlackInputField from "../../../components/BlackInputField";
import syllabusTopicService from "../services/syllabusTopicService";
import classSectionService from "../../students/services/classSectionService";
import subjectService from "../services/subjectService";

const asList = (data) => (Array.isArray(data) ? data : data?.results || []);
const classSectionLabel = (cs) => cs?.name || `Class ${cs?.grade ?? "?"} - ${cs?.section ?? "?"}`;

const emptyForm = { id: null, name: "", order: "0", description: "" };

const SyllabusTopics = () => {
  const navigate = useNavigate();

  const [classSections, setClassSections] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [classSection, setClassSection] = useState("");
  const [subject, setSubject] = useState("");

  const [topics, setTopics] = useState([]);
  const [loading, setLoading] = useState(false);

  const [showModal, setShowModal] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [errors, setErrors] = useState({});
  const [saving, setSaving] = useState(false);

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

  const classSectionOptions = useMemo(() => classSections.map((cs) => ({ label: classSectionLabel(cs), value: String(cs.id) })), [classSections]);
  const subjectOptions = useMemo(() => subjects.map((s) => ({ label: s.name, value: String(s.id) })), [subjects]);

  const fetchTopics = async () => {
    if (!classSection || !subject) return;
    setLoading(true);
    try {
      const res = await syllabusTopicService.getAllTopics({ class_section: classSection, subject });
      setTopics(asList(res.data));
    } catch (err) {
      console.error("Failed to load syllabus topics:", err);
      toast.error("Failed to load syllabus topics.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTopics();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [classSection, subject]);

  const columns = [
    { header: "Order", accessor: "order" },
    { header: "Topic", accessor: (row) => <span className="font-semibold text-ink-900">{row.name}</span> },
    { header: "Description", accessor: (row) => <span className="text-ink-500">{row.description || "—"}</span> },
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
    setForm({ id: row.id, name: row.name, order: String(row.order ?? 0), description: row.description || "" });
    setIsEditing(true);
    setErrors({});
    setShowModal(true);
  };

  const handleDelete = async (row) => {
    if (!window.confirm(`Delete syllabus topic "${row.name}"? Bank questions tagged with it will keep their tag but lose the topic link.`)) return;
    try {
      await syllabusTopicService.deleteTopic(row.id);
      toast.success("Topic deleted.");
      fetchTopics();
    } catch (err) {
      console.error("Failed to delete topic:", err);
      toast.error(err?.response?.data?.detail || "Failed to delete topic.");
    }
  };

  const validate = () => {
    const newErrors = {};
    if (!form.name.trim()) newErrors.name = "Required";
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
        name: form.name.trim(),
        order: Number(form.order) || 0,
        description: form.description.trim() || null,
      };
      if (isEditing) {
        await syllabusTopicService.updateTopic(form.id, payload);
        toast.success("Topic updated.");
      } else {
        await syllabusTopicService.createTopic(payload);
        toast.success("Topic added.");
      }
      setShowModal(false);
      resetForm();
      fetchTopics();
    } catch (err) {
      console.error("Failed to save topic:", err);
      toast.error(err?.response?.data?.name?.[0] || err?.response?.data?.error || "Failed to save topic.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="w-full">
      <div className="flex items-center gap-3 pb-4 border-b border-cn-border mb-6 flex-wrap">
        <div className="flex-1 min-w-0">
          <h1 className="font-heading font-bold text-2xl text-violet-950">Syllabus Topics</h1>
          <p className="text-ink-500 text-[13px] mt-1">Per-class, per-subject topics used to tag the question bank</p>
        </div>
        <Button variant="outline" icon={<ClipboardList size={16} />} onClick={() => navigate("/paper-setting")}>
          Exam Papers
        </Button>
        <Button variant="outline" icon={<BookOpen size={16} />} onClick={() => navigate("/paper-setting/question-bank")}>
          Question Bank
        </Button>
        <Button variant="primary" icon={<Plus size={16} />} onClick={openCreate}>
          Add Topic
        </Button>
      </div>

      <div className="flex flex-wrap gap-3 mb-4">
        <SelectBox className="w-56" label="Class & Section" fieldName="class_section" value={classSection} onChange={(e) => setClassSection(e.target.value)} options={classSectionOptions} />
        <SelectBox className="w-56" label="Subject" fieldName="subject" value={subject} onChange={(e) => setSubject(e.target.value)} options={subjectOptions} />
      </div>

      <Table
        columns={columns}
        data={topics}
        loading={loading}
        onEdit={openEdit}
        onDelete={handleDelete}
        emptyMessage="No syllabus topics yet"
        emptyDescription="Add the first topic for this class and subject."
      />

      <Modal isOpen={showModal} onClose={() => setShowModal(false)} title={isEditing ? "Edit topic" : "Add topic"}>
        <div className="flex flex-col gap-3 w-[360px] max-w-full">
          <BlackInputField label="Topic Name" fieldName="name" value={form.name} onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))} required error={errors.name} />
          <BlackInputField label="Order" fieldName="order" type="number" value={form.order} onChange={(e) => setForm((p) => ({ ...p, order: e.target.value }))} />
          <div>
            <label className="block text-sm font-medium mb-1 text-dark">Description</label>
            <textarea
              value={form.description}
              onChange={(e) => setForm((p) => ({ ...p, description: e.target.value }))}
              rows={3}
              className="w-full px-4 py-2 border border-slate-300 rounded-md bg-transparent text-[0.85rem] text-dark outline-none focus:border-violet-500"
            />
          </div>
          <div className="flex gap-3 justify-end pt-2">
            <Button variant="outline" onClick={() => setShowModal(false)}>
              Cancel
            </Button>
            <Button variant="primary" onClick={handleSubmit} loading={saving}>
              {isEditing ? "Save changes" : "Add topic"}
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default SyllabusTopics;
