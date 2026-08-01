import React, { useState } from "react";
import { toast } from "react-toastify";
import { Users, Plus } from "lucide-react";
import Button from "../../../components/Button";
import Table from "../../../components/Table";
import Modal from "../../../components/Modal";
import BlackInputField from "../../../components/BlackInputField";
import SelectBox from "../../../components/SelectBox";
import Pagination from "../../../components/Pagination";
import usePaginatedList from "../../../hooks/usePaginatedList";
import accountingService from "../services/accountingService";

const DESIGNATIONS = [
  { label: "Chairman", value: "chairman" },
  { label: "Trustee", value: "trustee" },
  { label: "Secretary", value: "secretary" },
  { label: "Treasurer", value: "treasurer" },
  { label: "Managing Trustee", value: "managing_trustee" },
  { label: "Governing Body Member", value: "member" },
];

const emptyForm = {
  name: "", designation: "trustee", pan: "", contact_number: "", address: "",
  date_of_appointment: "", notes: "",
};

const Trustees = () => {
  const {
    items: trustees,
    page,
    setPage,
    totalPages,
    count,
    pageSize,
    loading,
    refetch,
  } = usePaginatedList(accountingService.getTrustees);

  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    if (!form.name.trim()) {
      toast.error("Trustee name is required.");
      return;
    }
    setSaving(true);
    try {
      await accountingService.createTrustee({
        ...form,
        date_of_appointment: form.date_of_appointment || null,
      });
      toast.success("Trustee added.");
      setShowModal(false);
      setForm(emptyForm);
      refetch();
    } catch (err) {
      console.error("Failed to add trustee:", err);
      toast.error("Failed to add trustee.");
    } finally {
      setSaving(false);
    }
  };

  const handleToggleActive = async (trustee) => {
    try {
      await accountingService.updateTrustee(trustee.id, {
        is_active: !trustee.is_active,
        date_of_cessation: !trustee.is_active ? null : new Date().toISOString().slice(0, 10),
      });
      toast.success(trustee.is_active ? "Marked as ceased." : "Reactivated.");
      refetch();
    } catch (err) {
      console.error("Failed to update trustee:", err);
      toast.error("Failed to update trustee.");
    }
  };

  const columns = [
    { header: "Name", accessor: "name" },
    { header: "Designation", accessor: (row) => DESIGNATIONS.find((d) => d.value === row.designation)?.label || row.designation },
    { header: "PAN", accessor: (row) => row.pan || "-" },
    { header: "Contact", accessor: (row) => row.contact_number || "-" },
    { header: "Appointed", accessor: (row) => row.date_of_appointment || "-" },
    {
      header: "Status",
      accessor: (row) => (
        <button
          type="button" onClick={() => handleToggleActive(row)}
          className={`text-[11px] font-bold px-2 py-0.5 rounded-full cursor-pointer ${row.is_active ? "bg-success-tint text-success-hex" : "bg-cn-bg text-ink-400"}`}
        >
          {row.is_active ? "Active" : "Ceased"}
        </button>
      ),
    },
  ];

  return (
    <div className="w-full">
      <div className="flex items-center gap-3 pb-4 border-b border-cn-border mb-6 flex-wrap">
        <div className="flex-1 min-w-0">
          <h1 className="font-heading font-bold text-2xl text-violet-950 flex items-center gap-2">
            <Users size={22} className="text-violet-700" />
            Trustees &amp; Governing Body
          </h1>
          <p className="text-ink-500 text-[13px] mt-1">Section 13(3) related-party roster</p>
        </div>
        <Button variant="primary" icon={<Plus size={16} />} onClick={() => setShowModal(true)}>
          Add trustee
        </Button>
      </div>

      <Table columns={columns} data={trustees} loading={loading} emptyMessage="No trustees added yet" />
      <Pagination page={page} totalPages={totalPages} count={count} pageSize={pageSize} onPageChange={setPage} loading={loading} />

      <Modal isOpen={showModal} onClose={() => setShowModal(false)} title="Add trustee">
        <div className="flex flex-col gap-3.5 w-[380px] max-w-full">
          <BlackInputField label="Name" fieldName="name" value={form.name} onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))} required />
          <SelectBox label="Designation" fieldName="designation" value={form.designation} onChange={(e) => setForm((p) => ({ ...p, designation: e.target.value }))} options={DESIGNATIONS} />
          <div className="flex gap-3">
            <BlackInputField label="PAN (optional)" fieldName="pan" value={form.pan} onChange={(e) => setForm((p) => ({ ...p, pan: e.target.value.toUpperCase() }))} />
            <BlackInputField label="Contact (optional)" fieldName="contact_number" value={form.contact_number} onChange={(e) => setForm((p) => ({ ...p, contact_number: e.target.value }))} />
          </div>
          <BlackInputField label="Address (optional)" fieldName="address" value={form.address} onChange={(e) => setForm((p) => ({ ...p, address: e.target.value }))} />
          <BlackInputField label="Date of appointment (optional)" fieldName="date_of_appointment" type="date" value={form.date_of_appointment} onChange={(e) => setForm((p) => ({ ...p, date_of_appointment: e.target.value }))} />
          <BlackInputField label="Notes (optional)" fieldName="notes" value={form.notes} onChange={(e) => setForm((p) => ({ ...p, notes: e.target.value }))} placeholder="Related relatives/entities also treated as specified persons" />
          <div className="flex justify-end gap-2 mt-2">
            <Button variant="outline" onClick={() => setShowModal(false)}>Cancel</Button>
            <Button variant="primary" onClick={handleSave} loading={saving}>Save</Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default Trustees;
