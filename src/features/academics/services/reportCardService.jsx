import api from "../../../services/api";

// GET /api/academics/report-cards/ — students/subject rows are pre-aggregated
// server-side (see report_cards.py); this page only reads + downloads.
const getReportCards = async (params = {}) => {
  const response = await api.get("academics/report-cards/", { params });
  return { status: response.status, data: response.data };
};

// GET /api/academics/report-cards/{id}/pdf/ — returns a raw PDF blob.
const downloadReportCardPdf = async (id) => {
  const response = await api.get(`academics/report-cards/${id}/pdf/`, { responseType: "blob" });
  return { status: response.status, data: response.data };
};

const reportCardService = { getReportCards, downloadReportCardPdf };

export default reportCardService;
