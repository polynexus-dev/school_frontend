import React, { useEffect, useState } from "react";
import { toast } from "react-toastify";
import { Plus, LogOut } from "lucide-react";
import Button from "../../../components/Button";
import Table from "../../../components/Table";
import Modal from "../../../components/Modal";
import BlackInputField from "../../../components/BlackInputField";
import gateService from "../services/gateService";

const asList = (data) => (Array.isArray(data) ? data : data?.results || []);
const emptyForm = { full_name: "", phone_number: "", purpose_of_visit: "", person_to_meet: "", vehicle_number: "" };

const VisitorLog = () => {
  const [visitors, setVisitors] = useState([]);
  const [loading, setLoading] = useState(false);
  const [onlyOnPremises, setOnlyOnPremises] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);
  const [actingId, setActingId] = useState(null);

  const load = async () => {
    setLoading(true);
    try {
      const res = await gateService.getVisitors(onlyOnPremises ? { on_premises: "true" } : {});
      setVisitors(asList(res.data));
    } catch (err) {
      console.error("Failed to load visitors:", err);
      toast.error("Failed to load visitor log.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [onlyOnPremises]);

  const handleCheckIn = async () => {
    if (!form.full_name.trim() || !form.purpose_of_visit.trim()) {
      toast.error("Name and purpose of visit are required.");
      return;
    }
    setSaving(true);
    try {
      await gateService.checkInVisitor(form);
      toast.success("Visitor checked in.");
      setShowModal(false);
      setForm(emptyForm);
      load();
    } catch (err) {
      console.error("Failed to check in visitor:", err);
      toast.error("Failed to check in visitor.");
    } finally {
      setSaving(false);
    }
  };

  const handleCheckOut = async (visitor) => {
    setActingId(visitor.id);
    try {
      await gateService.checkOutVisitor(visitor.id);
      toast.success("Visitor checked out.");
      load();
    } catch (err) {
      console.error("Failed to check out visitor:", err);
      toast.error("Failed to check out visitor.");
    } finally {
      setActingId(null);
    }
  };

  const columns = [
    { header: "Name", accessor: (row) => <span className="font-semibold text-ink-900">{row.full_name}</span> },
    { header: "Purpose", accessor: "purpose_of_visit" },
    { header: "To meet", accessor: (row) => row.person_to_meet || "—" },
    { header: "Phone", accessor: (row) => row.phone_number || "—" },
    { header: "Checked in", accessor: (row) => new Date(row.check_in_time).toLocaleString() },
    {
      header: "Status",
      accessor: (row) => (
        <span className={`inline-flex items-center text-[11.5px] font-bold rounded-full px-2.5 py-0.5 ${row.check_out_time ? "bg-cn-bg text-ink-400" : "bg-success-tint text-success-hex"}`}>
          {row.check_out_time ? "CHECKED OUT" : "ON PREMISES"}
        </span>
      ),
    },
    {
      header: "Actions",
      accessor: (row) =>
        !row.check_out_time ? (
          <button type="button" onClick={() => handleCheckOut(row)} disabled={actingId === row.id} className="text-[11.5px] font-bold text-violet-700 hover:underline cursor-pointer">
            <LogOut size={13} className="inline mr-1" />
            Check out
          </button>
        ) : (
          "—"
        ),
    },
  ];

  return (
    <div className="w-full">
      <div className="flex items-center gap-3 pb-4 border-b border-cn-border mb-6 flex-wrap">
        <div className="flex-1 min-w-0">
          <h1 className="font-heading font-bold text-2xl text-violet-950">Visitor log</h1>
          <p className="text-ink-500 text-[13px] mt-1">Front-gate check-in / check-out</p>
        </div>
        <label className="flex items-center gap-2 text-[13px] text-ink-700 font-semibold cursor-pointer">
          <input type="checkbox" checked={onlyOnPremises} onChange={(e) => setOnlyOnPremises(e.target.checked)} />
          On premises only
        </label>
        <Button variant="primary" icon={<Plus size={16} />} onClick={() => setShowModal(true)}>
          Check in visitor
        </Button>
      </div>

      <Table columns={columns} data={visitors} loading={loading} emptyMessage="No visitors logged" />

      <Modal isOpen={showModal} onClose={() => setShowModal(false)} title="Check in visitor">
        <div className="flex flex-col gap-3 w-[340px] max-w-full">
          <BlackInputField label="Full name" fieldName="full_name" value={form.full_name} onChange={(e) => setForm((p) => ({ ...p, full_name: e.target.value }))} required />
          <BlackInputField label="Phone number" fieldName="phone_number" value={form.phone_number} onChange={(e) => setForm((p) => ({ ...p, phone_number: e.target.value }))} />
          <BlackInputField label="Purpose of visit" fieldName="purpose_of_visit" value={form.purpose_of_visit} onChange={(e) => setForm((p) => ({ ...p, purpose_of_visit: e.target.value }))} required />
          <BlackInputField label="Person to meet" fieldName="person_to_meet" value={form.person_to_meet} onChange={(e) => setForm((p) => ({ ...p, person_to_meet: e.target.value }))} />
          <BlackInputField label="Vehicle number" fieldName="vehicle_number" value={form.vehicle_number} onChange={(e) => setForm((p) => ({ ...p, vehicle_number: e.target.value }))} />
          <div className="flex gap-3 justify-end pt-2">
            <Button variant="outline" onClick={() => setShowModal(false)}>
              Cancel
            </Button>
            <Button variant="primary" onClick={handleCheckIn} loading={saving}>
              Check in
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default VisitorLog;
