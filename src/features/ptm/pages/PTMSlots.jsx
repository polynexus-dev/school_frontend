import React, { useEffect, useMemo, useState } from "react";
import { toast } from "react-toastify";
import { Plus, Trash2, CalendarCheck2, X } from "lucide-react";
import Button from "../../../components/Button";
import Modal from "../../../components/Modal";
import SelectBox from "../../../components/SelectBox";
import BlackInputField from "../../../components/BlackInputField";
import ptmService from "../services/ptmService";
import messagingService from "../../messaging/services/messagingService";
import useUser from "../../auth/hooks/useUser";

const asList = (data) => (Array.isArray(data) ? data : data?.results || []);
const emptyForm = { date: "", start_time: "", end_time: "" };

const PTMSlots = () => {
  const { user } = useUser();
  const roleName = user?.data?.role || "Admin";
  const isTeacher = roleName === "Teacher";
  const isParent = roleName === "Parent";

  // Teacher state
  const [mySlots, setMySlots] = useState([]);
  const [loadingMySlots, setLoadingMySlots] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);

  // Parent state
  const [children, setChildren] = useState([]);
  const [teachers, setTeachers] = useState([]);
  const [selectedChild, setSelectedChild] = useState("");
  const [selectedTeacher, setSelectedTeacher] = useState("");
  const [availableSlots, setAvailableSlots] = useState([]);
  const [myBookings, setMyBookings] = useState([]);
  const [loadingSlots, setLoadingSlots] = useState(false);
  const [actingId, setActingId] = useState(null);

  const loadMySlots = async () => {
    setLoadingMySlots(true);
    try {
      const res = await ptmService.getSlots({ teacher: user?.data?.user?.id });
      setMySlots(asList(res.data));
    } catch (err) {
      console.error("Failed to load PTM slots:", err);
      toast.error("Failed to load your PTM slots.");
    } finally {
      setLoadingMySlots(false);
    }
  };

  useEffect(() => {
    if (isTeacher) loadMySlots();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (!isParent) return;
    (async () => {
      try {
        const res = await messagingService.getMyChildren();
        setChildren(asList(res.data));
      } catch (err) {
        console.error("Failed to load children:", err);
        toast.error("Failed to load your linked children.");
      }
    })();
  }, [isParent]);

  const handleChildChange = async (studentId) => {
    setSelectedChild(studentId);
    setSelectedTeacher("");
    setAvailableSlots([]);
    setTeachers([]);
    setMyBookings([]);
    if (!studentId) return;
    try {
      const res = await messagingService.getEligibleTeachers(studentId);
      setTeachers(res.data);
    } catch (err) {
      console.error("Failed to load eligible teachers:", err);
      toast.error("Failed to load teachers for this child.");
    }
  };

  const loadSlotsForTeacher = async (studentId, teacherId) => {
    setLoadingSlots(true);
    try {
      const [availableRes, allRes] = await Promise.all([
        ptmService.getSlots({ student: studentId, teacher: teacherId, available_only: "true" }),
        ptmService.getSlots({ student: studentId, teacher: teacherId }),
      ]);
      setAvailableSlots(asList(availableRes.data));
      setMyBookings(asList(allRes.data).filter((s) => s.booking));
    } catch (err) {
      console.error("Failed to load PTM slots:", err);
      toast.error("Failed to load PTM slots.");
    } finally {
      setLoadingSlots(false);
    }
  };

  const handleTeacherChange = (teacherId) => {
    setSelectedTeacher(teacherId);
    if (teacherId) loadSlotsForTeacher(selectedChild, teacherId);
  };

  const handleAddSlot = async () => {
    if (!form.date || !form.start_time || !form.end_time) {
      toast.error("Date, start time and end time are all required.");
      return;
    }
    setSaving(true);
    try {
      await ptmService.createSlot(form);
      toast.success("Availability added.");
      setShowAddModal(false);
      setForm(emptyForm);
      loadMySlots();
    } catch (err) {
      console.error("Failed to add PTM slot:", err);
      toast.error(err?.response?.data?.non_field_errors?.[0] || "Failed to add availability — check for a clash.");
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteSlot = async (slot) => {
    if (!window.confirm("Remove this availability slot?")) return;
    try {
      await ptmService.deleteSlot(slot.id);
      toast.success("Slot removed.");
      loadMySlots();
    } catch (err) {
      console.error("Failed to delete slot:", err);
      toast.error(err?.response?.data?.error || "Failed to remove slot.");
    }
  };

  const handleTeacherCancel = async (slot) => {
    if (!window.confirm("Cancel this booking?")) return;
    setActingId(slot.id);
    try {
      await ptmService.cancelSlot(slot.id);
      toast.success("Booking cancelled.");
      loadMySlots();
    } catch (err) {
      console.error("Failed to cancel booking:", err);
      toast.error("Failed to cancel booking.");
    } finally {
      setActingId(null);
    }
  };

  const handleBook = async (slot) => {
    setActingId(slot.id);
    try {
      await ptmService.bookSlot(slot.id, Number(selectedChild));
      toast.success("Slot booked.");
      loadSlotsForTeacher(selectedChild, selectedTeacher);
    } catch (err) {
      console.error("Failed to book slot:", err);
      toast.error(err?.response?.data?.error || err?.response?.data?.student?.[0] || "Failed to book slot.");
    } finally {
      setActingId(null);
    }
  };

  const handleParentCancel = async (slot) => {
    if (!window.confirm("Cancel this meeting?")) return;
    setActingId(slot.id);
    try {
      await ptmService.cancelSlot(slot.id);
      toast.success("Meeting cancelled.");
      loadSlotsForTeacher(selectedChild, selectedTeacher);
    } catch (err) {
      console.error("Failed to cancel meeting:", err);
      toast.error("Failed to cancel meeting.");
    } finally {
      setActingId(null);
    }
  };

  const childOptions = useMemo(
    () => children.map((link) => ({ label: link.student_name || link.student_detail?.full_name, value: String(link.student) })),
    [children]
  );
  const teacherOptions = useMemo(() => teachers.map((t) => ({ label: t.name, value: String(t.id) })), [teachers]);

  if (isParent) {
    return (
      <div className="w-full">
        <div className="pb-4 border-b border-cn-border mb-6">
          <h1 className="font-heading font-bold text-2xl text-violet-950">Parent-Teacher Meetings</h1>
          <p className="text-ink-500 text-[13px] mt-1">Book a slot with your child's teacher</p>
        </div>

        <div className="flex gap-3 mb-6">
          <SelectBox className="w-56" label="Child" fieldName="student" value={selectedChild} onChange={(e) => handleChildChange(e.target.value)} options={childOptions} />
          <SelectBox
            className="w-56"
            label="Teacher"
            fieldName="teacher"
            value={selectedTeacher}
            onChange={(e) => handleTeacherChange(e.target.value)}
            options={teachers.length ? teacherOptions : [{ label: "Pick a child first", value: "" }]}
          />
        </div>

        {selectedTeacher && (
          <>
            {myBookings.length > 0 && (
              <div className="mb-6">
                <h2 className="font-heading font-semibold text-base text-ink-900 mb-3">Your upcoming meeting</h2>
                <div className="flex flex-col gap-2">
                  {myBookings.map((s) => (
                    <div key={s.id} className="flex items-center justify-between border border-cn-border rounded-xl px-4 py-3 bg-violet-50/40">
                      <div className="flex items-center gap-2 text-[13px] font-semibold text-ink-900">
                        <CalendarCheck2 size={15} className="text-violet-700" />
                        {s.date} · {s.start_time}–{s.end_time}
                      </div>
                      <button type="button" onClick={() => handleParentCancel(s)} disabled={actingId === s.id} className="text-[12px] font-bold text-error-hex hover:underline cursor-pointer">
                        Cancel
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <h2 className="font-heading font-semibold text-base text-ink-900 mb-3">Available slots</h2>
            {loadingSlots ? (
              <p className="text-ink-400 text-[13px]">Loading…</p>
            ) : availableSlots.length === 0 ? (
              <p className="text-ink-400 text-[13px]">No open slots right now.</p>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {availableSlots.map((s) => (
                  <div key={s.id} className="border border-cn-border rounded-xl px-4 py-3 flex items-center justify-between bg-cn-surface">
                    <div className="text-[13px] font-semibold text-ink-900">
                      {s.date}
                      <div className="text-[12px] text-ink-500 font-normal">{s.start_time}–{s.end_time}</div>
                    </div>
                    <Button variant="primary" size="compact" onClick={() => handleBook(s)} loading={actingId === s.id}>
                      Book
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </>
        )}
      </div>
    );
  }

  return (
    <div className="w-full">
      <div className="flex items-center gap-3 pb-4 border-b border-cn-border mb-6 flex-wrap">
        <div className="flex-1 min-w-0">
          <h1 className="font-heading font-bold text-2xl text-violet-950">Parent-Teacher Meetings</h1>
          <p className="text-ink-500 text-[13px] mt-1">{isTeacher ? "Your availability for parent meetings" : "Every teacher's PTM slots"}</p>
        </div>
        {isTeacher && (
          <Button variant="primary" icon={<Plus size={16} />} onClick={() => setShowAddModal(true)}>
            Add availability
          </Button>
        )}
      </div>

      {loadingMySlots ? (
        <p className="text-ink-400 text-[13px]">Loading…</p>
      ) : mySlots.length === 0 ? (
        <p className="text-ink-400 text-[13px]">No slots yet.</p>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {mySlots.map((s) => (
            <div key={s.id} className="border border-cn-border rounded-xl px-4 py-3 bg-cn-surface">
              <div className="flex items-start justify-between">
                <div className="text-[13px] font-semibold text-ink-900">
                  {s.date}
                  <div className="text-[12px] text-ink-500 font-normal">{s.start_time}–{s.end_time}</div>
                </div>
                {s.is_booked ? (
                  <button type="button" onClick={() => handleTeacherCancel(s)} disabled={actingId === s.id} className="text-error-hex hover:opacity-70 cursor-pointer" title="Cancel booking">
                    <X size={16} />
                  </button>
                ) : (
                  <button type="button" onClick={() => handleDeleteSlot(s)} className="text-ink-400 hover:text-error-hex cursor-pointer" title="Remove slot">
                    <Trash2 size={15} />
                  </button>
                )}
              </div>
              {s.is_booked && s.booking && (
                <div className="mt-2 pt-2 border-t border-cn-border text-[12px] text-violet-700 font-semibold">
                  Booked by {s.booking.guardian_name} (re: {s.booking.student_name})
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      <Modal isOpen={showAddModal} onClose={() => setShowAddModal(false)} title="Add availability">
        <div className="flex flex-col gap-3 w-[300px] max-w-full">
          <BlackInputField label="Date" fieldName="date" type="date" value={form.date} onChange={(e) => setForm((p) => ({ ...p, date: e.target.value }))} required />
          <div className="flex gap-3">
            <BlackInputField label="Start time" fieldName="start_time" type="time" value={form.start_time} onChange={(e) => setForm((p) => ({ ...p, start_time: e.target.value }))} required />
            <BlackInputField label="End time" fieldName="end_time" type="time" value={form.end_time} onChange={(e) => setForm((p) => ({ ...p, end_time: e.target.value }))} required />
          </div>
          <div className="flex gap-3 justify-end pt-2">
            <Button variant="outline" onClick={() => setShowAddModal(false)}>
              Cancel
            </Button>
            <Button variant="primary" onClick={handleAddSlot} loading={saving}>
              Save
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default PTMSlots;
