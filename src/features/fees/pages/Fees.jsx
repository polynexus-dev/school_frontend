import React, { useEffect, useMemo, useState } from "react";
import { toast } from "react-toastify";
import { Wallet, Plus, IndianRupee, Tag } from "lucide-react";
import Button from "../../../components/Button";
import Table from "../../../components/Table";
import Modal from "../../../components/Modal";
import BlackInputField from "../../../components/BlackInputField";
import SelectBox from "../../../components/SelectBox";
import Pagination from "../../../components/Pagination";
import usePaginatedList from "../../../hooks/usePaginatedList";
import feeService from "../services/feeService";
import accountingService from "../../accounting/services/accountingService";

const asList = (data) => (Array.isArray(data) ? data : data?.results || []);

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

const emptyInvoiceForm = { student: "", due_date: "", category: "", amount: "", discount_amount: "0" };
const emptyPaymentForm = { amount_paid: "", payment_method: "cash", remarks: "" };
const emptyCategoryForm = { name: "", description: "", income_account: "" };

const Fees = () => {
  const [tab, setTab] = useState("invoices");

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

  const [categories, setCategories] = useState([]);
  const [loadingCategories, setLoadingCategories] = useState(false);
  const [incomeAccounts, setIncomeAccounts] = useState([]);
  const [showCategoryModal, setShowCategoryModal] = useState(false);
  const [categoryForm, setCategoryForm] = useState(emptyCategoryForm);

  const [showCreateModal, setShowCreateModal] = useState(false);
  const [invoiceForm, setInvoiceForm] = useState(emptyInvoiceForm);
  const [creating, setCreating] = useState(false);

  const [payingInvoice, setPayingInvoice] = useState(null);
  const [paymentForm, setPaymentForm] = useState(emptyPaymentForm);
  const [recording, setRecording] = useState(false);

  const outstandingTotal = invoices.reduce((sum, inv) => sum + Number(inv.remaining_balance || 0), 0);

  const loadCategories = async () => {
    setLoadingCategories(true);
    try {
      const res = await feeService.getCategories({ page_size: 200 });
      setCategories(asList(res.data));
    } catch (err) {
      console.error("Failed to load fee categories:", err);
      toast.error("Failed to load fee categories.");
    } finally {
      setLoadingCategories(false);
    }
  };

  useEffect(() => {
    loadCategories();
    accountingService.getLedgerAccounts({ page_size: 500, account_type: "income" })
      .then((res) => setIncomeAccounts(asList(res.data)))
      .catch((err) => console.error("Failed to load income accounts:", err));
  }, []);

  const incomeAccountOptions = useMemo(
    () => incomeAccounts.map((a) => ({ label: `${a.code} - ${a.name}`, value: String(a.id) })),
    [incomeAccounts]
  );
  const categoryOptions = useMemo(
    () => categories.map((c) => ({ label: c.name, value: String(c.id) })),
    [categories]
  );

  const handleSaveCategory = async () => {
    if (!categoryForm.name.trim()) {
      toast.error("Category name is required.");
      return;
    }
    try {
      await feeService.createCategory({
        ...categoryForm,
        income_account: categoryForm.income_account ? Number(categoryForm.income_account) : null,
      });
      toast.success("Fee category created.");
      setShowCategoryModal(false);
      setCategoryForm(emptyCategoryForm);
      loadCategories();
    } catch (err) {
      console.error("Failed to create fee category:", err);
      toast.error(err?.response?.data?.name?.[0] || "Failed to create category — that name may already exist.");
    }
  };

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
    if (!invoiceForm.student || !invoiceForm.due_date || !invoiceForm.category || !invoiceForm.amount) {
      toast.error("Student, due date, fee category and amount are required.");
      return;
    }
    setCreating(true);
    try {
      await feeService.createInvoice({
        student: Number(invoiceForm.student),
        due_date: invoiceForm.due_date,
        discount_amount: Number(invoiceForm.discount_amount || 0),
        // items_input drives Plan 2's accrual posting (Dr Accounts
        // Receivable, Cr the category's income account) — total_amount is
        // computed server-side as the sum of these items.
        items_input: [{ category: Number(invoiceForm.category), amount: Number(invoiceForm.amount) }],
      });
      toast.success("Invoice created and posted to the ledger.");
      setShowCreateModal(false);
      setInvoiceForm(emptyInvoiceForm);
      refetch();
    } catch (err) {
      console.error("Failed to create invoice:", err);
      toast.error(err?.response?.data?.error || err?.response?.data?.non_field_errors?.[0] || "Failed to create invoice.");
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
        <div className="flex gap-2">
          <Button variant={tab === "invoices" ? "primary" : "outline"} size="compact" onClick={() => setTab("invoices")}>
            Invoices
          </Button>
          <Button variant={tab === "categories" ? "primary" : "outline"} size="compact" onClick={() => setTab("categories")}>
            Categories
          </Button>
        </div>
        {tab === "invoices" ? (
          <Button variant="primary" icon={<Plus size={16} />} onClick={() => setShowCreateModal(true)}>
            Create invoice
          </Button>
        ) : (
          <Button variant="primary" icon={<Plus size={16} />} onClick={() => setShowCategoryModal(true)}>
            Add category
          </Button>
        )}
      </div>

      {tab === "invoices" && (
        <>
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
        </>
      )}

      {tab === "categories" && (
        <Table
          columns={[
            { header: "Name", accessor: "name" },
            { header: "Description", accessor: (row) => row.description || "-" },
            {
              header: "Income account",
              accessor: (row) => {
                const acct = incomeAccounts.find((a) => a.id === row.income_account);
                return acct ? `${acct.code} - ${acct.name}` : <span className="text-error-hex font-semibold">Not mapped</span>;
              },
            },
          ]}
          data={categories}
          loading={loadingCategories}
          emptyMessage="No fee categories yet"
          emptyDescription="Add a category (e.g. Tuition Fee) and map it to an income account before invoicing."
        />
      )}

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
          <SelectBox
            label="Fee category"
            fieldName="category"
            value={invoiceForm.category}
            onChange={(e) => setInvoiceForm((p) => ({ ...p, category: e.target.value }))}
            options={categoryOptions}
            required
          />
          <BlackInputField
            label="Amount (₹)"
            fieldName="amount"
            type="number"
            value={invoiceForm.amount}
            onChange={(e) => setInvoiceForm((p) => ({ ...p, amount: e.target.value }))}
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

      <Modal isOpen={showCategoryModal} onClose={() => setShowCategoryModal(false)} title="Add fee category">
        <div className="flex flex-col gap-3.5 w-[340px] max-w-full">
          <BlackInputField
            label="Name" fieldName="name" value={categoryForm.name}
            onChange={(e) => setCategoryForm((p) => ({ ...p, name: e.target.value }))}
            placeholder="e.g. Tuition Fee" required
          />
          <BlackInputField
            label="Description (optional)" fieldName="description" value={categoryForm.description}
            onChange={(e) => setCategoryForm((p) => ({ ...p, description: e.target.value }))}
          />
          <SelectBox
            label="Income account (GL)" fieldName="income_account" value={categoryForm.income_account}
            onChange={(e) => setCategoryForm((p) => ({ ...p, income_account: e.target.value }))}
            options={incomeAccountOptions}
          />
          <p className="text-[11.5px] text-ink-400">Required before this category can be invoiced — invoicing without an income account fails so the ledger never silently drifts.</p>
          <div className="flex justify-end gap-2 mt-2">
            <Button variant="outline" onClick={() => setShowCategoryModal(false)}>Cancel</Button>
            <Button variant="primary" onClick={handleSaveCategory}>Save</Button>
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
