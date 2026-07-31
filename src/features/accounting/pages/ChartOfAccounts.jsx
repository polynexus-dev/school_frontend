import React, { useState } from "react";
import { toast } from "react-toastify";
import { Landmark, Plus } from "lucide-react";
import Button from "../../../components/Button";
import Table from "../../../components/Table";
import Modal from "../../../components/Modal";
import BlackInputField from "../../../components/BlackInputField";
import SelectBox from "../../../components/SelectBox";
import Pagination from "../../../components/Pagination";
import usePaginatedList from "../../../hooks/usePaginatedList";
import accountingService from "../services/accountingService";

// Chart of Accounts admin — Plan 1 of the Accounting/Annual Audit module.
// Every posted JournalEntryLine references one of these; deleting an
// account that already has ledger activity is blocked server-side
// (LedgerAccountViewSet.perform_destroy) — mark it inactive instead.

const TYPE_OPTIONS = [
  { label: "Asset", value: "asset" },
  { label: "Liability", value: "liability" },
  { label: "Equity", value: "equity" },
  { label: "Income", value: "income" },
  { label: "Expense", value: "expense" },
];

const TYPE_TONE = {
  asset: "bg-success-tint text-success-hex",
  liability: "bg-warning-tint text-warning-hex",
  equity: "bg-violet-50 text-violet-700",
  income: "bg-success-tint text-success-hex",
  expense: "bg-error-tint text-error-hex",
};

const emptyForm = { code: "", name: "", account_type: "asset", parent: "", description: "", is_active: true };

const ChartOfAccounts = () => {
  const { items: accounts, page, setPage, totalPages, count, pageSize, loading, refetch } = usePaginatedList(
    accountingService.getAccounts
  );

  const [showModal, setShowModal] = useState(false);
  const [editingAccount, setEditingAccount] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);

  const activeCount = accounts.filter((a) => a.is_active).length;

  const parentOptions = [
    { label: "None (top-level)", value: "" },
    ...accounts
      .filter((a) => a.id !== editingAccount?.id)
      .map((a) => ({ label: `${a.code} — ${a.name}`, value: String(a.id) })),
  ];

  const columns = [
    {
      header: "Account",
      accessor: (row) => (
        <div className="min-w-0">
          <div className="font-mono text-xs font-semibold text-ink-700">{row.code}</div>
          <div className="text-[13px] text-ink-900">{row.name}</div>
        </div>
      ),
    },
    {
      header: "Type",
      accessor: (row) => (
        <span className={`inline-flex items-center text-[11.5px] font-bold rounded-full px-2.5 py-0.5 ${TYPE_TONE[row.account_type] || "bg-cn-bg text-ink-500"}`}>
          {row.account_type_display || row.account_type}
        </span>
      ),
    },
    { header: "Parent", accessor: (row) => (row.parent ? accounts.find((a) => a.id === row.parent)?.code || `#${row.parent}` : "—") },
    {
      header: "Status",
      accessor: (row) => (
        <span className={`inline-flex items-center text-[11.5px] font-bold rounded-full px-2.5 py-0.5 ${row.is_active ? "bg-success-tint text-success-hex" : "bg-cn-bg text-ink-400"}`}>
          {row.is_active ? "ACTIVE" : "INACTIVE"}
        </span>
      ),
    },
  ];

  const openCreateModal = () => {
    setEditingAccount(null);
    setForm(emptyForm);
    setShowModal(true);
  };

  const openEditModal = (account) => {
    setEditingAccount(account);
    setForm({
      code: account.code,
      name: account.name,
      account_type: account.account_type,
      parent: account.parent ? String(account.parent) : "",
      description: account.description || "",
      is_active: account.is_active,
    });
    setShowModal(true);
  };

  const handleSave = async () => {
    if (!form.code || !form.name || !form.account_type) {
      toast.error("Code, name and type are required.");
      return;
    }
    setSaving(true);
    try {
      const payload = {
        code: form.code,
        name: form.name,
        account_type: form.account_type,
        parent: form.parent ? Number(form.parent) : null,
        description: form.description,
        is_active: form.is_active,
      };
      if (editingAccount) {
        await accountingService.updateAccount(editingAccount.id, payload);
        toast.success("Account updated.");
      } else {
        await accountingService.createAccount(payload);
        toast.success("Account created.");
      }
      setShowModal(false);
      refetch();
    } catch (err) {
      console.error("Failed to save ledger account:", err);
      toast.error(err?.response?.data?.code?.[0] || err?.response?.data?.detail || "Failed to save account.");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (account) => {
    if (!window.confirm(`Delete account "${account.code} — ${account.name}"? This only works if it has no journal activity.`)) return;
    try {
      await accountingService.deleteAccount(account.id);
      toast.success("Account deleted.");
      refetch();
    } catch (err) {
      console.error("Failed to delete ledger account:", err);
      toast.error(err?.response?.data?.[0] || err?.response?.data?.detail || "This account has journal entries posted against it — mark it inactive instead.");
    }
  };

  return (
    <div className="w-full">
      <div className="flex items-center gap-3 pb-4 border-b border-cn-border mb-6 flex-wrap">
        <div className="flex-1 min-w-0">
          <h1 className="font-heading font-bold text-2xl text-violet-950">Chart of Accounts</h1>
          <p className="text-ink-500 text-[13px] mt-1">The general ledger's account catalog — every journal entry line posts against one of these.</p>
        </div>
        <Button variant="primary" icon={<Plus size={16} />} onClick={openCreateModal}>
          New account
        </Button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
        <div className="bg-cn-surface border border-cn-border rounded-2xl p-5">
          <div className="w-10 h-10 rounded-xl bg-violet-50 text-violet-700 flex items-center justify-center mb-3">
            <Landmark size={18} />
          </div>
          <div className="font-heading font-extrabold text-2xl text-ink-900">{count}</div>
          <div className="text-[13px] text-ink-500 mt-1 font-medium">Total accounts</div>
        </div>
        <div className="bg-cn-surface border border-cn-border rounded-2xl p-5">
          <div className="w-10 h-10 rounded-xl bg-success-tint text-success-hex flex items-center justify-center mb-3">
            <Landmark size={18} />
          </div>
          <div className="font-heading font-extrabold text-2xl text-ink-900">{activeCount}</div>
          <div className="text-[13px] text-ink-500 mt-1 font-medium">Active (this page)</div>
        </div>
      </div>

      <Table
        columns={columns}
        data={accounts}
        loading={loading}
        onEdit={openEditModal}
        onDelete={handleDelete}
        emptyMessage="No accounts yet"
        emptyDescription="Click “New account” or run the seed_chart_of_accounts command to bootstrap a starter Chart of Accounts."
      />
      <Pagination page={page} totalPages={totalPages} count={count} pageSize={pageSize} onPageChange={setPage} loading={loading} />

      <Modal isOpen={showModal} onClose={() => setShowModal(false)} title={editingAccount ? "Edit account" : "New account"}>
        <div className="flex flex-col gap-3.5 w-[360px] max-w-full">
          <BlackInputField
            label="Code"
            fieldName="code"
            value={form.code}
            onChange={(e) => setForm((p) => ({ ...p, code: e.target.value }))}
            placeholder="e.g. 4050"
            required
          />
          <BlackInputField
            label="Name"
            fieldName="name"
            value={form.name}
            onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))}
            placeholder="e.g. Sports Fee Income"
            required
          />
          <SelectBox
            label="Type"
            fieldName="account_type"
            value={form.account_type}
            onChange={(e) => setForm((p) => ({ ...p, account_type: e.target.value }))}
            options={TYPE_OPTIONS}
            required
          />
          <SelectBox
            label="Parent account (optional)"
            fieldName="parent"
            value={form.parent}
            onChange={(e) => setForm((p) => ({ ...p, parent: e.target.value }))}
            options={parentOptions}
          />
          <BlackInputField
            label="Description (optional)"
            fieldName="description"
            value={form.description}
            onChange={(e) => setForm((p) => ({ ...p, description: e.target.value }))}
          />
          <label className="flex items-center gap-2 text-[13px] text-ink-700">
            <input
              type="checkbox"
              checked={form.is_active}
              onChange={(e) => setForm((p) => ({ ...p, is_active: e.target.checked }))}
              className="w-4 h-4 accent-violet-700"
            />
            Active
          </label>
          <div className="flex justify-end gap-2 mt-2">
            <Button variant="outline" onClick={() => setShowModal(false)}>
              Cancel
            </Button>
            <Button variant="primary" onClick={handleSave} loading={saving}>
              {editingAccount ? "Save changes" : "Create account"}
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default ChartOfAccounts;
