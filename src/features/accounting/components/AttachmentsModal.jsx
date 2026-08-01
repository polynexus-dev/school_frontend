import React, { useEffect, useRef, useState } from "react";
import { toast } from "react-toastify";
import { Paperclip, UploadCloud, Download, Trash2 } from "lucide-react";
import Button from "../../../components/Button";
import Modal from "../../../components/Modal";
import BlackInputField from "../../../components/BlackInputField";
import attachmentService from "../services/attachmentService";

const asList = (data) => (Array.isArray(data) ? data : data?.results || []);

// Drop-in attachments panel for any accounting record — pass recordType
// (must match SupportingDocument.RECORD_TYPE_CHOICES on the backend) and
// recordId. Used the same way across ExpenseVouchers/Bills/Donations/
// Investments/Grants/StatutoryChallans/JournalEntries so a CA never has to
// ask "where's the bill for this" separately from the ledger entry itself.
const AttachmentsModal = ({ isOpen, onClose, recordType, recordId, title }) => {
  const [attachments, setAttachments] = useState([]);
  const [loading, setLoading] = useState(false);
  const [description, setDescription] = useState("");
  const [uploading, setUploading] = useState(false);
  const [deletingId, setDeletingId] = useState(null);
  const fileInputRef = useRef(null);

  const load = async () => {
    if (!recordId) return;
    setLoading(true);
    try {
      const res = await attachmentService.getAttachments(recordType, recordId);
      setAttachments(asList(res.data));
    } catch (err) {
      console.error("Failed to load attachments:", err);
      toast.error("Failed to load attachments.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen, recordId]);

  const handleUploadClick = () => fileInputRef.current?.click();

  const handleFileSelected = async (e) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    setUploading(true);
    try {
      await attachmentService.uploadAttachment(recordType, recordId, file, description);
      toast.success("File attached.");
      setDescription("");
      load();
    } catch (err) {
      console.error("Failed to upload attachment:", err);
      toast.error("Failed to upload attachment.");
    } finally {
      setUploading(false);
    }
  };

  const handleDownload = async (attachment) => {
    try {
      await attachmentService.downloadAttachment(attachment.id, attachment.filename);
    } catch (err) {
      console.error("Failed to download attachment:", err);
      toast.error("Failed to download attachment.");
    }
  };

  const handleDelete = async (attachment) => {
    if (!window.confirm(`Remove "${attachment.filename}"?`)) return;
    setDeletingId(attachment.id);
    try {
      await attachmentService.deleteAttachment(attachment.id);
      toast.success("Attachment removed.");
      load();
    } catch (err) {
      console.error("Failed to delete attachment:", err);
      toast.error("Failed to remove attachment.");
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={title || "Supporting documents"}>
      <div className="flex flex-col gap-3 w-[420px] max-w-full">
        <div className="flex items-end gap-2">
          <BlackInputField
            label="Description (optional)" fieldName="description" value={description}
            onChange={(e) => setDescription(e.target.value)} placeholder="e.g. Vendor invoice"
          />
          <Button variant="primary" icon={<UploadCloud size={15} />} onClick={handleUploadClick} loading={uploading}>
            Upload
          </Button>
          <input ref={fileInputRef} type="file" className="hidden" onChange={handleFileSelected} />
        </div>

        {loading ? (
          <div className="text-center text-ink-400 text-[13px] py-6">Loading…</div>
        ) : attachments.length === 0 ? (
          <div className="text-center text-ink-400 text-[13px] py-6 flex flex-col items-center gap-2">
            <Paperclip size={20} />
            No documents attached yet.
          </div>
        ) : (
          <div className="flex flex-col gap-2 max-h-72 overflow-y-auto">
            {attachments.map((a) => (
              <div key={a.id} className="flex items-center justify-between gap-2 border border-cn-border rounded-lg p-2.5">
                <div className="min-w-0">
                  <div className="text-[12.5px] font-semibold text-ink-800 truncate">{a.filename}</div>
                  <div className="text-[11px] text-ink-400 truncate">{a.description || "—"} · {a.uploaded_by_name || "Unknown"}</div>
                </div>
                <div className="flex items-center gap-1 shrink-0">
                  <button type="button" onClick={() => handleDownload(a)} className="w-7 h-7 inline-flex items-center justify-center text-ink-500 hover:bg-violet-100 hover:text-violet-700 rounded-md cursor-pointer" title="Download">
                    <Download size={15} />
                  </button>
                  <button type="button" onClick={() => handleDelete(a)} disabled={deletingId === a.id} className="w-7 h-7 inline-flex items-center justify-center text-error-hex hover:bg-red-50 rounded-md cursor-pointer" title="Remove">
                    <Trash2 size={15} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </Modal>
  );
};

export default AttachmentsModal;
