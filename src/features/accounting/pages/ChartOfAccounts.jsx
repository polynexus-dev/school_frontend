import React, { useEffect, useMemo, useState } from "react";
import { toast } from "react-toastify";
import { BookOpen, Plus } from "lucide-react";
import Button from "../../../components/Button";
import Table from "../../../components/Table";
import Modal from "../../../components/Modal";
import BlackInputField from "../../../components/BlackInputField";
import SelectBox from "../../../components/SelectBox";
import Pagination from "../../../components/Pagination";
import usePaginatedList from "../../../hooks/usePaginatedList";
import accountingService from "../services/accountingService";

const asList = (data) => (Array.isArray(data) ? data : data?.results || []);

const ACCOUNT_TYPES = [
  { label: "Asset", value: "asset" },
  { label: "Liability", value: "liability" },
  { label: "Equity", value: "equity" },
  { label: "Income", value: "income" },
  { label: "Expense", value: "expense" },
];

const TYPE_TONE = {
  asset: "bg-violet-50 text-violet-700",
  liability: "bg-warning-tint text-warning-hex",
  equity: "bg-cn-bg text-ink-500",
  income: "bg-success-tint text-success-hex",
  expense: "bg-error-tint text-error-hex",
};

const emptyAccountForm = { code: "", name: "", account_type: "asset", parent: "", description: "" };
const emptyMappingForm = { method_code: "", account: "" };

const ChartOfAccounts = () => {
  const [tab, setTab] = useState("accounts");

  const {
    items: accounts,
    page,
    setPage,
    totalPages,
    count,
    pageSize,
    loading,
    refetch,
  } = usePaginatedList(accountingService.getLedgerAccounts);

  const [allAccounts, setAllAccounts] = useState([]); // unpaginated, for parent/mapping pickers
  const [mappings, setMappings] = useState([]);
  const [loadingMappings, setLoadingMappings] = useState(false);

  const [showAccountModal, setShowAccountModal] = useState(false);
  const [accountForm, setAccountForm] = useState(emptyAccountForm);
  const [showMappingModal, setShowMappingModal] = useState(false);
  const [mappingForm, setMappingForm] = useState(emptyMappingForm);
  const [editingMapping, setEditingMapping] = useState(null);
  const [saving, setSaving] = useState(false);

  const loadAllAccounts = async () => {
    try {
      const res = await accountingService.getLedgerAccounts({ page_size: 500 });
      setAllAccounts(asList(res.data));
    } catch (err) {
      console.error("Failed to load ledger accounts:", err);
    }
  };

  const loadMappings = async () => {
    setLoadingMappings(true);
    try {
      const res = await accountingService.getPaymentMethodMappings();
      setMappings(asList(res.data));
    } catch (err) {
      console.error("Failed to load payment-method mappings:", err);
      toast.error("Failed to load payment-method mappings.");
    } finally {
      setLoadingMappings(false);
    }
  };

  useEffect(() => {
    loadAllAccounts();
    loadMappings();
  }, []);

  const accountOptions = useMemo(
    () => allAccounts.map((a) => ({ label: `${a.code} - ${a.name}`, value: String(a.id) })),
    [allAccounts]
  );
  const parentOptions = useMemo(
    () => [{ label: "None (top-level)", value: "" }, ...accountOptions],
    [accountOptions]
  );

  const handleSaveAccount = async () => {
    if (!accountForm.code.trim() || !accountForm.name.trim()) {
      toast.error("Code and name are required.");
      return;
    }
    setSaving(true);
    try {
      await accountingService.createLedgerAccount({
        ...accountForm,
        parent: accountForm.parent ? Number(accountForm.parent) : null,
      });
      toast.success("Ledger account created.");
      setShowAccountModal(false);
      setAccountForm(emptyAccountForm);
      refetch();
      loadAllAccounts();
    } catch (err) {
      console.error("Failed to create ledger account:", err);
      toast.error(err?.response?.data?.code?.[0] || "Failed to create account — that code may already be in use.");
    } finally {
      setSaving(false);
    }
  };

  const handleToggleActive = async (account) => {
    try {
      await accountingService.updateLedgerAccount(account.id, { is_active: !account.is_active });
      toast.success(account.is_active ? "Account marked inactive." : "Account reactivated.");
      refetch();
      loadAllAccounts();
    } catch (err) {
      console.error("Failed to update ledger account:", err);
      toast.error("Failed to update account.");
    }
  };

  const openMappingModal = (mapping) => {
    if (mapping) {
      setEditingMapping(mapping);
      setMappingForm({ method_code: mapping.method_code, account: String(mapping.account) });
    } else {
      setEditingMapping(null);
      setMappingForm(emptyMappingForm);
    }
    setShowMappingModal(true);
  };

  const handleSaveMapping = async () => {
    if (!mappingForm.method_code.trim() || !mappingForm.account) {
      toast.error("Payment method code and account are both required.");
      return;
    }
    setSaving(true);
    try {
      const payload = { method_code: mappingForm.method_code.trim(), account: Number(mappingForm.account) };
      if (editingMapping) {
        await accountingService.updatePaymentMethodMapping(editingMapping.id, payload);
        toast.success("Mapping updated.");
      } else {
        await accountingService.createPaymentMethodMapping(payload);
        toast.success("Mapping created.");
      }
      setShowMappingModal(false);
      loadMappings();
    } catch (err) {
      console.error("Failed to save payment-method mapping:", err);
      toast.error(err?.response?.data?.method_code?.[0] || "Failed to save mapping.");
    } finally {
      setSaving(false);
    }
  };

  const accountColumns = [
    { header: "Code", accessor: "code" },
    { header: "Name", accessor: "name" },
    {
      header: "Type",
      accessor: (row) => (
        <span className={`px-2 py-0.5 rounded-full text-[11px] font-bold capitalize ${TYPE_TONE[row.account_type] || ""}`}>
          {row.account_type}
        </span>
      ),
    },
    { header: "Parent", accessor: (row) => allAccounts.find((a) => a.id === row.parent)?.code || "-" },
    {
      header: "Status",
      accessor: (row) => (
        <button
          type="button"
          onClick={() => handleToggleActive(row)}
          className={`text-[11px] font-bold px-2 py-0.5 rounded-full cursor-pointer ${row.is_active ? "bg-success-tint text-success-hex" : "bg-cn-bg text-ink-400"}`}
        >
          {row.is_active ? "Active" : "Inactive"}
        </button>
      ),
    },
  ];

  const mappingColumns = [
    { header: "Payment method", accessor: "method_code" },
    { header: "GL account", accessor: (row) => `${row.account_code} - ${row.account_name}` },
  ];

  return (
    <div className="w-full">
      <div className="flex items-center gap-3 pb-4 border-b border-cn-border mb-6 flex-wrap">
        <div className="flex-1 min-w-0">
          <h1 className="font-heading font-bold text-2xl text-violet-950 flex items-center gap-2">
            <BookOpen size={22} className="text-violet-700" />
            Chart of Accounts
          </h1>
          <p className="text-ink-500 text-[13px] mt-1">Ledger accounts &amp; payment-method GL mapping</p>
        </div>
        <div className="flex gap-2">
          <Button variant={tab === "accounts" ? "primary" : "outline"} size="compact" onClick={() => setTab("accounts")}>
            Accounts
          </Button>
          <Button variant={tab === "mappings" ? "primary" : "outline"} size="compact" onClick={() => setTab("mappings")}>
            Payment method mapping
          </Button>
        </div>
      </div>

      {tab === "accounts" && (
        <>
          <div className="flex justify-end mb-4">
            <Button variant="primary" icon={<Plus size={16} />} onClick={() => setShowAccountModal(true)}>
              Add account
            </Button>
          </div>
          <Table columns={accountColumns} data={accounts} loading={loading} emptyMessage="No ledger accounts yet" />
          <Pagination page={page} totalPages={totalPages} count={count} pageSize={pageSize} onPageChange={setPage} loading={loading} />
        </>
      )}

      {tab === "mappings" && (
        <>
          <div className="flex justify-end mb-4">
            <Button variant="primary" icon={<Plus size={16} />} onClick={() => openMappingModal(null)}>
              Add mapping
            </Button>
          </div>
          <Table columns={mappingColumns} data={mappings} loading={loadingMappings} onEdit={openMappingModal} emptyMessage="No payment-method mappings yet" />
        </>
      )}

      <Modal isOpen={showAccountModal} onClose={() => setShowAccountModal(false)} title="Add ledger account">
        <div className="flex flex-col gap-3.5 w-[360px] max-w-full">
          <BlackInputField label="Code" fieldName="code" value={accountForm.code} onChange={(e) => setAccountForm((p) => ({ ...p, code: e.target.value }))} placeholder="e.g. 5300" required />
          <BlackInputField label="Name" fieldName="name" value={accountForm.name} onChange={(e) => setAccountForm((p) => ({ ...p, name: e.target.value }))} placeholder="e.g. Stationery Expense" required />
          <SelectBox label="Type" fieldName="account_type" value={accountForm.account_type} onChange={(e) => setAccountForm((p) => ({ ...p, account_type: e.target.value }))} options={ACCOUNT_TYPES} required />
          <SelectBox label="Parent (optional)" fieldName="parent" value={accountForm.parent} onChange={(e) => setAccountForm((p) => ({ ...p, parent: e.target.value }))} options={parentOptions} />
          <BlackInputField label="Description (optional)" fieldName="description" value={accountForm.description} onChange={(e) => setAccountForm((p) => ({ ...p, description: e.target.value }))} />
          <div className="flex justify-end gap-2 mt-2">
            <Button variant="outline" onClick={() => setShowAccountModal(false)}>Cancel</Button>
            <Button variant="primary" onClick={handleSaveAccount} loading={saving}>Save</Button>
          </div>
        </div>
      </Modal>

      <Modal isOpen={showMappingModal} onClose={() => setShowMappingModal(false)} title={editingMapping ? "Edit mapping" : "Add payment-method mapping"}>
        <div className="flex flex-col gap-3.5 w-[340px] max-w-full">
          <BlackInputField
            label="Payment method code"
            fieldName="method_code"
            value={mappingForm.method_code}
            onChange={(e) => setMappingForm((p) => ({ ...p, method_code: e.target.value }))}
            placeholder="e.g. cash, upi, card, net_banking, online"
            required
          />
          <SelectBox label="GL account" fieldName="account" value={mappingForm.account} onChange={(e) => setMappingForm((p) => ({ ...p, account: e.target.value }))} options={accountOptions} required />
          <div className="flex justify-end gap-2 mt-2">
            <Button variant="outline" onClick={() => setShowMappingModal(false)}>Cancel</Button>
            <Button variant="primary" onClick={handleSaveMapping} loading={saving}>Save</Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default ChartOfAccounts;
