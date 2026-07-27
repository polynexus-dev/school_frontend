import React, { useEffect, useMemo, useState } from "react";
import { toast } from "react-toastify";
import { ChevronLeft, ChevronRight, Plus, Trash2 } from "lucide-react";
import Button from "../../../components/Button";
import Table from "../../../components/Table";
import Modal from "../../../components/Modal";
import SelectBox from "../../../components/SelectBox";
import BlackInputField from "../../../components/BlackInputField";
import eventService from "../services/eventService";
import classSectionService from "../../students/services/classSectionService";
import useUser from "../../auth/hooks/useUser";

const asList = (data) => (Array.isArray(data) ? data : data?.results || []);
const classSectionLabel = (cs) => cs?.display_name || `Class ${cs?.grade ?? "?"} - ${cs?.section ?? "?"}`;
const emptyForm = { title: "", description: "", event_type: "other", audience_type: "whole_school", target_class_sections: [], start_datetime: "", end_datetime: "" };

const TYPE_TONE = {
  holiday: "bg-success-tint text-success-hex",
  exam: "bg-error-tint text-error-hex",
  meeting: "bg-info-tint text-info-hex",
  sports: "bg-warning-tint text-warning-hex",
  cultural: "bg-violet-50 text-violet-700",
  other: "bg-cn-bg text-ink-500",
};

const EVENT_TYPE_OPTIONS = [
  { label: "Holiday", value: "holiday" },
  { label: "Exam", value: "exam" },
  { label: "Meeting", value: "meeting" },
  { label: "Sports", value: "sports" },
  { label: "Cultural", value: "cultural" },
  { label: "Other", value: "other" },
];
const AUDIENCE_OPTIONS = [
  { label: "Whole School", value: "whole_school" },
  { label: "Specific Class(es)", value: "class" },
  { label: "Staff Only", value: "staff_only" },
];

const Calendar = () => {
  const { user } = useUser();
  const roleName = user?.data?.role || "Admin";
  const isStaff = !["Parent", "Student"].includes(roleName);

  const [tab, setTab] = useState("calendar");
  const [monthCursor, setMonthCursor] = useState(() => {
    const d = new Date();
    return new Date(d.getFullYear(), d.getMonth(), 1);
  });
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(false);
  const [classSections, setClassSections] = useState([]);

  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);
  const [detailEvent, setDetailEvent] = useState(null);

  const load = async () => {
    setLoading(true);
    try {
      const res = await eventService.getEvents();
      setEvents(asList(res.data));
    } catch (err) {
      console.error("Failed to load events:", err);
      toast.error("Failed to load calendar events.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
    if (isStaff) classSectionService.getClassSections().then((res) => setClassSections(asList(res.data))).catch(() => {});
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleSave = async () => {
    if (!form.title.trim() || !form.start_datetime || !form.end_datetime) {
      toast.error("Title, start and end are all required.");
      return;
    }
    setSaving(true);
    try {
      await eventService.createEvent({
        ...form,
        target_class_sections: form.audience_type === "class" ? form.target_class_sections : [],
      });
      toast.success("Event added.");
      setShowModal(false);
      setForm(emptyForm);
      load();
    } catch (err) {
      console.error("Failed to add event:", err);
      toast.error("Failed to add event.");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (event) => {
    if (!window.confirm(`Delete "${event.title}"?`)) return;
    try {
      await eventService.deleteEvent(event.id);
      toast.success("Event deleted.");
      setDetailEvent(null);
      load();
    } catch (err) {
      console.error("Failed to delete event:", err);
      toast.error("Failed to delete event.");
    }
  };

  const toggleClassSection = (id) => {
    setForm((p) => ({
      ...p,
      target_class_sections: p.target_class_sections.includes(id) ? p.target_class_sections.filter((x) => x !== id) : [...p.target_class_sections, id],
    }));
  };

  const monthDays = useMemo(() => {
    const first = monthCursor;
    const startWeekday = first.getDay();
    const daysInMonth = new Date(first.getFullYear(), first.getMonth() + 1, 0).getDate();
    const cells = [];
    for (let i = 0; i < startWeekday; i++) cells.push(null);
    for (let d = 1; d <= daysInMonth; d++) cells.push(new Date(first.getFullYear(), first.getMonth(), d));
    return cells;
  }, [monthCursor]);

  const eventsByDay = useMemo(() => {
    const map = {};
    events.forEach((e) => {
      const key = new Date(e.start_datetime).toDateString();
      if (!map[key]) map[key] = [];
      map[key].push(e);
    });
    return map;
  }, [events]);

  const upcoming = useMemo(() => [...events].sort((a, b) => new Date(a.start_datetime) - new Date(b.start_datetime)), [events]);

  const listColumns = [
    { header: "Title", accessor: (row) => <span className="font-semibold text-ink-900">{row.title}</span> },
    { header: "Type", accessor: (row) => <span className={`inline-flex text-[11px] font-bold rounded-full px-2 py-0.5 ${TYPE_TONE[row.event_type]}`}>{row.event_type.toUpperCase()}</span> },
    { header: "Audience", accessor: (row) => AUDIENCE_OPTIONS.find((o) => o.value === row.audience_type)?.label },
    { header: "Starts", accessor: (row) => new Date(row.start_datetime).toLocaleString() },
    { header: "Ends", accessor: (row) => new Date(row.end_datetime).toLocaleString() },
    ...(isStaff ? [{ header: "Actions", accessor: (row) => <button type="button" onClick={() => handleDelete(row)} className="text-error-hex hover:opacity-70 cursor-pointer"><Trash2 size={14} /></button> }] : []),
  ];

  return (
    <div className="w-full">
      <div className="flex items-center gap-3 pb-4 border-b border-cn-border mb-6 flex-wrap">
        <div className="flex-1 min-w-0">
          <h1 className="font-heading font-bold text-2xl text-violet-950">Calendar</h1>
          <p className="text-ink-500 text-[13px] mt-1">School events, holidays and exams</p>
        </div>
        <div className="flex gap-2">
          <Button variant={tab === "calendar" ? "primary" : "outline"} size="compact" onClick={() => setTab("calendar")}>
            Calendar
          </Button>
          <Button variant={tab === "list" ? "primary" : "outline"} size="compact" onClick={() => setTab("list")}>
            List
          </Button>
        </div>
        {isStaff && (
          <Button variant="primary" icon={<Plus size={16} />} onClick={() => setShowModal(true)}>
            Add event
          </Button>
        )}
      </div>

      {tab === "calendar" && (
        <>
          <div className="flex items-center justify-center gap-4 mb-4">
            <button type="button" aria-label="Previous month" onClick={() => setMonthCursor((d) => new Date(d.getFullYear(), d.getMonth() - 1, 1))} className="p-1.5 rounded-lg hover:bg-violet-50 cursor-pointer">
              <ChevronLeft size={18} />
            </button>
            <span className="font-heading font-bold text-lg text-ink-900 w-48 text-center">
              {monthCursor.toLocaleString("default", { month: "long", year: "numeric" })}
            </span>
            <button type="button" aria-label="Next month" onClick={() => setMonthCursor((d) => new Date(d.getFullYear(), d.getMonth() + 1, 1))} className="p-1.5 rounded-lg hover:bg-violet-50 cursor-pointer">
              <ChevronRight size={18} />
            </button>
          </div>

          {loading ? (
            <p className="text-center text-ink-400 text-sm py-16">Loading…</p>
          ) : (
            <div className="grid grid-cols-7 gap-1.5">
              {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((d) => (
                <div key={d} className="text-[11px] font-bold text-ink-400 text-center pb-1">{d}</div>
              ))}
              {monthDays.map((date, idx) => {
                const dayEvents = date ? eventsByDay[date.toDateString()] || [] : [];
                const isToday = date && date.toDateString() === new Date().toDateString();
                return (
                  <div key={idx} className={`min-h-[84px] rounded-lg border p-1.5 ${date ? "bg-cn-surface border-cn-border" : "bg-transparent border-transparent"}`}>
                    {date && (
                      <>
                        <div className={`text-[11px] font-bold mb-1 ${isToday ? "text-violet-700" : "text-ink-500"}`}>{date.getDate()}</div>
                        <div className="flex flex-col gap-0.5">
                          {dayEvents.slice(0, 3).map((e) => (
                            <button
                              key={e.id}
                              type="button"
                              onClick={() => setDetailEvent(e)}
                              className={`text-[10px] font-semibold rounded px-1 py-0.5 truncate text-left cursor-pointer ${TYPE_TONE[e.event_type]}`}
                              title={e.title}
                            >
                              {e.title}
                            </button>
                          ))}
                        </div>
                      </>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </>
      )}

      {tab === "list" && <Table columns={listColumns} data={upcoming} loading={loading} emptyMessage="No events yet" />}

      <Modal isOpen={showModal} onClose={() => setShowModal(false)} title="Add event">
        <div className="flex flex-col gap-3 w-[360px] max-w-full">
          <BlackInputField label="Title" fieldName="title" value={form.title} onChange={(e) => setForm((p) => ({ ...p, title: e.target.value }))} required />
          <div>
            <label className="block text-sm font-medium mb-1 text-dark">Description (optional)</label>
            <textarea
              value={form.description}
              onChange={(e) => setForm((p) => ({ ...p, description: e.target.value }))}
              rows={2}
              className="w-full px-4 py-2 border border-slate-300 rounded-md bg-transparent text-[0.85rem] text-dark outline-none focus:border-violet-500"
            />
          </div>
          <div className="flex gap-3">
            <SelectBox label="Type" fieldName="event_type" value={form.event_type} onChange={(e) => setForm((p) => ({ ...p, event_type: e.target.value }))} options={EVENT_TYPE_OPTIONS} />
            <SelectBox label="Audience" fieldName="audience_type" value={form.audience_type} onChange={(e) => setForm((p) => ({ ...p, audience_type: e.target.value }))} options={AUDIENCE_OPTIONS} />
          </div>
          {form.audience_type === "class" && (
            <div className="flex flex-col gap-1.5 max-h-32 overflow-y-auto border border-cn-border rounded-lg p-2">
              {classSections.map((cs) => (
                <label key={cs.id} className="flex items-center gap-2 text-[12.5px] text-ink-700 cursor-pointer">
                  <input type="checkbox" checked={form.target_class_sections.includes(cs.id)} onChange={() => toggleClassSection(cs.id)} />
                  {classSectionLabel(cs)}
                </label>
              ))}
            </div>
          )}
          <div className="flex gap-3">
            <BlackInputField label="Start" fieldName="start_datetime" type="datetime-local" value={form.start_datetime} onChange={(e) => setForm((p) => ({ ...p, start_datetime: e.target.value }))} required />
            <BlackInputField label="End" fieldName="end_datetime" type="datetime-local" value={form.end_datetime} onChange={(e) => setForm((p) => ({ ...p, end_datetime: e.target.value }))} required />
          </div>
          <div className="flex gap-3 justify-end pt-2">
            <Button variant="outline" onClick={() => setShowModal(false)}>
              Cancel
            </Button>
            <Button variant="primary" onClick={handleSave} loading={saving}>
              Save
            </Button>
          </div>
        </div>
      </Modal>

      <Modal isOpen={!!detailEvent} onClose={() => setDetailEvent(null)} title={detailEvent?.title}>
        <div className="flex flex-col gap-2 w-[300px] max-w-full">
          <span className={`inline-flex self-start text-[11px] font-bold rounded-full px-2 py-0.5 ${TYPE_TONE[detailEvent?.event_type]}`}>{detailEvent?.event_type?.toUpperCase()}</span>
          {detailEvent?.description && <p className="text-[13px] text-ink-700">{detailEvent.description}</p>}
          <p className="text-[12px] text-ink-500">
            {detailEvent && new Date(detailEvent.start_datetime).toLocaleString()} — {detailEvent && new Date(detailEvent.end_datetime).toLocaleString()}
          </p>
          {isStaff && (
            <div className="flex justify-end pt-2">
              <Button variant="destructive" icon={<Trash2 size={14} />} onClick={() => handleDelete(detailEvent)}>
                Delete
              </Button>
            </div>
          )}
        </div>
      </Modal>
    </div>
  );
};

export default Calendar;
