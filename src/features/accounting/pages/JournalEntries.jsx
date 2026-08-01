import React, { useEffect, useMemo, useState } from "react";
import { toast } from "react-toastify";
import { BookText, Plus, Trash2, Send, Undo2, Paperclip } from "lucide-react";
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
const emptyEntryForm = { date: new Date().toISOString().slice(0, 10), narration: "" };

const JournalEntries = () => {
  const [statusFilter, setStatusFilter] = useState("");
  const {
    items: entries,
    page,
    setPage,
    totalPages,
    count,
    pageSize,
    loading,
    refetch,
  } = usePaginatedList(accountingService.getJournalEntries, { status: statusFilter || undefined });

  const [accounts, setAccounts] = useState([]);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [entryForm, setEntryForm] = useState(emptyEntryForm);
  const [lines, setLines] = useState([{ ...emptyLine }, { ...emptyLine }]);
  const [saving, setSaving] = useState(false);

  const [viewingEntry, setViewingEntry] = useState(null);
  const [reversingEntry, setReversingEntry] = useState(null);
  const [reversalNarration, setReversalNarration] = useState("");
  const [acting, setActing] = useState(false);
  const [attachingEntry, setAttachingEntry] = useState(null);

  useEffect(() => {
    accountingService
      .getLedgerAccounts({ page_size: 500, is_active: true })
      .then((res) => setAccounts(asList(res.data)))
      .catch((err) => console.error("Failed to load ledger accounts:", err));
  }, []);

  const accountOptions = useMemo(
    () => accounts.map((a) => ({ label: `${a.code} - ${a.name}`, value: String(a.id) })),
    [accounts]
  );

  const totalDebit = lines.reduce((sum, l) => sum + Number(l.debit || 0), 0);
  const totalCredit = lines.reduce((sum, l) => sum + Number(l.credit || 0), 0);
  const filledLines = lines.filter((l) => l.account && (Number(l.debit) > 0 || Number(l.credit) > 0));
  const isBalanced = filledLines.length >= 2 && totalDebit === totalCredit && totalDebit > 0;

  const updateLine = (idx, fieldOrPatch, value) => {
    setLines((prev) =>
      prev.map((l, i) => {
        if (i !== idx) return l;
        if (typeof fieldOrPatch === "object") {
          return { ...l, ...fieldOrPatch };
        }
        return { ...l, [fieldOrPatch]: value };
      })
    );
  };

  const addLine = () => setLines((prev) => [...prev, { ...emptyLine }]);
  const removeLine = (idx) => setLines((prev) => prev.filter((_, i) => i !== idx));

  const resetForm = () => {
    setEntryForm({ ...emptyEntryForm, date: new Date().toISOString().slice(0, 10) });
    setLines([{ ...emptyLine }, { ...emptyLine }]);
  };

  const openCreateModal = () => {
    resetForm();
    setShowCreateModal(true);
  };

  const handleSaveDraft = async () => {
    if (!entryForm.narration.trim()) {
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
        date: entryForm.date,
        narration: entryForm.narration,
        lines_input: filledLines.map((l) => ({
          account: Number(l.account),
          debit: Number(l.debit || 0),
          credit: Number(l.credit || 0),
          description: l.description || "",
        })),
      });
      toast.success(isBalanced ? "Journal entry created as draft — post it when ready." : "Draft saved.");
      setShowCreateModal(false);
      resetForm();
      refetch();
    } catch (err) {
      console.error("Failed to create journal entry draft:", err);
      toast.error(err?.response?.data?.non_field_errors?.[0] || err?.response?.data?.lines_input?.[0] || "Failed to create journal entry.");
    } finally {
      setSaving(false);
    }
  };

  const handleCreateAndPost = async () => {
    if (!entryForm.date || !entryForm.narration.trim()) {
      toast.error("Date and narration are required.");
      return;
    }
    if (filledLines.length < 2) {
      toast.error("A journal entry needs at least two lines.");
      return;
    }
    if (!isBalanced) {
      toast.error(`Entry is not balanced: total debit ₹${totalDebit} vs total credit ₹${totalCredit}.`);
      return;
    }
    setSaving(true);
    try {
      const res = await accountingService.createJournalEntry({
        date: entryForm.date,
        narration: entryForm.narration,
        lines_input: filledLines.map((l) => ({
          account: Number(l.account),
          debit: Number(l.debit || 0),
          credit: Number(l.credit || 0),
          description: l.description || "",
        })),
      });
      await accountingService.postJournalEntry(res.data.id);
      toast.success("Journal entry posted.");
      setShowCreateModal(false);
      resetForm();
      refetch();
    } catch (err) {
      console.error("Failed to create and post journal entry:", err);
      toast.error(err?.response?.data?.error || err?.response?.data?.non_field_errors?.[0] || "Failed to post journal entry.");
    } finally {
      setSaving(false);
    }
  };

  const openViewModal = (entry) => {
    setViewingEntry(entry);
    setReversalNarration("");
  };

  const handlePost = async () => {
    if (!viewingEntry) return;
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

  const handleReverse = async (entryToReverse, customNarration) => {
    const target = entryToReverse || reversingEntry || viewingEntry;
    if (!target) return;
    setActing(true);
    try {
      await accountingService.reverseJournalEntry(target.id, customNarration || reversalNarration || undefined);
      toast.success("Reversal entry posted.");
      setReversingEntry(null);
      setViewingEntry(null);
      setReversalNarration("");
      refetch();
    } catch (err) {
      console.error("Failed to reverse journal entry:", err);
      toast.error(err?.response?.data?.error || "Failed to reverse journal entry.");
    } finally {
      setActing(false);
    }
  };

  const handleDeleteDraft = async () => {
    if (!viewingEntry) return;
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
    {
      header: "Reverse",
      accessor: (row) =>
        row.status === "posted" && !row.is_reversed ? (
          <button
            type="button"
            onClick={() => setReversingEntry(row)}
            className="text-[11.5px] font-bold text-error-hex hover:underline cursor-pointer inline-flex items-center gap-1"
          >
            <Undo2 size={13} /> Reverse
          </button>
        ) : null,
    },
    {
      header: "Files",
      accessor: (row) => (
        <button type="button" onClick={() => setAttachingEntry(row)} className="text-ink-500 hover:text-violet-700 cursor-pointer" title="Attachments">
          <Paperclip size={14} />
        </button>
      ),
    },
  ];

  return (
    <div className="w-full">
      <div className="flex items-center gap-3 pb-4 border-b border-cn-border mb-6 flex-wrap">
        <div className="flex-1 min-w-0">
          <h1 className="font-heading font-bold text-2xl text-violet-950 flex items-center gap-2">
            <BookText size={22} className="text-violet-700" />
            Journal Entries
          </h1>
          <p className="text-ink-500 text-[13px] mt-1">The double-entry general ledger — posted entries are immutable; corrections go through Reverse.</p>
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
        viewLabel="View details"
        emptyMessage="No journal entries yet"
        emptyDescription="Click “New journal entry” to record the first Dr/Cr entry."
      />
      <Pagination page={page} totalPages={totalPages} count={count} pageSize={pageSize} onPageChange={setPage} loading={loading} />

      {/* Create modal */}
      <Modal isOpen={showCreateModal} onClose={() => { setShowCreateModal(false); resetForm(); }} title="New journal entry">
        <div className="flex flex-col gap-3.5 w-[560px] max-w-full">
          <div className="grid grid-cols-2 gap-3">
            <BlackInputField
              label="Date"
              fieldName="date"
              type="date"
              value={entryForm.date}
              onChange={(e) => setEntryForm((p) => ({ ...p, date: e.target.value }))}
              required
            />
            <BlackInputField
              label="Narration"
              fieldName="narration"
              value={entryForm.narration}
              onChange={(e) => setEntryForm((p) => ({ ...p, narration: e.target.value }))}
              placeholder="e.g. Office rent for July 2026"
              required
            />
          </div>

          <div className="border border-cn-border rounded-lg overflow-hidden">
            <table className="w-full text-[12.5px]">
              <thead className="bg-violet-50/50">
                <tr>
                  <th className="p-2 text-left font-semibold text-ink-500 uppercase text-[10.5px]">Account</th>
                  <th className="p-2 text-left font-semibold text-ink-500 uppercase text-[10.5px] w-24">Debit</th>
                  <th className="p-2 text-left font-semibold text-ink-500 uppercase text-[10.5px] w-24">Credit</th>
                  <th className="p-2 text-left font-semibold text-ink-500 uppercase text-[10.5px]">Description</th>
                  <th className="w-8"></th>
                </tr>
              </thead>
              <tbody>
                {lines.map((line, idx) => (
                  <tr key={idx} className="border-t border-cn-border">
                    <td className="p-1.5">
                      <SelectBox fieldName={`account-${idx}`} value={line.account} onChange={(e) => updateLine(idx, "account", e.target.value)} options={accountOptions} />
                    </td>
                    <td className="p-1.5">
                      <input
                        type="number"
                        value={line.debit}
                        onChange={(e) => updateLine(idx, "debit", e.target.value)}
                        className="w-full px-2 py-1.5 rounded-md border border-cn-border text-[12.5px]"
                        placeholder="0.00"
                      />
                    </td>
                    <td className="p-1.5">
                      <input
                        type="number"
                        value={line.credit}
                        onChange={(e) => updateLine(idx, "credit", e.target.value)}
                        className="w-full px-2 py-1.5 rounded-md border border-cn-border text-[12.5px]"
                        placeholder="0.00"
                      />
                    </td>
                    <td className="p-1.5">
                      <input
                        type="text"
                        value={line.description}
                        onChange={(e) => updateLine(idx, "description", e.target.value)}
                        className="w-full px-2 py-1.5 rounded-md border border-cn-border text-[12.5px]"
                      />
                    </td>
                    <td className="p-1.5 text-center">
                      {lines.length > 2 && (
                        <button type="button" onClick={() => removeLine(idx)} className="text-error-hex cursor-pointer">
                          <Trash2 size={14} />
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="flex items-center justify-between">
            <button type="button" onClick={addLine} className="text-[12px] font-bold text-violet-700 hover:underline cursor-pointer flex items-center gap-1">
              <Plus size={14} /> Add line
            </button>
            <div className={`text-[12.5px] font-bold ${isBalanced ? "text-success-hex" : "text-error-hex"}`}>
              Debit ₹{totalDebit.toLocaleString("en-IN")} · Credit ₹{totalCredit.toLocaleString("en-IN")}
              {!isBalanced && " (not balanced)"}
            </div>
          </div>

          <div className="flex justify-end gap-2 mt-2">
            <Button variant="outline" onClick={() => { setShowCreateModal(false); resetForm(); }}>Cancel</Button>
            <Button variant="outline" onClick={handleSaveDraft} loading={saving}>Save as draft</Button>
            <Button variant="primary" icon={<Send size={14} />} onClick={handleCreateAndPost} loading={saving} disabled={!isBalanced}>
              Post entry
            </Button>
          </div>
        </div>
      </Modal>

      {/* View entry modal */}
      <Modal isOpen={!!viewingEntry} onClose={() => setViewingEntry(null)} title={`Journal entry · ${viewingEntry?.entry_number || ""}`}>
        {viewingEntry && (
          <div className="flex flex-col gap-3.5 w-[460px] max-w-full">
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
                    <tr key={l.id || l.account}>
                      <td className="p-2">{l.account_code || l.account} — {l.account_name || ""}</td>
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
                  value={reversalNarration}
                  onChange={(e) => setReversalNarration(e.target.value)}
                  placeholder={`Reversal of ${viewingEntry.entry_number}`}
                />
                <div className="flex justify-end">
                  <Button variant="destructive" onClick={() => handleReverse(viewingEntry, reversalNarration)} loading={acting}>
                    Reverse entry
                  </Button>
                </div>
              </div>
            )}
          </div>
        )}
      </Modal>

      {/* Reverse standalone modal */}
      <Modal isOpen={!!reversingEntry} onClose={() => setReversingEntry(null)} title={`Reverse ${reversingEntry?.entry_number || ""}`}>
        <div className="flex flex-col gap-3.5 w-[360px] max-w-full">
          <p className="text-[12.5px] text-ink-500">
            This creates a new posted entry with every line's debit/credit swapped. The original entry stays in history, flagged as reversed.
          </p>
          <BlackInputField
            label="Reversal narration (optional)" fieldName="reversal_narration" value={reversalNarration}
            onChange={(e) => setReversalNarration(e.target.value)}
            placeholder={`Reversal of ${reversingEntry?.entry_number || ""}`}
          />
          <div className="flex justify-end gap-2 mt-2">
            <Button variant="outline" onClick={() => setReversingEntry(null)}>Cancel</Button>
            <Button variant="primary" onClick={() => handleReverse(reversingEntry, reversalNarration)} loading={acting}>Confirm reversal</Button>
          </div>
        </div>
      </Modal>

      <AttachmentsModal
        isOpen={!!attachingEntry} onClose={() => setAttachingEntry(null)}
        recordType="journal_entry" recordId={attachingEntry?.id}
        title={`Attachments · ${attachingEntry?.entry_number || ""}`}
      />
    </div>
  );
};

export default JournalEntries;
