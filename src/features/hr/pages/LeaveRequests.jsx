import React, { useEffect, useState } from "react";
import { toast } from "react-toastify";
import { Plus, Users } from "lucide-react";
import Button from "../../../components/Button";
import Table from "../../../components/Table";
import Modal from "../../../components/Modal";
import SelectBox from "../../../components/SelectBox";
import BlackInputField from "../../../components/BlackInputField";
import leaveService from "../services/leaveService";
import useUser from "../../auth/hooks/useUser";

const asList = (data) => (Array.isArray(data) ? data : data?.results || []);

const STATUS_TONE = {
  pending: "bg-warning-tint text-warning-hex",
  approved: "bg-success-tint text-success-hex",
  rejected: "bg-error-tint text-error-hex",
  cancelled: "bg-cn-bg text-ink-400",
};

const emptyForm = { leave_type: "", start_date: "", end_date: "", reason: "" };

const LeaveRequests = () => {
  const { user } = useUser();
  const roleName = user?.data?.role || "Admin";
  const isAdmin = !["Teacher", "Parent", "Conductor"].includes(roleName);

  const [leaveTypes, setLeaveTypes] = useState([]);
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(false);

  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);

  const [coverage, setCoverage] = useState(null); // {request, slots}

  const load = async () => {
    setLoading(true);
    try {
      const [typesRes, reqRes] = await Promise.all([leaveService.getLeaveTypes(), leaveService.getLeaveRequests()]);
      setLeaveTypes(asList(typesRes.data));
      setRequests(asList(reqRes.data));
    } catch (err) {
      console.error("Failed to load leave requests:", err);
      toast.error("Failed to load leave requests.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const leaveTypeOptions = leaveTypes.map((t) => ({ label: t.name, value: String(t.id) }));

  const handleApply = async () => {
    if (!form.leave_type || !form.start_date || !form.end_date) {
      toast.error("Leave type, start date and end date are required.");
      return;
    }
    setSaving(true);
    try {
      await leaveService.createLeaveRequest({
        leave_type: Number(form.leave_type),
        start_date: form.start_date,
        end_date: form.end_date,
        reason: form.reason || null,
      });
      toast.success("Leave request submitted.");
      setShowModal(false);
      setForm(emptyForm);
      load();
    } catch (err) {
      console.error("Failed to submit leave request:", err);
      toast.error(err?.response?.data?.error || err?.response?.data?.non_field_errors?.[0] || "Failed to submit leave request.");
    } finally {
      setSaving(false);
    }
  };

  const handleApprove = async (row) => {
    try {
      await leaveService.approveLeaveRequest(row.id);
      toast.success("Leave approved.");
      load();
    } catch (err) {
      console.error("Failed to approve leave:", err);
      toast.error(err?.response?.data?.error || "Failed to approve leave.");
    }
  };

  const handleReject = async (row) => {
    if (!window.confirm("Reject this leave request?")) return;
    try {
      await leaveService.rejectLeaveRequest(row.id);
      toast.success("Leave rejected.");
      load();
    } catch (err) {
      console.error("Failed to reject leave:", err);
      toast.error(err?.response?.data?.error || "Failed to reject leave.");
    }
  };

  const showCoverage = async (row) => {
    try {
      const res = await leaveService.getAffectedSlots(row.id);
      setCoverage({ request: row, slots: asList(res.data) });
    } catch (err) {
      console.error("Failed to load coverage:", err);
      toast.error("Failed to load substitute-coverage list.");
    }
  };

  const columns = [
    ...(isAdmin ? [{ header: "Staff", accessor: (row) => row.staff_name || `#${row.staff}` }] : []),
    { header: "Leave type", accessor: "leave_type_name" },
    { header: "Dates", accessor: (row) => `${row.start_date} → ${row.end_date} (${row.days_requested}d)` },
    { header: "Reason", accessor: (row) => <span className="text-ink-500">{row.reason || "—"}</span> },
    {
      header: "Status",
      accessor: (row) => (
        <span className={`inline-flex items-center text-[11.5px] font-bold rounded-full px-2.5 py-0.5 ${STATUS_TONE[row.status] || "bg-cn-bg text-ink-500"}`}>
          {row.status.toUpperCase()}
        </span>
      ),
    },
    {
      header: "Actions",
      accessor: (row) => (
        <div className="flex gap-2 items-center">
          {isAdmin && (
            <button type="button" onClick={() => showCoverage(row)} className="text-[11.5px] font-bold text-violet-700 hover:underline cursor-pointer" title="Which classes need a substitute">
              <Users size={13} className="inline mr-1" />
              Coverage
            </button>
          )}
          {isAdmin && row.status === "pending" && (
            <>
              <button type="button" onClick={() => handleApprove(row)} className="text-[11.5px] font-bold text-success-hex hover:underline cursor-pointer">
                Approve
              </button>
              <button type="button" onClick={() => handleReject(row)} className="text-[11.5px] font-bold text-error-hex hover:underline cursor-pointer">
                Reject
              </button>
            </>
          )}
        </div>
      ),
    },
  ];

  return (
    <div className="w-full">
      <div className="flex items-center gap-3 pb-4 border-b border-cn-border mb-6 flex-wrap">
        <div className="flex-1 min-w-0">
          <h1 className="font-heading font-bold text-2xl text-violet-950">Leave requests</h1>
          <p className="text-ink-500 text-[13px] mt-1">{isAdmin ? "Every staff member's leave history" : "Your leave history"}</p>
        </div>
        <Button variant="primary" icon={<Plus size={16} />} onClick={() => setShowModal(true)}>
          Apply for leave
        </Button>
      </div>

      <Table columns={columns} data={requests} loading={loading} emptyMessage="No leave requests yet" />

      <Modal isOpen={showModal} onClose={() => setShowModal(false)} title="Apply for leave">
        <div className="flex flex-col gap-3 w-[360px] max-w-full">
          <SelectBox label="Leave type" fieldName="leave_type" value={form.leave_type} onChange={(e) => setForm((p) => ({ ...p, leave_type: e.target.value }))} options={leaveTypeOptions} />
          <div className="flex gap-3">
            <BlackInputField label="Start date" fieldName="start_date" type="date" value={form.start_date} onChange={(e) => setForm((p) => ({ ...p, start_date: e.target.value }))} required />
            <BlackInputField label="End date" fieldName="end_date" type="date" value={form.end_date} onChange={(e) => setForm((p) => ({ ...p, end_date: e.target.value }))} required />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1 text-dark">Reason (optional)</label>
            <textarea
              value={form.reason}
              onChange={(e) => setForm((p) => ({ ...p, reason: e.target.value }))}
              rows={3}
              className="w-full px-4 py-2 border border-slate-300 rounded-md bg-transparent text-[0.85rem] text-dark outline-none focus:border-violet-500"
            />
          </div>
          <div className="flex gap-3 justify-end pt-2">
            <Button variant="outline" onClick={() => setShowModal(false)}>
              Cancel
            </Button>
            <Button variant="primary" onClick={handleApply} loading={saving}>
              Submit
            </Button>
          </div>
        </div>
      </Modal>

      <Modal isOpen={!!coverage} onClose={() => setCoverage(null)} title="Substitute coverage needed">
        <div className="flex flex-col gap-2 w-[420px] max-w-full">
          <p className="text-[12.5px] text-ink-500 mb-1">
            While {coverage?.request?.staff_name || "this staff member"} is on leave ({coverage?.request?.start_date} → {coverage?.request?.end_date}), these periods need a substitute:
          </p>
          {coverage?.slots?.length === 0 && <p className="text-ink-400 text-[13px] py-4 text-center">No timetable periods affected.</p>}
          {coverage?.slots?.map((s) => (
            <div key={s.id} className="border border-cn-border rounded-lg px-3 py-2 flex items-center justify-between">
              <div>
                <span className="text-[13px] font-semibold text-ink-900">{s.day_of_week_display} · P{s.period_number}</span>
                <span className="text-[12px] text-ink-500 ml-2">{s.class_section_name} — {s.subject_name}</span>
              </div>
              <span className="text-[11px] text-ink-400">{s.start_time}–{s.end_time}</span>
            </div>
          ))}
        </div>
      </Modal>
    </div>
  );
};

export default LeaveRequests;
