import React, { useEffect, useMemo, useState } from "react";
import { toast } from "react-toastify";
import { Plus, Check, X, LogOut } from "lucide-react";
import Button from "../../../components/Button";
import Table from "../../../components/Table";
import Modal from "../../../components/Modal";
import SelectBox from "../../../components/SelectBox";
import BlackInputField from "../../../components/BlackInputField";
import gateService from "../services/gateService";
import guardianService from "../../guardians/services/guardianService";
import classSectionService from "../../students/services/classSectionService";
import studentService from "../../students/services/studentService";

const asList = (data) => (Array.isArray(data) ? data : data?.results || []);
const classSectionLabel = (cs) => cs?.display_name || `Class ${cs?.grade ?? "?"} - ${cs?.section ?? "?"}`;
const emptyRequestForm = { class_section: "", student: "", reason: "", requested_exit_time: "" };

const STATUS_TONE = {
  pending: "bg-warning-tint text-warning-hex",
  approved: "bg-info-tint text-info-hex",
  rejected: "bg-error-tint text-error-hex",
  completed: "bg-success-tint text-success-hex",
};

const GatePasses = () => {
  const [passes, setPasses] = useState([]);
  const [loading, setLoading] = useState(false);
  const [actingId, setActingId] = useState(null);

  const [showRequestModal, setShowRequestModal] = useState(false);
  const [requestForm, setRequestForm] = useState(emptyRequestForm);
  const [classSections, setClassSections] = useState([]);
  const [sectionStudents, setSectionStudents] = useState([]);
  const [saving, setSaving] = useState(false);

  const [releasePass, setReleasePass] = useState(null);
  const [releaseGuardians, setReleaseGuardians] = useState([]);
  const [releaseForm, setReleaseForm] = useState({ picked_up_by_guardian: "", picked_up_by_name: "" });

  const load = async () => {
    setLoading(true);
    try {
      const res = await gateService.getGatePasses();
      setPasses(asList(res.data));
    } catch (err) {
      console.error("Failed to load gate passes:", err);
      toast.error("Failed to load gate passes.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
    classSectionService.getClassSections().then((res) => setClassSections(asList(res.data))).catch(() => {});
  }, []);

  const handleClassChange = async (classSectionId) => {
    setRequestForm((p) => ({ ...p, class_section: classSectionId, student: "" }));
    if (!classSectionId) {
      setSectionStudents([]);
      return;
    }
    try {
      const res = await studentService.getStudents({ class_section: classSectionId });
      setSectionStudents(asList(res.data));
    } catch (err) {
      console.error("Failed to load students:", err);
    }
  };

  const handleCreateRequest = async () => {
    if (!requestForm.student || !requestForm.reason.trim() || !requestForm.requested_exit_time) {
      toast.error("Student, reason and requested exit time are all required.");
      return;
    }
    setSaving(true);
    try {
      await gateService.createGatePass({
        student: Number(requestForm.student),
        reason: requestForm.reason.trim(),
        requested_exit_time: requestForm.requested_exit_time,
      });
      toast.success("Gate pass requested.");
      setShowRequestModal(false);
      setRequestForm(emptyRequestForm);
      load();
    } catch (err) {
      console.error("Failed to request gate pass:", err);
      toast.error("Failed to request gate pass.");
    } finally {
      setSaving(false);
    }
  };

  const handleApprove = async (row) => {
    setActingId(row.id);
    try {
      await gateService.approveGatePass(row.id);
      toast.success("Gate pass approved.");
      load();
    } catch (err) {
      console.error("Failed to approve gate pass:", err);
      toast.error("Failed to approve gate pass.");
    } finally {
      setActingId(null);
    }
  };

  const handleReject = async (row) => {
    setActingId(row.id);
    try {
      await gateService.rejectGatePass(row.id);
      toast.success("Gate pass rejected.");
      load();
    } catch (err) {
      console.error("Failed to reject gate pass:", err);
      toast.error("Failed to reject gate pass.");
    } finally {
      setActingId(null);
    }
  };

  const openRelease = async (row) => {
    setReleasePass(row);
    setReleaseForm({ picked_up_by_guardian: "", picked_up_by_name: "" });
    try {
      const res = await guardianService.getGuardianLinks({ student: row.student, status: "verified" });
      setReleaseGuardians(asList(res.data));
    } catch (err) {
      console.error("Failed to load verified guardians:", err);
      setReleaseGuardians([]);
    }
  };

  const handleRelease = async () => {
    if (!releaseForm.picked_up_by_guardian && !releaseForm.picked_up_by_name.trim()) {
      toast.error("Pick a verified guardian or type a name.");
      return;
    }
    setSaving(true);
    try {
      const payload = releaseForm.picked_up_by_guardian
        ? { picked_up_by_guardian: Number(releaseForm.picked_up_by_guardian) }
        : { picked_up_by_name: releaseForm.picked_up_by_name.trim() };
      await gateService.releaseGatePass(releasePass.id, payload);
      toast.success("Student released.");
      setReleasePass(null);
      load();
    } catch (err) {
      console.error("Failed to release gate pass:", err);
      toast.error(err?.response?.data?.error || "Failed to release.");
    } finally {
      setSaving(false);
    }
  };

  const classSectionOptions = useMemo(() => classSections.map((cs) => ({ label: classSectionLabel(cs), value: String(cs.id) })), [classSections]);
  const studentOptions = useMemo(
    () => sectionStudents.map((s) => ({ label: `${s.full_name || s.name} (${s.admission_number || s.admission_no})`, value: String(s.id) })),
    [sectionStudents]
  );
  const guardianOptions = useMemo(() => releaseGuardians.map((g) => ({ label: g.guardian_name, value: String(g.guardian) })), [releaseGuardians]);

  const columns = [
    { header: "Student", accessor: "student_name" },
    { header: "Reason", accessor: (row) => <span className="text-ink-500">{row.reason}</span> },
    { header: "Requested exit", accessor: (row) => new Date(row.requested_exit_time).toLocaleString() },
    {
      header: "Status",
      accessor: (row) => (
        <span className={`inline-flex items-center text-[11.5px] font-bold rounded-full px-2.5 py-0.5 ${STATUS_TONE[row.status] || "bg-cn-bg text-ink-500"}`}>{row.status.toUpperCase()}</span>
      ),
    },
    {
      header: "Actions",
      accessor: (row) => (
        <div className="flex gap-2 items-center">
          {row.status === "pending" && (
            <>
              <button type="button" onClick={() => handleApprove(row)} disabled={actingId === row.id} className="text-[11.5px] font-bold text-success-hex hover:underline cursor-pointer">
                <Check size={13} className="inline mr-1" />
                Approve
              </button>
              <button type="button" onClick={() => handleReject(row)} disabled={actingId === row.id} className="text-[11.5px] font-bold text-error-hex hover:underline cursor-pointer">
                <X size={13} className="inline mr-1" />
                Reject
              </button>
            </>
          )}
          {row.status === "approved" && (
            <button type="button" onClick={() => openRelease(row)} className="text-[11.5px] font-bold text-violet-700 hover:underline cursor-pointer">
              <LogOut size={13} className="inline mr-1" />
              Release
            </button>
          )}
          {(row.status === "rejected" || row.status === "completed") && "—"}
        </div>
      ),
    },
  ];

  return (
    <div className="w-full">
      <div className="flex items-center gap-3 pb-4 border-b border-cn-border mb-6 flex-wrap">
        <div className="flex-1 min-w-0">
          <h1 className="font-heading font-bold text-2xl text-violet-950">Gate passes</h1>
          <p className="text-ink-500 text-[13px] mt-1">Early-exit requests — approve, reject and confirm release</p>
        </div>
        <Button variant="primary" icon={<Plus size={16} />} onClick={() => setShowRequestModal(true)}>
          New request
        </Button>
      </div>

      <Table columns={columns} data={passes} loading={loading} emptyMessage="No gate pass requests" />

      <Modal isOpen={showRequestModal} onClose={() => setShowRequestModal(false)} title="New gate pass request">
        <div className="flex flex-col gap-3 w-[340px] max-w-full">
          <SelectBox label="Class" fieldName="class_section" value={requestForm.class_section} onChange={(e) => handleClassChange(e.target.value)} options={classSectionOptions} />
          <SelectBox
            label="Student"
            fieldName="student"
            value={requestForm.student}
            onChange={(e) => setRequestForm((p) => ({ ...p, student: e.target.value }))}
            options={studentOptions.length ? studentOptions : [{ label: "Pick a class first", value: "" }]}
          />
          <div>
            <label className="block text-sm font-medium mb-1 text-dark">Reason</label>
            <textarea
              value={requestForm.reason}
              onChange={(e) => setRequestForm((p) => ({ ...p, reason: e.target.value }))}
              rows={3}
              className="w-full px-4 py-2 border border-slate-300 rounded-md bg-transparent text-[0.85rem] text-dark outline-none focus:border-violet-500"
            />
          </div>
          <BlackInputField label="Requested exit time" fieldName="requested_exit_time" type="datetime-local" value={requestForm.requested_exit_time} onChange={(e) => setRequestForm((p) => ({ ...p, requested_exit_time: e.target.value }))} required />
          <div className="flex gap-3 justify-end pt-2">
            <Button variant="outline" onClick={() => setShowRequestModal(false)}>
              Cancel
            </Button>
            <Button variant="primary" onClick={handleCreateRequest} loading={saving}>
              Submit
            </Button>
          </div>
        </div>
      </Modal>

      <Modal isOpen={!!releasePass} onClose={() => setReleasePass(null)} title="Release student">
        <div className="flex flex-col gap-3 w-[320px] max-w-full">
          <p className="text-[12.5px] text-ink-500">Confirm who is picking up {releasePass?.student_name}.</p>
          <SelectBox
            label="Verified guardian"
            fieldName="picked_up_by_guardian"
            value={releaseForm.picked_up_by_guardian}
            onChange={(e) => setReleaseForm((p) => ({ ...p, picked_up_by_guardian: e.target.value, picked_up_by_name: "" }))}
            options={guardianOptions.length ? guardianOptions : [{ label: "No verified guardians on file", value: "" }]}
          />
          <div className="text-center text-[11px] text-ink-400">— or —</div>
          <BlackInputField
            label="Other pickup name"
            fieldName="picked_up_by_name"
            value={releaseForm.picked_up_by_name}
            onChange={(e) => setReleaseForm((p) => ({ ...p, picked_up_by_name: e.target.value, picked_up_by_guardian: "" }))}
          />
          <div className="flex gap-3 justify-end pt-2">
            <Button variant="outline" onClick={() => setReleasePass(null)}>
              Cancel
            </Button>
            <Button variant="primary" onClick={handleRelease} loading={saving}>
              Release
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default GatePasses;
