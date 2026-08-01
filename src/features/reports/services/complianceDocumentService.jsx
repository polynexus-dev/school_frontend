import api from "../../../services/api";

// GET/POST /api/accounting/compliance-documents/ — Admin has full CRUD,
// a CA/Auditor account gets read-only list/retrieve/download (enforced
// server-side by IsCAOrAdminReadOnly).
const getComplianceDocuments = async (params = {}) => {
  const response = await api.get("accounting/compliance-documents/", { params });
  return { status: response.status, data: response.data };
};

const uploadComplianceDocument = async (payload) => {
  const formData = new FormData();
  Object.entries(payload).forEach(([key, value]) => {
    if (value !== null && value !== undefined && value !== "") formData.append(key, value);
  });
  const response = await api.post("accounting/compliance-documents/", formData, {
    headers: { "Content-Type": "multipart/form-data" },
  });
  return { status: response.status, data: response.data };
};

const deleteComplianceDocument = async (id) => {
  const response = await api.delete(`accounting/compliance-documents/${id}/`);
  return { status: response.status, data: response.data };
};

// Blob download through the authenticated action — never link to the raw file URL.
const downloadComplianceDocument = async (id, filename) => {
  const response = await api.get(`accounting/compliance-documents/${id}/download/`, { responseType: "blob" });
  const url = window.URL.createObjectURL(new Blob([response.data]));
  const link = document.createElement("a");
  link.href = url;
  link.download = filename || "document";
  document.body.appendChild(link);
  link.click();
  link.remove();
  window.URL.revokeObjectURL(url);
};

const complianceDocumentService = { getComplianceDocuments, uploadComplianceDocument, deleteComplianceDocument, downloadComplianceDocument };

export default complianceDocumentService;
