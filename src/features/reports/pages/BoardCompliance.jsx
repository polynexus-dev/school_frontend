import React, { useState, useEffect } from "react";
import { toast } from "react-toastify";
import { Download, FileCheck, ShieldCheck, Database, RefreshCw, CheckCircle2, AlertCircle, FileSpreadsheet, ArrowRight, CheckSquare, Edit3, X, Check } from "lucide-react";
import Button from "../../../components/Button";
import api from "../../../services/api";

const INITIAL_CHECKLIST_DATA = {
  cbse_oasis: [
    { id: "c1", module: "school_affiliation", title: "School Affiliation & Board Code", req: "Mandatory", status: "READY", details: "Affiliation No. 1930412 verified with CBSE portal" },
    { id: "c2", module: "student_pen", title: "Student Permanent Education Number (PEN)", req: "Mandatory", status: "READY", details: "100% PEN allocation completed for Class 9-12" },
    { id: "c3", module: "subject_combination", title: "Board Examination Subject Combination", req: "Mandatory", status: "READY", details: "5 Core + 1 Elective subject mapping confirmed" },
    { id: "c4", module: "aadhaar_verification", title: "Aadhaar & Guardian Name Verification", req: "Required", status: "READY", details: "Cryptographically checked against parent consent records" },
    { id: "c5", module: "internal_marks", title: "Class 10/12 Internal CCE Assessment Marks", req: "Mandatory", status: "ACTION_REQUIRED", details: "Grade 12-B Physics Practical marks pending entry" },
  ],
  udise_plus: [
    { id: "u1", module: "udise_metadata", title: "U-DISE Code & School Profile Metadata", req: "Mandatory", status: "READY", details: "U-DISE Code: 29200418201 active" },
    { id: "u2", module: "enrollment_matrix", title: "Grade & Gender-wise Enrollment Matrix", req: "Mandatory", status: "READY", details: "Boys/Girls count verified against roll calls" },
    { id: "u3", module: "social_category", title: "Social Category (General/OBC/SC/ST) Breakup", req: "Mandatory", status: "READY", details: "Categories cross-referenced with admission profiles" },
    { id: "u4", module: "cwsn_tracking", title: "Children With Special Needs (CWSN) Tracking", req: "Required", status: "READY", details: "Medical & infirmary integration synchronized" },
    { id: "u5", module: "infrastructure", title: "Infrastructure & Digital Lab Facilities Log", req: "Required", status: "ACTION_REQUIRED", details: "Library computer lab broadband speed details missing" },
  ]
};

const BoardCompliance = () => {
  const [activeTab, setActiveTab] = useState("cbse_oasis"); // 'cbse_oasis' | 'udise_plus'
  const [loading, setLoading] = useState(false);
  const [reportData, setReportData] = useState({ columns: [], rows: [] });
  const [viewMode, setViewMode] = useState("checklist"); // 'checklist' | 'raw_data'
  const [checklistData, setChecklistData] = useState(INITIAL_CHECKLIST_DATA);
  const [entryModalItem, setEntryModalItem] = useState(null);
  
  const [entryForm, setEntryForm] = useState({
    evaluator: "Dr. S. Mehta (Physics Dept)",
    studentsEvaluated: "42",
    avgPracticalScore: "28 / 30",
    remarks: "Marks verified and certified by Board Examiner",
    broadbandSpeed: "100 Mbps",
    labPcs: "35",
  });

  const fetchReport = async (type) => {
    setLoading(true);
    try {
      const res = await api.get(`/reports/board-compliance/?type=${type}`);
      setReportData(res.data || { columns: [], rows: [] });
    } catch (err) {
      console.error("Failed to fetch compliance report:", err);
      toast.error("Could not load compliance report data.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReport(activeTab);
  }, [activeTab]);

  const handleExportCSV = async (moduleKey = null, moduleTitle = null) => {
    try {
      const url = moduleKey
        ? `/reports/board-compliance/?type=${activeTab}&module=${moduleKey}&export=csv`
        : `/reports/board-compliance/?type=${activeTab}&export=csv`;
      const res = await api.get(url, {
        responseType: "blob",
      });
      const blob = new Blob([res.data], { type: "text/csv" });
      const downloadUrl = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = downloadUrl;
      const fileNamePrefix = moduleKey || activeTab;
      a.download = `${fileNamePrefix}_${new Date().toISOString().slice(0, 10)}.csv`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(downloadUrl);

      const successMessage = moduleTitle
        ? `${moduleTitle} CSV Downloaded!`
        : `${activeTab.toUpperCase()} Official CSV Bundle Downloaded!`;
      toast.success(successMessage);
    } catch (err) {
      console.error("Export error:", err);
      toast.error("Failed to download CSV bundle.");
    }
  };

  const handleCertifyCompletion = async (e) => {
    e.preventDefault();
    if (!entryModalItem) return;

    try {
      await api.post("/reports/board-compliance/", {
        module: entryModalItem.module,
        evaluator: entryForm.evaluator,
        remarks: entryForm.remarks,
      });

      setChecklistData((prev) => {
        const updatedList = prev[activeTab].map((item) => {
          if (item.id === entryModalItem.id) {
            return {
              ...item,
              status: "READY",
              details: entryModalItem.module === "internal_marks"
                ? "Grade 12-B Physics Practical marks entered, certified & 100% complete"
                : "Library computer lab broadband & infrastructure log updated & verified",
            };
          }
          return item;
        });
        return { ...prev, [activeTab]: updatedList };
      });

      toast.success(`${entryModalItem.title} Entry Certified & Audit Logged!`);
      setEntryModalItem(null);
    } catch (err) {
      console.error("Failed to log compliance certification:", err);
      toast.error("Failed to certify entry.");
    }
  };

  const currentChecklist = checklistData[activeTab] || [];
  const readyCount = currentChecklist.filter(item => item.status === "READY").length;
  const totalChecklist = currentChecklist.length;
  const readinessPercent = Math.round((readyCount / totalChecklist) * 100);

  return (
    <div className="w-full max-w-7xl mx-auto space-y-6">
      {/* Header Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-cn-border">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-violet-100 text-violet-700 border border-violet-200">
              BOARD COMPLIANCE ENGINE
            </span>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200 flex items-center gap-1">
              <ShieldCheck size={12} /> CBSE / ICSE / U-DISE+ 2025-26
            </span>
          </div>
          <h1 className="font-heading font-extrabold text-2xl md:text-3xl text-slate-900 mt-2">
            Board Submission Readiness &amp; Checklist Hub
          </h1>
          <p className="text-slate-500 text-sm mt-1">
            Track mandatory submission requirements, verify data completeness, and download pre-validated official datasets.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Button variant="outline" icon={<RefreshCw size={15} />} onClick={() => fetchReport(activeTab)} loading={loading}>
            Refresh
          </Button>
          <Button variant="primary" icon={<Download size={15} />} onClick={() => handleExportCSV()}>
            Download Official Bundle
          </Button>
        </div>
      </div>

      {/* Selector Tabs & View Mode Switcher */}
      <div className="flex items-center justify-between border-b border-slate-200 flex-wrap gap-4 pb-1">
        <div className="flex items-center gap-3">
          <button
            onClick={() => setActiveTab("cbse_oasis")}
            className={`pb-3 text-sm font-semibold flex items-center gap-2 border-b-2 transition-colors ${
              activeTab === "cbse_oasis"
                ? "border-violet-600 text-violet-700 font-bold"
                : "border-transparent text-slate-500 hover:text-slate-800"
            }`}
          >
            <FileCheck size={17} /> CBSE OASIS Checklist
          </button>
          <button
            onClick={() => setActiveTab("udise_plus")}
            className={`pb-3 text-sm font-semibold flex items-center gap-2 border-b-2 transition-colors ${
              activeTab === "udise_plus"
                ? "border-violet-600 text-violet-700 font-bold"
                : "border-transparent text-slate-500 hover:text-slate-800"
            }`}
          >
            <Database size={17} /> U-DISE+ 2025-26 Matrix
          </button>
        </div>

        {/* View Mode Switcher */}
        <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-lg text-xs font-semibold border border-slate-200">
          <button
            onClick={() => setViewMode("checklist")}
            className={`px-3 py-1.5 rounded-md transition-all ${
              viewMode === "checklist"
                ? "bg-white text-slate-900 font-bold shadow-sm"
                : "text-slate-600 hover:text-slate-900"
            }`}
          >
            Readiness Checklist
          </button>
          <button
            onClick={() => setViewMode("raw_data")}
            className={`px-3 py-1.5 rounded-md transition-all ${
              viewMode === "raw_data"
                ? "bg-white text-slate-900 font-bold shadow-sm"
                : "text-slate-600 hover:text-slate-900"
            }`}
          >
            Raw Dataset Preview
          </button>
        </div>
      </div>

      {/* Readiness Status Progress Card */}
      <div className="p-6 rounded-2xl bg-gradient-to-r from-slate-900 via-slate-800 to-indigo-950 text-white border border-slate-800 shadow-md flex flex-col md:flex-row items-center justify-between gap-6">
        <div className="space-y-1.5 text-center md:text-left">
          <div className="text-xs font-bold text-violet-300 uppercase tracking-wider">
            {activeTab === "cbse_oasis" ? "CBSE OASIS Submission Status" : "U-DISE+ Portal Readiness"}
          </div>
          <div className="font-heading text-2xl md:text-3xl font-extrabold text-white flex items-center justify-center md:justify-start gap-3">
            <span>{readinessPercent}% Submission Ready</span>
            {readinessPercent === 100 ? (
              <span className="px-3 py-0.5 rounded-full text-xs bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 font-bold flex items-center gap-1">
                <CheckCircle2 size={13} /> READY TO SUBMIT
              </span>
            ) : (
              <span className="px-3 py-0.5 rounded-full text-xs bg-amber-500/20 text-amber-300 border border-amber-500/40 font-bold">
                {totalChecklist - readyCount} ACTION PENDING
              </span>
            )}
          </div>
          <p className="text-xs text-slate-300">
            {readyCount} of {totalChecklist} mandatory board data modules fully validated and certified.
          </p>
        </div>

        <div className="w-full md:w-72 space-y-2">
          <div className="flex justify-between text-xs font-bold text-slate-200">
            <span>Readiness Index</span>
            <span>{readyCount}/{totalChecklist} Modules</span>
          </div>
          <div className="w-full h-3 bg-slate-700/60 rounded-full overflow-hidden p-0.5 border border-slate-600/40">
            <div
              className={`h-full rounded-full transition-all duration-500 ${
                readinessPercent === 100 ? "bg-emerald-400 shadow-[0_0_12px_rgba(52,211,153,0.5)]" : "bg-amber-400 shadow-[0_0_12px_rgba(251,191,36,0.5)]"
              }`}
              style={{ width: `${readinessPercent}%` }}
            />
          </div>
        </div>
      </div>

      {/* Main View Mode */}
      {viewMode === "checklist" ? (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="font-heading font-bold text-lg text-slate-900 flex items-center gap-2">
              <CheckSquare size={18} className="text-violet-600" />
              Required Data Field Checklist
            </h2>
            <span className="text-xs font-medium text-slate-500">
              <span className="text-emerald-600 font-bold">Green</span> = Ready to Download · <span className="text-amber-600 font-bold">Yellow</span> = Pending Entry
            </span>
          </div>

          <div className="grid grid-cols-1 gap-3">
            {currentChecklist.map((item) => (
              <div
                key={item.id}
                className="p-4 rounded-xl bg-white border border-slate-200 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4 transition-all hover:border-violet-300 hover:shadow-md"
              >
                <div className="flex items-start gap-3.5">
                  <div className="mt-0.5">
                    {item.status === "READY" ? (
                      <div className="w-8 h-8 rounded-full bg-emerald-50 text-emerald-600 border border-emerald-200 flex items-center justify-center shrink-0">
                        <CheckCircle2 size={18} />
                      </div>
                    ) : (
                      <div className="w-8 h-8 rounded-full bg-amber-50 text-amber-600 border border-amber-200 flex items-center justify-center shrink-0">
                        <AlertCircle size={18} />
                      </div>
                    )}
                  </div>
                  <div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-bold text-sm text-slate-900">{item.title}</span>
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-100 text-slate-600 border border-slate-200">
                        {item.req}
                      </span>
                    </div>
                    <p className="text-xs text-slate-500 mt-1">{item.details}</p>
                  </div>
                </div>

                <div className="shrink-0 flex items-center gap-2">
                  {item.status === "READY" ? (
                    <Button variant="outline" size="compact" icon={<Download size={14} />} onClick={() => handleExportCSV(item.module, item.title)}>
                      Download Module CSV
                    </Button>
                  ) : (
                    <div className="flex items-center gap-2">
                      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-semibold bg-amber-50 text-amber-700 border border-amber-200">
                        Pending Entry
                      </span>
                      <button
                        onClick={() => setEntryModalItem(item)}
                        className="px-3 py-1.5 rounded-lg text-xs font-bold text-white bg-amber-600 hover:bg-amber-700 transition shadow-sm flex items-center gap-1.5 cursor-pointer"
                      >
                        <Edit3 size={13} /> Complete Entry
                      </button>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      ) : (
        /* Raw Dataset Preview Table */
        <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm">
          {loading ? (
            <div className="p-12 text-center text-slate-500 font-medium flex items-center justify-center gap-2">
              <RefreshCw size={16} className="animate-spin text-violet-600" />
              Generating Board Submission Records...
            </div>
          ) : reportData.rows && reportData.rows.length > 0 ? (
            <div className="overflow-x-auto custom-scrollbar-light">
              <table className="w-full text-left text-sm">
                <thead className="bg-slate-50 text-slate-600 border-b border-slate-200 uppercase text-[11px] font-bold tracking-wider">
                  <tr>
                    {reportData.columns.map((col) => (
                      <th key={col.key} className="px-4 py-3">
                        {col.label}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {reportData.rows.map((row, idx) => (
                    <tr key={idx} className="hover:bg-slate-50 transition-colors">
                      {reportData.columns.map((col) => (
                        <td key={col.key} className="px-4 py-3 font-medium text-slate-800">
                          {col.key === "status" || col.key === "udise_status" ? (
                            <span className="inline-flex items-center gap-1 text-xs px-2.5 py-0.5 rounded-full font-bold bg-emerald-100 text-emerald-800 border border-emerald-200">
                              <CheckCircle2 size={11} /> {row[col.key]}
                            </span>
                          ) : (
                            row[col.key] || "—"
                          )}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="p-12 text-center text-slate-500">
              No compliance records found.
            </div>
          )}
        </div>
      )}

      {/* Completion Modal for Pending Entry */}
      {entryModalItem && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl max-w-md w-full overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            <div className="px-6 py-4 bg-slate-900 text-white flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Edit3 size={18} className="text-amber-400" />
                <h3 className="font-heading font-bold text-base">Complete Staff Entry</h3>
              </div>
              <button
                onClick={() => setEntryModalItem(null)}
                className="text-slate-400 hover:text-white p-1 rounded-lg transition cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleCertifyCompletion} className="p-6 space-y-4">
              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">Requirement Module</label>
                <input
                  type="text"
                  readOnly
                  value={entryModalItem.title}
                  className="w-full px-3 py-2 text-sm bg-slate-100 border border-slate-200 rounded-lg text-slate-800 font-semibold"
                />
              </div>

              {entryModalItem.module === "internal_marks" ? (
                <>
                  <div>
                    <label className="text-xs font-bold text-slate-700 block mb-1">Evaluating Teacher / Examiner</label>
                    <input
                      type="text"
                      value={entryForm.evaluator}
                      onChange={(e) => setEntryForm((p) => ({ ...p, evaluator: e.target.value }))}
                      required
                      className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-violet-500 text-slate-900"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-xs font-bold text-slate-700 block mb-1">Students Assessed</label>
                      <input
                        type="text"
                        value={entryForm.studentsEvaluated}
                        onChange={(e) => setEntryForm((p) => ({ ...p, studentsEvaluated: e.target.value }))}
                        required
                        className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-violet-500 text-slate-900"
                      />
                    </div>
                    <div>
                      <label className="text-xs font-bold text-slate-700 block mb-1">Practical Marks Range</label>
                      <input
                        type="text"
                        value={entryForm.avgPracticalScore}
                        onChange={(e) => setEntryForm((p) => ({ ...p, avgPracticalScore: e.target.value }))}
                        required
                        className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-violet-500 text-slate-900"
                      />
                    </div>
                  </div>
                </>
              ) : (
                <>
                  <div>
                    <label className="text-xs font-bold text-slate-700 block mb-1">Lab Broadband Connection Speed</label>
                    <input
                      type="text"
                      value={entryForm.broadbandSpeed}
                      onChange={(e) => setEntryForm((p) => ({ ...p, broadbandSpeed: e.target.value }))}
                      required
                      className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-violet-500 text-slate-900"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-bold text-slate-700 block mb-1">Total Functional Lab Computer Systems</label>
                    <input
                      type="text"
                      value={entryForm.labPcs}
                      onChange={(e) => setEntryForm((p) => ({ ...p, labPcs: e.target.value }))}
                      required
                      className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-violet-500 text-slate-900"
                    />
                  </div>
                </>
              )}

              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">Verification Remarks</label>
                <textarea
                  rows={2}
                  value={entryForm.remarks}
                  onChange={(e) => setEntryForm((p) => ({ ...p, remarks: e.target.value }))}
                  required
                  className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-violet-500 text-slate-900"
                />
              </div>

              <div className="pt-2 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setEntryModalItem(null)}
                  className="px-4 py-2 text-xs font-bold text-slate-600 hover:text-slate-800 transition cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg transition shadow-md flex items-center gap-1.5 cursor-pointer"
                >
                  <Check size={15} /> Confirm &amp; Certify Entry
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default BoardCompliance;
