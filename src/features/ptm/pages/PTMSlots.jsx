import React, { useEffect, useMemo, useState } from "react";
import { toast } from "react-toastify";
import { Plus, Trash2, CalendarCheck2, X, Filter, UserCheck, Calendar } from "lucide-react";
import Button from "../../../components/Button";
import Modal from "../../../components/Modal";
import SelectBox from "../../../components/SelectBox";
import BlackInputField from "../../../components/BlackInputField";
import ptmService from "../services/ptmService";
import messagingService from "../../messaging/services/messagingService";
import useUser from "../../auth/hooks/useUser";
import api from "../../../services/api";

const asList = (data) => (Array.isArray(data) ? data : data?.results || []);
const emptyForm = { teacher: "", date: "", start_time: "", end_time: "" };

const PTMSlots = () => {
  const { user } = useUser();
  const roleName = user?.data?.role || "Admin";
  const isTeacher = roleName === "Teacher";
  const isParent = roleName === "Parent";
  const isAdmin = ["Admin", "School Admin", "Superuser", "Principal"].includes(roleName) || !isParent;
  const canManage = isTeacher || isAdmin;

  // Management (Teacher / Admin) state
  const [allSlots, setAllSlots] = useState([]);
  const [loadingSlots, setLoadingSlots] = useState(false);
  const [teachersList, setTeachersList] = useState([]);
  const [selectedTeacherFilter, setSelectedTeacherFilter] = useState("");
  const [showAddModal, setShowAddModal] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);
  const [actingId, setActingId] = useState(null);

  // Parent state
  const [children, setChildren] = useState([]);
  const [parentTeachers, setParentTeachers] = useState([]);
  const [selectedChild, setSelectedChild] = useState("");
  const [selectedParentTeacher, setSelectedParentTeacher] = useState("");
  const [availableSlots, setAvailableSlots] = useState([]);
  const [myBookings, setMyBookings] = useState([]);
  const [loadingParentSlots, setLoadingParentSlots] = useState(false);

  const fetchTeachers = async () => {
    if (!isAdmin) return;
    try {
      const res = await api.get("teachers/");
      const data = asList(res.data);
      setTeachersList(data);
    } catch (err) {
      console.error("Failed to load teachers list:", err);
    }
  };

  const loadSlots = async (teacherIdFilter = "") => {
    setLoadingSlots(true);
    try {
      const params = {};
      if (teacherIdFilter) params.teacher = teacherIdFilter;
      else if (isTeacher) params.teacher = user?.data?.user?.id;

      const res = await ptmService.getSlots(params);
      setAllSlots(asList(res.data));
    } catch (err) {
      console.error("Failed to load PTM slots:", err);
      toast.error("Failed to load PTM slots.");
    } finally {
      setLoadingSlots(false);
    }
  };

  useEffect(() => {
    if (canManage) {
      fetchTeachers();
      loadSlots(selectedTeacherFilter);
    }
  }, [canManage, selectedTeacherFilter]);

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
    setSelectedParentTeacher("");
    setAvailableSlots([]);
    setParentTeachers([]);
    setMyBookings([]);
    if (!studentId) return;
    try {
      const res = await messagingService.getEligibleTeachers(studentId);
      setParentTeachers(res.data);
    } catch (err) {
      console.error("Failed to load eligible teachers:", err);
      toast.error("Failed to load teachers for this child.");
    }
  };

  const loadSlotsForParentTeacher = async (studentId, teacherId) => {
    setLoadingParentSlots(true);
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
      setLoadingParentSlots(false);
    }
  };

  const handleParentTeacherChange = (teacherId) => {
    setSelectedParentTeacher(teacherId);
    if (teacherId) loadSlotsForParentTeacher(selectedChild, teacherId);
  };

  const handleOpenAddModal = () => {
    setForm({
      teacher: selectedTeacherFilter || (isTeacher ? String(user?.data?.user?.id) : ""),
      date: "",
      start_time: "",
      end_time: "",
    });
    setShowAddModal(true);
  };

  const handleAddSlot = async () => {
    if (!form.date || !form.start_time || !form.end_time) {
      toast.error("Date, start time and end time are required.");
      return;
    }
    if (isAdmin && !form.teacher) {
      toast.error("Please select a teacher for this slot.");
      return;
    }
    setSaving(true);
    try {
      const payload = {
        date: form.date,
        start_time: form.start_time,
        end_time: form.end_time,
      };
      if (form.teacher) {
        payload.teacher = Number(form.teacher);
      }
      await ptmService.createSlot(payload);
      toast.success("PTM availability slot created.");
      setShowAddModal(false);
      setForm(emptyForm);
      loadSlots(selectedTeacherFilter);
    } catch (err) {
      console.error("Failed to add PTM slot:", err);
      toast.error(err?.response?.data?.non_field_errors?.[0] || "Failed to add availability — check for a time clash.");
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteSlot = async (slot) => {
    if (!window.confirm("Remove this availability slot?")) return;
    try {
      await ptmService.deleteSlot(slot.id);
      toast.success("Slot removed.");
      loadSlots(selectedTeacherFilter);
    } catch (err) {
      console.error("Failed to delete slot:", err);
      toast.error(err?.response?.data?.error || "Failed to remove slot.");
    }
  };

  const handleCancelBooking = async (slot) => {
    if (!window.confirm("Cancel this meeting booking?")) return;
    setActingId(slot.id);
    try {
      await ptmService.cancelSlot(slot.id);
      toast.success("Booking cancelled.");
      if (canManage) loadSlots(selectedTeacherFilter);
      if (isParent) loadSlotsForParentTeacher(selectedChild, selectedParentTeacher);
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
      toast.success("Slot booked successfully.");
      loadSlotsForParentTeacher(selectedChild, selectedParentTeacher);
    } catch (err) {
      console.error("Failed to book slot:", err);
      toast.error(err?.response?.data?.error || err?.response?.data?.student?.[0] || "Failed to book slot.");
    } finally {
      setActingId(null);
    }
  };

  const childOptions = useMemo(
    () => children.map((link) => ({ label: link.student_name || link.student_detail?.full_name, value: String(link.student) })),
    [children]
  );
  const parentTeacherOptions = useMemo(() => parentTeachers.map((t) => ({ label: t.name, value: String(t.id) })), [parentTeachers]);

  const teacherSelectOptions = useMemo(() => {
    return teachersList.map((t) => {
      const u = t.user_detail || {};
      const name = [u.first_name, u.last_name].filter(Boolean).join(" ") || u.username || `Teacher #${t.id}`;
      return { label: `${name} (${t.designation || "Staff"})`, value: String(u.id || t.user || t.id) };
    });
  }, [teachersList]);

  if (isParent) {
    return (
      <div className="w-full">
        <div className="pb-4 border-b border-cn-border mb-6">
          <h1 className="font-heading font-bold text-2xl text-violet-950">Parent-Teacher Meetings</h1>
          <p className="text-ink-500 text-[13px] mt-1">Book a PTM slot with your child's class teacher</p>
        </div>

        <div className="flex gap-3 mb-6 flex-wrap">
          <SelectBox className="w-60" label="Select Child" fieldName="student" value={selectedChild} onChange={(e) => handleChildChange(e.target.value)} options={childOptions} />
          <SelectBox
            className="w-60"
            label="Select Teacher"
            fieldName="teacher"
            value={selectedParentTeacher}
            onChange={(e) => handleParentTeacherChange(e.target.value)}
            options={parentTeachers.length ? parentTeacherOptions : [{ label: "Pick a child first", value: "" }]}
          />
        </div>

        {selectedParentTeacher && (
          <>
            {myBookings.length > 0 && (
              <div className="mb-6">
                <h2 className="font-heading font-semibold text-base text-ink-900 mb-3">Your Upcoming Meeting</h2>
                <div className="flex flex-col gap-2">
                  {myBookings.map((s) => (
                    <div key={s.id} className="flex items-center justify-between border border-cn-border rounded-xl px-4 py-3 bg-violet-50/50">
                      <div className="flex items-center gap-2 text-[13px] font-semibold text-ink-900">
                        <CalendarCheck2 size={16} className="text-violet-700" />
                        {s.date} · {s.start_time} – {s.end_time}
                      </div>
                      <button type="button" onClick={() => handleCancelBooking(s)} disabled={actingId === s.id} className="text-[12px] font-bold text-error-hex hover:underline cursor-pointer">
                        Cancel Meeting
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <h2 className="font-heading font-semibold text-base text-ink-900 mb-3">Available PTM Slots</h2>
            {loadingParentSlots ? (
              <p className="text-ink-400 text-[13px]">Loading availability…</p>
            ) : availableSlots.length === 0 ? (
              <p className="text-ink-400 text-[13px]">No open slots available right now for this teacher.</p>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {availableSlots.map((s) => (
                  <div key={s.id} className="border border-cn-border rounded-xl px-4 py-3 flex items-center justify-between bg-cn-surface">
                    <div className="text-[13px] font-semibold text-ink-900">
                      {s.date}
                      <div className="text-[12px] text-ink-500 font-normal">{s.start_time} – {s.end_time}</div>
                    </div>
                    <Button variant="primary" size="compact" onClick={() => handleBook(s)} loading={actingId === s.id}>
                      Book Slot
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
          <h1 className="font-heading font-bold text-2xl text-violet-950">Parent-Teacher Meetings (PTM)</h1>
          <p className="text-ink-500 text-[13px] mt-1">
            {isAdmin ? "Manage PTM slots and teacher availability across all classes" : "Your availability schedule for parent meetings"}
          </p>
        </div>
        <Button variant="primary" icon={<Plus size={16} />} onClick={handleOpenAddModal}>
          Add Availability
        </Button>
      </div>

      {/* Admin Filter bar */}
      {isAdmin && (
        <div className="flex items-center gap-3 mb-6 bg-violet-50/50 p-3.5 rounded-2xl border border-violet-100 flex-wrap">
          <Filter size={16} className="text-violet-700 ml-1" />
          <span className="text-[13px] font-bold text-violet-950">Filter by Teacher:</span>
          <SelectBox
            className="w-64"
            fieldName="teacherFilter"
            value={selectedTeacherFilter}
            onChange={(e) => setSelectedTeacherFilter(e.target.value)}
            options={[{ label: "All Teachers", value: "" }, ...teacherSelectOptions]}
          />
        </div>
      )}

      {loadingSlots ? (
        <p className="text-ink-400 text-[13px]">Loading PTM slots…</p>
      ) : allSlots.length === 0 ? (
        <div className="bg-cn-surface border border-cn-border rounded-2xl p-8 text-center flex flex-col items-center gap-2">
          <Calendar size={32} className="text-violet-400 mb-1" />
          <h3 className="font-bold text-violet-950 text-base">No PTM slots created yet</h3>
          <p className="text-ink-500 text-[13px] max-w-md">
            Click <span className="font-bold text-violet-700">"Add Availability"</span> to open appointment slots for parents to book.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {allSlots.map((s) => (
            <div key={s.id} className="border border-cn-border rounded-2xl p-4 bg-cn-surface shadow-xs flex flex-col gap-2.5">
              <div className="flex items-start justify-between">
                <div className="flex flex-col">
                  <span className="text-[13.5px] font-bold text-violet-950">{s.date}</span>
                  <span className="text-[12px] font-semibold text-ink-600">
                    {s.start_time} – {s.end_time}
                  </span>
                </div>
                <span
                  className={`text-[10.5px] font-extrabold uppercase px-2.5 py-0.5 rounded-full ${
                    s.is_booked
                      ? "bg-violet-100 text-violet-800 border border-violet-200"
                      : "bg-emerald-50 text-emerald-700 border border-emerald-200"
                  }`}
                >
                  {s.is_booked ? "BOOKED" : "AVAILABLE"}
                </span>
              </div>

              <div className="text-[12px] text-ink-600 font-medium pt-1 border-t border-cn-border flex items-center justify-between">
                <span>Teacher: <b className="text-violet-950">{s.teacher_name}</b></span>
                {s.is_booked ? (
                  <button
                    type="button"
                    onClick={() => handleCancelBooking(s)}
                    disabled={actingId === s.id}
                    className="text-error-hex font-bold hover:underline cursor-pointer text-[11.5px]"
                  >
                    Cancel Booking
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={() => handleDeleteSlot(s)}
                    className="text-ink-400 hover:text-error-hex cursor-pointer p-1"
                    title="Delete Slot"
                  >
                    <Trash2 size={15} />
                  </button>
                )}
              </div>

              {s.is_booked && s.booking && (
                <div className="bg-violet-50/60 rounded-xl p-2.5 text-[11.5px] text-violet-950 border border-violet-100 flex flex-col gap-0.5">
                  <div>Parent: <b>{s.booking.guardian_name}</b></div>
                  <div>Student: <b>{s.booking.student_name}</b></div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Add Availability Modal */}
      <Modal isOpen={showAddModal} onClose={() => setShowAddModal(false)} title="Add PTM Availability">
        <div className="flex flex-col gap-3.5 w-[340px] max-w-full">
          {isAdmin && (
            <SelectBox
              label="Select Teacher *"
              fieldName="teacher"
              value={form.teacher}
              onChange={(e) => setForm((p) => ({ ...p, teacher: e.target.value }))}
              options={[{ label: "Select Teacher", value: "" }, ...teacherSelectOptions]}
            />
          )}

          <BlackInputField label="Date *" fieldName="date" type="date" value={form.date} onChange={(e) => setForm((p) => ({ ...p, date: e.target.value }))} required />
          <div className="flex gap-3">
            <BlackInputField label="Start time *" fieldName="start_time" type="time" value={form.start_time} onChange={(e) => setForm((p) => ({ ...p, start_time: e.target.value }))} required />
            <BlackInputField label="End time *" fieldName="end_time" type="time" value={form.end_time} onChange={(e) => setForm((p) => ({ ...p, end_time: e.target.value }))} required />
          </div>

          <div className="flex gap-3 justify-end pt-3 border-t border-cn-border">
            <Button variant="outline" onClick={() => setShowAddModal(false)}>
              Cancel
            </Button>
            <Button variant="primary" onClick={handleAddSlot} loading={saving}>
              Save Availability
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default PTMSlots;
