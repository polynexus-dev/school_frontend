import api from "../../../services/api";

// GET/POST /api/accounting/supporting-documents/ — filtered by record_type + record_id.
const getAttachments = async (recordType, recordId) => {
  const response = await api.get("accounting/supporting-documents/", { params: { record_type: recordType, record_id: recordId } });
  return { status: response.status, data: response.data };
};

const uploadAttachment = async (recordType, recordId, file, description) => {
  const formData = new FormData();
  formData.append("record_type", recordType);
  formData.append("record_id", recordId);
  formData.append("file", file);
  if (description) formData.append("description", description);
  const response = await api.post("accounting/supporting-documents/", formData, {
    headers: { "Content-Type": "multipart/form-data" },
  });
  return { status: response.status, data: response.data };
};

const deleteAttachment = async (id) => {
  const response = await api.delete(`accounting/supporting-documents/${id}/`);
  return { status: response.status, data: response.data };
};

// Blob download through the authenticated action — never link to the raw file URL.
const downloadAttachment = async (id, filename) => {
  const response = await api.get(`accounting/supporting-documents/${id}/download/`, { responseType: "blob" });
  const url = window.URL.createObjectURL(new Blob([response.data]));
  const link = document.createElement("a");
  link.href = url;
  link.download = filename || "attachment";
  document.body.appendChild(link);
  link.click();
  link.remove();
  window.URL.revokeObjectURL(url);
};

const attachmentService = { getAttachments, uploadAttachment, deleteAttachment, downloadAttachment };

export default attachmentService;
