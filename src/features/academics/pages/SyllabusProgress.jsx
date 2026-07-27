import React, { useEffect, useState } from "react";
import { toast } from "react-toastify";
import {
  BookOpen,
  CheckCircle2,
  Clock,
  AlertCircle,
  Plus,
  Edit3,
  TrendingUp,
  Filter,
  Layers,
  Calendar,
} from "lucide-react";
import Button from "../../../components/Button";
import Modal from "../../../components/Modal";
import SelectBox from "../../../components/SelectBox";
import BlackInputField from "../../../components/BlackInputField";
import syllabusService from "../services/syllabusService";
import api from "../../../services/api";
import useUser from "../../auth/hooks/useUser";

const asList = (data) => (Array.isArray(data) ? data : data?.results || []);

const STATUS_OPTIONS = [
  { label: "Completed", value: "completed" },
  { label: "In Progress", value: "in_progress" },
  { label: "Pending / Not Started", value: "not_started" },
];

const SyllabusProgress = () => {
  const { user } = useUser();
  const roleName = user?.data?.role || "Admin";
  const isTeacher = roleName === "Teacher";
  const isParent = roleName === "Parent";
  const isStudent = roleName === "Student";
  const canEdit = ["Admin", "School Admin", "Superuser", "Principal", "Teacher"].includes(roleName);

  const [classSections, setClassSections] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [selectedClass, setSelectedClass] = useState("");
  const [selectedSubject, setSelectedSubject] = useState("");

  const [summaryData, setSummaryData] = useState(null);
  const [topics, setTopics] = useState([]);
  const [loading, setLoading] = useState(false);

  // Edit Topic Modal
  const [editingTopic, setEditingTopic] = useState(null);
  const [editStatus, setEditStatus] = useState("in_progress");
  const [editPct, setEditPct] = useState(50);
  const [editNotes, setEditNotes] = useState("");
  const [editTargetDate, setEditTargetDate] = useState("");
  const [saving, setSaving] = useState(false);

  // Add Topic Modal
  const [showAddModal, setShowAddModal] = useState(false);
  const [addForm, setAddForm] = useState({
    class_section: "",
    subject: "",
    name: "",
    order: 1,
    target_completion_date: "",
    description: "",
  });

  const loadClassesAndSubjects = async () => {
    try {
      const [csRes, subjRes] = await Promise.all([
        api.get("class-sections/"),
        api.get("subjects/"),
      ]);
      const csData = asList(csRes.data);
      setClassSections(csData);
      setSubjects(asList(subjRes.data));

      if (csData.length > 0 && !selectedClass) {
        setSelectedClass(String(csData[0].id));
      }
    } catch (err) {
      console.error("Failed to load classes or subjects:", err);
    }
  };

  const loadProgressData = async () => {
    setLoading(true);
    try {
      const params = {};
      if (selectedClass) params.class_section = selectedClass;
      if (selectedSubject) params.subject = selectedSubject;

      const [summaryRes, topicsRes] = await Promise.all([
        syllabusService.getProgressSummary(params),
        syllabusService.getSyllabusTopics(params),
      ]);

      setSummaryData(summaryRes.data);
      setTopics(asList(topicsRes.data));
    } catch (err) {
      console.error("Failed to load syllabus progress:", err);
      toast.error("Failed to load syllabus progress.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadClassesAndSubjects();
  }, []);

  useEffect(() => {
    loadProgressData();
  }, [selectedClass, selectedSubject]);

  const openEditModal = (topic) => {
    setEditingTopic(topic);
    setEditStatus(topic.status);
    setEditPct(topic.completion_percentage || (topic.status === "completed" ? 100 : 0));
    setEditNotes(topic.notes || "");
    setEditTargetDate(topic.target_completion_date || "");
  };

  const handleUpdateTopic = async () => {
    if (!editingTopic) return;
    setSaving(true);
    try {
      const payload = {
        status: editStatus,
        completion_percentage: editStatus === "completed" ? 100 : editStatus === "not_started" ? 0 : Number(editPct),
        notes: editNotes,
        target_completion_date: editTargetDate || null,
      };
      await syllabusService.updateSyllabusTopic(editingTopic.id, payload);
      toast.success("Syllabus topic progress updated!");
      setEditingTopic(null);
      loadProgressData();
    } catch (err) {
      console.error("Failed to update syllabus topic:", err);
      toast.error("Failed to save progress update.");
    } finally {
      setSaving(false);
    }
  };

  const handleCreateTopic = async () => {
    if (!addForm.name.trim() || !addForm.class_section || !addForm.subject) {
      toast.error("Class, subject, and topic name are required.");
      return;
    }
    setSaving(true);
    try {
      await syllabusService.createSyllabusTopic({
        class_section: Number(addForm.class_section),
        subject: Number(addForm.subject),
        name: addForm.name.trim(),
        order: Number(addForm.order) || 1,
        target_completion_date: addForm.target_completion_date || null,
        description: addForm.description,
      });
      toast.success("New syllabus topic added.");
      setShowAddModal(false);
      setAddForm({ class_section: selectedClass, subject: "", name: "", order: 1, target_completion_date: "", description: "" });
      loadProgressData();
    } catch (err) {
      console.error("Failed to add syllabus topic:", err);
      toast.error("Failed to create syllabus topic.");
    } finally {
      setSaving(false);
    }
  };

  const classOptions = classSections.map((cs) => ({
    label: cs.display_name || `Class ${cs.grade_level}-${cs.section_name}`,
    value: String(cs.id),
  }));

  const subjectOptions = subjects.map((s) => ({
    label: s.name,
    value: String(s.id),
  }));

  const getStatusBadge = (status, pct) => {
    switch (status) {
      case "completed":
        return (
          <span className="bg-emerald-50 text-emerald-700 border border-emerald-200 text-[11.5px] font-bold rounded-full px-2.5 py-0.5 inline-flex items-center gap-1">
            <CheckCircle2 size={13} /> Completed (100%)
          </span>
        );
      case "in_progress":
        return (
          <span className="bg-sky-50 text-sky-700 border border-sky-200 text-[11.5px] font-bold rounded-full px-2.5 py-0.5 inline-flex items-center gap-1">
            <Clock size={13} /> In Progress ({pct}%)
          </span>
        );
      default:
        return (
          <span className="bg-slate-100 text-slate-700 border border-slate-200 text-[11.5px] font-medium rounded-full px-2.5 py-0.5 inline-flex items-center gap-1">
            <AlertCircle size={13} /> Pending
          </span>
        );
    }
  };

  const overall = summaryData?.overall || { total_topics: 0, completed_topics: 0, in_progress_topics: 0, not_started_topics: 0, completion_pct: 0 };
  const subjectsList = summaryData?.subjects || [];

  return (
    <div className="w-full">
      {/* Header */}
      <div className="flex items-center gap-3 pb-4 border-b border-cn-border mb-6 flex-wrap">
        <div className="flex-1 min-w-0">
          <h1 className="font-heading font-bold text-2xl text-violet-950">Syllabus Progress Tracker</h1>
          <p className="text-ink-500 text-[13px] mt-1">Real-time syllabus completion status and unit coverage tracking</p>
        </div>
        {canEdit && (
          <Button variant="primary" icon={<Plus size={16} />} onClick={() => {
            setAddForm((p) => ({ ...p, class_section: selectedClass }));
            setShowAddModal(true);
          }}>
            Add Syllabus Topic
          </Button>
        )}
      </div>

      {/* Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 mb-6">
        <div className="bg-gradient-to-br from-violet-900 to-violet-950 text-white rounded-2xl p-4 flex flex-col justify-between shadow-md">
          <div className="flex items-center justify-between text-violet-200 text-[12px] font-bold uppercase tracking-wider">
            <span>Syllabus Coverage</span>
            <TrendingUp size={16} />
          </div>
          <div className="mt-3">
            <div className="text-3xl font-extrabold">{overall.completion_pct}%</div>
            <div className="w-full bg-violet-800/60 rounded-full h-2 mt-2 overflow-hidden">
              <div className="bg-emerald-400 h-2 rounded-full transition-all duration-500" style={{ width: `${overall.completion_pct}%` }} />
            </div>
          </div>
        </div>

        <div className="bg-emerald-50/70 border border-emerald-200 rounded-2xl p-4 flex flex-col justify-between shadow-xs">
          <span className="text-emerald-800 text-[12px] font-bold uppercase">Completed Topics</span>
          <div className="text-2xl font-extrabold text-emerald-950 mt-2">{overall.completed_topics} <span className="text-xs font-semibold text-emerald-700">/ {overall.total_topics} topics</span></div>
        </div>

        <div className="bg-sky-50/70 border border-sky-200 rounded-2xl p-4 flex flex-col justify-between shadow-xs">
          <span className="text-sky-800 text-[12px] font-bold uppercase">In Progress</span>
          <div className="text-2xl font-extrabold text-sky-950 mt-2">{overall.in_progress_topics} <span className="text-xs font-semibold text-sky-700">topics</span></div>
        </div>

        <div className="bg-slate-100/70 border border-slate-200 rounded-2xl p-4 flex flex-col justify-between shadow-xs">
          <span className="text-slate-700 text-[12px] font-bold uppercase">Pending Topics</span>
          <div className="text-2xl font-extrabold text-slate-900 mt-2">{overall.not_started_topics} <span className="text-xs font-semibold text-slate-600">topics</span></div>
        </div>
      </div>

      {/* Filter Controls */}
      <div className="flex items-center gap-3 mb-6 bg-violet-50/40 p-3.5 rounded-2xl border border-violet-100 flex-wrap">
        <Filter size={16} className="text-violet-700 ml-1" />
        <SelectBox
          className="w-56"
          label="Class Section"
          fieldName="class_section"
          value={selectedClass}
          onChange={(e) => setSelectedClass(e.target.value)}
          options={classOptions}
        />
        <SelectBox
          className="w-56"
          label="Subject Filter"
          fieldName="subject"
          value={selectedSubject}
          onChange={(e) => setSelectedSubject(e.target.value)}
          options={[{ label: "All Subjects", value: "" }, ...subjectOptions]}
        />
      </div>

      {/* Subject Coverage Cards */}
      <div className="mb-8">
        <h2 className="font-heading font-bold text-lg text-violet-950 mb-3 flex items-center gap-2">
          <Layers size={18} className="text-violet-700" /> Subject Coverage Summary
        </h2>
        {subjectsList.length === 0 ? (
          <p className="text-ink-400 text-[13px]">No syllabus summary available for this filter.</p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {subjectsList.map((subj) => (
              <div key={`${subj.class_section_id}-${subj.subject_id}`} className="bg-cn-surface border border-cn-border rounded-2xl p-4 shadow-xs flex flex-col gap-3">
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="font-heading font-bold text-base text-violet-950">{subj.subject_name}</h3>
                    <span className="text-[11.5px] font-medium text-ink-500">{subj.class_section_name}</span>
                  </div>
                  <span className="text-xl font-extrabold text-violet-900">{subj.overall_completion_pct}%</span>
                </div>

                {/* Progress bar */}
                <div className="w-full bg-slate-100 rounded-full h-2.5 overflow-hidden">
                  <div
                    className="bg-gradient-to-r from-violet-600 to-emerald-500 h-2.5 rounded-full transition-all duration-500"
                    style={{ width: `${subj.overall_completion_pct}%` }}
                  />
                </div>

                <div className="grid grid-cols-3 gap-2 pt-2 border-t border-cn-border text-center text-[11.5px]">
                  <div className="bg-emerald-50 text-emerald-800 rounded-xl p-1.5 font-bold">
                    {subj.completed_topics} Done
                  </div>
                  <div className="bg-sky-50 text-sky-800 rounded-xl p-1.5 font-bold">
                    {subj.in_progress_topics} Active
                  </div>
                  <div className="bg-slate-100 text-slate-700 rounded-xl p-1.5 font-semibold">
                    {subj.not_started_topics} Pending
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Topics Breakdown List */}
      <div>
        <h2 className="font-heading font-bold text-lg text-violet-950 mb-3 flex items-center gap-2">
          <BookOpen size={18} className="text-violet-700" /> Syllabus Topic Breakdown
        </h2>

        {loading ? (
          <p className="text-ink-400 text-[13px]">Loading topics…</p>
        ) : topics.length === 0 ? (
          <p className="text-ink-400 text-[13px]">No topics found for this selection.</p>
        ) : (
          <div className="flex flex-col gap-3">
            {topics.map((t) => (
              <div
                key={t.id}
                className="bg-cn-surface border border-cn-border rounded-2xl p-4 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:border-violet-300 transition-colors"
              >
                <div className="flex items-start gap-3 min-w-0 flex-1">
                  <div className="w-8 h-8 rounded-xl bg-violet-100 text-violet-800 font-extrabold text-sm flex items-center justify-center shrink-0 mt-0.5">
                    {t.order}
                  </div>
                  <div className="flex flex-col gap-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h4 className="font-bold text-violet-950 text-[14.5px]">{t.name}</h4>
                      <span className="text-[11px] font-semibold text-ink-500 bg-slate-100 px-2 py-0.5 rounded-full">
                        {t.subject_name} ({t.class_section_name})
                      </span>
                    </div>

                    {t.description && <p className="text-[12.5px] text-ink-600 line-clamp-1">{t.description}</p>}

                    {t.notes && (
                      <div className="text-[12px] text-violet-900 bg-violet-50/60 p-2 rounded-xl border border-violet-100 mt-1 font-medium">
                        📝 <b>Teacher Notes:</b> {t.notes}
                      </div>
                    )}

                    <div className="flex items-center gap-4 text-[11.5px] text-ink-400 mt-0.5 flex-wrap">
                      {t.target_completion_date && (
                        <span className="flex items-center gap-1 font-medium">
                          <Calendar size={13} /> Target: {t.target_completion_date}
                        </span>
                      )}
                      {t.updated_by_name && (
                        <span>Updated by {t.updated_by_name}</span>
                      )}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-3 justify-between sm:justify-end shrink-0 pt-2 sm:pt-0 border-t sm:border-t-0 border-cn-border">
                  {getStatusBadge(t.status, t.completion_percentage)}

                  {canEdit && (
                    <Button
                      variant="outline"
                      size="compact"
                      icon={<Edit3 size={14} />}
                      onClick={() => openEditModal(t)}
                    >
                      Update
                    </Button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Edit Topic Progress Modal */}
      <Modal isOpen={!!editingTopic} onClose={() => setEditingTopic(null)} title="Update Topic Progress">
        {editingTopic && (
          <div className="flex flex-col gap-4 w-[380px] max-w-full">
            <div className="bg-violet-50 p-3.5 rounded-xl border border-violet-100">
              <h3 className="font-bold text-violet-950 text-base">{editingTopic.name}</h3>
              <span className="text-[12px] font-semibold text-violet-800">
                {editingTopic.subject_name} • {editingTopic.class_section_name}
              </span>
            </div>

            <SelectBox
              label="Completion Status"
              fieldName="editStatus"
              value={editStatus}
              onChange={(e) => {
                const st = e.target.value;
                setEditStatus(st);
                if (st === "completed") setEditPct(100);
                else if (st === "not_started") setEditPct(0);
                else if (editPct === 0 || editPct === 100) setEditPct(50);
              }}
              options={STATUS_OPTIONS}
            />

            {editStatus === "in_progress" && (
              <div className="flex flex-col gap-1.5">
                <div className="flex justify-between items-center text-[13px] font-bold text-violet-950">
                  <span>Completion Percentage:</span>
                  <span className="text-violet-700">{editPct}%</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="100"
                  step="5"
                  value={editPct}
                  onChange={(e) => setEditPct(Number(e.target.value))}
                  className="w-full accent-violet-700 cursor-pointer"
                />
              </div>
            )}

            <BlackInputField
              label="Target Completion Date"
              fieldName="editTargetDate"
              type="date"
              value={editTargetDate}
              onChange={(e) => setEditTargetDate(e.target.value)}
            />

            <div className="flex flex-col gap-1.5">
              <label className="text-[13px] font-medium text-black">Teacher Notes / Remarks</label>
              <textarea
                rows={3}
                placeholder="e.g., Covered Section 3.1 & 3.2, exercises 1-15 assigned"
                value={editNotes}
                onChange={(e) => setEditNotes(e.target.value)}
                className="w-full p-3 text-[13px] border border-cn-border rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-violet-500/20 focus:border-violet-400 font-medium"
              />
            </div>

            <div className="flex gap-2 justify-end pt-2 border-t border-cn-border">
              <Button variant="outline" onClick={() => setEditingTopic(null)}>
                Cancel
              </Button>
              <Button variant="primary" onClick={handleUpdateTopic} loading={saving}>
                Save Progress
              </Button>
            </div>
          </div>
        )}
      </Modal>

      {/* Add Topic Modal */}
      <Modal isOpen={showAddModal} onClose={() => setShowAddModal(false)} title="Add Syllabus Topic">
        <div className="flex flex-col gap-3.5 w-[380px] max-w-full">
          <SelectBox
            label="Class Section *"
            fieldName="class_section"
            value={addForm.class_section}
            onChange={(e) => setAddForm((p) => ({ ...p, class_section: e.target.value }))}
            options={[{ label: "Select Class", value: "" }, ...classOptions]}
          />

          <SelectBox
            label="Subject *"
            fieldName="subject"
            value={addForm.subject}
            onChange={(e) => setAddForm((p) => ({ ...p, subject: e.target.value }))}
            options={[{ label: "Select Subject", value: "" }, ...subjectOptions]}
          />

          <BlackInputField
            label="Topic / Unit Name *"
            fieldName="name"
            placeholder="e.g. Chapter 4: Linear Equations"
            value={addForm.name}
            onChange={(e) => setAddForm((p) => ({ ...p, name: e.target.value }))}
            required
          />

          <div className="grid grid-cols-2 gap-3">
            <BlackInputField
              label="Order #"
              fieldName="order"
              type="number"
              value={addForm.order}
              onChange={(e) => setAddForm((p) => ({ ...p, order: e.target.value }))}
            />
            <BlackInputField
              label="Target Date"
              fieldName="target_completion_date"
              type="date"
              value={addForm.target_completion_date}
              onChange={(e) => setAddForm((p) => ({ ...p, target_completion_date: e.target.value }))}
            />
          </div>

          <div className="flex gap-2 justify-end pt-3 border-t border-cn-border">
            <Button variant="outline" onClick={() => setShowAddModal(false)}>
              Cancel
            </Button>
            <Button variant="primary" onClick={handleCreateTopic} loading={saving}>
              Create Topic
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default SyllabusProgress;
