import React, { useEffect, useMemo, useState } from "react";
import { toast } from "react-toastify";
import Button from "../../../components/Button";
import SelectBox from "../../../components/SelectBox";
import studentService from "../services/studentService";
import classSectionService from "../services/classSectionService";

// Scaffold page — layout matches "Admin Web.dc.html" screen 3 (year-end
// promotion). There is no dedicated PromotionBatch/PromotionRecord endpoint
// in the confirmed contract yet (per the plan, that workflow is a stubbed
// backend piece for a follow-up pass), so "Promote" here does the one thing
// it safely CAN do with the confirmed endpoints: bulk-update each promoted
// student's class_section via PUT /api/students/{id}/. Roll renumbering,
// reversibility, and carry-over of bus stop/fee plan/guardian links still
// need the real promotion endpoint — TODO once it exists.

const asList = (data) => (Array.isArray(data) ? data : data?.results || []);

const initialsOf = (name = "") =>
  name.split(" ").filter(Boolean).map((n) => n[0]).join("").toUpperCase().slice(0, 2) || "?";

const ACTIONS = [
  { key: "promote", label: "Promote", tone: "success" },
  { key: "hold", label: "Hold · decide later", tone: "warning" },
  { key: "exclude", label: "Exclude · transferred", tone: "error" },
];

const PromoteClass = () => {
  const [classSections, setClassSections] = useState([]);
  const [fromClass, setFromClass] = useState("");
  const [toClass, setToClass] = useState("");
  const [students, setStudents] = useState([]);
  const [rowActions, setRowActions] = useState({});
  const [loading, setLoading] = useState(true);
  const [promoting, setPromoting] = useState(false);

  useEffect(() => {
    const load = async () => {
      try {
        const res = await classSectionService.getClassSections();
        const list = asList(res.data);
        setClassSections(list);
        if (list.length > 0) setFromClass(String(list[0].id));
        if (list.length > 1) setToClass(String(list[1].id));
      } catch (err) {
        console.error("Failed to load class sections:", err);
      }
    };
    load();
  }, []);

  useEffect(() => {
    if (!fromClass) return;
    const loadStudents = async () => {
      setLoading(true);
      try {
        const res = await studentService.getStudents({ class_section: fromClass });
        const list = asList(res.data);
        setStudents(list);
        setRowActions(Object.fromEntries(list.map((s) => [s.id, "promote"])));
      } catch (err) {
        console.error("Failed to load students for promotion:", err);
        toast.error("Failed to load class roster.");
      } finally {
        setLoading(false);
      }
    };
    loadStudents();
  }, [fromClass]);

  const classSectionOptions = useMemo(
    () =>
      classSections.map((cs) => ({
        label: cs.name || `Class ${cs.grade ?? "?"} - ${cs.section ?? "?"}`,
        value: String(cs.id),
      })),
    [classSections]
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

  const handlePromote = async () => {
    if (!toClass) {
      toast.error("Pick a destination class first.");
      return;
    }
    const toPromote = students.filter((s) => rowActions[s.id] === "promote");
    if (toPromote.length === 0) {
      toast.error("No students marked for promotion.");
      return;
    }

    setPromoting(true);
    let succeeded = 0;
    for (const student of toPromote) {
      try {
        await studentService.updateStudent(student.id, { class_section: Number(toClass) });
        succeeded += 1;
      } catch (err) {
        console.error(`Failed to promote student ${student.id}:`, err);
      }
    }
    setPromoting(false);

    if (succeeded === toPromote.length) {
      toast.success(`Promoted ${succeeded} student(s) to the new class.`);
    } else {
      toast.warning(`Promoted ${succeeded} of ${toPromote.length} — some updates failed, please retry.`);
    }
    // Refresh the roster for the (now largely empty) "from" class.
    const res = await studentService.getStudents({ class_section: fromClass });
    const list = asList(res.data);
    setStudents(list);
    setRowActions(Object.fromEntries(list.map((s) => [s.id, "promote"])));
  };

  return (
    <div className="w-full">
      <div className="flex items-center gap-3 pb-4 border-b border-cn-border mb-6 flex-wrap">
        <div className="min-w-0">
          <h1 className="font-heading font-bold text-2xl text-violet-950">Promote class · year-end</h1>
          <span className="inline-block mt-1 bg-warning-tint text-warning-hex border border-amber-200 rounded-lg px-2.5 py-1 text-[11.5px] font-bold">
            Bulk class_section update · full reversible workflow pending backend
          </span>
        </div>
      </div>

      <div className="flex flex-col gap-5">
        {/* Mapping row */}
        <div className="bg-cn-surface border border-cn-border rounded-2xl p-5 flex flex-col md:flex-row items-center gap-4">
          <div className="flex-1 w-full">
            <div className="text-[11.5px] font-bold text-ink-500 tracking-wide mb-1.5">FROM</div>
            <SelectBox fieldName="from_class" value={fromClass} onChange={(e) => setFromClass(e.target.value)} options={classSectionOptions} />
          </div>
          <div className="w-11 h-11 rounded-full bg-violet-700 text-white flex items-center justify-center text-lg font-extrabold shrink-0 mt-5">
            →
          </div>
          <div className="flex-1 w-full">
            <div className="text-[11.5px] font-bold text-ink-500 tracking-wide mb-1.5">TO</div>
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
                  <div className="text-[12.5px] font-semibold text-ink-500">— (results not in contract)</div>
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

          <div className="border-t border-cn-border px-5 py-3.5 flex items-center gap-4 bg-cn-bg flex-wrap">
            <div className="text-[13px] text-ink-500">
              <b className="text-ink-900">{counts.promote || 0} promote</b> · {counts.hold || 0} hold · {counts.exclude || 0} exclude
            </div>
            <div className="flex-1" />
            <Button variant="primary" onClick={handlePromote} loading={promoting}>
              Promote {counts.promote || 0} students →
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PromoteClass;
