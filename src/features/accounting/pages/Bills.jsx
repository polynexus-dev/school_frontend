import React, { useEffect, useMemo, useState } from "react";
import { toast } from "react-toastify";
import { FileStack, Plus, IndianRupee, Paperclip } from "lucide-react";
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

const PAYMENT_METHODS = [
  { label: "Net Banking", value: "net_banking" },
  { label: "Cash", value: "cash" },
  { label: "UPI", value: "upi" },
  { label: "Card", value: "card" },
  { label: "Cheque", value: "cheque" },
];

const STATUS_TONE = {
  paid: "bg-success-tint text-success-hex",
  partially_paid: "bg-warning-tint text-warning-hex",
  unpaid: "bg-error-tint text-error-hex",
};

const emptyVendorForm = { name: "", contact_person: "", contact_number: "", email: "", gstin: "", pan: "" };
const emptyBillForm = { vendor: "", category: "", vendor_bill_number: "", bill_date: new Date().toISOString().slice(0, 10), due_date: "", amount: "", narration: "", related_party: "" };
const emptyPaymentForm = { amount_paid: "", payment_method: "net_banking", payment_date: new Date().toISOString().slice(0, 10), reference_number: "" };

const Bills = () => {
  const [tab, setTab] = useState("bills");

  const {
    items: bills,
    page,
    setPage,
    totalPages,
    count,
    pageSize,
    loading,
    refetch,
  } = usePaginatedList(accountingService.getBills);

  const [vendors, setVendors] = useState([]);
  const [loadingVendors, setLoadingVendors] = useState(false);
  const [categories, setCategories] = useState([]);
  const [trustees, setTrustees] = useState([]);

  const [showVendorModal, setShowVendorModal] = useState(false);
  const [vendorForm, setVendorForm] = useState(emptyVendorForm);
  const [showBillModal, setShowBillModal] = useState(false);
  const [billForm, setBillForm] = useState(emptyBillForm);
  const [saving, setSaving] = useState(false);

  const [payingBill, setPayingBill] = useState(null);
  const [attachingBill, setAttachingBill] = useState(null);
  const [paymentForm, setPaymentForm] = useState(emptyPaymentForm);
  const [recording, setRecording] = useState(false);

  const loadVendors = async () => {
    setLoadingVendors(true);
    try {
      const res = await accountingService.getVendors({ page_size: 200 });
      setVendors(asList(res.data));
    } catch (err) {
      console.error("Failed to load vendors:", err);
      toast.error("Failed to load vendors.");
    } finally {
      setLoadingVendors(false);
    }
  };

  useEffect(() => {
    loadVendors();
    accountingService.getExpenseCategories({ page_size: 200 }).then((res) => setCategories(asList(res.data))).catch(() => {});
    accountingService.getTrustees({ page_size: 200, is_active: true }).then((res) => setTrustees(asList(res.data))).catch(() => {});
  }, []);

  const vendorOptions = useMemo(() => vendors.map((v) => ({ label: v.name, value: String(v.id) })), [vendors]);
  const categoryOptions = useMemo(() => categories.map((c) => ({ label: c.name, value: String(c.id) })), [categories]);
  const trusteeOptions = useMemo(() => [{ label: "None", value: "" }, ...trustees.map((t) => ({ label: t.name, value: String(t.id) }))], [trustees]);

  const outstandingTotal = bills.reduce((sum, b) => sum + Number(b.remaining_balance || 0), 0);

  const handleSaveVendor = async () => {
    if (!vendorForm.name.trim()) {
      toast.error("Vendor name is required.");
      return;
    }
    setSaving(true);
    try {
      await accountingService.createVendor(vendorForm);
      toast.success("Vendor added.");
      setShowVendorModal(false);
      setVendorForm(emptyVendorForm);
      loadVendors();
    } catch (err) {
      console.error("Failed to add vendor:", err);
      toast.error(err?.response?.data?.name?.[0] || "Failed to add vendor — that name may already exist.");
    } finally {
      setSaving(false);
    }
  };

  const handleSaveBill = async () => {
    if (!billForm.vendor || !billForm.category || !billForm.due_date || !billForm.amount) {
      toast.error("Vendor, category, due date and amount are required.");
      return;
    }
    setSaving(true);
    try {
      await accountingService.createBill({
        ...billForm,
        vendor: Number(billForm.vendor),
        category: Number(billForm.category),
        amount: Number(billForm.amount),
        related_party: billForm.related_party ? Number(billForm.related_party) : null,
      });
      toast.success("Bill recorded and posted to the ledger.");
      setShowBillModal(false);
      setBillForm(emptyBillForm);
      refetch();
    } catch (err) {
      console.error("Failed to record bill:", err);
      toast.error(err?.response?.data?.error || "Failed to record bill.");
    } finally {
      setSaving(false);
    }
  };

  const openPaymentModal = (bill) => {
    setPayingBill(bill);
    setPaymentForm({ ...emptyPaymentForm, amount_paid: String(bill.remaining_balance || "") });
  };

  const handleRecordPayment = async () => {
    if (!paymentForm.amount_paid || Number(paymentForm.amount_paid) <= 0) {
      toast.error("Enter a valid amount.");
      return;
    }
    setRecording(true);
    try {
      await accountingService.recordBillPayment({
        ...paymentForm,
        bill: payingBill.id,
        amount_paid: Number(paymentForm.amount_paid),
      });
      toast.success("Payment recorded and posted to the ledger.");
      setPayingBill(null);
      refetch();
    } catch (err) {
      console.error("Failed to record bill payment:", err);
      toast.error(err?.response?.data?.error || "Failed to record payment.");
    } finally {
      setRecording(false);
    }
  };

  const billColumns = [
    { header: "Bill #", accessor: "bill_number" },
    { header: "Vendor", accessor: "vendor_name" },
    { header: "Category", accessor: "category_name" },
    { header: "Due Date", accessor: "due_date" },
    { header: "Amount", accessor: (row) => `₹${Number(row.amount).toLocaleString("en-IN")}` },
    { header: "Outstanding", accessor: (row) => `₹${Number(row.remaining_balance).toLocaleString("en-IN")}` },
    {
      header: "Status",
      accessor: (row) => (
        <span className={`text-[11px] font-bold px-2 py-0.5 rounded-full ${STATUS_TONE[row.status] || ""}`}>{row.status.replace("_", " ").toUpperCase()}</span>
      ),
    },
    {
      header: "Files",
      accessor: (row) => (
        <button type="button" onClick={() => setAttachingBill(row)} className="text-ink-500 hover:text-violet-700 cursor-pointer" title="Attachments">
          <Paperclip size={14} />
        </button>
      ),
    },
  ];

  const vendorColumns = [
    { header: "Name", accessor: "name" },
    { header: "Contact", accessor: (row) => row.contact_person || "-" },
    { header: "Phone", accessor: (row) => row.contact_number || "-" },
    { header: "GSTIN", accessor: (row) => row.gstin || "-" },
    {
      header: "Status",
      accessor: (row) => (
        <span className={`text-[11px] font-bold px-2 py-0.5 rounded-full ${row.is_active ? "bg-success-tint text-success-hex" : "bg-cn-bg text-ink-400"}`}>
          {row.is_active ? "Active" : "Inactive"}
        </span>
      ),
    },
  ];

  return (
    <div className="w-full">
      <div className="flex items-center gap-3 pb-4 border-b border-cn-border mb-6 flex-wrap">
        <div className="flex-1 min-w-0">
          <h1 className="font-heading font-bold text-2xl text-violet-950 flex items-center gap-2">
            <FileStack size={22} className="text-violet-700" />
            Bills &amp; Vendors
          </h1>
          <p className="text-ink-500 text-[13px] mt-1">Accounts payable — credit purchases and settlements</p>
        </div>
        <div className="flex gap-2">
          <Button variant={tab === "bills" ? "primary" : "outline"} size="compact" onClick={() => setTab("bills")}>Bills</Button>
          <Button variant={tab === "vendors" ? "primary" : "outline"} size="compact" onClick={() => setTab("vendors")}>Vendors</Button>
        </div>
        {tab === "bills" ? (
          <Button variant="primary" icon={<Plus size={16} />} onClick={() => setShowBillModal(true)}>Record bill</Button>
        ) : (
          <Button variant="primary" icon={<Plus size={16} />} onClick={() => setShowVendorModal(true)}>Add vendor</Button>
        )}
      </div>

      {tab === "bills" && (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
            <div className="bg-cn-surface border border-cn-border rounded-2xl p-5">
              <div className="font-heading font-extrabold text-2xl text-ink-900">{count}</div>
              <div className="text-[13px] text-ink-500 mt-1 font-medium">Total bills</div>
            </div>
            <div className="bg-cn-surface border border-cn-border rounded-2xl p-5">
              <div className="w-10 h-10 rounded-xl bg-warning-tint text-warning-hex flex items-center justify-center mb-3">
                <IndianRupee size={18} />
              </div>
              <div className="font-heading font-extrabold text-2xl text-ink-900">₹{outstandingTotal.toLocaleString("en-IN")}</div>
              <div className="text-[13px] text-ink-500 mt-1 font-medium">Outstanding (this page)</div>
            </div>
          </div>
          <Table columns={billColumns} data={bills} loading={loading} onView={openPaymentModal} viewLabel="Record payment" emptyMessage="No bills recorded yet" />
          <Pagination page={page} totalPages={totalPages} count={count} pageSize={pageSize} onPageChange={setPage} loading={loading} />
        </>
      )}

      {tab === "vendors" && (
        <Table columns={vendorColumns} data={vendors} loading={loadingVendors} emptyMessage="No vendors added yet" />
      )}

      <Modal isOpen={showVendorModal} onClose={() => setShowVendorModal(false)} title="Add vendor">
        <div className="flex flex-col gap-3.5 w-[360px] max-w-full">
          <BlackInputField label="Vendor name" fieldName="name" value={vendorForm.name} onChange={(e) => setVendorForm((p) => ({ ...p, name: e.target.value }))} required />
          <BlackInputField label="Contact person (optional)" fieldName="contact_person" value={vendorForm.contact_person} onChange={(e) => setVendorForm((p) => ({ ...p, contact_person: e.target.value }))} />
          <BlackInputField label="Contact number (optional)" fieldName="contact_number" value={vendorForm.contact_number} onChange={(e) => setVendorForm((p) => ({ ...p, contact_number: e.target.value }))} />
          <BlackInputField label="Email (optional)" fieldName="email" value={vendorForm.email} onChange={(e) => setVendorForm((p) => ({ ...p, email: e.target.value }))} />
          <div className="flex gap-3">
            <BlackInputField label="GSTIN (optional)" fieldName="gstin" value={vendorForm.gstin} onChange={(e) => setVendorForm((p) => ({ ...p, gstin: e.target.value.toUpperCase() }))} />
            <BlackInputField label="PAN (optional)" fieldName="pan" value={vendorForm.pan} onChange={(e) => setVendorForm((p) => ({ ...p, pan: e.target.value.toUpperCase() }))} />
          </div>
          <div className="flex justify-end gap-2 mt-2">
            <Button variant="outline" onClick={() => setShowVendorModal(false)}>Cancel</Button>
            <Button variant="primary" onClick={handleSaveVendor} loading={saving}>Save</Button>
          </div>
        </div>
      </Modal>

      <Modal isOpen={showBillModal} onClose={() => setShowBillModal(false)} title="Record bill">
        <div className="flex flex-col gap-3.5 w-[400px] max-w-full">
          <SelectBox label="Vendor" fieldName="vendor" value={billForm.vendor} onChange={(e) => setBillForm((p) => ({ ...p, vendor: e.target.value }))} options={vendorOptions} required />
          <SelectBox label="Expense category" fieldName="category" value={billForm.category} onChange={(e) => setBillForm((p) => ({ ...p, category: e.target.value }))} options={categoryOptions} required />
          <BlackInputField label="Vendor's bill number (optional)" fieldName="vendor_bill_number" value={billForm.vendor_bill_number} onChange={(e) => setBillForm((p) => ({ ...p, vendor_bill_number: e.target.value }))} />
          <div className="flex gap-3">
            <BlackInputField label="Bill date" fieldName="bill_date" type="date" value={billForm.bill_date} onChange={(e) => setBillForm((p) => ({ ...p, bill_date: e.target.value }))} required />
            <BlackInputField label="Due date" fieldName="due_date" type="date" value={billForm.due_date} onChange={(e) => setBillForm((p) => ({ ...p, due_date: e.target.value }))} required />
          </div>
          <BlackInputField label="Amount (₹)" fieldName="amount" type="number" value={billForm.amount} onChange={(e) => setBillForm((p) => ({ ...p, amount: e.target.value }))} required />
          <BlackInputField label="Narration (optional)" fieldName="narration" value={billForm.narration} onChange={(e) => setBillForm((p) => ({ ...p, narration: e.target.value }))} />
          <SelectBox label="Related party (optional)" fieldName="related_party" value={billForm.related_party} onChange={(e) => setBillForm((p) => ({ ...p, related_party: e.target.value }))} options={trusteeOptions} />
          <div className="flex justify-end gap-2 mt-2">
            <Button variant="outline" onClick={() => setShowBillModal(false)}>Cancel</Button>
            <Button variant="primary" onClick={handleSaveBill} loading={saving}>Save</Button>
          </div>
        </div>
      </Modal>

      <Modal isOpen={!!payingBill} onClose={() => setPayingBill(null)} title={`Record payment · ${payingBill?.bill_number || ""}`}>
        <div className="flex flex-col gap-3.5 w-[340px] max-w-full">
          <div className="text-[12.5px] text-ink-500">
            Remaining balance: <b className="text-ink-900">₹{Number(payingBill?.remaining_balance || 0).toLocaleString("en-IN")}</b>
          </div>
          <BlackInputField label="Amount paid (₹)" fieldName="amount_paid" type="number" value={paymentForm.amount_paid} onChange={(e) => setPaymentForm((p) => ({ ...p, amount_paid: e.target.value }))} required />
          <BlackInputField label="Payment date" fieldName="payment_date" type="date" value={paymentForm.payment_date} onChange={(e) => setPaymentForm((p) => ({ ...p, payment_date: e.target.value }))} required />
          <SelectBox label="Payment method" fieldName="payment_method" value={paymentForm.payment_method} onChange={(e) => setPaymentForm((p) => ({ ...p, payment_method: e.target.value }))} options={PAYMENT_METHODS} />
          <BlackInputField label="Reference number (optional)" fieldName="reference_number" value={paymentForm.reference_number} onChange={(e) => setPaymentForm((p) => ({ ...p, reference_number: e.target.value }))} />
          <div className="flex justify-end gap-2 mt-2">
            <Button variant="outline" onClick={() => setPayingBill(null)}>Cancel</Button>
            <Button variant="primary" onClick={handleRecordPayment} loading={recording}>Record payment</Button>
          </div>
        </div>
      </Modal>

      <AttachmentsModal
        isOpen={!!attachingBill} onClose={() => setAttachingBill(null)}
        recordType="bill" recordId={attachingBill?.id}
        title={`Attachments · ${attachingBill?.bill_number || ""}`}
      />
    </div>
  );
};

export default Bills;
