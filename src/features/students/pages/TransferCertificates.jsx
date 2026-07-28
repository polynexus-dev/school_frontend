import React, { useEffect, useState } from "react";
import { toast } from "react-toastify";
import { FileCheck, ShieldCheck, AlertCircle, Plus, CheckCircle2, QrCode, Printer } from "lucide-react";
import Button from "../../../components/Button";
import Modal from "../../../components/Modal";
import SelectBox from "../../../components/SelectBox";
import tcService from "../services/tcService";
import api from "../../../services/api";

const asList = (data) => (Array.isArray(data) ? data : data?.results || []);

const TransferCertificates = () => {
  const [tcs, setTcs] = useState([]);
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(false);

  // Clearance modal
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedStudentId, setSelectedStudentId] = useState("");
  const [clearanceReport, setClearanceReport] = useState(null);
  const [checkingClearance, setCheckingClearance] = useState(false);

  // Form details
  const [reason, setReason] = useState("Parent Relocation");
  const [conduct, setConduct] = useState("Good");
  const [generating, setGenerating] = useState(false);

  // View Printable TC Modal
  const [viewTcModal, setViewTcModal] = useState(null);

  const loadData = async () => {
    setLoading(true);
    try {
      const [tcRes, stRes] = await Promise.all([
        tcService.getTransferCertificates(),
        api.get("students/"),
      ]);
      setTcs(asList(tcRes.data));
      setStudents(asList(stRes.data));
    } catch (err) {
      console.error("Failed to load TC data:", err);
      toast.error("Failed to load Transfer Certificate data.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleRunClearance = async (studentId) => {
    if (!studentId) return;
    setSelectedStudentId(studentId);
    setCheckingClearance(true);
    try {
      const res = await tcService.checkClearance(Number(studentId));
      setClearanceReport(res.data);
    } catch (err) {
      console.error("Clearance check failed:", err);
      toast.error("Clearance check failed.");
    } finally {
      setCheckingClearance(false);
    }
  };

  const handleGenerateTC = async () => {
    if (!selectedStudentId) return;
    setGenerating(true);
    try {
      const res = await tcService.generateTC({
        student_id: Number(selectedStudentId),
        reason_for_leaving: reason,
        conduct_character: conduct,
      });
      toast.success(res.data.message || "Transfer Certificate generated successfully!");
      setIsModalOpen(false);
      setClearanceReport(null);
      setSelectedStudentId("");
      loadData();
    } catch (err) {
      console.error("Failed to generate TC:", err);
      toast.error(err.response?.data?.error || "Failed to generate Transfer Certificate.");
    } finally {
      setGenerating(false);
    }
  };

  const studentOptions = students.map((s) => ({
    label: `${s.user_detail?.first_name || ""} ${s.user_detail?.last_name || ""} (${s.admission_no})`.trim(),
    value: String(s.id),
  }));

  return (
    <div className="w-full">
      {/* Header */}
      <div className="flex items-center justify-between pb-4 border-b border-cn-border mb-6 flex-wrap gap-4">
        <div>
          <div className="flex items-center gap-2">
            <FileCheck className="text-violet-600" size={26} />
            <h1 className="font-heading font-bold text-2xl text-violet-950">Digital Transfer Certificates (TC)</h1>
          </div>
          <p className="text-ink-500 text-[13px] mt-1">
            Auto-checks fee dues, library clearance, and hostel clearance before issuing QR-verified TCs.
          </p>
        </div>

        <Button
          variant="primary"
          onClick={() => {
            setClearanceReport(null);
            setSelectedStudentId("");
            setIsModalOpen(true);
          }}
          className="flex items-center gap-2"
        >
          <Plus size={16} /> Issue Transfer Certificate
        </Button>
      </div>

      {/* Table */}
      {loading ? (
        <p className="text-center text-ink-400 text-sm py-16">Loading Transfer Certificates…</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full border-collapse">
            <thead>
              <tr className="border-b border-cn-border text-left text-xs font-bold text-ink-400">
                <th className="p-3">TC NUMBER</th>
                <th className="p-3">STUDENT</th>
                <th className="p-3">REASON</th>
                <th className="p-3">CLEARANCE STATUS</th>
                <th className="p-3">TC STATUS</th>
                <th className="p-3">VERIFICATION CODE</th>
                <th className="p-3 text-right">ACTION</th>
              </tr>
            </thead>
            <tbody>
              {tcs.length === 0 ? (
                <tr>
                  <td colSpan={7} className="text-center py-12 text-ink-400 text-sm">
                    No Transfer Certificates issued yet.
                  </td>
                </tr>
              ) : (
                tcs.map((t) => (
                  <tr key={t.id} className="border-b border-cn-border/60 hover:bg-cn-surface text-xs text-ink-800">
                    <td className="p-3 font-bold text-violet-950">{t.tc_number}</td>
                    <td className="p-3 font-semibold text-ink-900">{t.student_name}</td>
                    <td className="p-3 text-ink-600">{t.reason_for_leaving}</td>
                    <td className="p-3">
                      <span
                        className={`px-2 py-0.5 rounded-md font-bold text-[11px] ${
                          t.overall_clearance_status === "cleared" ? "bg-emerald-100 text-emerald-800" : "bg-red-100 text-red-800"
                        }`}
                      >
                        {t.overall_clearance_display}
                      </span>
                    </td>
                    <td className="p-3 font-bold text-violet-700">{t.status_display}</td>
                    <td className="p-3 font-mono text-[11px] text-ink-500 flex items-center gap-1.5">
                      <QrCode size={14} className="text-violet-600" /> {t.verification_uuid?.slice(0, 13)}…
                    </td>
                    <td className="p-3 text-right">
                      <button
                        onClick={() => setViewTcModal(t)}
                        className="px-2.5 py-1 text-[11px] font-bold text-violet-700 bg-violet-50 hover:bg-violet-100 rounded-md border border-violet-200 transition"
                      >
                        Print TC
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* Issue TC / Clearance Modal */}
      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title="📄 Issue Transfer Certificate & Check Clearance">
        <div className="flex flex-col gap-4 w-[460px] max-w-full">
          <SelectBox
            label="Select Student"
            fieldName="student"
            value={selectedStudentId}
            onChange={(e) => handleRunClearance(e.target.value)}
            options={[{ label: "— Select Student —", value: "" }, ...studentOptions]}
          />

          {checkingClearance && <p className="text-xs text-ink-400 text-center py-4">Checking multi-module clearance…</p>}

          {clearanceReport && (
            <div className="flex flex-col gap-3 p-3.5 rounded-xl border border-cn-border bg-slate-50/70 text-xs">
              <h4 className="font-bold text-ink-900 text-sm border-b pb-2 flex items-center justify-between">
                <span>Clearance Report: {clearanceReport.student_name}</span>
                <span
                  className={`text-[11px] px-2 py-0.5 rounded font-extrabold ${
                    clearanceReport.can_issue_tc ? "bg-emerald-600 text-white" : "bg-red-600 text-white"
                  }`}
                >
                  {clearanceReport.can_issue_tc ? "CLEARED" : "DUES PENDING"}
                </span>
              </h4>

              {/* Clearance Items */}
              <div className="flex items-center justify-between">
                <span>💳 Fee Clearance:</span>
                <span className={clearanceReport.fee_clearance_status === "cleared" ? "font-bold text-emerald-600" : "font-bold text-red-600"}>
                  {clearanceReport.fee_clearance_status === "cleared" ? "Cleared (No Dues)" : `Dues Pending (Rs. ${clearanceReport.fee_dues_amount})`}
                </span>
              </div>

              <div className="flex items-center justify-between">
                <span>📚 Library Books:</span>
                <span className={clearanceReport.library_clearance_status === "cleared" ? "font-bold text-emerald-600" : "font-bold text-red-600"}>
                  {clearanceReport.library_clearance_status === "cleared" ? "Cleared" : `${clearanceReport.overdue_books_count} Books Pending`}
                </span>
              </div>

              <div className="flex items-center justify-between">
                <span>🏢 Hostel Room:</span>
                <span className={clearanceReport.hostel_clearance_status === "cleared" ? "font-bold text-emerald-600" : "font-bold text-amber-600"}>
                  {clearanceReport.hostel_clearance_status}
                </span>
              </div>
            </div>
          )}

          {clearanceReport && (
            <>
              <div>
                <label className="block text-xs font-medium mb-1 text-ink-700">Reason for Leaving</label>
                <input
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs outline-none focus:border-violet-500"
                />
              </div>

              <div>
                <label className="block text-xs font-medium mb-1 text-ink-700">Conduct / Character</label>
                <input
                  value={conduct}
                  onChange={(e) => setConduct(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs outline-none focus:border-violet-500"
                />
              </div>
            </>
          )}

          <div className="flex gap-3 justify-end pt-2">
            <Button variant="outline" onClick={() => setIsModalOpen(false)}>
              Cancel
            </Button>
            {clearanceReport && (
              <Button variant="primary" onClick={handleGenerateTC} loading={generating}>
                Generate & Issue TC
              </Button>
            )}
          </div>
        </div>
      </Modal>

      {/* Print TC View Modal */}
      {viewTcModal && (
        <Modal isOpen={!!viewTcModal} onClose={() => setViewTcModal(null)} title="Print Transfer Certificate">
          <div className="w-[500px] max-w-full p-6 bg-white border border-slate-200 rounded-2xl flex flex-col gap-4 text-xs">
            <div className="text-center border-b pb-3">
              <h2 className="font-extrabold text-lg text-violet-950 uppercase tracking-wide">VIDYAM PUBLIC SCHOOL</h2>
              <p className="text-[11px] text-ink-500">Official Digital Transfer Certificate</p>
              <p className="font-mono text-[11px] font-bold text-violet-700 mt-1">TC NO: {viewTcModal.tc_number}</p>
            </div>

            <div className="flex flex-col gap-2 text-ink-800">
              <p>
                This is to certify that <strong>{viewTcModal.student_name}</strong> (Admission No:{" "}
                <strong>{viewTcModal.admission_no}</strong>) has been officially relieved from class{" "}
                <strong>{viewTcModal.class_section_name}</strong> on <strong>{viewTcModal.leaving_date}</strong>.
              </p>
              <p>
                <strong>Reason for leaving:</strong> {viewTcModal.reason_for_leaving}
              </p>
              <p>
                <strong>Conduct & Character:</strong> {viewTcModal.conduct_character}
              </p>
              <p>
                <strong>Overall Clearance:</strong>{" "}
                <span className="font-bold text-emerald-600">{viewTcModal.overall_clearance_display}</span>
              </p>
            </div>

            <div className="flex items-center justify-between border-t pt-4 mt-2">
              <div className="flex items-center gap-2 font-mono text-[10px] text-slate-500 bg-slate-50 p-2 rounded-lg border">
                <QrCode size={24} className="text-violet-700" />
                <div>
                  <p className="font-bold text-violet-900">Scan to Verify Authenticity</p>
                  <p>{viewTcModal.verification_uuid}</p>
                </div>
              </div>

              <button
                onClick={() => window.print()}
                className="flex items-center gap-1.5 bg-violet-600 hover:bg-violet-700 text-white text-xs font-bold px-3 py-2 rounded-lg transition"
              >
                <Printer size={14} /> Print Document
              </button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
};

export default TransferCertificates;
