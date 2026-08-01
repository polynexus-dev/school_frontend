import React, { useEffect, useRef, useState } from "react";
import { toast } from "react-toastify";
import { FolderLock, Plus, Download, Trash2 } from "lucide-react";
import Button from "../../../components/Button";
import Table from "../../../components/Table";
import Modal from "../../../components/Modal";
import BlackInputField from "../../../components/BlackInputField";
import SelectBox from "../../../components/SelectBox";
import Pagination from "../../../components/Pagination";
import usePaginatedList from "../../../hooks/usePaginatedList";
import useUser from "../../auth/hooks/useUser";
import complianceDocumentService from "../services/complianceDocumentService";

const CATEGORIES = [
  { label: "Trust Deed / Society Registration", value: "trust_deed" },
  { label: "12A/12AB Registration Certificate", value: "12a_certificate" },
  { label: "80G Registration Certificate", value: "80g_certificate" },
  { label: "FCRA Registration", value: "fcra_registration" },
  { label: "Previous Year's Audited Accounts & Report", value: "previous_year_audit_report" },
  { label: "Fixed Deposit Certificate", value: "fd_certificate" },
  { label: "Physical Cash Certificate", value: "physical_cash_certificate" },
  { label: "TDS Return (24Q/26Q)", value: "tds_return" },
  { label: "GST Return", value: "gst_return" },
  { label: "Bank Statement", value: "bank_statement" },
  { label: "Governing Body / Trustee Meeting Minutes", value: "governing_body_minutes" },
  { label: "Form 16 / 16A", value: "form_16_16a" },
  { label: "Other", value: "other" },
];
const CATEGORY_LABEL = Object.fromEntries(CATEGORIES.map((c) => [c.value, c.label]));

const emptyForm = { category: "trust_deed", title: "", financial_year: "", description: "" };

const ComplianceDocuments = () => {
  const { user } = useUser();
  const roleName = user?.data?.role;
  const canManage = roleName !== "CA"; // Admin roles manage; CA is read-only (also enforced server-side).

  const {
    items: documents,
    page,
    setPage,
    totalPages,
    count,
    pageSize,
    loading,
    refetch,
  } = usePaginatedList(complianceDocumentService.getComplianceDocuments);

  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [file, setFile] = useState(null);
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState(null);
  const fileInputRef = useRef(null);

  const handleFileSelected = (e) => setFile(e.target.files?.[0] || null);

  const handleSave = async () => {
    if (!form.title.trim() || !file) {
      toast.error("Title and a file are both required.");
      return;
    }
    setSaving(true);
    try {
      await complianceDocumentService.uploadComplianceDocument({ ...form, file });
      toast.success("Document uploaded.");
      setShowModal(false);
      setForm(emptyForm);
      setFile(null);
      refetch();
    } catch (err) {
      console.error("Failed to upload compliance document:", err);
      toast.error("Failed to upload document.");
    } finally {
      setSaving(false);
    }
  };

  const handleDownload = async (doc) => {
    try {
      await complianceDocumentService.downloadComplianceDocument(doc.id, doc.filename);
    } catch (err) {
      console.error("Failed to download document:", err);
      toast.error("Failed to download document.");
    }
  };

  const handleDelete = async (doc) => {
    if (!window.confirm(`Remove "${doc.title}"?`)) return;
    setDeletingId(doc.id);
    try {
      await complianceDocumentService.deleteComplianceDocument(doc.id);
      toast.success("Document removed.");
      refetch();
    } catch (err) {
      console.error("Failed to delete document:", err);
      toast.error("Failed to remove document.");
    } finally {
      setDeletingId(null);
    }
  };

  const columns = [
    { header: "Category", accessor: (row) => CATEGORY_LABEL[row.category] || row.category },
    { header: "Title", accessor: "title" },
    { header: "Financial Year", accessor: (row) => row.financial_year || "-" },
    { header: "Uploaded By", accessor: (row) => row.uploaded_by_name || "-" },
    { header: "Uploaded", accessor: (row) => new Date(row.uploaded_at).toLocaleDateString("en-IN") },
    {
      header: "Action",
      accessor: (row) => (
        <div className="flex items-center gap-2">
          <button type="button" onClick={() => handleDownload(row)} className="text-[11.5px] font-bold text-violet-700 hover:underline cursor-pointer inline-flex items-center gap-1">
            <Download size={13} /> Download
          </button>
          {canManage && (
            <button type="button" onClick={() => handleDelete(row)} disabled={deletingId === row.id} className="text-error-hex hover:text-red-700 cursor-pointer">
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
          <h1 className="font-heading font-bold text-2xl text-violet-950 flex items-center gap-2">
            <FolderLock size={22} className="text-violet-700" />
            Compliance Documents
          </h1>
          <p className="text-ink-500 text-[13px] mt-1">
            Trust deed, 12A/80G certificates, FD/cash certificates, filed returns &amp; other statutory documents
          </p>
        </div>
        {canManage && (
          <Button variant="primary" icon={<Plus size={16} />} onClick={() => setShowModal(true)}>
            Upload document
          </Button>
        )}
      </div>

      <Table columns={columns} data={documents} loading={loading} emptyMessage="No compliance documents uploaded yet" />
      <Pagination page={page} totalPages={totalPages} count={count} pageSize={pageSize} onPageChange={setPage} loading={loading} />

      <Modal isOpen={showModal} onClose={() => setShowModal(false)} title="Upload compliance document">
        <div className="flex flex-col gap-3.5 w-[380px] max-w-full">
          <SelectBox label="Category" fieldName="category" value={form.category} onChange={(e) => setForm((p) => ({ ...p, category: e.target.value }))} options={CATEGORIES} />
          <BlackInputField label="Title" fieldName="title" value={form.title} onChange={(e) => setForm((p) => ({ ...p, title: e.target.value }))} placeholder="e.g. Trust Deed (Registered 2010)" required />
          <BlackInputField label="Financial year (optional)" fieldName="financial_year" value={form.financial_year} onChange={(e) => setForm((p) => ({ ...p, financial_year: e.target.value }))} placeholder="e.g. 2025-26" />
          <BlackInputField label="Description (optional)" fieldName="description" value={form.description} onChange={(e) => setForm((p) => ({ ...p, description: e.target.value }))} />
          <div>
            <label className="text-[13px] text-ink-700 block mb-1">File</label>
            <input ref={fileInputRef} type="file" onChange={handleFileSelected} className="text-[12.5px]" />
          </div>
          <div className="flex justify-end gap-2 mt-2">
            <Button variant="outline" onClick={() => setShowModal(false)}>Cancel</Button>
            <Button variant="primary" onClick={handleSave} loading={saving}>Upload</Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default ComplianceDocuments;
