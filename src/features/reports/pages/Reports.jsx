import React, { useEffect, useMemo, useState } from "react";
import { toast } from "react-toastify";
import { Download, FileBarChart2 } from "lucide-react";
import Button from "../../../components/Button";
import SelectBox from "../../../components/SelectBox";
import BlackInputField from "../../../components/BlackInputField";
import reportService from "../services/reportService";
import classSectionService from "../../students/services/classSectionService";
import examTermService from "../../academics/services/examTermService";

const asList = (data) => (Array.isArray(data) ? data : data?.results || []);
const classSectionLabel = (cs) => cs?.display_name || `Class ${cs?.grade ?? "?"} - ${cs?.section ?? "?"}`;

const REPORTS = [
  { key: "fee_collection", label: "Fee Collection", filters: ["start_date", "end_date", "class_section"] },
  { key: "attendance_summary", label: "Attendance Summary", filters: ["start_date", "end_date", "class_section"] },
  { key: "academic_performance", label: "Academic Performance", filters: ["exam_term", "class_section"] },
  { key: "staff_leave", label: "Staff Leave", filters: ["start_date", "end_date"] },
  { key: "library_overdue", label: "Library Overdue", filters: [] },
  { key: "hostel_occupancy", label: "Hostel Occupancy", filters: [] },
];

const Reports = () => {
  const [reportKey, setReportKey] = useState(REPORTS[0].key);
  const [filters, setFilters] = useState({});
  const [result, setResult] = useState(null); // { columns, rows }
  const [loading, setLoading] = useState(false);
  const [downloading, setDownloading] = useState(false);
  const [classSections, setClassSections] = useState([]);
  const [examTerms, setExamTerms] = useState([]);

  const report = REPORTS.find((r) => r.key === reportKey);

  useEffect(() => {
    classSectionService.getClassSections().then((res) => setClassSections(asList(res.data))).catch(() => {});
    examTermService.getExamTerms().then((res) => setExamTerms(asList(res.data))).catch(() => {});
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
  const reportOptions = useMemo(() => REPORTS.map((r) => ({ label: r.label, value: r.key })), []);

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
        {report.filters.includes("class_section") && (
          <SelectBox label="Class" fieldName="class_section" value={filters.class_section || ""} onChange={(e) => setFilters((p) => ({ ...p, class_section: e.target.value }))} options={classSectionOptions} className="w-48" />
        )}
        {report.filters.includes("exam_term") && (
          <SelectBox label="Exam term" fieldName="exam_term" value={filters.exam_term || ""} onChange={(e) => setFilters((p) => ({ ...p, exam_term: e.target.value }))} options={examTermOptions} className="w-56" />
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
