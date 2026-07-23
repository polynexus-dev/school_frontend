import React, { useState } from "react";
import { toast } from "react-toastify";
import { Wallet, Plus, IndianRupee } from "lucide-react";
import Button from "../../../components/Button";
import Table from "../../../components/Table";
import Modal from "../../../components/Modal";
import BlackInputField from "../../../components/BlackInputField";
import SelectBox from "../../../components/SelectBox";
import Pagination from "../../../components/Pagination";
import usePaginatedList from "../../../hooks/usePaginatedList";
import feeService from "../services/feeService";

// Real invoice + offline-payment recording, wired to the confirmed
// /api/fees/invoices/ and /api/fees/payments/ endpoints. Online Razorpay
// checkout (POST /fees/invoices/{id}/checkout/, /fees/checkout/verify/) is
// the Parent App's "Pay Now" flow — this Admin Web screen is for office
// staff to raise invoices and record payments collected offline (cash/UPI-
// at-office/cheque); FeePayment.save() auto-updates the invoice status.

const STATUS_TONE = {
  paid: "bg-success-tint text-success-hex",
  partially_paid: "bg-warning-tint text-warning-hex",
  unpaid: "bg-error-tint text-error-hex",
};

const PAYMENT_METHODS = [
  { label: "Cash", value: "cash" },
  { label: "UPI", value: "upi" },
  { label: "Card", value: "card" },
  { label: "Net Banking", value: "net_banking" },
];

const emptyInvoiceForm = { student: "", due_date: "", total_amount: "", discount_amount: "0" };
const emptyPaymentForm = { amount_paid: "", payment_method: "cash", remarks: "" };

const Fees = () => {
  const {
    items: invoices,
    page,
    setPage,
    totalPages,
    count,
    pageSize,
    loading,
    refetch,
  } = usePaginatedList(feeService.getInvoices);

  const [showCreateModal, setShowCreateModal] = useState(false);
  const [invoiceForm, setInvoiceForm] = useState(emptyInvoiceForm);
  const [creating, setCreating] = useState(false);

  const [payingInvoice, setPayingInvoice] = useState(null);
  const [paymentForm, setPaymentForm] = useState(emptyPaymentForm);
  const [recording, setRecording] = useState(false);

  const outstandingTotal = invoices.reduce((sum, inv) => sum + Number(inv.remaining_balance || 0), 0);

  const columns = [
    {
      header: "Invoice",
      accessor: (row) => (
        <div className="min-w-0">
          <div className="font-mono text-xs font-semibold text-ink-700">{row.invoice_number}</div>
          <div className="text-[11px] text-ink-400">Student #{row.student}</div>
        </div>
      ),
    },
    { header: "Due date", accessor: "due_date" },
    {
      header: "Total",
      accessor: (row) => `₹${Number(row.total_amount).toLocaleString("en-IN")}`,
    },
    {
      header: "Remaining",
      accessor: (row) => `₹${Number(row.remaining_balance).toLocaleString("en-IN")}`,
    },
    {
      header: "Status",
      accessor: (row) => (
        <span className={`inline-flex items-center text-[11.5px] font-bold rounded-full px-2.5 py-0.5 ${STATUS_TONE[row.status] || "bg-cn-bg text-ink-500"}`}>
          {(row.status || "unpaid").replace("_", " ").toUpperCase()}
        </span>
      ),
    },
  ];

  const openPaymentModal = (invoice) => {
    setPayingInvoice(invoice);
    setPaymentForm({ ...emptyPaymentForm, amount_paid: String(invoice.remaining_balance || "") });
  };

  const handleCreateInvoice = async () => {
    if (!invoiceForm.student || !invoiceForm.due_date || !invoiceForm.total_amount) {
      toast.error("Student, due date and total amount are required.");
      return;
    }
    setCreating(true);
    try {
      await feeService.createInvoice({
        student: Number(invoiceForm.student),
        due_date: invoiceForm.due_date,
        total_amount: Number(invoiceForm.total_amount),
        discount_amount: Number(invoiceForm.discount_amount || 0),
      });
      toast.success("Invoice created.");
      setShowCreateModal(false);
      setInvoiceForm(emptyInvoiceForm);
      refetch();
    } catch (err) {
      console.error("Failed to create invoice:", err);
      toast.error(err?.response?.data?.error || "Failed to create invoice.");
    } finally {
      setCreating(false);
    }
  };

  const handleRecordPayment = async () => {
    if (!paymentForm.amount_paid || Number(paymentForm.amount_paid) <= 0) {
      toast.error("Enter a valid amount.");
      return;
    }
    setRecording(true);
    try {
      await feeService.recordPayment({
        invoice: payingInvoice.id,
        amount_paid: Number(paymentForm.amount_paid),
        payment_method: paymentForm.payment_method,
        remarks: paymentForm.remarks,
      });
      toast.success("Payment recorded.");
      setPayingInvoice(null);
      refetch();
    } catch (err) {
      console.error("Failed to record payment:", err);
      toast.error(err?.response?.data?.error || "Failed to record payment.");
    } finally {
      setRecording(false);
    }
  };

  return (
    <div className="w-full">
      <div className="flex items-center gap-3 pb-4 border-b border-cn-border mb-6 flex-wrap">
        <div className="flex-1 min-w-0">
          <h1 className="font-heading font-bold text-2xl text-violet-950">Fees</h1>
          <p className="text-ink-500 text-[13px] mt-1">Fee invoices &amp; payment collection</p>
        </div>
        <Button variant="primary" icon={<Plus size={16} />} onClick={() => setShowCreateModal(true)}>
          Create invoice
        </Button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
        <div className="bg-cn-surface border border-cn-border rounded-2xl p-5">
          <div className="w-10 h-10 rounded-xl bg-violet-50 text-violet-700 flex items-center justify-center mb-3">
            <Wallet size={18} />
          </div>
          <div className="font-heading font-extrabold text-2xl text-ink-900">{count}</div>
          <div className="text-[13px] text-ink-500 mt-1 font-medium">Total invoices</div>
        </div>
        <div className="bg-cn-surface border border-cn-border rounded-2xl p-5">
          <div className="w-10 h-10 rounded-xl bg-warning-tint text-warning-hex flex items-center justify-center mb-3">
            <IndianRupee size={18} />
          </div>
          <div className="font-heading font-extrabold text-2xl text-ink-900">₹{outstandingTotal.toLocaleString("en-IN")}</div>
          <div className="text-[13px] text-ink-500 mt-1 font-medium">Outstanding (this page)</div>
        </div>
      </div>

      <Table
        columns={columns}
        data={invoices}
        loading={loading}
        onView={openPaymentModal}
        viewLabel="Record payment"
        emptyMessage="No invoices yet"
        emptyDescription="Click “Create invoice” to raise the first fee invoice."
      />
      <Pagination page={page} totalPages={totalPages} count={count} pageSize={pageSize} onPageChange={setPage} loading={loading} />

      <Modal isOpen={showCreateModal} onClose={() => setShowCreateModal(false)} title="Create invoice">
        <div className="flex flex-col gap-3.5 w-[360px] max-w-full">
          <BlackInputField
            label="Student ID"
            fieldName="student"
            value={invoiceForm.student}
            onChange={(e) => setInvoiceForm((p) => ({ ...p, student: e.target.value }))}
            placeholder="e.g. 108"
            required
          />
          <BlackInputField
            label="Due date"
            fieldName="due_date"
            type="date"
            value={invoiceForm.due_date}
            onChange={(e) => setInvoiceForm((p) => ({ ...p, due_date: e.target.value }))}
            required
          />
          <BlackInputField
            label="Total amount (₹)"
            fieldName="total_amount"
            type="number"
            value={invoiceForm.total_amount}
            onChange={(e) => setInvoiceForm((p) => ({ ...p, total_amount: e.target.value }))}
            required
          />
          <BlackInputField
            label="Discount (₹, optional)"
            fieldName="discount_amount"
            type="number"
            value={invoiceForm.discount_amount}
            onChange={(e) => setInvoiceForm((p) => ({ ...p, discount_amount: e.target.value }))}
          />
          <div className="flex justify-end gap-2 mt-2">
            <Button variant="outline" onClick={() => setShowCreateModal(false)}>
              Cancel
            </Button>
            <Button variant="primary" onClick={handleCreateInvoice} loading={creating}>
              Create invoice
            </Button>
          </div>
        </div>
      </Modal>

      <Modal isOpen={!!payingInvoice} onClose={() => setPayingInvoice(null)} title={`Record payment · ${payingInvoice?.invoice_number || ""}`}>
        <div className="flex flex-col gap-3.5 w-[340px] max-w-full">
          <div className="text-[12.5px] text-ink-500">
            Remaining balance: <b className="text-ink-900">₹{Number(payingInvoice?.remaining_balance || 0).toLocaleString("en-IN")}</b>
          </div>
          <BlackInputField
            label="Amount paid (₹)"
            fieldName="amount_paid"
            type="number"
            value={paymentForm.amount_paid}
            onChange={(e) => setPaymentForm((p) => ({ ...p, amount_paid: e.target.value }))}
            required
          />
          <SelectBox
            label="Payment method"
            fieldName="payment_method"
            value={paymentForm.payment_method}
            onChange={(e) => setPaymentForm((p) => ({ ...p, payment_method: e.target.value }))}
            options={PAYMENT_METHODS}
          />
          <BlackInputField
            label="Remarks (optional)"
            fieldName="remarks"
            value={paymentForm.remarks}
            onChange={(e) => setPaymentForm((p) => ({ ...p, remarks: e.target.value }))}
          />
          <div className="flex justify-end gap-2 mt-2">
            <Button variant="outline" onClick={() => setPayingInvoice(null)}>
              Cancel
            </Button>
            <Button variant="primary" onClick={handleRecordPayment} loading={recording}>
              Record payment
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default Fees;
