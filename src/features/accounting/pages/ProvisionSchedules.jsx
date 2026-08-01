import React, { useEffect, useMemo, useState } from "react";
import { toast } from "react-toastify";
import { CalendarClock, Plus, CheckCircle2, Paperclip } from "lucide-react";
import Button from "../../../components/Button";
import Table from "../../../components/Table";
import Modal from "../../../components/Modal";
import BlackInputField from "../../../components/BlackInputField";
import SelectBox from "../../../components/SelectBox";
import Pagination from "../../../components/Pagination";
import usePaginatedList from "../../../hooks/usePaginatedList";
import accountingService from "../services/accountingService";
import AttachmentsModal from "../components/AttachmentsModal";

const asList = (data) => (Array.isArray(data) ? data : data?.results || []);

const SCHEDULE_TYPES = [
  { label: "Prepaid Expense", value: "prepaid_expense" },
  { label: "Accrued Expense", value: "accrued_expense" },
  { label: "Fees Received in Advance", value: "fees_advance" },
  { label: "Refundable Deposit", value: "refundable_deposit" },
  { label: "Gratuity Provision", value: "gratuity" },
  { label: "Leave Encashment Provision", value: "leave_encashment" },
];

const PAYMENT_METHODS = [
  { label: "Net Banking", value: "net_banking" },
  { label: "Cash", value: "cash" },
  { label: "UPI", value: "upi" },
  { label: "Card", value: "card" },
];

const STATUS_TONE = { active: "bg-warning-tint text-warning-hex", released: "bg-success-tint text-success-hex" };

const emptyForm = {
  schedule_type: "prepaid_expense", description: "", party_name: "", amount: "",
  start_date: new Date().toISOString().slice(0, 10), expected_release_date: "", payment_method: "net_banking", contra_account: "",
};

const ProvisionSchedules = () => {
  const {
    items: schedules,
    page,
    setPage,
    totalPages,
    count,
    pageSize,
    loading,
    refetch,
  } = usePaginatedList(accountingService.getProvisionSchedules);

  const [ledgerAccounts, setLedgerAccounts] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);

  const [releasingSchedule, setReleasingSchedule] = useState(null);
  const [releaseForm, setReleaseForm] = useState({ release_amount: "", release_date: new Date().toISOString().slice(0, 10) });
  const [releasing, setReleasing] = useState(false);
  const [attachingSchedule, setAttachingSchedule] = useState(null);

  useEffect(() => {
    accountingService.getLedgerAccounts({ page_size: 500 }).then((res) => setLedgerAccounts(asList(res.data))).catch(() => {});
  }, []);

  const ledgerAccountOptions = useMemo(
    () => [{ label: "Default for type", value: "" }, ...ledgerAccounts.map((a) => ({ label: `${a.code} - ${a.name}`, value: String(a.id) }))],
    [ledgerAccounts]
  );

  const showContraAccount = form.schedule_type === "prepaid_expense" || form.schedule_type === "accrued_expense" || form.schedule_type === "fees_advance";

  const handleSave = async () => {
    if (!form.description.trim() || !form.amount || !form.start_date) {
      toast.error("Description, amount and start date are required.");
      return;
    }
    setSaving(true);
    try {
      await accountingService.createProvisionSchedule({
        ...form,
        amount: Number(form.amount),
        expected_release_date: form.expected_release_date || null,
        contra_account: form.contra_account ? Number(form.contra_account) : null,
      });
      toast.success("Schedule recorded and posted to the ledger.");
      setShowModal(false);
      setForm(emptyForm);
      refetch();
    } catch (err) {
      console.error("Failed to record schedule:", err);
      toast.error(err?.response?.data?.error || "Failed to record schedule.");
    } finally {
      setSaving(false);
    }
  };

  const openReleaseModal = (schedule) => {
    setReleasingSchedule(schedule);
    setReleaseForm({ release_amount: String(schedule.amount), release_date: new Date().toISOString().slice(0, 10) });
  };

  const handleRelease = async () => {
    if (!releaseForm.release_amount) {
      toast.error("Enter the release amount.");
      return;
    }
    setReleasing(true);
    try {
      await accountingService.releaseProvisionSchedule(releasingSchedule.id, Number(releaseForm.release_amount), releaseForm.release_date);
      toast.success("Schedule released and posted to the ledger.");
      setReleasingSchedule(null);
      refetch();
    } catch (err) {
      console.error("Failed to release schedule:", err);
      toast.error(err?.response?.data?.error || "Failed to release schedule.");
    } finally {
      setReleasing(false);
    }
  };

  const columns = [
    { header: "Type", accessor: (row) => SCHEDULE_TYPES.find((t) => t.value === row.schedule_type)?.label || row.schedule_type },
    { header: "Description", accessor: "description" },
    { header: "Party", accessor: (row) => row.party_name || "-" },
    { header: "Amount", accessor: (row) => `₹${Number(row.amount).toLocaleString("en-IN")}` },
    { header: "Start Date", accessor: "start_date" },
    { header: "Expected Release", accessor: (row) => row.expected_release_date || "-" },
    {
      header: "Status",
      accessor: (row) => <span className={`text-[11px] font-bold px-2 py-0.5 rounded-full ${STATUS_TONE[row.status] || ""}`}>{row.status.toUpperCase()}</span>,
    },
    {
      header: "Action",
      accessor: (row) => (
        <div className="flex items-center gap-2">
          {row.status === "active" && (
            <button type="button" onClick={() => openReleaseModal(row)} className="text-[11.5px] font-bold text-violet-700 hover:underline cursor-pointer inline-flex items-center gap-1">
              <CheckCircle2 size={13} /> Release
            </button>
          )}
          <button type="button" onClick={() => setAttachingSchedule(row)} className="text-ink-500 hover:text-violet-700 cursor-pointer" title="Attachments">
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
            <CalendarClock size={22} className="text-violet-700" />
            Provisions &amp; Schedules
          </h1>
          <p className="text-ink-500 text-[13px] mt-1">Prepaid/accrued expenses, fees in advance, refundable deposits, gratuity &amp; leave encashment</p>
        </div>
        <Button variant="primary" icon={<Plus size={16} />} onClick={() => setShowModal(true)}>
          Record schedule
        </Button>
      </div>

      <Table columns={columns} data={schedules} loading={loading} emptyMessage="No provisions or schedules recorded yet" />
      <Pagination page={page} totalPages={totalPages} count={count} pageSize={pageSize} onPageChange={setPage} loading={loading} />

      <Modal isOpen={showModal} onClose={() => setShowModal(false)} title="Record provision / schedule">
        <div className="flex flex-col gap-3.5 w-[400px] max-w-full">
          <SelectBox label="Type" fieldName="schedule_type" value={form.schedule_type} onChange={(e) => setForm((p) => ({ ...p, schedule_type: e.target.value }))} options={SCHEDULE_TYPES} />
          <BlackInputField label="Description" fieldName="description" value={form.description} onChange={(e) => setForm((p) => ({ ...p, description: e.target.value }))} placeholder="e.g. Prepaid insurance — FY26" required />
          <BlackInputField label="Party name (optional)" fieldName="party_name" value={form.party_name} onChange={(e) => setForm((p) => ({ ...p, party_name: e.target.value }))} placeholder="e.g. staff/vendor/donor name" />
          <div className="flex gap-3">
            <BlackInputField label="Amount (₹)" fieldName="amount" type="number" value={form.amount} onChange={(e) => setForm((p) => ({ ...p, amount: e.target.value }))} required />
            <BlackInputField label="Start date" fieldName="start_date" type="date" value={form.start_date} onChange={(e) => setForm((p) => ({ ...p, start_date: e.target.value }))} required />
          </div>
          <BlackInputField label="Expected release date (optional)" fieldName="expected_release_date" type="date" value={form.expected_release_date} onChange={(e) => setForm((p) => ({ ...p, expected_release_date: e.target.value }))} />
          <SelectBox label="Cash/bank account" fieldName="payment_method" value={form.payment_method} onChange={(e) => setForm((p) => ({ ...p, payment_method: e.target.value }))} options={PAYMENT_METHODS} />
          {showContraAccount && (
            <SelectBox
              label="Expense/income account override (optional)" fieldName="contra_account" value={form.contra_account}
              onChange={(e) => setForm((p) => ({ ...p, contra_account: e.target.value }))} options={ledgerAccountOptions}
            />
          )}
          <div className="flex justify-end gap-2 mt-2">
            <Button variant="outline" onClick={() => setShowModal(false)}>Cancel</Button>
            <Button variant="primary" onClick={handleSave} loading={saving}>Save</Button>
          </div>
        </div>
      </Modal>

      <Modal isOpen={!!releasingSchedule} onClose={() => setReleasingSchedule(null)} title={`Release · ${releasingSchedule?.description || ""}`}>
        <div className="flex flex-col gap-3.5 w-[340px] max-w-full">
          <BlackInputField label="Release amount (₹)" fieldName="release_amount" type="number" value={releaseForm.release_amount} onChange={(e) => setReleaseForm((p) => ({ ...p, release_amount: e.target.value }))} required />
          <BlackInputField label="Release date" fieldName="release_date" type="date" value={releaseForm.release_date} onChange={(e) => setReleaseForm((p) => ({ ...p, release_date: e.target.value }))} required />
          <div className="flex justify-end gap-2 mt-2">
            <Button variant="outline" onClick={() => setReleasingSchedule(null)}>Cancel</Button>
            <Button variant="primary" onClick={handleRelease} loading={releasing}>Confirm release</Button>
          </div>
        </div>
      </Modal>

      <AttachmentsModal
        isOpen={!!attachingSchedule} onClose={() => setAttachingSchedule(null)}
        recordType="provision_schedule" recordId={attachingSchedule?.id}
        title={`Attachments · ${attachingSchedule?.description || ""}`}
      />
    </div>
  );
};

export default ProvisionSchedules;
