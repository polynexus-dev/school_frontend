import React, { useState } from "react";
import { toast } from "react-toastify";
import { Landmark, Plus, FileCheck, Paperclip } from "lucide-react";
import Button from "../../../components/Button";
import Table from "../../../components/Table";
import Modal from "../../../components/Modal";
import BlackInputField from "../../../components/BlackInputField";
import SelectBox from "../../../components/SelectBox";
import Pagination from "../../../components/Pagination";
import usePaginatedList from "../../../hooks/usePaginatedList";
import accountingService from "../services/accountingService";
import AttachmentsModal from "../components/AttachmentsModal";

const PAYMENT_METHODS = [
  { label: "Net Banking", value: "net_banking" },
  { label: "Cash", value: "cash" },
  { label: "UPI", value: "upi" },
  { label: "Card", value: "card" },
  { label: "Cheque", value: "cheque" },
];

const STATUS_TONE = {
  received: "bg-warning-tint text-warning-hex",
  partially_utilized: "bg-violet-50 text-violet-700",
  fully_utilized: "bg-success-tint text-success-hex",
};

const emptyGrantForm = { grantor_name: "", grant_reference: "", amount: "", date_received: new Date().toISOString().slice(0, 10), purpose: "", payment_method: "net_banking" };
const emptyUtilizationForm = { amount: "", date: new Date().toISOString().slice(0, 10), narration: "" };

const Grants = () => {
  const {
    items: grants,
    page,
    setPage,
    totalPages,
    count,
    pageSize,
    loading,
    refetch,
  } = usePaginatedList(accountingService.getGrants);

  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState(emptyGrantForm);
  const [saving, setSaving] = useState(false);

  const [utilizingGrant, setUtilizingGrant] = useState(null);
  const [utilForm, setUtilForm] = useState(emptyUtilizationForm);
  const [recording, setRecording] = useState(false);
  const [issuing, setIssuing] = useState(null);
  const [attachingGrant, setAttachingGrant] = useState(null);

  const handleSave = async () => {
    if (!form.grantor_name.trim() || !form.amount || !form.date_received) {
      toast.error("Grantor name, amount and date received are required.");
      return;
    }
    setSaving(true);
    try {
      await accountingService.createGrant({ ...form, amount: Number(form.amount) });
      toast.success("Grant recorded and posted to the ledger.");
      setShowModal(false);
      setForm(emptyGrantForm);
      refetch();
    } catch (err) {
      console.error("Failed to record grant:", err);
      toast.error(err?.response?.data?.error || "Failed to record grant.");
    } finally {
      setSaving(false);
    }
  };

  const openUtilizeModal = (grant) => {
    setUtilizingGrant(grant);
    setUtilForm({ ...emptyUtilizationForm, amount: String(grant.remaining_unutilized || "") });
  };

  const handleRecordUtilization = async () => {
    if (!utilForm.amount || Number(utilForm.amount) <= 0) {
      toast.error("Enter a valid utilization amount.");
      return;
    }
    setRecording(true);
    try {
      await accountingService.recordGrantUtilization({ ...utilForm, grant: utilizingGrant.id, amount: Number(utilForm.amount) });
      toast.success("Utilization recorded and posted to the ledger.");
      setUtilizingGrant(null);
      refetch();
    } catch (err) {
      console.error("Failed to record grant utilization:", err);
      toast.error(err?.response?.data?.non_field_errors?.[0] || err?.response?.data?.error || "Failed to record utilization.");
    } finally {
      setRecording(false);
    }
  };

  const handleIssueCertificate = async (grant) => {
    setIssuing(grant.id);
    try {
      await accountingService.issueUtilizationCertificate(grant.id);
      toast.success("Utilization certificate marked as issued.");
      refetch();
    } catch (err) {
      console.error("Failed to issue utilization certificate:", err);
      toast.error(err?.response?.data?.error || "Failed to issue certificate.");
    } finally {
      setIssuing(null);
    }
  };

  const columns = [
    { header: "Grantor", accessor: "grantor_name" },
    { header: "Reference", accessor: (row) => row.grant_reference || "-" },
    { header: "Amount", accessor: (row) => `₹${Number(row.amount).toLocaleString("en-IN")}` },
    { header: "Utilized", accessor: (row) => `₹${Number(row.utilized_amount).toLocaleString("en-IN")}` },
    { header: "Remaining", accessor: (row) => `₹${Number(row.remaining_unutilized).toLocaleString("en-IN")}` },
    {
      header: "Status",
      accessor: (row) => (
        <span className={`text-[11px] font-bold px-2 py-0.5 rounded-full ${STATUS_TONE[row.status] || ""}`}>{row.status.replace(/_/g, " ").toUpperCase()}</span>
      ),
    },
    {
      header: "Action",
      accessor: (row) => (
        <div className="flex items-center gap-2">
          {row.status !== "fully_utilized" && (
            <button type="button" onClick={() => openUtilizeModal(row)} className="text-[11.5px] font-bold text-violet-700 hover:underline cursor-pointer">
              Utilize
            </button>
          )}
          {row.status === "fully_utilized" && !row.utilization_certificate_issued && (
            <button type="button" onClick={() => handleIssueCertificate(row)} disabled={issuing === row.id} className="text-[11.5px] font-bold text-success-hex hover:underline cursor-pointer inline-flex items-center gap-1">
              <FileCheck size={13} /> Issue UC
            </button>
          )}
          {row.utilization_certificate_issued && <span className="text-[11px] text-success-hex font-bold">UC Issued</span>}
          <button type="button" onClick={() => setAttachingGrant(row)} className="text-ink-500 hover:text-violet-700 cursor-pointer" title="Attachments">
            <Paperclip size={14} />
          </button>
        </div>
      ),
    },
  ];

  return (
    <div className="w-full">
      <div className="flex items-center gap-3 pb-4 border-b border-cn-border mb-6 flex-wrap">
        <div className="flex-1 min-w-0">
          <h1 className="font-heading font-bold text-2xl text-violet-950 flex items-center gap-2">
            <Landmark size={22} className="text-violet-700" />
            Grant Register
          </h1>
          <p className="text-ink-500 text-[13px] mt-1">Grants received, utilization progress &amp; utilization certificates</p>
        </div>
        <Button variant="primary" icon={<Plus size={16} />} onClick={() => setShowModal(true)}>
          Record grant
        </Button>
      </div>

      <Table columns={columns} data={grants} loading={loading} emptyMessage="No grants recorded yet" />
      <Pagination page={page} totalPages={totalPages} count={count} pageSize={pageSize} onPageChange={setPage} loading={loading} />

      <Modal isOpen={showModal} onClose={() => setShowModal(false)} title="Record grant">
        <div className="flex flex-col gap-3.5 w-[380px] max-w-full">
          <BlackInputField label="Grantor name" fieldName="grantor_name" value={form.grantor_name} onChange={(e) => setForm((p) => ({ ...p, grantor_name: e.target.value }))} required />
          <BlackInputField label="Grant reference (optional)" fieldName="grant_reference" value={form.grant_reference} onChange={(e) => setForm((p) => ({ ...p, grant_reference: e.target.value }))} />
          <div className="flex gap-3">
            <BlackInputField label="Amount (₹)" fieldName="amount" type="number" value={form.amount} onChange={(e) => setForm((p) => ({ ...p, amount: e.target.value }))} required />
            <BlackInputField label="Date received" fieldName="date_received" type="date" value={form.date_received} onChange={(e) => setForm((p) => ({ ...p, date_received: e.target.value }))} required />
          </div>
          <BlackInputField label="Purpose (optional)" fieldName="purpose" value={form.purpose} onChange={(e) => setForm((p) => ({ ...p, purpose: e.target.value }))} />
          <SelectBox label="Received via" fieldName="payment_method" value={form.payment_method} onChange={(e) => setForm((p) => ({ ...p, payment_method: e.target.value }))} options={PAYMENT_METHODS} />
          <div className="flex justify-end gap-2 mt-2">
            <Button variant="outline" onClick={() => setShowModal(false)}>Cancel</Button>
            <Button variant="primary" onClick={handleSave} loading={saving}>Save</Button>
          </div>
        </div>
      </Modal>

      <Modal isOpen={!!utilizingGrant} onClose={() => setUtilizingGrant(null)} title={`Record utilization · ${utilizingGrant?.grantor_name || ""}`}>
        <div className="flex flex-col gap-3.5 w-[340px] max-w-full">
          <p className="text-[12.5px] text-ink-500">
            Remaining unutilized: <b className="text-ink-900">₹{Number(utilizingGrant?.remaining_unutilized || 0).toLocaleString("en-IN")}</b>.
            Record the actual expenditure separately via Expense Voucher/Bill — this only recognizes the matching income.
          </p>
          <BlackInputField label="Amount utilized (₹)" fieldName="amount" type="number" value={utilForm.amount} onChange={(e) => setUtilForm((p) => ({ ...p, amount: e.target.value }))} required />
          <BlackInputField label="Date" fieldName="date" type="date" value={utilForm.date} onChange={(e) => setUtilForm((p) => ({ ...p, date: e.target.value }))} required />
          <BlackInputField label="Narration (optional)" fieldName="narration" value={utilForm.narration} onChange={(e) => setUtilForm((p) => ({ ...p, narration: e.target.value }))} placeholder="e.g. Purchased microscopes" />
          <div className="flex justify-end gap-2 mt-2">
            <Button variant="outline" onClick={() => setUtilizingGrant(null)}>Cancel</Button>
            <Button variant="primary" onClick={handleRecordUtilization} loading={recording}>Record utilization</Button>
          </div>
        </div>
      </Modal>

      <AttachmentsModal
        isOpen={!!attachingGrant} onClose={() => setAttachingGrant(null)}
        recordType="grant" recordId={attachingGrant?.id}
        title={`Attachments · ${attachingGrant?.grantor_name || ""}`}
      />
    </div>
  );
};

export default Grants;
