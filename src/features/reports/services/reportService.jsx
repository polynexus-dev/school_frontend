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
  trial_balance: "reports/trial-balance/",
  income_expenditure: "reports/income-expenditure/",
  balance_sheet: "reports/balance-sheet/",
  fee_receivables_ageing: "reports/fee-receivables-ageing/",
  general_ledger: "reports/general-ledger/",
  cash_book: "reports/cash-book/",
  bank_book: "reports/bank-book/",
  receipts_payments: "reports/receipts-payments/",
  bank_reconciliation_statement: "reports/bank-reconciliation-statement/",
  asset_register: "reports/asset-register/",
  donation_register: "reports/donation-register/",
  form_10bd_register: "reports/form-10bd-register/",
  investment_register: "reports/investment-register/",
  related_party_transactions: "reports/related-party-transactions/",
  creditors_ageing: "reports/creditors-ageing/",
  grant_register: "reports/grant-register/",
  statutory_challan_register: "reports/statutory-challan-register/",
  provision_schedule: "reports/provision-schedule/",
  statutory_liability_summary: "reports/statutory-liability-summary/",
  payroll_summary: "reports/payroll-summary/",
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

// Plan 8 — the CS/CA deliverable for the statutory audit. `exportFormat` is
// one of "zip" (Excel + PDF bundled, the default), "xlsx" (just the
// workbook), or "pdf" (just the attestation cover) — same blob-download
// pattern as the CSV exports above, just different content types/filenames.
// Sent as `export`, not `format` — DRF reserves `format` for its own
// content-negotiation and 404s before the view runs otherwise.
const AUDIT_PACKAGE_FORMATS = {
  zip: { mime: "application/zip", filename: (period) => `Annual_Audit_Package_${period}.zip` },
  xlsx: { mime: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet", filename: (period) => `Books_of_Accounts_${period}.xlsx` },
  pdf: { mime: "application/pdf", filename: (period) => `Attestation_${period}.pdf` },
};

const downloadAuditPackage = async (startDate, endDate, exportFormat = "zip") => {
  const response = await api.get("reports/annual-audit-package/", {
    params: { start_date: startDate, end_date: endDate, export: exportFormat },
    responseType: "blob",
  });
  const { mime, filename } = AUDIT_PACKAGE_FORMATS[exportFormat];
  const url = window.URL.createObjectURL(new Blob([response.data], { type: mime }));
  const link = document.createElement("a");
  link.href = url;
  link.download = filename(`${startDate}_to_${endDate}`);
  document.body.appendChild(link);
  link.click();
  link.remove();
  window.URL.revokeObjectURL(url);
};

const reportService = { getReport, downloadReportCsv, downloadAuditPackage, REPORT_ENDPOINTS };

export default reportService;
