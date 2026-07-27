import React, { useEffect, useMemo, useState } from "react";
import { toast } from "react-toastify";
import { Plus, Download, Trash2, FolderPlus, FileText } from "lucide-react";
import Button from "../../../components/Button";
import Table from "../../../components/Table";
import Modal from "../../../components/Modal";
import SelectBox from "../../../components/SelectBox";
import BlackInputField from "../../../components/BlackInputField";
import documentService from "../services/documentService";
import classSectionService from "../../students/services/classSectionService";
import useUser from "../../auth/hooks/useUser";

const asList = (data) => (Array.isArray(data) ? data : data?.results || []);
const classSectionLabel = (cs) => cs?.display_name || `Class ${cs?.grade ?? "?"} - ${cs?.section ?? "?"}`;
const emptyUploadForm = { title: "", description: "", folder: "", audience_type: "whole_school", target_class_sections: [], file: null };

const AUDIENCE_OPTIONS = [
  { label: "Whole School", value: "whole_school" },
  { label: "Specific Class(es)", value: "class" },
  { label: "Staff Only", value: "staff_only" },
];

const Documents = () => {
  const { user } = useUser();
  const roleName = user?.data?.role || "Admin";
  const isStaff = !["Parent", "Student"].includes(roleName);

  const [folders, setFolders] = useState([]);
  const [selectedFolder, setSelectedFolder] = useState("");
  const [documents, setDocuments] = useState([]);
  const [loading, setLoading] = useState(false);
  const [classSections, setClassSections] = useState([]);

  const [showFolderModal, setShowFolderModal] = useState(false);
  const [folderName, setFolderName] = useState("");
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [form, setForm] = useState(emptyUploadForm);
  const [saving, setSaving] = useState(false);

  const loadFolders = async () => {
    try {
      const res = await documentService.getFolders();
      setFolders(asList(res.data));
    } catch (err) {
      console.error("Failed to load folders:", err);
    }
  };

  const loadDocuments = async (folderId) => {
    setLoading(true);
    try {
      const res = await documentService.getDocuments(folderId ? { folder: folderId } : {});
      setDocuments(asList(res.data));
    } catch (err) {
      console.error("Failed to load documents:", err);
      toast.error("Failed to load documents.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadFolders();
    loadDocuments();
    if (isStaff) classSectionService.getClassSections().then((res) => setClassSections(asList(res.data))).catch(() => {});
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    loadDocuments(selectedFolder);
  }, [selectedFolder]);

  const handleAddFolder = async () => {
    if (!folderName.trim()) {
      toast.error("Folder name is required.");
      return;
    }
    setSaving(true);
    try {
      await documentService.createFolder({ name: folderName.trim() });
      toast.success("Folder created.");
      setShowFolderModal(false);
      setFolderName("");
      loadFolders();
    } catch (err) {
      console.error("Failed to create folder:", err);
      toast.error("Failed to create folder.");
    } finally {
      setSaving(false);
    }
  };

  const toggleClassSection = (id) => {
    setForm((p) => ({
      ...p,
      target_class_sections: p.target_class_sections.includes(id) ? p.target_class_sections.filter((x) => x !== id) : [...p.target_class_sections, id],
    }));
  };

  const handleUpload = async () => {
    if (!form.title.trim() || !form.file) {
      toast.error("Title and a file are both required.");
      return;
    }
    setSaving(true);
    try {
      const fd = new FormData();
      fd.append("title", form.title);
      if (form.description) fd.append("description", form.description);
      if (form.folder) fd.append("folder", form.folder);
      fd.append("audience_type", form.audience_type);
      if (form.audience_type === "class") form.target_class_sections.forEach((id) => fd.append("target_class_sections", id));
      fd.append("file", form.file);
      await documentService.uploadDocument(fd);
      toast.success("Document uploaded.");
      setShowUploadModal(false);
      setForm(emptyUploadForm);
      loadDocuments(selectedFolder);
    } catch (err) {
      console.error("Failed to upload document:", err);
      toast.error("Failed to upload document.");
    } finally {
      setSaving(false);
    }
  };

  const handleDownload = async (doc) => {
    try {
      await documentService.downloadDocument(doc.id, doc.title);
    } catch (err) {
      console.error("Failed to download document:", err);
      toast.error("Failed to download document.");
    }
  };

  const handleDelete = async (doc) => {
    if (!window.confirm(`Delete "${doc.title}"?`)) return;
    try {
      await documentService.deleteDocument(doc.id);
      toast.success("Document deleted.");
      loadDocuments(selectedFolder);
    } catch (err) {
      console.error("Failed to delete document:", err);
      toast.error("Failed to delete document.");
    }
  };

  const folderOptions = useMemo(() => [{ label: "All folders", value: "" }, ...folders.map((f) => ({ label: f.name, value: String(f.id) }))], [folders]);
  const uploadFolderOptions = useMemo(() => [{ label: "No folder (root)", value: "" }, ...folders.map((f) => ({ label: f.name, value: String(f.id) }))], [folders]);

  const columns = [
    { header: "Title", accessor: (row) => <span className="font-semibold text-ink-900 flex items-center gap-1.5"><FileText size={14} className="text-violet-500" />{row.title}</span> },
    { header: "Folder", accessor: (row) => row.folder_name || "—" },
    { header: "Audience", accessor: (row) => AUDIENCE_OPTIONS.find((o) => o.value === row.audience_type)?.label },
    { header: "Uploaded by", accessor: "uploaded_by_name" },
    { header: "Uploaded", accessor: (row) => new Date(row.uploaded_at).toLocaleDateString() },
    {
      header: "Actions",
      accessor: (row) => (
        <div className="flex gap-2 items-center">
          <button type="button" onClick={() => handleDownload(row)} className="text-[11.5px] font-bold text-violet-700 hover:underline cursor-pointer">
            <Download size={13} className="inline mr-1" />
            Download
          </button>
          {isStaff && (
            <button type="button" onClick={() => handleDelete(row)} className="text-error-hex hover:opacity-70 cursor-pointer">
              <Trash2 size={14} />
            </button>
          )}
        </div>
      ),
    },
  ];

  return (
    <div className="w-full">
      <div className="flex items-center gap-3 pb-4 border-b border-cn-border mb-6 flex-wrap">
        <div className="flex-1 min-w-0">
          <h1 className="font-heading font-bold text-2xl text-violet-950">Documents</h1>
          <p className="text-ink-500 text-[13px] mt-1">Shared circulars, policies and forms</p>
        </div>
        <SelectBox className="w-52" label="Folder" fieldName="folder_filter" value={selectedFolder} onChange={(e) => setSelectedFolder(e.target.value)} options={folderOptions} />
        {isStaff && (
          <>
            <Button variant="outline" icon={<FolderPlus size={16} />} onClick={() => setShowFolderModal(true)}>
              New folder
            </Button>
            <Button variant="primary" icon={<Plus size={16} />} onClick={() => setShowUploadModal(true)}>
              Upload
            </Button>
          </>
        )}
      </div>

      <Table columns={columns} data={documents} loading={loading} emptyMessage="No documents yet" />

      <Modal isOpen={showFolderModal} onClose={() => setShowFolderModal(false)} title="New folder">
        <div className="flex flex-col gap-3 w-[280px] max-w-full">
          <BlackInputField label="Name" fieldName="folder_name" value={folderName} onChange={(e) => setFolderName(e.target.value)} required />
          <div className="flex gap-3 justify-end pt-2">
            <Button variant="outline" onClick={() => setShowFolderModal(false)}>
              Cancel
            </Button>
            <Button variant="primary" onClick={handleAddFolder} loading={saving}>
              Create
            </Button>
          </div>
        </div>
      </Modal>

      <Modal isOpen={showUploadModal} onClose={() => setShowUploadModal(false)} title="Upload document">
        <div className="flex flex-col gap-3 w-[360px] max-w-full">
          <BlackInputField label="Title" fieldName="title" value={form.title} onChange={(e) => setForm((p) => ({ ...p, title: e.target.value }))} required />
          <div>
            <label className="block text-sm font-medium mb-1 text-dark">Description (optional)</label>
            <textarea
              value={form.description}
              onChange={(e) => setForm((p) => ({ ...p, description: e.target.value }))}
              rows={2}
              className="w-full px-4 py-2 border border-slate-300 rounded-md bg-transparent text-[0.85rem] text-dark outline-none focus:border-violet-500"
            />
          </div>
          <SelectBox label="Folder" fieldName="upload_folder" value={form.folder} onChange={(e) => setForm((p) => ({ ...p, folder: e.target.value }))} options={uploadFolderOptions} />
          <SelectBox label="Audience" fieldName="audience_type" value={form.audience_type} onChange={(e) => setForm((p) => ({ ...p, audience_type: e.target.value }))} options={AUDIENCE_OPTIONS} />
          {form.audience_type === "class" && (
            <div className="flex flex-col gap-1.5 max-h-32 overflow-y-auto border border-cn-border rounded-lg p-2">
              {classSections.map((cs) => (
                <label key={cs.id} className="flex items-center gap-2 text-[12.5px] text-ink-700 cursor-pointer">
                  <input type="checkbox" checked={form.target_class_sections.includes(cs.id)} onChange={() => toggleClassSection(cs.id)} />
                  {classSectionLabel(cs)}
                </label>
              ))}
            </div>
          )}
          <div>
            <label className="block text-sm font-medium mb-1 text-dark">File</label>
            <input type="file" onChange={(e) => setForm((p) => ({ ...p, file: e.target.files?.[0] || null }))} className="w-full text-[13px]" />
          </div>
          <div className="flex gap-3 justify-end pt-2">
            <Button variant="outline" onClick={() => setShowUploadModal(false)}>
              Cancel
            </Button>
            <Button variant="primary" onClick={handleUpload} loading={saving}>
              Upload
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default Documents;
