import React, { useEffect, useMemo, useState } from "react";
import { toast } from "react-toastify";
import { Plus, Shuffle, CheckCircle2 } from "lucide-react";
import Button from "../../../components/Button";
import Table from "../../../components/Table";
import Modal from "../../../components/Modal";
import SelectBox from "../../../components/SelectBox";
import BlackInputField from "../../../components/BlackInputField";
import usePaginatedList from "../../../hooks/usePaginatedList";
import examSchedulingService from "../services/examSchedulingService";
import examTermService from "../services/examTermService";
import classSectionService from "../../students/services/classSectionService";

const asList = (data) => (Array.isArray(data) ? data : data?.results || []);
const classSectionLabel = (cs) => cs?.display_name || cs?.name || `Class ${cs?.grade ?? "?"} - ${cs?.section ?? "?"}`;

const emptyForm = { exam_term: "", exam_date: "", room: "" };

const SeatingArrangementPage = () => {
  const [examTerms, setExamTerms] = useState([]);
  const [classSections, setClassSections] = useState([]);
  const [rooms, setRooms] = useState([]);

  const [showCreate, setShowCreate] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [errors, setErrors] = useState({});
  const [saving, setSaving] = useState(false);

  const [manageRow, setManageRow] = useState(null);
  const [selectedClassSections, setSelectedClassSections] = useState([]);
  const [generating, setGenerating] = useState(false);
  const [publishing, setPublishing] = useState(false);

  const {
    items: arrangements,
    loading,
    refetch,
  } = usePaginatedList(examSchedulingService.getSeatingArrangements, {});

  useEffect(() => {
    const load = async () => {
      try {
        const [etRes, csRes, roomRes] = await Promise.all([
          examTermService.getExamTerms(),
          classSectionService.getClassSections(),
          examSchedulingService.getRooms(),
        ]);
        setExamTerms(asList(etRes.data));
        setClassSections(asList(csRes.data));
        setRooms(asList(roomRes.data));
      } catch (err) {
        console.error("Failed to load seating filter data:", err);
        toast.error("Failed to load exam terms / classes / rooms.");
      }
    };
    load();
  }, []);

  const formExamTermOptions = useMemo(() => examTerms.map((t) => ({ label: t.name, value: String(t.id) })), [examTerms]);
  const formRoomOptions = useMemo(() => rooms.map((r) => ({ label: `${r.name} (capacity ${r.capacity})`, value: String(r.id) })), [rooms]);

  const resetForm = () => {
    setForm(emptyForm);
    setErrors({});
  };

  const validate = () => {
    const newErrors = {};
    if (!form.exam_term) newErrors.exam_term = "Required";
    if (!form.exam_date) newErrors.exam_date = "Required";
    if (!form.room) newErrors.room = "Required";
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleCreate = async () => {
    if (!validate()) {
      toast.error("Please fill in all required fields.");
      return;
    }
    setSaving(true);
    try {
      await examSchedulingService.createSeatingArrangement({
        exam_term: Number(form.exam_term),
        exam_date: form.exam_date,
        room: Number(form.room),
      });
      toast.success("Seating arrangement created — open it to allocate seats.");
      setShowCreate(false);
      resetForm();
      refetch();
    } catch (err) {
      console.error("Failed to create seating arrangement:", err);
      toast.error(
        err?.response?.data?.non_field_errors?.[0] || err?.response?.data?.error || "Failed to create (one may already exist for this room/date)."
      );
    } finally {
      setSaving(false);
    }
  };

  const openManage = (row) => {
    setManageRow(row);
    setSelectedClassSections([]);
  };

  const toggleClassSection = (id) => {
    setSelectedClassSections((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));
  };

  const handleGenerate = async () => {
    if (selectedClassSections.length < 1) {
      toast.error("Select at least one class/section to draw students from.");
      return;
    }
    setGenerating(true);
    try {
      const res = await examSchedulingService.generateSeating(manageRow.id, selectedClassSections);
      toast.success(`Allocated ${res.data.allocated_count} seats.`);
      setManageRow(res.data.seating_arrangement);
      refetch();
    } catch (err) {
      console.error("Failed to generate seating:", err);
      toast.error(err?.response?.data?.error || "Failed to generate seating.");
    } finally {
      setGenerating(false);
    }
  };

  const handlePublish = async () => {
    setPublishing(true);
    try {
      const res = await examSchedulingService.publishSeatingArrangement(manageRow.id);
      toast.success("Seating arrangement published — students/guardians can now see their seat.");
      setManageRow(res.data);
      refetch();
    } catch (err) {
      console.error("Failed to publish seating arrangement:", err);
      toast.error(err?.response?.data?.error || "Failed to publish.");
    } finally {
      setPublishing(false);
    }
  };

  const columns = [
    { header: "Exam Term", accessor: (row) => row.exam_term_name || "—" },
    { header: "Date", accessor: (row) => row.exam_date },
    { header: "Room", accessor: (row) => row.room_name || "—" },
    { header: "Seats Allocated", accessor: (row) => row.allocations?.length ?? 0 },
    {
      header: "Status",
      accessor: (row) => (
        <span className={`inline-flex items-center gap-1 text-[11.5px] font-bold rounded-full px-2.5 py-0.5 ${row.is_published ? "bg-success-tint text-success-hex" : "bg-warning-tint text-warning-hex"}`}>
          {row.is_published ? "PUBLISHED" : "DRAFT"}
        </span>
      ),
    },
    {
      header: "",
      accessor: (row) => (
        <Button variant="outline" size="compact" onClick={() => openManage(row)}>
          Manage seats →
        </Button>
      ),
    },
  ];

  const allocationColumns = [
    { header: "Seat No.", accessor: (row) => <span className="font-semibold text-ink-900">{row.seat_number}</span> },
    { header: "Student", accessor: (row) => row.student_name },
    { header: "Roll No.", accessor: (row) => row.roll_number || "—" },
    { header: "Class & Section", accessor: (row) => row.class_section_name || "—" },
  ];

  return (
    <div className="w-full">
      <div className="flex items-center gap-3 pb-4 border-b border-cn-border mb-6 flex-wrap">
        <div className="flex-1 min-w-0">
          <h1 className="font-heading font-bold text-2xl text-violet-950">Seating Arrangement</h1>
          <p className="text-ink-500 text-[13px] mt-1">Room-wise seating plans, interleaved across classes to prevent copying</p>
        </div>
        <Button
          variant="primary"
          icon={<Plus size={16} />}
          onClick={() => {
            resetForm();
            setShowCreate(true);
          }}
        >
          New Seating Plan
        </Button>
      </div>

      <Table
        columns={columns}
        data={arrangements}
        loading={loading}
        emptyMessage="No seating arrangements yet"
        emptyDescription="Click “New Seating Plan” to set up a room/date, then allocate seats."
      />

      <Modal isOpen={showCreate} onClose={() => setShowCreate(false)} title="New seating plan">
        <div className="flex flex-col gap-3 w-[380px] max-w-full">
          <SelectBox label="Exam Term" fieldName="exam_term" value={form.exam_term} onChange={(e) => setForm((p) => ({ ...p, exam_term: e.target.value }))} options={formExamTermOptions} required error={errors.exam_term} />
          <BlackInputField label="Exam Date" fieldName="exam_date" type="date" value={form.exam_date} onChange={(e) => setForm((p) => ({ ...p, exam_date: e.target.value }))} required error={errors.exam_date} />
          <SelectBox label="Room" fieldName="room" value={form.room} onChange={(e) => setForm((p) => ({ ...p, room: e.target.value }))} options={formRoomOptions} required error={errors.room} />
          <div className="flex gap-3 justify-end pt-2">
            <Button variant="outline" onClick={() => setShowCreate(false)}>
              Cancel
            </Button>
            <Button variant="primary" onClick={handleCreate} loading={saving}>
              Create plan →
            </Button>
          </div>
        </div>
      </Modal>

      <Modal isOpen={!!manageRow} onClose={() => setManageRow(null)} title={manageRow ? `${manageRow.room_name} — ${manageRow.exam_date}` : ""}>
        {manageRow && (
          <div className="flex flex-col gap-4 w-[560px] max-w-full">
            {!manageRow.is_published && (
              <div>
                <p className="text-[13px] font-semibold text-ink-900 mb-2">Draw students from these class(es)/section(s):</p>
                <div className="flex flex-wrap gap-2 max-h-[140px] overflow-y-auto border border-cn-border rounded-md p-2">
                  {classSections.map((cs) => (
                    <label key={cs.id} className="flex items-center gap-1.5 text-[12.5px] bg-cn-bg rounded-full px-2.5 py-1 cursor-pointer">
                      <input type="checkbox" checked={selectedClassSections.includes(cs.id)} onChange={() => toggleClassSection(cs.id)} />
                      {classSectionLabel(cs)}
                    </label>
                  ))}
                </div>
                <div className="flex justify-end mt-2">
                  <Button variant="outline" icon={<Shuffle size={15} />} onClick={handleGenerate} loading={generating}>
                    Generate seating
                  </Button>
                </div>
              </div>
            )}

            <div>
              <p className="text-[13px] font-semibold text-ink-900 mb-2">Allocated seats ({manageRow.allocations?.length ?? 0})</p>
              <Table columns={allocationColumns} data={manageRow.allocations || []} loading={false} emptyMessage="No seats allocated yet" />
            </div>

            {!manageRow.is_published && (
              <div className="flex justify-end pt-2 border-t border-cn-border">
                <Button variant="primary" icon={<CheckCircle2 size={15} />} onClick={handlePublish} loading={publishing}>
                  Publish seating plan
                </Button>
              </div>
            )}
          </div>
        )}
      </Modal>
    </div>
  );
};

export default SeatingArrangementPage;
