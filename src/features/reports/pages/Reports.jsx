import React, { useEffect, useMemo, useState } from "react";
import { toast } from "react-toastify";
import { Download, FileBarChart2 } from "lucide-react";
import Button from "../../../components/Button";
import SelectBox from "../../../components/SelectBox";
import BlackInputField from "../../../components/BlackInputField";
import reportService from "../services/reportService";
import classSectionService from "../../students/services/classSectionService";
import examTermService from "../../academics/services/examTermService";
import accountingService from "../../accounting/services/accountingService";
import useUser from "../../auth/hooks/useUser";

const asList = (data) => (Array.isArray(data) ? data : data?.results || []);
const classSectionLabel = (cs) => cs?.display_name || `Class ${cs?.grade ?? "?"} - ${cs?.section ?? "?"}`;

// Reports a CA/Auditor account cannot read (matches IsCAOrAdminReadOnly's
// scope server-side) — filtered out of the picker so a CA never sees a
// report key that would just 403, rather than a security boundary itself.
const NON_FINANCIAL_REPORT_KEYS = new Set(["attendance_summary", "academic_performance", "staff_leave", "library_overdue", "hostel_occupancy"]);

const REPORTS = [
  { key: "fee_collection", label: "Fee Collection", filters: ["start_date", "end_date", "class_section"] },
  { key: "attendance_summary", label: "Attendance Summary", filters: ["start_date", "end_date", "class_section"] },
  { key: "academic_performance", label: "Academic Performance", filters: ["exam_term", "class_section"] },
  { key: "staff_leave", label: "Staff Leave", filters: ["start_date", "end_date"] },
  { key: "library_overdue", label: "Library Overdue", filters: [] },
  { key: "hostel_occupancy", label: "Hostel Occupancy", filters: [] },
  { key: "trial_balance", label: "Trial Balance", filters: ["as_of_date"] },
  { key: "income_expenditure", label: "Income & Expenditure Statement", filters: ["start_date", "end_date"] },
  { key: "balance_sheet", label: "Balance Sheet", filters: ["as_of_date"] },
  { key: "fee_receivables_ageing", label: "Fee Receivables Ageing", filters: ["as_of_date"] },
  { key: "general_ledger", label: "General Ledger (account-wise)", filters: ["account", "start_date", "end_date"] },
  { key: "cash_book", label: "Cash Book", filters: ["start_date", "end_date"] },
  { key: "bank_book", label: "Bank Book", filters: ["start_date", "end_date"] },
  { key: "receipts_payments", label: "Receipts & Payments Account", filters: ["start_date", "end_date"] },
  { key: "bank_reconciliation_statement", label: "Bank Reconciliation Statement", filters: ["bank_account", "as_of_date"] },
  { key: "asset_register", label: "Asset Register", filters: [] },
  { key: "donation_register", label: "Donation Register (12A/80G)", filters: ["start_date", "end_date"] },
  { key: "form_10bd_register", label: "Form 10BD Register", filters: ["start_date", "end_date"] },
  { key: "investment_register", label: "Investment Register (Sec 11(5))", filters: [] },
  { key: "related_party_transactions", label: "Related-Party Transactions (Sec 13(3))", filters: ["start_date", "end_date"] },
  { key: "creditors_ageing", label: "Creditors Ageing", filters: ["as_of_date"] },
  { key: "grant_register", label: "Grant Register", filters: [] },
  { key: "statutory_challan_register", label: "Statutory Challan Register", filters: ["start_date", "end_date"] },
  { key: "provision_schedule", label: "Provisions & Schedules", filters: [] },
  { key: "statutory_liability_summary", label: "Statutory Liability Summary (PF/ESI/PT/TDS)", filters: ["start_date", "end_date"] },
  { key: "payroll_summary", label: "Payroll Summary", filters: ["start_date", "end_date"] },
];

const Reports = () => {
  const { user } = useUser();
  const isCA = user?.data?.role === "CA";
  const visibleReports = useMemo(() => (isCA ? REPORTS.filter((r) => !NON_FINANCIAL_REPORT_KEYS.has(r.key)) : REPORTS), [isCA]);

  const [reportKey, setReportKey] = useState(REPORTS[0].key);
  const [filters, setFilters] = useState({});
  const [result, setResult] = useState(null); // { columns, rows }
  const [loading, setLoading] = useState(false);
  const [downloading, setDownloading] = useState(false);
  const [classSections, setClassSections] = useState([]);
  const [examTerms, setExamTerms] = useState([]);
  const [ledgerAccounts, setLedgerAccounts] = useState([]);
  const [bankAccounts, setBankAccounts] = useState([]);

  const report = REPORTS.find((r) => r.key === reportKey);

  useEffect(() => {
    classSectionService.getClassSections().then((res) => setClassSections(asList(res.data))).catch(() => {});
    examTermService.getExamTerms().then((res) => setExamTerms(asList(res.data))).catch(() => {});
    accountingService.getLedgerAccounts({ page_size: 500 }).then((res) => setLedgerAccounts(asList(res.data))).catch(() => {});
    accountingService.getBankAccounts({ page_size: 200 }).then((res) => setBankAccounts(asList(res.data))).catch(() => {});
  }, []);

  useEffect(() => {
    setFilters({});
    setResult(null);
  }, [reportKey]);

  const runReport = async () => {
    if (report.filters.includes("exam_term") && !filters.exam_term) {
      toast.error("Pick an exam term first.");
      return;
    }
    if (report.filters.includes("account") && !filters.account) {
      toast.error("Pick a ledger account first.");
      return;
    }
    if (report.filters.includes("bank_account") && !filters.bank_account) {
      toast.error("Pick a bank account first.");
      return;
    }
    setLoading(true);
    try {
      const res = await reportService.getReport(reportKey, filters);
      setResult(res.data);
    } catch (err) {
      console.error("Failed to run report:", err);
      const msg = err?.response?.status === 403
        ? "You don't have access to this report."
        : err?.response?.data?.error || "Failed to run report.";
      toast.error(msg);
      setResult(null);
    } finally {
      setLoading(false);
    }
  };

  const handleDownload = async () => {
    setDownloading(true);
    try {
      await reportService.downloadReportCsv(reportKey, filters, `${reportKey}.csv`);
    } catch (err) {
      console.error("Failed to download report:", err);
      toast.error("Failed to download CSV.");
    } finally {
      setDownloading(false);
    }
  };

  const classSectionOptions = useMemo(() => [{ label: "All classes", value: "" }, ...classSections.map((cs) => ({ label: classSectionLabel(cs), value: String(cs.id) }))], [classSections]);
  const examTermOptions = useMemo(() => examTerms.map((t) => ({ label: t.name, value: String(t.id) })), [examTerms]);
  const reportOptions = useMemo(() => visibleReports.map((r) => ({ label: r.label, value: r.key })), [visibleReports]);
  const ledgerAccountOptions = useMemo(() => ledgerAccounts.map((a) => ({ label: `${a.code} - ${a.name}`, value: String(a.id) })), [ledgerAccounts]);
  const bankAccountOptions = useMemo(() => bankAccounts.map((b) => ({ label: b.name, value: String(b.id) })), [bankAccounts]);

  return (
    <div className="w-full">
      <div className="flex items-center gap-3 pb-4 border-b border-cn-border mb-6 flex-wrap">
        <div className="flex-1 min-w-0">
          <h1 className="font-heading font-bold text-2xl text-violet-950 flex items-center gap-2">
            <FileBarChart2 size={22} className="text-violet-700" />
            Reports
          </h1>
          <p className="text-ink-500 text-[13px] mt-1">Parameterized, exportable school reports</p>
        </div>
      </div>

      <div className="flex items-end gap-3 mb-5 flex-wrap bg-cn-surface border border-cn-border rounded-xl p-4">
        <SelectBox label="Report" fieldName="report" value={reportKey} onChange={(e) => setReportKey(e.target.value)} options={reportOptions} className="w-56" />

        {report.filters.includes("start_date") && (
          <BlackInputField label="Start date" fieldName="start_date" type="date" value={filters.start_date || ""} onChange={(e) => setFilters((p) => ({ ...p, start_date: e.target.value }))} />
        )}
        {report.filters.includes("end_date") && (
          <BlackInputField label="End date" fieldName="end_date" type="date" value={filters.end_date || ""} onChange={(e) => setFilters((p) => ({ ...p, end_date: e.target.value }))} />
        )}
        {report.filters.includes("as_of_date") && (
          <BlackInputField label="As of date" fieldName="as_of_date" type="date" value={filters.as_of_date || ""} onChange={(e) => setFilters((p) => ({ ...p, as_of_date: e.target.value }))} />
        )}
        {report.filters.includes("class_section") && (
          <SelectBox label="Class" fieldName="class_section" value={filters.class_section || ""} onChange={(e) => setFilters((p) => ({ ...p, class_section: e.target.value }))} options={classSectionOptions} className="w-48" />
        )}
        {report.filters.includes("exam_term") && (
          <SelectBox label="Exam term" fieldName="exam_term" value={filters.exam_term || ""} onChange={(e) => setFilters((p) => ({ ...p, exam_term: e.target.value }))} options={examTermOptions} className="w-56" />
        )}
        {report.filters.includes("account") && (
          <SelectBox label="Ledger account" fieldName="account" value={filters.account || ""} onChange={(e) => setFilters((p) => ({ ...p, account: e.target.value }))} options={ledgerAccountOptions} className="w-64" />
        )}
        {report.filters.includes("bank_account") && (
          <SelectBox label="Bank account" fieldName="bank_account" value={filters.bank_account || ""} onChange={(e) => setFilters((p) => ({ ...p, bank_account: e.target.value }))} options={bankAccountOptions} className="w-56" />
        )}

        <Button variant="primary" onClick={runReport} loading={loading}>
          Run report
        </Button>
        {result && (
          <Button variant="outline" icon={<Download size={15} />} onClick={handleDownload} loading={downloading}>
            Export CSV
          </Button>
        )}
      </div>

      {result && (
        <div className="overflow-x-auto bg-cn-surface border border-cn-border rounded-xl">
          <table className="min-w-full font-sans text-left border-collapse">
            <thead>
              <tr className="border-b border-cn-border bg-violet-50/50">
                {result.columns.map((col) => (
                  <th key={col.key} className="p-3 text-[11.5px] font-semibold tracking-wider text-ink-500 uppercase select-none">
                    {col.label}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="text-[13.5px] text-ink-700 divide-y divide-violet-50">
              {result.rows.length === 0 && (
                <tr>
                  <td colSpan={result.columns.length} className="p-6 text-center text-ink-400">
                    No data for the selected filters.
                  </td>
                </tr>
              )}
              {result.rows.map((row, idx) => (
                <tr key={idx} className="hover:bg-violet-50 transition duration-150">
                  {result.columns.map((col) => (
                    <td key={col.key} className="p-3">
                      {row[col.key]}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default Reports;
