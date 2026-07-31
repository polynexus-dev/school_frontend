import React, { useEffect, useState } from "react";
import { toast } from "react-toastify";
import { BookText, Plus, Trash2 } from "lucide-react";
import Button from "../../../components/Button";
import Table from "../../../components/Table";
import Modal from "../../../components/Modal";
import BlackInputField from "../../../components/BlackInputField";
import SelectBox from "../../../components/SelectBox";
import Pagination from "../../../components/Pagination";
import usePaginatedList from "../../../hooks/usePaginatedList";
import accountingService from "../services/accountingService";

// Double-entry Journal Ledger — Plan 1 of the Accounting/Annual Audit
// module. Entries are created as DRAFT (lines nested in one atomic
// payload), then explicitly Posted; once posted they're immutable — the
// only correction path is Reverse, which posts a new mirrored entry.

const STATUS_TONE = {
  draft: "bg-warning-tint text-warning-hex",
  posted: "bg-success-tint text-success-hex",
};

const STATUS_OPTIONS = [
  { label: "All statuses", value: "" },
  { label: "Draft", value: "draft" },
  { label: "Posted", value: "posted" },
];

const emptyLine = { account: "", debit: "", credit: "", description: "" };
const emptyForm = { date: new Date().toISOString().slice(0, 10), narration: "" };

const JournalEntries = () => {
  const [statusFilter, setStatusFilter] = useState("");
  const { items: entries, page, setPage, totalPages, count, pageSize, loading, refetch } = usePaginatedList(
    accountingService.getJournalEntries,
    { status: statusFilter || undefined }
  );

  const [accounts, setAccounts] = useState([]);
  useEffect(() => {
    accountingService
      .getAccounts()
      .then((res) => setAccounts(res.data?.results ?? res.data ?? []))
      .catch((err) => console.error("Failed to load ledger accounts:", err));
  }, []);
  const accountOptions = accounts.map((a) => ({ label: `${a.code} — ${a.name}`, value: String(a.id) }));

  const [showCreateModal, setShowCreateModal] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [lines, setLines] = useState([{ ...emptyLine }, { ...emptyLine }]);
  const [saving, setSaving] = useState(false);

  const [viewingEntry, setViewingEntry] = useState(null);
  const [reverseNarration, setReverseNarration] = useState("");
  const [acting, setActing] = useState(false);

  const totalDebit = lines.reduce((sum, l) => sum + (Number(l.debit) || 0), 0);
  const totalCredit = lines.reduce((sum, l) => sum + (Number(l.credit) || 0), 0);
  const filledLines = lines.filter((l) => l.account && (Number(l.debit) > 0 || Number(l.credit) > 0));
  const isBalanced = filledLines.length >= 2 && totalDebit === totalCredit && totalDebit > 0;

  const columns = [
    {
      header: "Entry",
      accessor: (row) => (
        <div className="min-w-0">
          <div className="font-mono text-xs font-semibold text-ink-700">{row.entry_number}</div>
          <div className="text-[11px] text-ink-400">{row.date}</div>
        </div>
      ),
    },
    { header: "Narration", accessor: (row) => <span className="line-clamp-1">{row.narration}</span> },
    {
      header: "Amount",
      accessor: (row) => `₹${Number(row.total_debit || 0).toLocaleString("en-IN")}`,
    },
    {
      header: "Status",
      accessor: (row) => (
        <span className={`inline-flex items-center text-[11.5px] font-bold rounded-full px-2.5 py-0.5 ${STATUS_TONE[row.status] || "bg-cn-bg text-ink-500"}`}>
          {row.status?.toUpperCase()}
          {row.is_reversed ? " · REVERSED" : ""}
        </span>
      ),
    },
  ];

  const updateLine = (idx, patch) => {
    setLines((prev) => prev.map((l, i) => (i === idx ? { ...l, ...patch } : l)));
  };
  const addLine = () => setLines((prev) => [...prev, { ...emptyLine }]);
  const removeLine = (idx) => setLines((prev) => prev.filter((_, i) => i !== idx));

  const openCreateModal = () => {
    setForm({ ...emptyForm, date: new Date().toISOString().slice(0, 10) });
    setLines([{ ...emptyLine }, { ...emptyLine }]);
    setShowCreateModal(true);
  };

  const handleCreate = async () => {
    if (!form.narration.trim()) {
      toast.error("Narration is required.");
      return;
    }
    if (filledLines.length < 2) {
      toast.error("Add at least two lines (one debit, one credit).");
      return;
    }
    setSaving(true);
    try {
      await accountingService.createJournalEntry({
        date: form.date,
        narration: form.narration,
        lines_input: filledLines.map((l) => ({
          account: Number(l.account),
          debit: Number(l.debit) || 0,
          credit: Number(l.credit) || 0,
          description: l.description,
        })),
      });
      toast.success(isBalanced ? "Journal entry created as draft — post it when ready." : "Draft saved (not balanced yet — edit lines before posting).");
      setShowCreateModal(false);
      refetch();
    } catch (err) {
      console.error("Failed to create journal entry:", err);
      toast.error(err?.response?.data?.non_field_errors?.[0] || err?.response?.data?.lines_input?.[0] || "Failed to create journal entry.");
    } finally {
      setSaving(false);
    }
  };

  const openViewModal = (entry) => {
    setViewingEntry(entry);
    setReverseNarration("");
  };

  const handlePost = async () => {
    setActing(true);
    try {
      await accountingService.postJournalEntry(viewingEntry.id);
      toast.success("Journal entry posted.");
      setViewingEntry(null);
      refetch();
    } catch (err) {
      console.error("Failed to post journal entry:", err);
      toast.error(err?.response?.data?.error || "Failed to post journal entry.");
    } finally {
      setActing(false);
    }
  };

  const handleReverse = async () => {
    setActing(true);
    try {
      await accountingService.reverseJournalEntry(viewingEntry.id, reverseNarration);
      toast.success("Reversal entry posted.");
      setViewingEntry(null);
      refetch();
    } catch (err) {
      console.error("Failed to reverse journal entry:", err);
      toast.error(err?.response?.data?.error || "Failed to reverse journal entry.");
    } finally {
      setActing(false);
    }
  };

  const handleDeleteDraft = async () => {
    if (!window.confirm(`Delete draft entry "${viewingEntry.entry_number}"?`)) return;
    setActing(true);
    try {
      await accountingService.deleteJournalEntry(viewingEntry.id);
      toast.success("Draft deleted.");
      setViewingEntry(null);
      refetch();
    } catch (err) {
      console.error("Failed to delete draft entry:", err);
      toast.error(err?.response?.data?.error || "Failed to delete draft entry.");
    } finally {
      setActing(false);
    }
  };

  return (
    <div className="w-full">
      <div className="flex items-center gap-3 pb-4 border-b border-cn-border mb-6 flex-wrap">
        <div className="flex-1 min-w-0">
          <h1 className="font-heading font-bold text-2xl text-violet-950">Journal Entries</h1>
          <p className="text-ink-500 text-[13px] mt-1">The double-entry general ledger — every posted entry is immutable; corrections go through Reverse.</p>
        </div>
        <Button variant="primary" icon={<Plus size={16} />} onClick={openCreateModal}>
          New journal entry
        </Button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
        <div className="bg-cn-surface border border-cn-border rounded-2xl p-5">
          <div className="w-10 h-10 rounded-xl bg-violet-50 text-violet-700 flex items-center justify-center mb-3">
            <BookText size={18} />
          </div>
          <div className="font-heading font-extrabold text-2xl text-ink-900">{count}</div>
          <div className="text-[13px] text-ink-500 mt-1 font-medium">Total entries</div>
        </div>
        <div className="w-full sm:w-64">
          <SelectBox
            label="Filter by status"
            fieldName="status"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            options={STATUS_OPTIONS}
          />
        </div>
      </div>

      <Table
        columns={columns}
        data={entries}
        loading={loading}
        onView={openViewModal}
        viewLabel="View / Post / Reverse"
        emptyMessage="No journal entries yet"
        emptyDescription="Click “New journal entry” to record the first Dr/Cr entry."
      />
      <Pagination page={page} totalPages={totalPages} count={count} pageSize={pageSize} onPageChange={setPage} loading={loading} />

      {/* Create modal */}
      <Modal isOpen={showCreateModal} onClose={() => setShowCreateModal(false)} title="New journal entry">
        <div className="flex flex-col gap-3.5 w-[520px] max-w-full">
          <div className="grid grid-cols-2 gap-3">
            <BlackInputField
              label="Date"
              fieldName="date"
              type="date"
              value={form.date}
              onChange={(e) => setForm((p) => ({ ...p, date: e.target.value }))}
              required
            />
            <BlackInputField
              label="Narration"
              fieldName="narration"
              value={form.narration}
              onChange={(e) => setForm((p) => ({ ...p, narration: e.target.value }))}
              placeholder="e.g. Office rent paid for July"
              required
            />
          </div>

          <div className="flex flex-col gap-2">
            <div className="flex items-center justify-between">
              <span className="text-[13px] font-semibold text-ink-700">Lines</span>
              <button type="button" onClick={addLine} className="text-[12.5px] font-semibold text-violet-700 hover:text-violet-900">
                + Add line
              </button>
            </div>
            {lines.map((line, idx) => (
              <div key={idx} className="grid grid-cols-[1fr_90px_90px_28px] gap-2 items-start">
                <SelectBox
                  fieldName={`account-${idx}`}
                  value={line.account}
                  onChange={(e) => updateLine(idx, { account: e.target.value })}
                  options={accountOptions}
                />
                <BlackInputField
                  fieldName={`debit-${idx}`}
                  type="number"
                  placeholder="Dr"
                  value={line.debit}
                  onChange={(e) => updateLine(idx, { debit: e.target.value, credit: e.target.value ? "" : line.credit })}
                />
                <BlackInputField
                  fieldName={`credit-${idx}`}
                  type="number"
                  placeholder="Cr"
                  value={line.credit}
                  onChange={(e) => updateLine(idx, { credit: e.target.value, debit: e.target.value ? "" : line.debit })}
                />
                <button
                  type="button"
                  onClick={() => removeLine(idx)}
                  disabled={lines.length <= 2}
                  className="w-7 h-7 mt-0.5 inline-flex items-center justify-center text-error-hex hover:bg-red-50 rounded-md disabled:opacity-30 disabled:cursor-not-allowed"
                  title="Remove line"
                >
                  <Trash2 size={14} />
                </button>
              </div>
            ))}
          </div>

          <div className={`text-[12.5px] font-semibold rounded-lg px-3 py-2 ${isBalanced ? "bg-success-tint text-success-hex" : "bg-warning-tint text-warning-hex"}`}>
            Total Dr ₹{totalDebit.toLocaleString("en-IN")} · Total Cr ₹{totalCredit.toLocaleString("en-IN")}
            {isBalanced ? " · Balanced" : " · Not balanced yet"}
          </div>

          <div className="flex justify-end gap-2 mt-2">
            <Button variant="outline" onClick={() => setShowCreateModal(false)}>
              Cancel
            </Button>
            <Button variant="primary" onClick={handleCreate} loading={saving}>
              Save as draft
            </Button>
          </div>
        </div>
      </Modal>

      {/* View / act modal */}
      <Modal isOpen={!!viewingEntry} onClose={() => setViewingEntry(null)} title={`Journal entry · ${viewingEntry?.entry_number || ""}`}>
        {viewingEntry && (
          <div className="flex flex-col gap-3.5 w-[420px] max-w-full">
            <div className="text-[13px] text-ink-700">{viewingEntry.narration}</div>
            <div className="overflow-x-auto border border-cn-border rounded-lg">
              <table className="min-w-full text-[12.5px]">
                <thead>
                  <tr className="bg-violet-50/50 border-b border-cn-border">
                    <th className="p-2 text-left font-semibold text-ink-500">Account</th>
                    <th className="p-2 text-right font-semibold text-ink-500">Dr</th>
                    <th className="p-2 text-right font-semibold text-ink-500">Cr</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-violet-50">
                  {(viewingEntry.lines || []).map((l) => (
                    <tr key={l.id}>
                      <td className="p-2">{l.account_code} — {l.account_name}</td>
                      <td className="p-2 text-right">{Number(l.debit) > 0 ? `₹${Number(l.debit).toLocaleString("en-IN")}` : "—"}</td>
                      <td className="p-2 text-right">{Number(l.credit) > 0 ? `₹${Number(l.credit).toLocaleString("en-IN")}` : "—"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="text-[12.5px] text-ink-500">
              Status: <b className="text-ink-900">{viewingEntry.status?.toUpperCase()}</b>
              {viewingEntry.is_reversed && <span className="text-error-hex font-semibold"> · REVERSED</span>}
              {viewingEntry.posted_by_name && <div>Posted by {viewingEntry.posted_by_name}</div>}
            </div>

            {viewingEntry.status === "draft" && (
              <div className="flex justify-end gap-2">
                <Button variant="destructive" onClick={handleDeleteDraft} loading={acting}>
                  Delete draft
                </Button>
                <Button variant="primary" onClick={handlePost} loading={acting}>
                  Post entry
                </Button>
              </div>
            )}

            {viewingEntry.status === "posted" && !viewingEntry.is_reversed && (
              <div className="flex flex-col gap-2">
                <BlackInputField
                  label="Reversal narration (optional)"
                  fieldName="reverse_narration"
                  value={reverseNarration}
                  onChange={(e) => setReverseNarration(e.target.value)}
                  placeholder={`Reversal of ${viewingEntry.entry_number}`}
                />
                <div className="flex justify-end">
                  <Button variant="destructive" onClick={handleReverse} loading={acting}>
                    Reverse entry
                  </Button>
                </div>
              </div>
            )}
          </div>
        )}
      </Modal>
    </div>
  );
};

export default JournalEntries;
