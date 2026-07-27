import React, { useEffect, useMemo, useState } from "react";
import { toast } from "react-toastify";
import { Plus } from "lucide-react";
import Button from "../../../components/Button";
import Modal from "../../../components/Modal";
import SelectBox from "../../../components/SelectBox";
import timetableService from "../services/timetableService";
import classSectionService from "../../students/services/classSectionService";
import subjectService from "../services/subjectService";
import api from "../../../services/api";
import useUser from "../../auth/hooks/useUser";

const asList = (data) => (Array.isArray(data) ? data : data?.results || []);
const classSectionLabel = (cs) => cs?.name || `Class ${cs?.grade ?? "?"} - ${cs?.section ?? "?"}`;

const DAYS = [
  { value: 0, label: "Monday" },
  { value: 1, label: "Tuesday" },
  { value: 2, label: "Wednesday" },
  { value: 3, label: "Thursday" },
  { value: 4, label: "Friday" },
  { value: 5, label: "Saturday" },
];
const PERIODS = [1, 2, 3, 4, 5, 6, 7, 8];

const emptyForm = { id: null, subject: "", teacher: "", start_time: "", end_time: "", room: "" };

const Timetable = () => {
  const { user } = useUser();
  const roleName = user?.data?.role || "Admin";
  const isAdmin = !["Teacher", "Parent", "Conductor", "Student"].includes(roleName);
  const isStudent = roleName === "Student";
  const ownClassSectionId = user?.data?.class_section_id;
  // Subjects/teachers only drive the add/edit-period form (Admin-only) — a
  // Teacher can still read them, but Parent/Student never need to and the
  // endpoints are Teacher+-only, so skip the calls rather than 403.
  const canReadStaffLists = isAdmin || roleName === "Teacher";

  const [classSections, setClassSections] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [teachers, setTeachers] = useState([]);
  const [classSection, setClassSection] = useState("");
  const [slots, setSlots] = useState([]);
  const [loading, setLoading] = useState(false);

  const [modalCell, setModalCell] = useState(null); // {day, period, existing}
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const load = async () => {
      try {
        const csRes = await classSectionService.getClassSections();
        const csList = asList(csRes.data);
        setClassSections(csList);
        if (isStudent && ownClassSectionId) {
          setClassSection(String(ownClassSectionId));
        } else if (csList.length > 0) {
          setClassSection(String(csList[0].id));
        }
      } catch (err) {
        console.error("Failed to load class sections:", err);
        toast.error("Failed to load classes.");
      }

      if (!canReadStaffLists) return;
      try {
        const [subRes, teachersRes] = await Promise.all([subjectService.getSubjects(), api.get("teachers/")]);
        setSubjects(asList(subRes.data));
        setTeachers(asList(teachersRes.data));
      } catch (err) {
        console.error("Failed to load subjects / teachers:", err);
        toast.error("Failed to load subjects / teachers.");
      }
    };
    load();
    // RoleRoute blocks rendering until `user` is loaded, so isStudent/
    // ownClassSectionId are already correct on this first (only) run.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const fetchSlots = async () => {
    if (!classSection) return;
    setLoading(true);
    try {
      const res = await timetableService.getSlots({ class_section: classSection });
      setSlots(asList(res.data));
    } catch (err) {
      console.error("Failed to load timetable:", err);
      toast.error("Failed to load timetable.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSlots();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [classSection]);

  const classSectionOptions = useMemo(() => classSections.map((cs) => ({ label: classSectionLabel(cs), value: String(cs.id) })), [classSections]);
  const subjectOptions = useMemo(() => subjects.map((s) => ({ label: s.name, value: String(s.id) })), [subjects]);
  const teacherOptions = useMemo(
    () => teachers.map((t) => ({ label: [t.user_detail?.first_name, t.user_detail?.last_name].filter(Boolean).join(" ") || t.user_detail?.username, value: String(t.user) })),
    [teachers]
  );

  const slotAt = (day, period) => slots.find((s) => s.day_of_week === day && s.period_number === period);

  const openCell = (day, period) => {
    if (!isAdmin) return;
    const existing = slotAt(day, period);
    setModalCell({ day, period, existing });
    setForm(
      existing
        ? { id: existing.id, subject: String(existing.subject), teacher: existing.teacher ? String(existing.teacher) : "", start_time: existing.start_time, end_time: existing.end_time, room: existing.room || "" }
        : emptyForm
    );
  };

  const handleDelete = async () => {
    if (!modalCell?.existing) return;
    if (!window.confirm("Remove this timetable slot?")) return;
    try {
      await timetableService.deleteSlot(modalCell.existing.id);
      toast.success("Slot removed.");
      setModalCell(null);
      fetchSlots();
    } catch (err) {
      console.error("Failed to delete slot:", err);
      toast.error(err?.response?.data?.error || "Failed to delete slot.");
    }
  };

  const handleSubmit = async () => {
    if (!form.subject || !form.start_time || !form.end_time) {
      toast.error("Subject, start time and end time are required.");
      return;
    }
    setSaving(true);
    try {
      const payload = {
        class_section: Number(classSection),
        day_of_week: modalCell.day,
        period_number: modalCell.period,
        subject: Number(form.subject),
        teacher: form.teacher ? Number(form.teacher) : null,
        start_time: form.start_time,
        end_time: form.end_time,
        room: form.room || null,
      };
      if (modalCell.existing) {
        await timetableService.updateSlot(modalCell.existing.id, payload);
        toast.success("Slot updated.");
      } else {
        await timetableService.createSlot(payload);
        toast.success("Slot added.");
      }
      setModalCell(null);
      fetchSlots();
    } catch (err) {
      console.error("Failed to save slot:", err);
      toast.error(err?.response?.data?.error || err?.response?.data?.non_field_errors?.[0] || "Failed to save slot — check for a clash.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="w-full">
      <div className="flex items-center gap-3 pb-4 border-b border-cn-border mb-6 flex-wrap">
        <div className="flex-1 min-w-0">
          <h1 className="font-heading font-bold text-2xl text-violet-950">Timetable</h1>
          <p className="text-ink-500 text-[13px] mt-1">
            {isStudent ? "Your class schedule" : `Weekly class schedule${isAdmin ? " — click an empty cell to add a period" : ""}`}
          </p>
        </div>
        {!isStudent && (
          <SelectBox className="w-56" label="Class & Section" fieldName="class_section" value={classSection} onChange={(e) => setClassSection(e.target.value)} options={classSectionOptions} />
        )}
      </div>

      {loading ? (
        <p className="text-center text-ink-400 text-sm py-16">Loading…</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full border-collapse min-w-[900px]">
            <thead>
              <tr>
                <th className="text-left text-[11.5px] font-bold text-ink-400 p-2 w-16">PERIOD</th>
                {DAYS.map((d) => (
                  <th key={d.value} className="text-left text-[11.5px] font-bold text-ink-400 p-2">
                    {d.label.toUpperCase()}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {PERIODS.map((period) => (
                <tr key={period}>
                  <td className="p-2 text-[13px] font-bold text-ink-700 align-top">P{period}</td>
                  {DAYS.map((d) => {
                    const slot = slotAt(d.value, period);
                    return (
                      <td key={d.value} className="p-1.5 align-top">
                        <div
                          onClick={() => openCell(d.value, period)}
                          className={`rounded-xl border p-2.5 min-h-[64px] ${
                            slot ? "bg-violet-50 border-violet-200" : "bg-cn-surface border-dashed border-cn-border"
                          } ${isAdmin ? "cursor-pointer hover:border-violet-400" : ""}`}
                        >
                          {slot ? (
                            <>
                              <div className="text-[12.5px] font-semibold text-ink-900">{slot.subject_name}</div>
                              <div className="text-[11px] text-ink-500 mt-0.5">{slot.teacher_name || "—"}</div>
                              <div className="text-[10.5px] text-ink-400 mt-0.5">
                                {slot.start_time}–{slot.end_time} {slot.room ? `· ${slot.room}` : ""}
                              </div>
                            </>
                          ) : (
                            isAdmin && <Plus size={14} className="text-ink-300" />
                          )}
                        </div>
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <Modal isOpen={!!modalCell} onClose={() => setModalCell(null)} title={modalCell?.existing ? "Edit period" : "Add period"}>
        <div className="flex flex-col gap-3 w-[340px] max-w-full">
          <SelectBox label="Subject" fieldName="subject" value={form.subject} onChange={(e) => setForm((p) => ({ ...p, subject: e.target.value }))} options={subjectOptions} />
          <SelectBox label="Teacher (optional)" fieldName="teacher" value={form.teacher} onChange={(e) => setForm((p) => ({ ...p, teacher: e.target.value }))} options={[{ label: "— None —", value: "" }, ...teacherOptions]} />
          <div className="flex gap-3">
            <div className="flex-1">
              <label className="block text-sm font-medium mb-1 text-dark">Start time</label>
              <input type="time" value={form.start_time} onChange={(e) => setForm((p) => ({ ...p, start_time: e.target.value }))} className="w-full px-3 py-2 border border-slate-300 rounded-md bg-transparent text-[0.85rem] text-dark outline-none focus:border-violet-500" />
            </div>
            <div className="flex-1">
              <label className="block text-sm font-medium mb-1 text-dark">End time</label>
              <input type="time" value={form.end_time} onChange={(e) => setForm((p) => ({ ...p, end_time: e.target.value }))} className="w-full px-3 py-2 border border-slate-300 rounded-md bg-transparent text-[0.85rem] text-dark outline-none focus:border-violet-500" />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium mb-1 text-dark">Room (optional)</label>
            <input value={form.room} onChange={(e) => setForm((p) => ({ ...p, room: e.target.value }))} className="w-full px-4 py-2 border border-slate-300 rounded-md bg-transparent text-[0.85rem] text-dark outline-none focus:border-violet-500" />
          </div>
          <div className="flex gap-3 justify-between pt-2">
            {modalCell?.existing ? (
              <Button variant="destructive" onClick={handleDelete}>
                Remove
              </Button>
            ) : (
              <span />
            )}
            <div className="flex gap-3">
              <Button variant="outline" onClick={() => setModalCell(null)}>
                Cancel
              </Button>
              <Button variant="primary" onClick={handleSubmit} loading={saving}>
                Save
              </Button>
            </div>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default Timetable;
