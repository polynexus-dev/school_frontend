import React, { useEffect, useMemo, useState } from "react";
import { toast } from "react-toastify";
import { Receipt, Plus, Send, Paperclip } from "lucide-react";
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
  { label: "Cash", value: "cash" },
  { label: "UPI", value: "upi" },
  { label: "Card", value: "card" },
  { label: "Net Banking", value: "net_banking" },
];

const STATUS_TONE = {
  draft: "bg-warning-tint text-warning-hex",
  posted: "bg-success-tint text-success-hex",
};

const emptyCategoryForm = { name: "", description: "", expense_account: "" };
const emptyVoucherForm = { date: new Date().toISOString().slice(0, 10), category: "", payee_name: "", amount: "", payment_method: "cash", narration: "", related_party: "" };

const ExpenseVouchers = () => {
  const [tab, setTab] = useState("vouchers");

  const {
    items: vouchers,
    page,
    setPage,
    totalPages,
    count,
    pageSize,
    loading,
    refetch,
  } = usePaginatedList(accountingService.getExpenseVouchers);

  const [categories, setCategories] = useState([]);
  const [loadingCategories, setLoadingCategories] = useState(false);
  const [expenseAccounts, setExpenseAccounts] = useState([]);
  const [trustees, setTrustees] = useState([]);

  const [showCategoryModal, setShowCategoryModal] = useState(false);
  const [categoryForm, setCategoryForm] = useState(emptyCategoryForm);
  const [showVoucherModal, setShowVoucherModal] = useState(false);
  const [voucherForm, setVoucherForm] = useState(emptyVoucherForm);
  const [saving, setSaving] = useState(false);
  const [posting, setPosting] = useState(null);
  const [attachingVoucher, setAttachingVoucher] = useState(null);

  const loadCategories = async () => {
    setLoadingCategories(true);
    try {
      const res = await accountingService.getExpenseCategories({ page_size: 200 });
      setCategories(asList(res.data));
    } catch (err) {
      console.error("Failed to load expense categories:", err);
      toast.error("Failed to load expense categories.");
    } finally {
      setLoadingCategories(false);
    }
  };

  useEffect(() => {
    loadCategories();
    accountingService.getLedgerAccounts({ page_size: 500, account_type: "expense" })
      .then((res) => setExpenseAccounts(asList(res.data)))
      .catch((err) => console.error("Failed to load expense accounts:", err));
    accountingService.getTrustees({ page_size: 200, is_active: true })
      .then((res) => setTrustees(asList(res.data)))
      .catch((err) => console.error("Failed to load trustees:", err));
  }, []);

  const expenseAccountOptions = useMemo(
    () => expenseAccounts.map((a) => ({ label: `${a.code} - ${a.name}`, value: String(a.id) })),
    [expenseAccounts]
  );
  const categoryOptions = useMemo(() => categories.map((c) => ({ label: c.name, value: String(c.id) })), [categories]);
  const trusteeOptions = useMemo(() => [{ label: "None", value: "" }, ...trustees.map((t) => ({ label: t.name, value: String(t.id) }))], [trustees]);

  const handleSaveCategory = async () => {
    if (!categoryForm.name.trim()) {
      toast.error("Category name is required.");
      return;
    }
    setSaving(true);
    try {
      await accountingService.createExpenseCategory({
        ...categoryForm,
        expense_account: categoryForm.expense_account ? Number(categoryForm.expense_account) : null,
      });
      toast.success("Expense category created.");
      setShowCategoryModal(false);
      setCategoryForm(emptyCategoryForm);
      loadCategories();
    } catch (err) {
      console.error("Failed to create expense category:", err);
      toast.error(err?.response?.data?.name?.[0] || "Failed to create category — that name may already exist.");
    } finally {
      setSaving(false);
    }
  };

  const handleCreateVoucher = async () => {
    if (!voucherForm.date || !voucherForm.category || !voucherForm.payee_name.trim() || !voucherForm.amount) {
      toast.error("Date, category, payee and amount are all required.");
      return;
    }
    setSaving(true);
    try {
      await accountingService.createExpenseVoucher({
        ...voucherForm,
        category: Number(voucherForm.category),
        amount: Number(voucherForm.amount),
        related_party: voucherForm.related_party ? Number(voucherForm.related_party) : null,
      });
      toast.success("Expense voucher saved as draft.");
      setShowVoucherModal(false);
      setVoucherForm(emptyVoucherForm);
      refetch();
    } catch (err) {
      console.error("Failed to create expense voucher:", err);
      toast.error(err?.response?.data?.error || "Failed to create expense voucher.");
    } finally {
      setSaving(false);
    }
  };

  const handlePost = async (voucher) => {
    if (!window.confirm(`Post ${voucher.voucher_number} to the ledger? This cannot be undone.`)) return;
    setPosting(voucher.id);
    try {
      await accountingService.postExpenseVoucher(voucher.id);
      toast.success("Voucher posted to the ledger.");
      refetch();
    } catch (err) {
      console.error("Failed to post expense voucher:", err);
      toast.error(err?.response?.data?.error || "Failed to post expense voucher.");
    } finally {
      setPosting(null);
    }
  };

  const voucherColumns = [
    { header: "Voucher #", accessor: "voucher_number" },
    { header: "Date", accessor: "date" },
    { header: "Category", accessor: "category_name" },
    { header: "Payee", accessor: "payee_name" },
    { header: "Amount", accessor: (row) => `₹${Number(row.amount).toLocaleString("en-IN")}` },
    { header: "Method", accessor: (row) => row.payment_method.replace("_", " ") },
    {
      header: "Status",
      accessor: (row) => (
        <span className={`text-[11.5px] font-bold rounded-full px-2.5 py-0.5 ${STATUS_TONE[row.status] || ""}`}>{row.status.toUpperCase()}</span>
      ),
    },
    {
      header: "Action",
      accessor: (row) => (
        <div className="flex items-center gap-2">
          {row.status === "draft" && (
            <button
              type="button" onClick={() => handlePost(row)} disabled={posting === row.id}
              className="text-[11.5px] font-bold text-violet-700 hover:underline cursor-pointer inline-flex items-center gap-1"
            >
              <Send size={12} /> Post
            </button>
          )}
          <button type="button" onClick={() => setAttachingVoucher(row)} className="text-ink-500 hover:text-violet-700 cursor-pointer" title="Attachments">
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
            <Receipt size={22} className="text-violet-700" />
            Expense Vouchers
          </h1>
          <p className="text-ink-500 text-[13px] mt-1">Record and post expenditure to the ledger</p>
        </div>
        <div className="flex gap-2">
          <Button variant={tab === "vouchers" ? "primary" : "outline"} size="compact" onClick={() => setTab("vouchers")}>Vouchers</Button>
          <Button variant={tab === "categories" ? "primary" : "outline"} size="compact" onClick={() => setTab("categories")}>Categories</Button>
        </div>
        {tab === "vouchers" ? (
          <Button variant="primary" icon={<Plus size={16} />} onClick={() => setShowVoucherModal(true)}>New voucher</Button>
        ) : (
          <Button variant="primary" icon={<Plus size={16} />} onClick={() => setShowCategoryModal(true)}>Add category</Button>
        )}
      </div>

      {tab === "vouchers" && (
        <>
          <Table columns={voucherColumns} data={vouchers} loading={loading} emptyMessage="No expense vouchers yet" />
          <Pagination page={page} totalPages={totalPages} count={count} pageSize={pageSize} onPageChange={setPage} loading={loading} />
        </>
      )}

      {tab === "categories" && (
        <Table
          columns={[
            { header: "Name", accessor: "name" },
            { header: "Description", accessor: (row) => row.description || "-" },
            {
              header: "Expense account",
              accessor: (row) => {
                const acct = expenseAccounts.find((a) => a.id === row.expense_account);
                return acct ? `${acct.code} - ${acct.name}` : <span className="text-error-hex font-semibold">Not mapped</span>;
              },
            },
          ]}
          data={categories}
          loading={loadingCategories}
          emptyMessage="No expense categories yet"
        />
      )}

      <Modal isOpen={showVoucherModal} onClose={() => setShowVoucherModal(false)} title="New expense voucher">
        <div className="flex flex-col gap-3.5 w-[360px] max-w-full">
          <BlackInputField label="Date" fieldName="date" type="date" value={voucherForm.date} onChange={(e) => setVoucherForm((p) => ({ ...p, date: e.target.value }))} required />
          <SelectBox label="Category" fieldName="category" value={voucherForm.category} onChange={(e) => setVoucherForm((p) => ({ ...p, category: e.target.value }))} options={categoryOptions} required />
          <BlackInputField label="Payee" fieldName="payee_name" value={voucherForm.payee_name} onChange={(e) => setVoucherForm((p) => ({ ...p, payee_name: e.target.value }))} placeholder="e.g. ABC Electricals" required />
          <BlackInputField label="Amount (₹)" fieldName="amount" type="number" value={voucherForm.amount} onChange={(e) => setVoucherForm((p) => ({ ...p, amount: e.target.value }))} required />
          <SelectBox label="Payment method" fieldName="payment_method" value={voucherForm.payment_method} onChange={(e) => setVoucherForm((p) => ({ ...p, payment_method: e.target.value }))} options={PAYMENT_METHODS} />
          <BlackInputField label="Narration (optional)" fieldName="narration" value={voucherForm.narration} onChange={(e) => setVoucherForm((p) => ({ ...p, narration: e.target.value }))} />
          <SelectBox
            label="Related party (optional)" fieldName="related_party" value={voucherForm.related_party}
            onChange={(e) => setVoucherForm((p) => ({ ...p, related_party: e.target.value }))} options={trusteeOptions}
          />
          <p className="text-[11px] text-ink-400 -mt-2">Set if this payment is to/for a trustee — Section 13(3) related-party disclosure.</p>
          <div className="flex justify-end gap-2 mt-2">
            <Button variant="outline" onClick={() => setShowVoucherModal(false)}>Cancel</Button>
            <Button variant="primary" onClick={handleCreateVoucher} loading={saving}>Save as draft</Button>
          </div>
        </div>
      </Modal>

      <Modal isOpen={showCategoryModal} onClose={() => setShowCategoryModal(false)} title="Add expense category">
        <div className="flex flex-col gap-3.5 w-[340px] max-w-full">
          <BlackInputField label="Name" fieldName="name" value={categoryForm.name} onChange={(e) => setCategoryForm((p) => ({ ...p, name: e.target.value }))} placeholder="e.g. Rent" required />
          <BlackInputField label="Description (optional)" fieldName="description" value={categoryForm.description} onChange={(e) => setCategoryForm((p) => ({ ...p, description: e.target.value }))} />
          <SelectBox label="Expense account (GL)" fieldName="expense_account" value={categoryForm.expense_account} onChange={(e) => setCategoryForm((p) => ({ ...p, expense_account: e.target.value }))} options={expenseAccountOptions} />
          <p className="text-[11.5px] text-ink-400">Required before a voucher in this category can be posted to the ledger.</p>
          <div className="flex justify-end gap-2 mt-2">
            <Button variant="outline" onClick={() => setShowCategoryModal(false)}>Cancel</Button>
            <Button variant="primary" onClick={handleSaveCategory} loading={saving}>Save</Button>
          </div>
        </div>
      </Modal>

      <AttachmentsModal
        isOpen={!!attachingVoucher} onClose={() => setAttachingVoucher(null)}
        recordType="expense_voucher" recordId={attachingVoucher?.id}
        title={`Attachments · ${attachingVoucher?.voucher_number || ""}`}
      />
    </div>
  );
};

export default ExpenseVouchers;
