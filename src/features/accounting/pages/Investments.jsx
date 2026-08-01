import React, { useState } from "react";
import { toast } from "react-toastify";
import { PiggyBank, Plus, Banknote, Paperclip } from "lucide-react";
import Button from "../../../components/Button";
import Table from "../../../components/Table";
import Modal from "../../../components/Modal";
import BlackInputField from "../../../components/BlackInputField";
import SelectBox from "../../../components/SelectBox";
import Pagination from "../../../components/Pagination";
import usePaginatedList from "../../../hooks/usePaginatedList";
import accountingService from "../services/accountingService";
import AttachmentsModal from "../components/AttachmentsModal";

const MODES = [
  { label: "Scheduled/Co-op Bank Fixed Deposit", value: "bank_fixed_deposit" },
  { label: "Government Savings Certificate", value: "govt_savings_certificate" },
  { label: "Post Office Savings Bank Deposit", value: "post_office_savings" },
  { label: "UTI Units", value: "uti_units" },
  { label: "Government Securities / Bonds", value: "govt_securities" },
  { label: "PSU Bonds / Debentures", value: "psu_bonds" },
  { label: "Specified Mutual Fund Units", value: "mutual_fund" },
  { label: "Immovable Property", value: "immovable_property" },
  { label: "Other Sec 11(5) Approved Mode", value: "other_approved" },
  { label: "Non-Specified Mode (NON-COMPLIANT)", value: "non_compliant" },
];

const PAYMENT_METHODS = [
  { label: "Net Banking", value: "net_banking" },
  { label: "Cash", value: "cash" },
  { label: "UPI", value: "upi" },
  { label: "Card", value: "card" },
];

const emptyForm = {
  name: "", mode: "bank_fixed_deposit", institution_name: "", account_or_certificate_number: "",
  principal_amount: "", interest_rate_percent: "", investment_date: new Date().toISOString().slice(0, 10),
  maturity_date: "", payment_method: "net_banking", notes: "",
};

const Investments = () => {
  const {
    items: investments,
    page,
    setPage,
    totalPages,
    count,
    pageSize,
    loading,
    refetch,
  } = usePaginatedList(accountingService.getInvestments);

  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);

  const [redeemingInvestment, setRedeemingInvestment] = useState(null);
  const [attachingInvestment, setAttachingInvestment] = useState(null);
  const [redemptionForm, setRedemptionForm] = useState({ redemption_amount: "", redemption_date: new Date().toISOString().slice(0, 10) });
  const [redeeming, setRedeeming] = useState(false);

  const handleSave = async () => {
    if (!form.name.trim() || !form.principal_amount || !form.investment_date) {
      toast.error("Name, principal amount and investment date are required.");
      return;
    }
    setSaving(true);
    try {
      await accountingService.createInvestment({
        ...form,
        principal_amount: Number(form.principal_amount),
        interest_rate_percent: form.interest_rate_percent ? Number(form.interest_rate_percent) : null,
        maturity_date: form.maturity_date || null,
      });
      toast.success("Investment recorded and posted to the ledger.");
      setShowModal(false);
      setForm(emptyForm);
      refetch();
    } catch (err) {
      console.error("Failed to record investment:", err);
      toast.error(err?.response?.data?.error || "Failed to record investment.");
    } finally {
      setSaving(false);
    }
  };

  const openRedeemModal = (investment) => {
    setRedeemingInvestment(investment);
    setRedemptionForm({ redemption_amount: String(investment.principal_amount), redemption_date: new Date().toISOString().slice(0, 10) });
  };

  const handleRedeem = async () => {
    if (!redemptionForm.redemption_amount) {
      toast.error("Enter the redemption amount.");
      return;
    }
    setRedeeming(true);
    try {
      await accountingService.redeemInvestment(redeemingInvestment.id, Number(redemptionForm.redemption_amount), redemptionForm.redemption_date);
      toast.success("Investment redeemed and posted to the ledger.");
      setRedeemingInvestment(null);
      refetch();
    } catch (err) {
      console.error("Failed to redeem investment:", err);
      toast.error(err?.response?.data?.error || "Failed to redeem investment.");
    } finally {
      setRedeeming(false);
    }
  };

  const columns = [
    { header: "Investment", accessor: "name" },
    { header: "Mode", accessor: (row) => row.mode.replace(/_/g, " ") },
    {
      header: "Sec 11(5)",
      accessor: (row) => (
        <span className={`text-[11px] font-bold px-2 py-0.5 rounded-full ${row.is_sec_11_5_compliant ? "bg-success-tint text-success-hex" : "bg-error-tint text-error-hex"}`}>
          {row.is_sec_11_5_compliant ? "Compliant" : "NON-COMPLIANT"}
        </span>
      ),
    },
    { header: "Principal", accessor: (row) => `₹${Number(row.principal_amount).toLocaleString("en-IN")}` },
    { header: "Maturity", accessor: (row) => row.maturity_date || "-" },
    {
      header: "Status",
      accessor: (row) => (
        <span className={`text-[11px] font-bold px-2 py-0.5 rounded-full ${row.status === "active" ? "bg-warning-tint text-warning-hex" : "bg-success-tint text-success-hex"}`}>
          {row.status.toUpperCase()}
        </span>
      ),
    },
    {
      header: "Action",
      accessor: (row) => (
        <div className="flex items-center gap-2">
          {row.status === "active" && (
            <button type="button" onClick={() => openRedeemModal(row)} className="text-[11.5px] font-bold text-violet-700 hover:underline cursor-pointer inline-flex items-center gap-1">
              <Banknote size={13} /> Redeem
            </button>
          )}
          <button type="button" onClick={() => setAttachingInvestment(row)} className="text-ink-500 hover:text-violet-700 cursor-pointer" title="Attachments">
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
            <PiggyBank size={22} className="text-violet-700" />
            Investment Register
          </h1>
          <p className="text-ink-500 text-[13px] mt-1">Section 11(5) compliance tracking for Trust surplus funds</p>
        </div>
        <Button variant="primary" icon={<Plus size={16} />} onClick={() => setShowModal(true)}>
          Record investment
        </Button>
      </div>

      <Table columns={columns} data={investments} loading={loading} emptyMessage="No investments recorded yet" />
      <Pagination page={page} totalPages={totalPages} count={count} pageSize={pageSize} onPageChange={setPage} loading={loading} />

      <Modal isOpen={showModal} onClose={() => setShowModal(false)} title="Record investment">
        <div className="flex flex-col gap-3.5 w-[420px] max-w-full">
          <BlackInputField label="Investment name" fieldName="name" value={form.name} onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))} placeholder="e.g. HDFC Bank FD #12345" required />
          <SelectBox label="Mode (Sec 11(5) category)" fieldName="mode" value={form.mode} onChange={(e) => setForm((p) => ({ ...p, mode: e.target.value }))} options={MODES} />
          <div className="flex gap-3">
            <BlackInputField label="Institution (optional)" fieldName="institution_name" value={form.institution_name} onChange={(e) => setForm((p) => ({ ...p, institution_name: e.target.value }))} />
            <BlackInputField label="Account/Certificate # (optional)" fieldName="account_or_certificate_number" value={form.account_or_certificate_number} onChange={(e) => setForm((p) => ({ ...p, account_or_certificate_number: e.target.value }))} />
          </div>
          <div className="flex gap-3">
            <BlackInputField label="Principal amount (₹)" fieldName="principal_amount" type="number" value={form.principal_amount} onChange={(e) => setForm((p) => ({ ...p, principal_amount: e.target.value }))} required />
            <BlackInputField label="Interest rate % (optional)" fieldName="interest_rate_percent" type="number" value={form.interest_rate_percent} onChange={(e) => setForm((p) => ({ ...p, interest_rate_percent: e.target.value }))} />
          </div>
          <div className="flex gap-3">
            <BlackInputField label="Investment date" fieldName="investment_date" type="date" value={form.investment_date} onChange={(e) => setForm((p) => ({ ...p, investment_date: e.target.value }))} required />
            <BlackInputField label="Maturity date (optional)" fieldName="maturity_date" type="date" value={form.maturity_date} onChange={(e) => setForm((p) => ({ ...p, maturity_date: e.target.value }))} />
          </div>
          <SelectBox label="Funded from" fieldName="payment_method" value={form.payment_method} onChange={(e) => setForm((p) => ({ ...p, payment_method: e.target.value }))} options={PAYMENT_METHODS} />
          <BlackInputField label="Notes (optional)" fieldName="notes" value={form.notes} onChange={(e) => setForm((p) => ({ ...p, notes: e.target.value }))} />
          <div className="flex justify-end gap-2 mt-2">
            <Button variant="outline" onClick={() => setShowModal(false)}>Cancel</Button>
            <Button variant="primary" onClick={handleSave} loading={saving}>Save</Button>
          </div>
        </div>
      </Modal>

      <Modal isOpen={!!redeemingInvestment} onClose={() => setRedeemingInvestment(null)} title={`Redeem · ${redeemingInvestment?.name || ""}`}>
        <div className="flex flex-col gap-3.5 w-[340px] max-w-full">
          <p className="text-[12.5px] text-ink-500">
            Principal: ₹{Number(redeemingInvestment?.principal_amount || 0).toLocaleString("en-IN")}. Any amount above principal posts as Interest Income; below posts as a loss.
          </p>
          <BlackInputField label="Redemption amount (₹)" fieldName="redemption_amount" type="number" value={redemptionForm.redemption_amount} onChange={(e) => setRedemptionForm((p) => ({ ...p, redemption_amount: e.target.value }))} required />
          <BlackInputField label="Redemption date" fieldName="redemption_date" type="date" value={redemptionForm.redemption_date} onChange={(e) => setRedemptionForm((p) => ({ ...p, redemption_date: e.target.value }))} required />
          <div className="flex justify-end gap-2 mt-2">
            <Button variant="outline" onClick={() => setRedeemingInvestment(null)}>Cancel</Button>
            <Button variant="primary" onClick={handleRedeem} loading={redeeming}>Confirm redemption</Button>
          </div>
        </div>
      </Modal>

      <AttachmentsModal
        isOpen={!!attachingInvestment} onClose={() => setAttachingInvestment(null)}
        recordType="investment" recordId={attachingInvestment?.id}
        title={`Attachments · ${attachingInvestment?.name || ""}`}
      />
    </div>
  );
};

export default Investments;
