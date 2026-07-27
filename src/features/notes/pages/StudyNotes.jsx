import React, { useEffect, useState } from "react";
import { toast } from "react-toastify";
import {
  FileText,
  Download,
  ExternalLink,
  Plus,
  Trash2,
  BookOpen,
  Video,
  Layers,
  Filter,
  Paperclip,
  User,
  Clock,
} from "lucide-react";
import Button from "../../../components/Button";
import Modal from "../../../components/Modal";
import SelectBox from "../../../components/SelectBox";
import BlackInputField from "../../../components/BlackInputField";
import studyNotesService from "../services/studyNotesService";
import api, { getBaseURL } from "../../../services/api";
import useUser from "../../auth/hooks/useUser";

const asList = (data) => (Array.isArray(data) ? data : data?.results || []);

const MATERIAL_TYPES = [
  { label: "All Types", value: "" },
  { label: "Lecture Notes", value: "notes" },
  { label: "Practice Sheet / Assignment", value: "practice_sheet" },
  { label: "Revision Guide", value: "revision_guide" },
  { label: "Web / Video Link", value: "web_link" },
  { label: "Other Material", value: "other" },
];

const StudyNotes = () => {
  const { user } = useUser();
  const roleName = user?.data?.role || "Admin";
  const canPublish = ["Admin", "School Admin", "Superuser", "Principal", "Teacher"].includes(roleName);

  const [classSections, setClassSections] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [selectedClass, setSelectedClass] = useState("");
  const [selectedSubject, setSelectedSubject] = useState("");
  const [selectedType, setSelectedType] = useState("");

  const [notes, setNotes] = useState([]);
  const [loading, setLoading] = useState(false);

  // Upload Modal State
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [form, setForm] = useState({
    class_section: "",
    subject: "",
    title: "",
    material_type: "notes",
    content: "",
    external_url: "",
  });
  const [selectedFile, setSelectedFile] = useState(null);
  const [uploading, setUploading] = useState(false);

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
        const class8a = csData.find((cs) => String(cs.grade_level) === "8" || cs.display_name?.includes("8"));
        setSelectedClass(String((class8a || csData[0]).id));
      }

    } catch (err) {
      console.error("Failed to load options:", err);
    }
  };

  const loadNotes = async () => {
    setLoading(true);
    try {
      const params = {};
      if (selectedClass) params.class_section = selectedClass;
      if (selectedSubject) params.subject = selectedSubject;
      if (selectedType) params.material_type = selectedType;

      const res = await studyNotesService.getStudyNotes(params);
      setNotes(asList(res.data));
    } catch (err) {
      console.error("Failed to load study notes:", err);
      toast.error("Failed to load study notes.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadClassesAndSubjects();
  }, []);

  useEffect(() => {
    loadNotes();
  }, [selectedClass, selectedSubject, selectedType]);

  const handleUploadSubmit = async () => {
    if (!form.title.trim() || !form.class_section || !form.subject) {
      toast.error("Class, subject, and note title are required.");
      return;
    }
    setUploading(true);
    try {
      const formData = new FormData();
      formData.append("class_section", form.class_section);
      formData.append("subject", form.subject);
      formData.append("title", form.title.trim());
      formData.append("material_type", form.material_type);
      if (form.content) formData.append("content", form.content.trim());
      if (form.external_url) formData.append("external_url", form.external_url.trim());
      if (selectedFile) formData.append("file", selectedFile);

      await studyNotesService.createStudyNote(formData);
      toast.success("Study material uploaded and shared with students!");
      setShowUploadModal(false);
      setForm({ class_section: selectedClass, subject: "", title: "", material_type: "notes", content: "", external_url: "" });
      setSelectedFile(null);
      loadNotes();
    } catch (err) {
      console.error("Failed to upload study note:", err);
      toast.error("Failed to upload study note.");
    } finally {
      setUploading(false);
    }
  };

  const handleDeleteNote = async (id) => {
    if (!window.confirm("Delete this study material?")) return;
    try {
      await studyNotesService.deleteStudyNote(id);
      toast.success("Study material deleted.");
      loadNotes();
    } catch (err) {
      console.error("Failed to delete note:", err);
      toast.error("Failed to delete study material.");
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

  const getTypeIcon = (type) => {
    switch (type) {
      case "web_link":
        return <Video size={18} className="text-rose-600" />;
      case "practice_sheet":
        return <Layers size={18} className="text-sky-600" />;
      case "revision_guide":
        return <BookOpen size={18} className="text-amber-600" />;
      default:
        return <FileText size={18} className="text-violet-600" />;
    }
  };

  const getTypeBadge = (typeDisplay) => {
    return (
      <span className="bg-violet-100 text-violet-900 border border-violet-200 text-[11px] font-extrabold uppercase px-2.5 py-0.5 rounded-full">
        {typeDisplay}
      </span>
    );
  };

  const handleDownload = (noteId) => {
    const downloadUrl = `${getBaseURL()}study-notes/${noteId}/download/`;
    const token = localStorage.getItem("accessToken");
    // Fetch file with auth header or open window
    window.open(downloadUrl, "_blank");
  };

  return (
    <div className="w-full">
      {/* Header */}
      <div className="flex items-center gap-3 pb-4 border-b border-cn-border mb-6 flex-wrap">
        <div className="flex-1 min-w-0">
          <h1 className="font-heading font-bold text-2xl text-violet-950">Study Notes & Learning Materials</h1>
          <p className="text-ink-500 text-[13px] mt-1">Access lecture notes, worksheets, revision guides, and video resources shared by teachers</p>
        </div>
        {canPublish && (
          <Button variant="primary" icon={<Plus size={16} />} onClick={() => {
            setForm((p) => ({ ...p, class_section: selectedClass }));
            setShowUploadModal(true);
          }}>
            Upload & Share Notes
          </Button>
        )}
      </div>

      {/* Filter bar */}
      <div className="flex items-center gap-3 mb-6 bg-violet-50/40 p-3.5 rounded-2xl border border-violet-100 flex-wrap">
        <Filter size={16} className="text-violet-700 ml-1" />
        <SelectBox
          className="w-56"
          label="Class Section"
          fieldName="class_section"
          value={selectedClass}
          onChange={(e) => setSelectedClass(e.target.value)}
          options={[{ label: "All Classes", value: "" }, ...classOptions]}
        />

        <SelectBox
          className="w-56"
          label="Subject Filter"
          fieldName="subject"
          value={selectedSubject}
          onChange={(e) => setSelectedSubject(e.target.value)}
          options={[{ label: "All Subjects", value: "" }, ...subjectOptions]}
        />
        <SelectBox
          className="w-56"
          label="Material Type"
          fieldName="material_type"
          value={selectedType}
          onChange={(e) => setSelectedType(e.target.value)}
          options={MATERIAL_TYPES}
        />
      </div>

      {/* Notes Grid */}
      {loading ? (
        <p className="text-ink-400 text-[13px]">Loading study notes…</p>
      ) : notes.length === 0 ? (
        <div className="bg-cn-surface border border-cn-border rounded-2xl p-10 text-center flex flex-col items-center gap-2">
          <BookOpen size={36} className="text-violet-400 mb-1" />
          <h3 className="font-bold text-violet-950 text-base">No Study Notes Found</h3>
          <p className="text-ink-500 text-[13px] max-w-md">
            No learning materials have been published yet for this class or subject.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {notes.map((note) => (
            <div
              key={note.id}
              className="bg-cn-surface border border-cn-border rounded-2xl p-4 shadow-xs flex flex-col justify-between gap-3 hover:border-violet-300 transition-colors"
            >
              <div className="flex flex-col gap-2">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-2 min-w-0">
                    <div className="p-2 bg-violet-50 rounded-xl shrink-0 border border-violet-100">
                      {getTypeIcon(note.material_type)}
                    </div>
                    <div className="flex flex-col min-w-0">
                      <h3 className="font-heading font-bold text-base text-violet-950 truncate">{note.title}</h3>
                      <span className="text-[11.5px] font-medium text-ink-500">
                        {note.subject_name} • {note.class_section_name}
                      </span>
                    </div>
                  </div>
                  {getTypeBadge(note.material_type_display)}
                </div>

                {note.content && (
                  <p className="text-[13px] text-ink-800 whitespace-pre-wrap leading-relaxed bg-slate-50/70 p-3 rounded-xl border border-slate-100 mt-1">
                    {note.content}
                  </p>
                )}

                <div className="flex flex-wrap gap-2 mt-1">
                  {note.has_attachment && (
                    <button
                      type="button"
                      onClick={() => handleDownload(note.id)}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-violet-700 text-white rounded-xl text-[12px] font-bold hover:bg-violet-800 transition-colors cursor-pointer"
                    >
                      <Download size={14} /> Download Attachment
                    </button>
                  )}

                  {note.external_url && (
                    <a
                      href={note.external_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-rose-50 text-rose-700 border border-rose-200 rounded-xl text-[12px] font-bold hover:bg-rose-100 transition-colors"
                    >
                      <ExternalLink size={14} /> Open Video / Web Link
                    </a>
                  )}
                </div>
              </div>

              <div className="flex items-center justify-between pt-3 border-t border-cn-border text-[11.5px] text-ink-500">
                <span className="flex items-center gap-1 font-medium">
                  <User size={13} /> Published by <b className="text-violet-950">{note.uploaded_by_name || "Teacher"}</b>
                </span>
                <div className="flex items-center gap-3">
                  <span className="flex items-center gap-1 font-medium">
                    <Clock size={13} /> {note.created_at ? note.created_at.split("T")[0] : ""}
                  </span>
                  {canPublish && (
                    <button
                      type="button"
                      onClick={() => handleDeleteNote(note.id)}
                      className="text-ink-400 hover:text-rose-600 cursor-pointer p-0.5"
                      title="Delete Material"
                    >
                      <Trash2 size={14} />
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Upload Study Material Modal */}
      <Modal isOpen={showUploadModal} onClose={() => setShowUploadModal(false)} title="Upload Study Material">
        <div className="flex flex-col gap-3.5 w-[420px] max-w-full">
          <div className="grid grid-cols-2 gap-3">
            <SelectBox
              label="Class Section *"
              fieldName="class_section"
              value={form.class_section}
              onChange={(e) => setForm((p) => ({ ...p, class_section: e.target.value }))}
              options={[{ label: "Select Class", value: "" }, ...classOptions]}
            />
            <SelectBox
              label="Subject *"
              fieldName="subject"
              value={form.subject}
              onChange={(e) => setForm((p) => ({ ...p, subject: e.target.value }))}
              options={[{ label: "Select Subject", value: "" }, ...subjectOptions]}
            />
          </div>

          <SelectBox
            label="Material Type *"
            fieldName="material_type"
            value={form.material_type}
            onChange={(e) => setForm((p) => ({ ...p, material_type: e.target.value }))}
            options={MATERIAL_TYPES.filter((t) => t.value !== "")}
          />

          <BlackInputField
            label="Title / Heading *"
            fieldName="title"
            placeholder="e.g., Chapter 3 Quadrilaterals Solved Examples & Formula Sheet"
            value={form.title}
            onChange={(e) => setForm((p) => ({ ...p, title: e.target.value }))}
            required
          />

          <div className="flex flex-col gap-1.5">
            <label className="text-[13px] font-medium text-black">Notes Content / Description</label>
            <textarea
              rows={3}
              placeholder="Write summary notes, instructions, or important formulas for students..."
              value={form.content}
              onChange={(e) => setForm((p) => ({ ...p, content: e.target.value }))}
              className="w-full p-3 text-[13px] border border-cn-border rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-violet-500/20 focus:border-violet-400 font-medium"
            />
          </div>

          <BlackInputField
            label="External Resource / Video Link (Optional)"
            fieldName="external_url"
            placeholder="https://youtube.com/... or Google Drive link"
            value={form.external_url}
            onChange={(e) => setForm((p) => ({ ...p, external_url: e.target.value }))}
          />

          <div className="flex flex-col gap-1.5">
            <label className="text-[13px] font-medium text-black">Upload Attachment File (PDF, DOCX, Image)</label>
            <input
              type="file"
              onChange={(e) => setSelectedFile(e.target.files[0] || null)}
              className="text-[12.5px] text-ink-700 file:mr-3 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-[12px] file:font-bold file:bg-violet-100 file:text-violet-900 hover:file:bg-violet-200 cursor-pointer"
            />
          </div>

          <div className="flex gap-2 justify-end pt-3 border-t border-cn-border">
            <Button variant="outline" onClick={() => setShowUploadModal(false)}>
              Cancel
            </Button>
            <Button variant="primary" onClick={handleUploadSubmit} loading={uploading}>
              Upload & Share Notes
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default StudyNotes;
