import api from "../../../services/api";

// GET/POST /api/donations/ — auto-posted to the ledger on create (Plan 5).
const getDonations = async (params = {}) => {
  const response = await api.get("donations/", { params });
  return { status: response.status, data: response.data };
};

const createDonation = async (payload) => {
  const response = await api.post("donations/", payload);
  return { status: response.status, data: response.data };
};

// Filed externally on the income tax portal, then recorded here so a 10BE
// certificate can be issued — the one field a posted donation can still change.
const recordForm10BDAck = async (id, ackNumber) => {
  const response = await api.post(`donations/${id}/record-10bd-ack/`, { form_10bd_acknowledgment_number: ackNumber });
  return { status: response.status, data: response.data };
};

// Blob download, same pattern as reportService's CSV/ZIP exports — only
// succeeds once a 10BD acknowledgment number has been recorded.
const downloadCertificate10BE = async (id, receiptNumber) => {
  const response = await api.get(`donations/${id}/certificate-10be/`, { responseType: "blob" });
  const url = window.URL.createObjectURL(new Blob([response.data], { type: "application/pdf" }));
  const link = document.createElement("a");
  link.href = url;
  link.download = `10BE_${receiptNumber}.pdf`;
  document.body.appendChild(link);
  link.click();
  link.remove();
  window.URL.revokeObjectURL(url);
};

const donationService = { getDonations, createDonation, recordForm10BDAck, downloadCertificate10BE };

export default donationService;
