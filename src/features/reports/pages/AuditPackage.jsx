import React, { useMemo, useState } from "react";
import { toast } from "react-toastify";
import { FileArchive, Download, FileSpreadsheet, FileText } from "lucide-react";
import Button from "../../../components/Button";
import SelectBox from "../../../components/SelectBox";
import BlackInputField from "../../../components/BlackInputField";
import reportService from "../services/reportService";

// Indian financial year: 1 Apr - 31 Mar. Builds the last 6 FYs (including
// the one in progress) so a school can export any recently-closed year for
// its CS/CA without hand-typing dates every time — a custom range is still
// available below for anything outside that window (part-year handover, etc).
const buildFinancialYears = () => {
  const today = new Date();
  const currentFYStartYear = today.getMonth() >= 3 ? today.getFullYear() : today.getFullYear() - 1; // getMonth() 3 == April
  const years = [];
  for (let i = 0; i < 6; i++) {
    const startYear = currentFYStartYear - i;
    years.push({
      label: `FY ${startYear}-${String(startYear + 1).slice(-2)}`,
      start_date: `${startYear}-04-01`,
      end_date: `${startYear + 1}-03-31`,
    });
  }
  return years;
};

const AuditPackage = () => {
  const financialYears = useMemo(buildFinancialYears, []);
  const [mode, setMode] = useState("fy"); // "fy" | "custom"
  const [fyIndex, setFyIndex] = useState(0);
  const [customRange, setCustomRange] = useState({ start_date: financialYears[0].start_date, end_date: financialYears[0].end_date });
  const [downloading, setDownloading] = useState(null); // null | "zip" | "xlsx" | "pdf"

  const selectedRange = mode === "fy" ? financialYears[fyIndex] : customRange;

  const handleDownload = async (format, label) => {
    if (!selectedRange.start_date || !selectedRange.end_date) {
      toast.error("Start date and end date are both required.");
      return;
    }
    if (selectedRange.start_date > selectedRange.end_date) {
      toast.error("Start date must be on or before end date.");
      return;
    }
    setDownloading(format);
    try {
      await reportService.downloadAuditPackage(selectedRange.start_date, selectedRange.end_date, format);
      toast.success(`${label} downloaded.`);
    } catch (err) {
      console.error(`Failed to download audit package (${format}):`, err);
      const msg = err?.response?.status === 403
        ? "You don't have access to export the audit package."
        : "Failed to generate the audit package. Please try again.";
      toast.error(msg);
    } finally {
      setDownloading(null);
    }
  };

  return (
    <div className="w-full">
      <div className="flex items-center gap-3 pb-4 border-b border-cn-border mb-6 flex-wrap">
        <div className="flex-1 min-w-0">
          <h1 className="font-heading font-bold text-2xl text-violet-950 flex items-center gap-2">
            <FileArchive size={22} className="text-violet-700" />
            Annual Audit Package
          </h1>
          <p className="text-ink-500 text-[13px] mt-1">Export everything your CS/CA needs for the statutory audit, bundled in one download</p>
        </div>
      </div>

      <div className="bg-cn-surface border border-cn-border rounded-xl p-5 max-w-xl">
        <div className="flex gap-2 mb-5">
          <Button variant={mode === "fy" ? "primary" : "outline"} size="compact" onClick={() => setMode("fy")}>
            Financial year
          </Button>
          <Button variant={mode === "custom" ? "primary" : "outline"} size="compact" onClick={() => setMode("custom")}>
            Custom range
          </Button>
        </div>

        {mode === "fy" ? (
          <SelectBox
            label="Financial year"
            fieldName="financial_year"
            value={String(fyIndex)}
            onChange={(e) => setFyIndex(Number(e.target.value))}
            options={financialYears.map((fy, idx) => ({ label: fy.label, value: String(idx) }))}
          />
        ) : (
          <div className="flex gap-3">
            <BlackInputField
              label="Start date" fieldName="start_date" type="date"
              value={customRange.start_date}
              onChange={(e) => setCustomRange((p) => ({ ...p, start_date: e.target.value }))}
            />
            <BlackInputField
              label="End date" fieldName="end_date" type="date"
              value={customRange.end_date}
              onChange={(e) => setCustomRange((p) => ({ ...p, end_date: e.target.value }))}
            />
          </div>
        )}

        <div className="mt-5 pt-4 border-t border-cn-border">
          <p className="text-[12.5px] text-ink-500 mb-4">
            The workbook covers Trial Balance, Income &amp; Expenditure, Balance Sheet, Receipts &amp; Payments, Cash/Bank Book,
            Asset Register, Donation &amp; Form 10BD Registers, Investment Register (Sec 11(5)), Fee/Creditors Ageing, Grant
            Register, Related-Party Transactions, Provisions &amp; Schedules, Fee Collection Summary, Payroll Summary, and
            Statutory Liability/Challan Registers. Download everything together, or just the one file your CA asked for.
          </p>

          <div className="flex flex-col gap-3">
            <div className="flex items-center justify-between gap-3 p-3 rounded-lg border border-cn-border bg-violet-50/30">
              <span className="inline-flex items-center gap-2 text-[13px] font-semibold text-ink-800">
                <FileArchive size={16} className="text-violet-700" /> Both, bundled (ZIP)
              </span>
              <Button variant="primary" size="compact" icon={<Download size={14} />} onClick={() => handleDownload("zip", "Audit package")} loading={downloading === "zip"}>
                Download ZIP
              </Button>
            </div>
            <div className="flex items-center justify-between gap-3 p-3 rounded-lg border border-cn-border">
              <span className="inline-flex items-center gap-2 text-[13px] font-semibold text-ink-800">
                <FileSpreadsheet size={16} className="text-success-hex" /> Books of Accounts (Excel)
              </span>
              <Button variant="outline" size="compact" icon={<Download size={14} />} onClick={() => handleDownload("xlsx", "Excel workbook")} loading={downloading === "xlsx"}>
                Download .xlsx
              </Button>
            </div>
            <div className="flex items-center justify-between gap-3 p-3 rounded-lg border border-cn-border">
              <span className="inline-flex items-center gap-2 text-[13px] font-semibold text-ink-800">
                <FileText size={16} className="text-error-hex" /> Attestation cover (PDF)
              </span>
              <Button variant="outline" size="compact" icon={<Download size={14} />} onClick={() => handleDownload("pdf", "Attestation PDF")} loading={downloading === "pdf"}>
                Download .pdf
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AuditPackage;
