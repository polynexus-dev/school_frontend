import React, { useEffect, useMemo, useState } from "react";
import { toast } from "react-toastify";
import { ScrollText, Plus, Trash2, Send, Undo2, Paperclip } from "lucide-react";
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

const emptyLine = { account: "", debit: "", credit: "", description: "" };
const emptyEntryForm = { date: new Date().toISOString().slice(0, 10), narration: "" };

const JournalEntries = () => {
  const {
    items: entries,
    page,
    setPage,
    totalPages,
    count,
    pageSize,
    loading,
    refetch,
  } = usePaginatedList(accountingService.getJournalEntries);

  const [accounts, setAccounts] = useState([]);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [entryForm, setEntryForm] = useState(emptyEntryForm);
  const [lines, setLines] = useState([{ ...emptyLine }, { ...emptyLine }]);
  const [saving, setSaving] = useState(false);
  const [reversingEntry, setReversingEntry] = useState(null);
  const [reversalNarration, setReversalNarration] = useState("");
  const [acting, setActing] = useState(null);
  const [attachingEntry, setAttachingEntry] = useState(null);

  useEffect(() => {
    accountingService.getLedgerAccounts({ page_size: 500, is_active: true })
      .then((res) => setAccounts(asList(res.data)))
      .catch((err) => console.error("Failed to load ledger accounts:", err));
  }, []);

  const accountOptions = useMemo(
    () => accounts.map((a) => ({ label: `${a.code} - ${a.name}`, value: String(a.id) })),
    [accounts]
  );

  const totalDebit = lines.reduce((sum, l) => sum + Number(l.debit || 0), 0);
  const totalCredit = lines.reduce((sum, l) => sum + Number(l.credit || 0), 0);
  const isBalanced = totalDebit === totalCredit && totalDebit > 0;

  const updateLine = (idx, field, value) => {
    setLines((prev) => prev.map((l, i) => (i === idx ? { ...l, [field]: value } : l)));
  };

  const addLine = () => setLines((prev) => [...prev, { ...emptyLine }]);
  const removeLine = (idx) => setLines((prev) => prev.filter((_, i) => i !== idx));

  const resetForm = () => {
    setEntryForm(emptyEntryForm);
    setLines([{ ...emptyLine }, { ...emptyLine }]);
  };

  const handleCreateAndPost = async () => {
    if (!entryForm.date || !entryForm.narration.trim()) {
      toast.error("Date and narration are required.");
      return;
    }
    const validLines = lines.filter((l) => l.account && (Number(l.debit) > 0 || Number(l.credit) > 0));
    if (validLines.length < 2) {
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
        lines_input: validLines.map((l) => ({
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
      console.error("Failed to create journal entry:", err);
      toast.error(err?.response?.data?.error || err?.response?.data?.non_field_errors?.[0] || "Failed to create journal entry.");
    } finally {
      setSaving(false);
    }
  };

  const handleReverse = async () => {
    setActing(reversingEntry.id);
    try {
      await accountingService.reverseJournalEntry(reversingEntry.id, reversalNarration || undefined);
      toast.success("Reversal entry posted.");
      setReversingEntry(null);
      setReversalNarration("");
      refetch();
    } catch (err) {
      console.error("Failed to reverse journal entry:", err);
      toast.error(err?.response?.data?.error || "Failed to reverse journal entry.");
    } finally {
      setActing(null);
    }
  };

  const columns = [
    { header: "Entry #", accessor: "entry_number" },
    { header: "Date", accessor: "date" },
    { header: "Narration", accessor: "narration" },
    { header: "Debit", accessor: (row) => `₹${Number(row.total_debit).toLocaleString("en-IN")}` },
    { header: "Credit", accessor: (row) => `₹${Number(row.total_credit).toLocaleString("en-IN")}` },
    {
      header: "Status",
      accessor: (row) => (
        <span className={`inline-flex items-center gap-1 text-[11.5px] font-bold rounded-full px-2.5 py-0.5 ${STATUS_TONE[row.status] || ""}`}>
          {row.status.toUpperCase()}
          {row.is_reversed && " · REVERSED"}
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
            <ScrollText size={22} className="text-violet-700" />
            Journal Entries
          </h1>
          <p className="text-ink-500 text-[13px] mt-1">Double-entry general ledger</p>
        </div>
        <Button variant="primary" icon={<Plus size={16} />} onClick={() => setShowCreateModal(true)}>
          New journal entry
        </Button>
      </div>

      <Table columns={columns} data={entries} loading={loading} emptyMessage="No journal entries yet" />
      <Pagination page={page} totalPages={totalPages} count={count} pageSize={pageSize} onPageChange={setPage} loading={loading} />

      <Modal isOpen={showCreateModal} onClose={() => { setShowCreateModal(false); resetForm(); }} title="New journal entry">
        <div className="flex flex-col gap-3.5 w-[560px] max-w-full">
          <div className="flex gap-3">
            <BlackInputField
              label="Date" fieldName="date" type="date" value={entryForm.date}
              onChange={(e) => setEntryForm((p) => ({ ...p, date: e.target.value }))} required
            />
            <BlackInputField
              label="Narration" fieldName="narration" value={entryForm.narration}
              onChange={(e) => setEntryForm((p) => ({ ...p, narration: e.target.value }))}
              placeholder="e.g. Office rent for July 2026" required
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
                        type="number" value={line.debit}
                        onChange={(e) => updateLine(idx, "debit", e.target.value)}
                        className="w-full px-2 py-1.5 rounded-md border border-cn-border text-[12.5px]"
                        placeholder="0.00"
                      />
                    </td>
                    <td className="p-1.5">
                      <input
                        type="number" value={line.credit}
                        onChange={(e) => updateLine(idx, "credit", e.target.value)}
                        className="w-full px-2 py-1.5 rounded-md border border-cn-border text-[12.5px]"
                        placeholder="0.00"
                      />
                    </td>
                    <td className="p-1.5">
                      <input
                        type="text" value={line.description}
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
            <Button variant="primary" icon={<Send size={14} />} onClick={handleCreateAndPost} loading={saving} disabled={!isBalanced}>
              Post entry
            </Button>
          </div>
        </div>
      </Modal>

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
            <Button variant="primary" onClick={handleReverse} loading={acting === reversingEntry?.id}>Confirm reversal</Button>
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
