import React, { useEffect, useMemo, useState } from "react";
import { toast } from "react-toastify";
import { Plus } from "lucide-react";
import Button from "../../../components/Button";
import Table from "../../../components/Table";
import Modal from "../../../components/Modal";
import SelectBox from "../../../components/SelectBox";
import BlackInputField from "../../../components/BlackInputField";
import homeworkService from "../services/homeworkService";
import classSectionService from "../../students/services/classSectionService";
import subjectService from "../services/subjectService";
import useUser from "../../auth/hooks/useUser";

const asList = (data) => (Array.isArray(data) ? data : data?.results || []);
const classSectionLabel = (cs) => cs?.name || `Class ${cs?.grade ?? "?"} - ${cs?.section ?? "?"}`;

const emptyForm = { id: null, title: "", description: "", due_date: "" };

const HomeworkBoard = () => {
  const { user } = useUser();
  const roleName = user?.data?.role || "Admin";
  // Read-only: Parent sees their linked child's class, Student sees their
  // own — neither can post/edit/delete a class assignment.
  const isReadOnly = ["Parent", "Student"].includes(roleName);
  const isStudent = roleName === "Student";
  const ownClassSectionId = user?.data?.class_section_id;

  const [classSections, setClassSections] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [classSection, setClassSection] = useState("");
  const [subject, setSubject] = useState("");

  const [homework, setHomework] = useState([]);
  const [loading, setLoading] = useState(false);

  const [showModal, setShowModal] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [errors, setErrors] = useState({});
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const load = async () => {
      try {
        const csRes = await classSectionService.getClassSections();
        const csList = asList(csRes.data);
        setClassSections(csList);
        if (isStudent && ownClassSectionId) {
          setClassSection(String(ownClassSectionId));
        } else if (csList.length > 0) {
          setClassSection(String(csList[0].id));
        }
      } catch (err) {
        console.error("Failed to load class sections:", err);
        toast.error("Failed to load classes.");
      }

      // Subject list is Teacher+ only (drives the post/edit form) — Parent
      // and Student never see that form, so skip the call entirely rather
      // than let a 403 here (via Promise.all) take down the class list too.
      if (isReadOnly) return;
      try {
        const subRes = await subjectService.getSubjects();
        const subList = asList(subRes.data);
        setSubjects(subList);
        if (subList.length > 0) setSubject(String(subList[0].id));
      } catch (err) {
        console.error("Failed to load subjects:", err);
        toast.error("Failed to load subjects.");
      }
    };
    load();
    // RoleRoute blocks rendering until `user` is loaded, so isStudent/
    // ownClassSectionId are already correct on this first (only) run.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const fetchHomework = async () => {
    if (!classSection) return;
    setLoading(true);
    try {
      const res = await homeworkService.getHomework({ class_section: classSection });
      setHomework(asList(res.data));
    } catch (err) {
      console.error("Failed to load homework:", err);
      toast.error("Failed to load homework.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchHomework();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [classSection]);

  const classSectionOptions = useMemo(() => classSections.map((cs) => ({ label: classSectionLabel(cs), value: String(cs.id) })), [classSections]);
  const subjectOptions = useMemo(() => subjects.map((s) => ({ label: s.name, value: String(s.id) })), [subjects]);

  const columns = [
    { header: "Title", accessor: (row) => <span className="font-semibold text-ink-900">{row.title}</span> },
    { header: "Subject", accessor: (row) => row.subject_name || "—" },
    { header: "Due date", accessor: "due_date" },
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
    setForm({ id: row.id, title: row.title, description: row.description || "", due_date: row.due_date });
    setIsEditing(true);
    setErrors({});
    setShowModal(true);
  };

  const handleDelete = async (row) => {
    if (!window.confirm(`Delete homework "${row.title}"?`)) return;
    try {
      await homeworkService.deleteHomework(row.id);
      toast.success("Homework deleted.");
      fetchHomework();
    } catch (err) {
      console.error("Failed to delete homework:", err);
      toast.error(err?.response?.data?.detail || "Failed to delete homework.");
    }
  };

  const validate = () => {
    const newErrors = {};
    if (!form.title.trim()) newErrors.title = "Required";
    if (!form.due_date) newErrors.due_date = "Required";
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
        title: form.title.trim(),
        description: form.description.trim() || null,
        due_date: form.due_date,
      };
      if (isEditing) {
        await homeworkService.updateHomework(form.id, payload);
        toast.success("Homework updated.");
      } else {
        await homeworkService.createHomework(payload);
        toast.success("Homework posted.");
      }
      setShowModal(false);
      resetForm();
      fetchHomework();
    } catch (err) {
      console.error("Failed to save homework:", err);
      toast.error(err?.response?.data?.error || "Failed to save homework.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="w-full">
      <div className="flex items-center gap-3 pb-4 border-b border-cn-border mb-6 flex-wrap">
        <div className="flex-1 min-w-0">
          <h1 className="font-heading font-bold text-2xl text-violet-950">Homework</h1>
          <p className="text-ink-500 text-[13px] mt-1">
            {isStudent ? "Your class assignments — checked in class, no online submission" : "Class assignments — checked in class, no online submission"}
          </p>
        </div>
        {!isReadOnly && (
          <Button variant="primary" icon={<Plus size={16} />} onClick={openCreate}>
            Post Homework
          </Button>
        )}
      </div>

      <div className="flex flex-wrap gap-3 mb-4">
        {!isStudent && (
          <SelectBox className="w-56" label="Class & Section" fieldName="class_section" value={classSection} onChange={(e) => setClassSection(e.target.value)} options={classSectionOptions} />
        )}
        {!isReadOnly && (
          <SelectBox className="w-56" label="Subject" fieldName="subject" value={subject} onChange={(e) => setSubject(e.target.value)} options={subjectOptions} />
        )}
      </div>

      <Table
        columns={columns}
        data={homework}
        loading={loading}
        onEdit={isReadOnly ? undefined : openEdit}
        onDelete={isReadOnly ? undefined : handleDelete}
        emptyMessage="No homework posted yet"
        emptyDescription="Post the first assignment for this class and subject."
      />

      <Modal isOpen={showModal} onClose={() => setShowModal(false)} title={isEditing ? "Edit homework" : "Post homework"}>
        <div className="flex flex-col gap-3 w-[380px] max-w-full">
          <BlackInputField label="Title" fieldName="title" value={form.title} onChange={(e) => setForm((p) => ({ ...p, title: e.target.value }))} required error={errors.title} />
          <BlackInputField label="Due date" fieldName="due_date" type="date" value={form.due_date} onChange={(e) => setForm((p) => ({ ...p, due_date: e.target.value }))} required error={errors.due_date} />
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
              {isEditing ? "Save changes" : "Post homework"}
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default HomeworkBoard;
