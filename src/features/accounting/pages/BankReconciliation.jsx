import React, { useEffect, useMemo, useRef, useState } from "react";
import { toast } from "react-toastify";
import { Landmark, Plus, UploadCloud, Link2, Unlink } from "lucide-react";
import Button from "../../../components/Button";
import Table from "../../../components/Table";
import Modal from "../../../components/Modal";
import BlackInputField from "../../../components/BlackInputField";
import SelectBox from "../../../components/SelectBox";
import accountingService from "../services/accountingService";

const asList = (data) => (Array.isArray(data) ? data : data?.results || []);

const emptyBankAccountForm = { name: "", account_number: "", bank_name: "", ifsc_code: "", ledger_account: "" };

const BankReconciliation = () => {
  const [bankAccounts, setBankAccounts] = useState([]);
  const [assetAccounts, setAssetAccounts] = useState([]);
  const [selectedBankAccount, setSelectedBankAccount] = useState(null);
  const [summary, setSummary] = useState(null);
  const [statementLines, setStatementLines] = useState([]);
  const [loadingLines, setLoadingLines] = useState(false);
  const [statusFilter, setStatusFilter] = useState("unmatched");

  const [showAccountModal, setShowAccountModal] = useState(false);
  const [accountForm, setAccountForm] = useState(emptyBankAccountForm);
  const [saving, setSaving] = useState(false);
  const [importing, setImporting] = useState(false);
  const fileInputRef = useRef(null);

  const [matchingLine, setMatchingLine] = useState(null);
  const [suggestions, setSuggestions] = useState([]);
  const [loadingSuggestions, setLoadingSuggestions] = useState(false);
  const [acting, setActing] = useState(null);

  const loadBankAccounts = async () => {
    try {
      const res = await accountingService.getBankAccounts({ page_size: 200 });
      const list = asList(res.data);
      setBankAccounts(list);
      if (!selectedBankAccount && list.length > 0) setSelectedBankAccount(list[0]);
    } catch (err) {
      console.error("Failed to load bank accounts:", err);
      toast.error("Failed to load bank accounts.");
    }
  };

  useEffect(() => {
    loadBankAccounts();
    accountingService.getLedgerAccounts({ page_size: 500, account_type: "asset" })
      .then((res) => setAssetAccounts(asList(res.data)))
      .catch((err) => console.error("Failed to load asset accounts:", err));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const ledgerAccountOptions = useMemo(
    () => assetAccounts.map((a) => ({ label: `${a.code} - ${a.name}`, value: String(a.id) })),
    [assetAccounts]
  );
  const bankAccountOptions = useMemo(
    () => bankAccounts.map((b) => ({ label: b.name, value: String(b.id) })),
    [bankAccounts]
  );

  const loadSummaryAndLines = async (bankAccount) => {
    if (!bankAccount) return;
    setLoadingLines(true);
    try {
      const [summaryRes, linesRes] = await Promise.all([
        accountingService.getReconciliationSummary(bankAccount.id),
        accountingService.getStatementLines({ bank_account: bankAccount.id, status: statusFilter || undefined, page_size: 200 }),
      ]);
      setSummary(summaryRes.data);
      setStatementLines(asList(linesRes.data));
    } catch (err) {
      console.error("Failed to load reconciliation data:", err);
      toast.error("Failed to load reconciliation data.");
    } finally {
      setLoadingLines(false);
    }
  };

  useEffect(() => {
    loadSummaryAndLines(selectedBankAccount);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedBankAccount, statusFilter]);

  const handleSaveAccount = async () => {
    if (!accountForm.name.trim() || !accountForm.ledger_account) {
      toast.error("Name and GL account are required.");
      return;
    }
    setSaving(true);
    try {
      const res = await accountingService.createBankAccount({
        ...accountForm,
        ledger_account: Number(accountForm.ledger_account),
      });
      toast.success("Bank account created.");
      setShowAccountModal(false);
      setAccountForm(emptyBankAccountForm);
      await loadBankAccounts();
      setSelectedBankAccount(res.data);
    } catch (err) {
      console.error("Failed to create bank account:", err);
      toast.error(err?.response?.data?.ledger_account?.[0] || "Failed to create bank account.");
    } finally {
      setSaving(false);
    }
  };

  const handleImportClick = () => fileInputRef.current?.click();

  const handleFileSelected = async (e) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file || !selectedBankAccount) return;
    setImporting(true);
    try {
      const res = await accountingService.importBankStatement(selectedBankAccount.id, file);
      toast.success(`Imported ${res.data.imported} line(s)${res.data.skipped ? `, skipped ${res.data.skipped}` : ""}.`);
      loadSummaryAndLines(selectedBankAccount);
    } catch (err) {
      console.error("Failed to import statement:", err);
      toast.error(err?.response?.data?.error || "Failed to import statement.");
    } finally {
      setImporting(false);
    }
  };

  const openMatchModal = async (line) => {
    setMatchingLine(line);
    setLoadingSuggestions(true);
    setSuggestions([]);
    try {
      const res = await accountingService.getMatchSuggestions(line.id);
      setSuggestions(res.data);
    } catch (err) {
      console.error("Failed to load match suggestions:", err);
      toast.error("Failed to load match suggestions.");
    } finally {
      setLoadingSuggestions(false);
    }
  };

  const handleMatch = async (journalLineId) => {
    setActing(journalLineId);
    try {
      await accountingService.matchStatementLine(matchingLine.id, journalLineId);
      toast.success("Matched.");
      setMatchingLine(null);
      loadSummaryAndLines(selectedBankAccount);
    } catch (err) {
      console.error("Failed to match statement line:", err);
      toast.error(err?.response?.data?.error || "Failed to match.");
    } finally {
      setActing(null);
    }
  };

  const handleUnmatch = async (line) => {
    if (!window.confirm(`Unmatch ${line.description || line.reference_number || "this line"}?`)) return;
    setActing(line.id);
    try {
      await accountingService.unmatchStatementLine(line.id);
      toast.success("Unmatched.");
      loadSummaryAndLines(selectedBankAccount);
    } catch (err) {
      console.error("Failed to unmatch statement line:", err);
      toast.error("Failed to unmatch.");
    } finally {
      setActing(null);
    }
  };

  const columns = [
    { header: "Date", accessor: "date" },
    { header: "Description", accessor: (row) => row.description || "-" },
    { header: "Reference", accessor: (row) => row.reference_number || "-" },
    { header: "Debit (out)", accessor: (row) => (Number(row.debit) ? `₹${Number(row.debit).toLocaleString("en-IN")}` : "-") },
    { header: "Credit (in)", accessor: (row) => (Number(row.credit) ? `₹${Number(row.credit).toLocaleString("en-IN")}` : "-") },
    {
      header: "Status",
      accessor: (row) => (
        <span className={`text-[11px] font-bold px-2 py-0.5 rounded-full ${row.status === "matched" ? "bg-success-tint text-success-hex" : "bg-warning-tint text-warning-hex"}`}>
          {row.status.toUpperCase()}
        </span>
      ),
    },
    {
      header: "Action",
      accessor: (row) =>
        row.status === "unmatched" ? (
          <button type="button" onClick={() => openMatchModal(row)} className="text-[11.5px] font-bold text-violet-700 hover:underline cursor-pointer inline-flex items-center gap-1">
            <Link2 size={12} /> Match
          </button>
        ) : (
          <button type="button" onClick={() => handleUnmatch(row)} disabled={acting === row.id} className="text-[11.5px] font-bold text-error-hex hover:underline cursor-pointer inline-flex items-center gap-1">
            <Unlink size={12} /> Unmatch
          </button>
        ),
    },
  ];

  return (
    <div className="w-full">
      <div className="flex items-center gap-3 pb-4 border-b border-cn-border mb-6 flex-wrap">
        <div className="flex-1 min-w-0">
          <h1 className="font-heading font-bold text-2xl text-violet-950 flex items-center gap-2">
            <Landmark size={22} className="text-violet-700" />
            Bank Reconciliation
          </h1>
          <p className="text-ink-500 text-[13px] mt-1">Match imported bank statement lines against the ledger</p>
        </div>
        <Button variant="primary" icon={<Plus size={16} />} onClick={() => setShowAccountModal(true)}>
          Add bank account
        </Button>
      </div>

      <div className="flex items-end gap-3 mb-5 flex-wrap bg-cn-surface border border-cn-border rounded-xl p-4">
        <SelectBox
          label="Bank account" fieldName="bank_account" className="w-64"
          value={selectedBankAccount ? String(selectedBankAccount.id) : ""}
          onChange={(e) => setSelectedBankAccount(bankAccounts.find((b) => b.id === Number(e.target.value)) || null)}
          options={bankAccountOptions}
        />
        <SelectBox
          label="Status" fieldName="status_filter" className="w-40" value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          options={[{ label: "Unmatched", value: "unmatched" }, { label: "Matched", value: "matched" }, { label: "All", value: "" }]}
        />
        <Button variant="outline" icon={<UploadCloud size={15} />} onClick={handleImportClick} loading={importing} disabled={!selectedBankAccount}>
          Import statement (CSV)
        </Button>
        <input ref={fileInputRef} type="file" accept=".csv" className="hidden" onChange={handleFileSelected} />
      </div>

      {summary && (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
          <div className="bg-cn-surface border border-cn-border rounded-2xl p-5">
            <div className="font-heading font-extrabold text-xl text-ink-900">₹{summary.ledger_balance.toLocaleString("en-IN")}</div>
            <div className="text-[13px] text-ink-500 mt-1 font-medium">Ledger balance</div>
          </div>
          <div className="bg-cn-surface border border-cn-border rounded-2xl p-5">
            <div className="font-heading font-extrabold text-xl text-ink-900">₹{summary.statement_balance.toLocaleString("en-IN")}</div>
            <div className="text-[13px] text-ink-500 mt-1 font-medium">Statement balance</div>
          </div>
          <div className="bg-cn-surface border border-cn-border rounded-2xl p-5">
            <div className={`font-heading font-extrabold text-xl ${summary.difference === 0 ? "text-success-hex" : "text-error-hex"}`}>
              ₹{summary.difference.toLocaleString("en-IN")}
            </div>
            <div className="text-[13px] text-ink-500 mt-1 font-medium">Difference · {summary.unmatched_count} unmatched line(s)</div>
          </div>
        </div>
      )}

      <Table columns={columns} data={statementLines} loading={loadingLines} emptyMessage="No statement lines" emptyDescription="Import a CSV bank statement to get started." />

      <Modal isOpen={showAccountModal} onClose={() => setShowAccountModal(false)} title="Add bank account">
        <div className="flex flex-col gap-3.5 w-[360px] max-w-full">
          <BlackInputField label="Name" fieldName="name" value={accountForm.name} onChange={(e) => setAccountForm((p) => ({ ...p, name: e.target.value }))} placeholder="e.g. HDFC Bank — Operating Account" required />
          <BlackInputField label="Bank name (optional)" fieldName="bank_name" value={accountForm.bank_name} onChange={(e) => setAccountForm((p) => ({ ...p, bank_name: e.target.value }))} />
          <BlackInputField label="Account number (optional)" fieldName="account_number" value={accountForm.account_number} onChange={(e) => setAccountForm((p) => ({ ...p, account_number: e.target.value }))} />
          <BlackInputField label="IFSC (optional)" fieldName="ifsc_code" value={accountForm.ifsc_code} onChange={(e) => setAccountForm((p) => ({ ...p, ifsc_code: e.target.value }))} />
          <SelectBox label="GL account" fieldName="ledger_account" value={accountForm.ledger_account} onChange={(e) => setAccountForm((p) => ({ ...p, ledger_account: e.target.value }))} options={ledgerAccountOptions} required />
          <div className="flex justify-end gap-2 mt-2">
            <Button variant="outline" onClick={() => setShowAccountModal(false)}>Cancel</Button>
            <Button variant="primary" onClick={handleSaveAccount} loading={saving}>Save</Button>
          </div>
        </div>
      </Modal>

      <Modal isOpen={!!matchingLine} onClose={() => setMatchingLine(null)} title="Match statement line">
        <div className="flex flex-col gap-3 w-[460px] max-w-full">
          {matchingLine && (
            <div className="text-[12.5px] text-ink-500 bg-violet-50/50 rounded-lg p-3">
              {matchingLine.date} · {matchingLine.description || matchingLine.reference_number} · Rs.{Number(matchingLine.credit || matchingLine.debit).toLocaleString("en-IN")}
            </div>
          )}
          {loadingSuggestions ? (
            <div className="text-center text-ink-400 text-[13px] py-6">Loading suggestions…</div>
          ) : suggestions.length === 0 ? (
            <div className="text-center text-ink-400 text-[13px] py-6">No matching unposted ledger lines found for this amount.</div>
          ) : (
            <div className="flex flex-col gap-2 max-h-80 overflow-y-auto">
              {suggestions.map((s) => (
                <div key={s.id} className="flex items-center justify-between border border-cn-border rounded-lg p-2.5">
                  <div className="min-w-0">
                    <div className="text-[12.5px] font-semibold text-ink-800">{s.journal_entry_number} · {s.date}</div>
                    <div className="text-[11.5px] text-ink-500 truncate">{s.narration}</div>
                  </div>
                  <Button variant="primary" size="compact" onClick={() => handleMatch(s.id)} loading={acting === s.id}>
                    Match
                  </Button>
                </div>
              ))}
            </div>
          )}
        </div>
      </Modal>
    </div>
  );
};

export default BankReconciliation;
