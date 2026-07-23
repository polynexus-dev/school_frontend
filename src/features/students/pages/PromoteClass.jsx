import React, { useEffect, useMemo, useState } from "react";
import { toast } from "react-toastify";
import Button from "../../../components/Button";
import SelectBox from "../../../components/SelectBox";
import Pagination from "../../../components/Pagination";
import usePaginatedList from "../../../hooks/usePaginatedList";
import studentService from "../services/studentService";
import classSectionService from "../services/classSectionService";
import academicYearService from "../services/academicYearService";
import promotionService from "../services/promotionService";

// Layout matches "Admin Web.dc.html" screen 3 (year-end promotion), now
// wired to the real PromotionBatch workflow: create a draft batch for the
// academic-year pair, then POST .../run/ with a single from->to class
// mapping plus per-student outcome overrides. The backend processes every
// *active* student in the "from" class section server-side (not just the
// page currently loaded here) — anyone not flagged hold/exclude defaults to
// "promoted", so pagination only limits how many rows staff can review/flag
// per screen, not which students actually get processed.

const asList = (data) => (Array.isArray(data) ? data : data?.results || []);

const initialsOf = (name = "") =>
  name.split(" ").filter(Boolean).map((n) => n[0]).join("").toUpperCase().slice(0, 2) || "?";

const ACTIONS = [
  { key: "promote", label: "Promote", tone: "success", outcome: null },
  { key: "hold", label: "Hold · re-exam", tone: "warning", outcome: "re_exam_hold" },
  { key: "exclude", label: "Exclude · transferred", tone: "error", outcome: "transferred_excluded" },
];

const OUTCOME_LABELS = {
  promoted: "Promoted",
  re_exam_hold: "Held for re-exam",
  transferred_excluded: "Transferred / excluded",
};

const PromoteClass = () => {
  const [classSections, setClassSections] = useState([]);
  const [academicYears, setAcademicYears] = useState([]);
  const [fromClass, setFromClass] = useState("");
  const [toClass, setToClass] = useState("");
  const [academicYearFrom, setAcademicYearFrom] = useState("");
  const [academicYearTo, setAcademicYearTo] = useState("");
  const [rowActions, setRowActions] = useState({});
  const [promoting, setPromoting] = useState(false);
  const [reverting, setReverting] = useState(false);
  const [lastBatch, setLastBatch] = useState(null); // {id, is_revertible, records: [...]}

  const {
    items: students,
    page,
    setPage,
    totalPages,
    count,
    pageSize,
    loading,
    refetch: refetchStudents,
  } = usePaginatedList(studentService.getStudents, { class_section: fromClass || 0 });

  useEffect(() => {
    const load = async () => {
      try {
        const [csRes, ayRes] = await Promise.all([
          classSectionService.getClassSections(),
          academicYearService.getAcademicYears(),
        ]);
        const csList = asList(csRes.data);
        setClassSections(csList);
        if (csList.length > 0) setFromClass(String(csList[0].id));
        if (csList.length > 1) setToClass(String(csList[1].id));

        const ayList = asList(ayRes.data);
        setAcademicYears(ayList);
        const current = ayList.find((y) => y.is_current) || ayList[0];
        const nextYear = ayList.find((y) => y.id !== current?.id);
        if (current) setAcademicYearFrom(String(current.id));
        if (nextYear) setAcademicYearTo(String(nextYear.id));
      } catch (err) {
        console.error("Failed to load promotion setup data:", err);
        toast.error("Failed to load class sections / academic years.");
      }
    };
    load();
  }, []);

  // Seed newly-loaded rows to "promote" without clobbering choices already
  // made on a previously-visited page of the same class.
  useEffect(() => {
    setRowActions((prev) => {
      const next = { ...prev };
      students.forEach((s) => {
        if (!(s.id in next)) next[s.id] = "promote";
      });
      return next;
    });
  }, [students]);

  useEffect(() => {
    setRowActions({});
    setLastBatch(null);
  }, [fromClass]);

  const classSectionOptions = useMemo(
    () =>
      classSections.map((cs) => ({
        label: cs.name || `Class ${cs.grade ?? "?"} - ${cs.section ?? "?"}`,
        value: String(cs.id),
      })),
    [classSections]
  );

  const academicYearOptions = useMemo(
    () => academicYears.map((y) => ({ label: y.name, value: String(y.id) })),
    [academicYears]
  );

  const cycleAction = (studentId) => {
    setRowActions((prev) => {
      const currentIdx = ACTIONS.findIndex((a) => a.key === prev[studentId]);
      const next = ACTIONS[(currentIdx + 1) % ACTIONS.length];
      return { ...prev, [studentId]: next.key };
    });
  };

  const counts = ACTIONS.reduce((acc, a) => {
    acc[a.key] = Object.values(rowActions).filter((v) => v === a.key).length;
    return acc;
  }, {});

  const recordByStudentId = useMemo(() => {
    const map = {};
    (lastBatch?.records || []).forEach((r) => {
      map[r.student] = r;
    });
    return map;
  }, [lastBatch]);

  const handlePromote = async () => {
    if (!toClass) {
      toast.error("Pick a destination class first.");
      return;
    }
    if (!academicYearFrom || !academicYearTo) {
      toast.error("Pick both academic years first.");
      return;
    }
    setPromoting(true);
    try {
      const batchRes = await promotionService.createBatch({ academicYearFrom, academicYearTo });
      const batchId = batchRes.data?.id;

      const outcomes = {};
      Object.entries(rowActions).forEach(([studentId, actionKey]) => {
        const action = ACTIONS.find((a) => a.key === actionKey);
        if (action?.outcome) outcomes[studentId] = { outcome: action.outcome };
      });

      const runRes = await promotionService.runBatch(batchId, {
        mappings: [{ from_class_section: Number(fromClass), to_class_section: Number(toClass) }],
        outcomes,
      });

      const summary = runRes.data?.summary || {};
      setLastBatch(runRes.data?.batch || null);
      toast.success(
        `Batch complete — ${summary.promoted || 0} promoted, ${summary.re_exam_hold || 0} held, ` +
          `${summary.transferred_excluded || 0} excluded, ${summary.invoices_generated || 0} invoice(s) generated.`
      );
      refetchStudents();
    } catch (err) {
      console.error("Failed to run promotion batch:", err);
      toast.error(err?.response?.data?.error || "Failed to run promotion batch.");
    } finally {
      setPromoting(false);
    }
  };

  const handleRevert = async () => {
    if (!lastBatch?.id) return;
    setReverting(true);
    try {
      await promotionService.revertBatch(lastBatch.id);
      toast.success("Batch reverted — students restored to their previous class.");
      setLastBatch(null);
      refetchStudents();
    } catch (err) {
      console.error("Failed to revert batch:", err);
      toast.error(err?.response?.data?.error || "Failed to revert batch.");
    } finally {
      setReverting(false);
    }
  };

  return (
    <div className="w-full">
      <div className="flex items-center gap-3 pb-4 border-b border-cn-border mb-6 flex-wrap">
        <div className="min-w-0">
          <h1 className="font-heading font-bold text-2xl text-violet-950">Promote class · year-end</h1>
          <span className="inline-block mt-1 bg-success-tint text-success-hex border border-green-200 rounded-lg px-2.5 py-1 text-[11.5px] font-bold">
            Real promotion batch · roll renumbering · 7-day revert window
          </span>
        </div>
        {lastBatch?.is_revertible && (
          <Button variant="destructive" onClick={handleRevert} loading={reverting}>
            Revert last batch
          </Button>
        )}
      </div>

      <div className="flex flex-col gap-5">
        {/* Academic year row */}
        <div className="bg-cn-surface border border-cn-border rounded-2xl p-5 flex flex-col md:flex-row items-center gap-4">
          <div className="flex-1 w-full">
            <div className="text-[11.5px] font-bold text-ink-500 tracking-wide mb-1.5">ACADEMIC YEAR FROM</div>
            <SelectBox fieldName="ay_from" value={academicYearFrom} onChange={(e) => setAcademicYearFrom(e.target.value)} options={academicYearOptions} />
          </div>
          <div className="w-11 h-11 rounded-full bg-violet-100 text-violet-700 flex items-center justify-center text-lg font-extrabold shrink-0 mt-5">
            →
          </div>
          <div className="flex-1 w-full">
            <div className="text-[11.5px] font-bold text-ink-500 tracking-wide mb-1.5">ACADEMIC YEAR TO</div>
            <SelectBox fieldName="ay_to" value={academicYearTo} onChange={(e) => setAcademicYearTo(e.target.value)} options={academicYearOptions} />
          </div>
        </div>

        {/* Class mapping row */}
        <div className="bg-cn-surface border border-cn-border rounded-2xl p-5 flex flex-col md:flex-row items-center gap-4">
          <div className="flex-1 w-full">
            <div className="text-[11.5px] font-bold text-ink-500 tracking-wide mb-1.5">FROM CLASS</div>
            <SelectBox fieldName="from_class" value={fromClass} onChange={(e) => setFromClass(e.target.value)} options={classSectionOptions} />
          </div>
          <div className="w-11 h-11 rounded-full bg-violet-700 text-white flex items-center justify-center text-lg font-extrabold shrink-0 mt-5">
            →
          </div>
          <div className="flex-1 w-full">
            <div className="text-[11.5px] font-bold text-ink-500 tracking-wide mb-1.5">TO CLASS</div>
            <SelectBox fieldName="to_class" value={toClass} onChange={(e) => setToClass(e.target.value)} options={classSectionOptions} />
          </div>
        </div>

        {/* Student table */}
        <div className="bg-cn-surface border border-cn-border rounded-2xl overflow-hidden flex flex-col">
          <div className="grid grid-cols-[1.6fr_1fr_1.2fr] gap-3 px-5 py-3 border-b border-cn-border text-[11px] font-extrabold text-ink-500 tracking-wide">
            <div>STUDENT</div>
            <div>RESULT</div>
            <div>ACTION (click to cycle)</div>
          </div>
          <div className="max-h-[420px] overflow-y-auto custom-scrollbar-light">
            {loading && <div className="text-center text-ink-400 text-sm py-8">Loading roster…</div>}
            {!loading && students.length === 0 && (
              <div className="text-center text-ink-400 text-sm py-8">No students in this class.</div>
            )}
            {students.map((s) => {
              const action = ACTIONS.find((a) => a.key === rowActions[s.id]) || ACTIONS[0];
              const toneClasses = {
                success: "bg-success-tint border-green-200 text-success-hex",
                warning: "bg-warning-tint border-amber-200 text-warning-hex",
                error: "bg-error-tint border-red-200 text-error-hex",
              };
              const record = recordByStudentId[s.id];
              return (
                <div key={s.id} className="grid grid-cols-[1.6fr_1fr_1.2fr] gap-3 px-5 py-3 border-b border-cn-border last:border-b-0 items-center">
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div
                      className="w-8 h-8 rounded-[10px] flex items-center justify-center font-bold text-white text-xs shrink-0"
                      style={{ background: "linear-gradient(135deg, #7C3AED, #A78BFA)" }}
                    >
                      {initialsOf(s.full_name || s.name)}
                    </div>
                    <span className="text-[13.5px] font-bold text-ink-900 truncate">{s.full_name || s.name}</span>
                  </div>
                  <div className="text-[12.5px] font-semibold text-ink-500">
                    {record ? `${OUTCOME_LABELS[record.outcome] || record.outcome}${record.new_roll_number ? ` · Roll ${record.new_roll_number}` : ""}` : "—"}
                  </div>
                  <button
                    type="button"
                    onClick={() => cycleAction(s.id)}
                    className={`inline-flex justify-self-start items-center gap-1 rounded-lg px-2.5 py-1.5 text-[11.5px] font-extrabold border cursor-pointer transition ${toneClasses[action.tone]}`}
                  >
                    {action.label.toUpperCase()}
                  </button>
                </div>
              );
            })}
          </div>
          <Pagination page={page} totalPages={totalPages} count={count} pageSize={pageSize} onPageChange={setPage} loading={loading} />

          <div className="border-t border-cn-border px-5 py-3.5 flex items-center gap-4 bg-cn-bg flex-wrap">
            <div className="text-[13px] text-ink-500">
              <b className="text-ink-900">{counts.promote || 0} promote</b> (this page) · {counts.hold || 0} hold · {counts.exclude || 0} exclude
              <span className="block text-[11.5px] text-ink-400 mt-0.5">
                Every active student in the class is processed — anyone not flagged hold/exclude defaults to promoted.
              </span>
            </div>
            <div className="flex-1" />
            <Button variant="primary" onClick={handlePromote} loading={promoting}>
              Run promotion batch →
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PromoteClass;
