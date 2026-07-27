import api from "../../../services/api";

// GET/POST/DELETE /api/documents/folders/, /files/ — the file's raw URL is
// never returned by the API (write_only on the backend); downloads always
// go through the authenticated `download` action below.
const getFolders = async () => {
  const response = await api.get("documents/folders/");
  return { status: response.status, data: response.data };
};

const createFolder = async (payload) => {
  const response = await api.post("documents/folders/", payload);
  return { status: response.status, data: response.data };
};

const getDocuments = async (params = {}) => {
  const response = await api.get("documents/files/", { params });
  return { status: response.status, data: response.data };
};

const uploadDocument = async (formData) => {
  const response = await api.post("documents/files/", formData, { headers: { "Content-Type": "multipart/form-data" } });
  return { status: response.status, data: response.data };
};

const deleteDocument = async (id) => {
  const response = await api.delete(`documents/files/${id}/`);
  return { status: response.status, data: response.data };
};

// Streams the actual file through the authenticated endpoint, then triggers
// a browser download from the in-memory blob (same pattern as report cards).
const downloadDocument = async (id, filename) => {
  const response = await api.get(`documents/files/${id}/download/`, { responseType: "blob" });
  const url = window.URL.createObjectURL(new Blob([response.data]));
  const link = document.createElement("a");
  link.href = url;
  link.download = filename || "document";
  document.body.appendChild(link);
  link.click();
  link.remove();
  window.URL.revokeObjectURL(url);
};

const documentService = { getFolders, createFolder, getDocuments, uploadDocument, deleteDocument, downloadDocument };

export default documentService;
