import React, { useState } from "react";
import { toast } from "react-toastify";
import { ShieldCheck, Plus, Paperclip } from "lucide-react";
import Button from "../../../components/Button";
import Table from "../../../components/Table";
import Modal from "../../../components/Modal";
import BlackInputField from "../../../components/BlackInputField";
import SelectBox from "../../../components/SelectBox";
import Pagination from "../../../components/Pagination";
import usePaginatedList from "../../../hooks/usePaginatedList";
import accountingService from "../services/accountingService";
import AttachmentsModal from "../components/AttachmentsModal";

const STATUTORY_TYPES = [
  { label: "Provident Fund (PF)", value: "pf" },
  { label: "ESI", value: "esi" },
  { label: "Professional Tax", value: "professional_tax" },
  { label: "TDS", value: "tds" },
];

const PAYMENT_METHODS = [
  { label: "Net Banking", value: "net_banking" },
  { label: "Cash", value: "cash" },
  { label: "UPI", value: "upi" },
  { label: "Card", value: "card" },
];

const MONTHS = Array.from({ length: 12 }, (_, i) => ({ label: new Date(2000, i, 1).toLocaleString("default", { month: "long" }), value: String(i + 1) }));

const emptyForm = {
  statutory_type: "pf", period_month: String(new Date().getMonth() + 1), period_year: String(new Date().getFullYear()),
  amount: "", challan_number: "", payment_date: new Date().toISOString().slice(0, 10), filed_date: "", payment_method: "net_banking",
};

const StatutoryChallans = () => {
  const {
    items: challans,
    page,
    setPage,
    totalPages,
    count,
    pageSize,
    loading,
    refetch,
  } = usePaginatedList(accountingService.getStatutoryChallans);

  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);
  const [attachingChallan, setAttachingChallan] = useState(null);

  const handleSave = async () => {
    if (!form.amount || !form.payment_date) {
      toast.error("Amount and payment date are required.");
      return;
    }
    setSaving(true);
    try {
      await accountingService.createStatutoryChallan({
        ...form,
        period_month: Number(form.period_month),
        period_year: Number(form.period_year),
        amount: Number(form.amount),
        filed_date: form.filed_date || null,
      });
      toast.success("Challan recorded and posted to the ledger.");
      setShowModal(false);
      setForm(emptyForm);
      refetch();
    } catch (err) {
      console.error("Failed to record challan:", err);
      toast.error(err?.response?.data?.error || "Failed to record challan.");
    } finally {
      setSaving(false);
    }
  };

  const columns = [
    { header: "Type", accessor: (row) => STATUTORY_TYPES.find((t) => t.value === row.statutory_type)?.label || row.statutory_type },
    { header: "Period", accessor: (row) => `${row.period_month}/${row.period_year}` },
    { header: "Challan #", accessor: (row) => row.challan_number || "-" },
    { header: "Amount", accessor: (row) => `₹${Number(row.amount).toLocaleString("en-IN")}` },
    { header: "Payment Date", accessor: "payment_date" },
    { header: "Return Filed", accessor: (row) => row.filed_date || "-" },
    {
      header: "Files",
      accessor: (row) => (
        <button type="button" onClick={() => setAttachingChallan(row)} className="text-ink-500 hover:text-violet-700 cursor-pointer" title="Attachments">
          <Paperclip size={14} />
        </button>
      ),
    },
  ];

  return (
    <div className="w-full">
      <div className="flex items-center gap-3 pb-4 border-b border-cn-border mb-6 flex-wrap">
        <div className="flex-1 min-w-0">
          <h1 className="font-heading font-bold text-2xl text-violet-950 flex items-center gap-2">
            <ShieldCheck size={22} className="text-violet-700" />
            Statutory Challans
          </h1>
          <p className="text-ink-500 text-[13px] mt-1">PF / ESI / Professional Tax / TDS remittances</p>
        </div>
        <Button variant="primary" icon={<Plus size={16} />} onClick={() => setShowModal(true)}>
          Record challan
        </Button>
      </div>

      <Table columns={columns} data={challans} loading={loading} emptyMessage="No challans recorded yet" />
      <Pagination page={page} totalPages={totalPages} count={count} pageSize={pageSize} onPageChange={setPage} loading={loading} />

      <Modal isOpen={showModal} onClose={() => setShowModal(false)} title="Record statutory challan">
        <div className="flex flex-col gap-3.5 w-[380px] max-w-full">
          <SelectBox label="Type" fieldName="statutory_type" value={form.statutory_type} onChange={(e) => setForm((p) => ({ ...p, statutory_type: e.target.value }))} options={STATUTORY_TYPES} />
          <div className="flex gap-3">
            <SelectBox label="Period month" fieldName="period_month" value={form.period_month} onChange={(e) => setForm((p) => ({ ...p, period_month: e.target.value }))} options={MONTHS} />
            <BlackInputField label="Period year" fieldName="period_year" type="number" value={form.period_year} onChange={(e) => setForm((p) => ({ ...p, period_year: e.target.value }))} />
          </div>
          <BlackInputField label="Amount (₹)" fieldName="amount" type="number" value={form.amount} onChange={(e) => setForm((p) => ({ ...p, amount: e.target.value }))} required />
          <BlackInputField label="Challan number (optional)" fieldName="challan_number" value={form.challan_number} onChange={(e) => setForm((p) => ({ ...p, challan_number: e.target.value }))} />
          <div className="flex gap-3">
            <BlackInputField label="Payment date" fieldName="payment_date" type="date" value={form.payment_date} onChange={(e) => setForm((p) => ({ ...p, payment_date: e.target.value }))} required />
            <BlackInputField label="Return filed date (optional)" fieldName="filed_date" type="date" value={form.filed_date} onChange={(e) => setForm((p) => ({ ...p, filed_date: e.target.value }))} />
          </div>
          <SelectBox label="Paid via" fieldName="payment_method" value={form.payment_method} onChange={(e) => setForm((p) => ({ ...p, payment_method: e.target.value }))} options={PAYMENT_METHODS} />
          <div className="flex justify-end gap-2 mt-2">
            <Button variant="outline" onClick={() => setShowModal(false)}>Cancel</Button>
            <Button variant="primary" onClick={handleSave} loading={saving}>Save</Button>
          </div>
        </div>
      </Modal>

      <AttachmentsModal
        isOpen={!!attachingChallan} onClose={() => setAttachingChallan(null)}
        recordType="statutory_challan" recordId={attachingChallan?.id}
        title={`Attachments · ${attachingChallan?.challan_number || ""}`}
      />
    </div>
  );
};

export default StatutoryChallans;
