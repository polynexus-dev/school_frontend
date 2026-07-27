import api from "../../../services/api";

const getTemplates = async () => {
  const response = await api.get("certificates/templates/");
  return { status: response.status, data: response.data };
};

const getIssuedCertificates = async (params = {}) => {
  const response = await api.get("certificates/issued/", { params });
  return { status: response.status, data: response.data };
};

const issueCertificate = async (payload) => {
  const response = await api.post("certificates/issued/", payload);
  return { status: response.status, data: response.data };
};

// Streams the PDF and triggers a browser download (same pattern as report cards).
const downloadCertificate = async (id, filename) => {
  const response = await api.get(`certificates/issued/${id}/pdf/`, { responseType: "blob" });
  const url = window.URL.createObjectURL(new Blob([response.data], { type: "application/pdf" }));
  const link = document.createElement("a");
  link.href = url;
  link.download = filename || "certificate.pdf";
  document.body.appendChild(link);
  link.click();
  link.remove();
  window.URL.revokeObjectURL(url);
};

const certificateService = { getTemplates, getIssuedCertificates, issueCertificate, downloadCertificate };

export default certificateService;
