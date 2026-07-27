import api from "../../../services/api";

// GET /api/reports/<report>/ — each report has its own permission class on
// the backend (some Admin-only, some Teacher+); a 403 here is expected and
// should be handled by the caller, not treated as a bug.
const REPORT_ENDPOINTS = {
  fee_collection: "reports/fee-collection/",
  attendance_summary: "reports/attendance-summary/",
  academic_performance: "reports/academic-performance/",
  staff_leave: "reports/staff-leave/",
  library_overdue: "reports/library-overdue/",
  hostel_occupancy: "reports/hostel-occupancy/",
};

const getReport = async (reportKey, params = {}) => {
  const response = await api.get(REPORT_ENDPOINTS[reportKey], { params });
  return { status: response.status, data: response.data };
};

// CSV export — streamed as a blob and downloaded client-side, same pattern
// as certificate/document downloads.
const downloadReportCsv = async (reportKey, params = {}, filename) => {
  const response = await api.get(REPORT_ENDPOINTS[reportKey], {
    params: { ...params, export: "csv" },
    responseType: "blob",
  });
  const url = window.URL.createObjectURL(new Blob([response.data], { type: "text/csv" }));
  const link = document.createElement("a");
  link.href = url;
  link.download = filename || `${reportKey}.csv`;
  document.body.appendChild(link);
  link.click();
  link.remove();
  window.URL.revokeObjectURL(url);
};

const reportService = { getReport, downloadReportCsv, REPORT_ENDPOINTS };

export default reportService;
