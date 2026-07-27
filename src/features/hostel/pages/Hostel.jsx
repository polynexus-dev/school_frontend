import React, { useEffect, useMemo, useState } from "react";
import { toast } from "react-toastify";
import { Plus, LogOut } from "lucide-react";
import Button from "../../../components/Button";
import Table from "../../../components/Table";
import Modal from "../../../components/Modal";
import SelectBox from "../../../components/SelectBox";
import BlackInputField from "../../../components/BlackInputField";
import hostelService from "../services/hostelService";
import classSectionService from "../../students/services/classSectionService";
import studentService from "../../students/services/studentService";

const asList = (data) => (Array.isArray(data) ? data : data?.results || []);
const classSectionLabel = (cs) => cs?.display_name || `Class ${cs?.grade ?? "?"} - ${cs?.section ?? "?"}`;
const emptyHostelForm = { name: "", address: "" };
const emptyRoomForm = { room_number: "", capacity: 4 };
const emptyAllocForm = { hostel: "", room: "", class_section: "", student: "", notes: "" };

const Hostel = () => {
  const [tab, setTab] = useState("rooms");

  const [hostels, setHostels] = useState([]);
  const [selectedHostel, setSelectedHostel] = useState("");
  const [rooms, setRooms] = useState([]);
  const [loadingRooms, setLoadingRooms] = useState(false);
  const [showHostelModal, setShowHostelModal] = useState(false);
  const [hostelForm, setHostelForm] = useState(emptyHostelForm);
  const [showRoomModal, setShowRoomModal] = useState(false);
  const [roomForm, setRoomForm] = useState(emptyRoomForm);

  const [allocations, setAllocations] = useState([]);
  const [loadingAllocations, setLoadingAllocations] = useState(false);
  const [showAllocModal, setShowAllocModal] = useState(false);
  const [allocForm, setAllocForm] = useState(emptyAllocForm);
  const [allocRooms, setAllocRooms] = useState([]);
  const [classSections, setClassSections] = useState([]);
  const [sectionStudents, setSectionStudents] = useState([]);
  const [saving, setSaving] = useState(false);
  const [actingId, setActingId] = useState(null);

  const loadHostels = async () => {
    try {
      const res = await hostelService.getHostels();
      const list = asList(res.data);
      setHostels(list);
      if (list.length > 0 && !selectedHostel) setSelectedHostel(String(list[0].id));
    } catch (err) {
      console.error("Failed to load hostels:", err);
      toast.error("Failed to load hostels.");
    }
  };

  const loadRooms = async (hostelId) => {
    if (!hostelId) return;
    setLoadingRooms(true);
    try {
      const res = await hostelService.getRooms(hostelId);
      setRooms(asList(res.data));
    } catch (err) {
      console.error("Failed to load rooms:", err);
      toast.error("Failed to load rooms.");
    } finally {
      setLoadingRooms(false);
    }
  };

  const loadAllocations = async () => {
    setLoadingAllocations(true);
    try {
      const res = await hostelService.getAllocations({ status: "active" });
      setAllocations(asList(res.data));
    } catch (err) {
      console.error("Failed to load allocations:", err);
      toast.error("Failed to load hostel allocations.");
    } finally {
      setLoadingAllocations(false);
    }
  };

  useEffect(() => {
    loadHostels();
    loadAllocations();
    classSectionService.getClassSections().then((res) => setClassSections(asList(res.data))).catch(() => {});
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    loadRooms(selectedHostel);
  }, [selectedHostel]);

  const handleSaveHostel = async () => {
    if (!hostelForm.name.trim()) {
      toast.error("Hostel name is required.");
      return;
    }
    setSaving(true);
    try {
      const res = await hostelService.createHostel(hostelForm);
      toast.success("Hostel added.");
      setShowHostelModal(false);
      setHostelForm(emptyHostelForm);
      await loadHostels();
      setSelectedHostel(String(res.data.id));
    } catch (err) {
      console.error("Failed to add hostel:", err);
      toast.error("Failed to add hostel.");
    } finally {
      setSaving(false);
    }
  };

  const handleSaveRoom = async () => {
    if (!roomForm.room_number.trim()) {
      toast.error("Room number is required.");
      return;
    }
    setSaving(true);
    try {
      await hostelService.createRoom({ hostel: Number(selectedHostel), room_number: roomForm.room_number.trim(), capacity: Number(roomForm.capacity) || 4 });
      toast.success("Room added.");
      setShowRoomModal(false);
      setRoomForm(emptyRoomForm);
      loadRooms(selectedHostel);
    } catch (err) {
      console.error("Failed to add room:", err);
      toast.error(err?.response?.data?.non_field_errors?.[0] || "Failed to add room — that room number may already exist in this hostel.");
    } finally {
      setSaving(false);
    }
  };

  const openAllocModal = () => {
    setAllocForm(emptyAllocForm);
    setAllocRooms([]);
    setSectionStudents([]);
    setShowAllocModal(true);
  };

  const handleAllocHostelChange = async (hostelId) => {
    setAllocForm((p) => ({ ...p, hostel: hostelId, room: "" }));
    if (!hostelId) {
      setAllocRooms([]);
      return;
    }
    try {
      const res = await hostelService.getRooms(hostelId);
      setAllocRooms(asList(res.data).filter((r) => r.available_beds > 0));
    } catch (err) {
      console.error("Failed to load rooms for allocation:", err);
    }
  };

  const handleAllocClassChange = async (classSectionId) => {
    setAllocForm((p) => ({ ...p, class_section: classSectionId, student: "" }));
    if (!classSectionId) {
      setSectionStudents([]);
      return;
    }
    try {
      const res = await studentService.getStudents({ class_section: classSectionId });
      setSectionStudents(asList(res.data));
    } catch (err) {
      console.error("Failed to load students:", err);
    }
  };

  const handleAllocate = async () => {
    if (!allocForm.room || !allocForm.student) {
      toast.error("Room and student are both required.");
      return;
    }
    setSaving(true);
    try {
      await hostelService.createAllocation({ room: Number(allocForm.room), student: Number(allocForm.student), notes: allocForm.notes || null });
      toast.success("Student allocated to room.");
      setShowAllocModal(false);
      loadAllocations();
      loadRooms(selectedHostel);
    } catch (err) {
      console.error("Failed to allocate:", err);
      toast.error(err?.response?.data?.error || "Failed to allocate — the room may be full or the student already allocated.");
    } finally {
      setSaving(false);
    }
  };

  const handleVacate = async (allocation) => {
    if (!window.confirm(`Vacate ${allocation.student_name} from ${allocation.room_label}?`)) return;
    setActingId(allocation.id);
    try {
      await hostelService.vacateAllocation(allocation.id);
      toast.success("Room vacated.");
      loadAllocations();
      loadRooms(selectedHostel);
    } catch (err) {
      console.error("Failed to vacate:", err);
      toast.error("Failed to vacate room.");
    } finally {
      setActingId(null);
    }
  };

  const hostelOptions = useMemo(() => hostels.map((h) => ({ label: h.name, value: String(h.id) })), [hostels]);
  const allocHostelOptions = useMemo(() => hostels.map((h) => ({ label: h.name, value: String(h.id) })), [hostels]);
  const allocRoomOptions = useMemo(() => allocRooms.map((r) => ({ label: `${r.room_number} (${r.available_beds} bed${r.available_beds === 1 ? "" : "s"} free)`, value: String(r.id) })), [allocRooms]);
  const classSectionOptions = useMemo(() => classSections.map((cs) => ({ label: classSectionLabel(cs), value: String(cs.id) })), [classSections]);
  const studentOptions = useMemo(
    () => sectionStudents.map((s) => ({ label: `${s.full_name || s.name} (${s.admission_number || s.admission_no})`, value: String(s.id) })),
    [sectionStudents]
  );

  const roomColumns = [
    { header: "Room", accessor: "room_number" },
    { header: "Capacity", accessor: "capacity" },
    { header: "Occupied", accessor: "occupied_count" },
    { header: "Available Beds", accessor: (row) => <span className={row.available_beds > 0 ? "text-success-hex font-bold" : "text-error-hex font-bold"}>{row.available_beds}</span> },
  ];

  const allocColumns = [
    { header: "Student", accessor: "student_name" },
    { header: "Room", accessor: "room_label" },
    { header: "Allocated On", accessor: "allocated_on" },
    {
      header: "Actions",
      accessor: (row) => (
        <button type="button" onClick={() => handleVacate(row)} disabled={actingId === row.id} className="text-[11.5px] font-bold text-error-hex hover:underline cursor-pointer">
          <LogOut size={13} className="inline mr-1" />
          Vacate
        </button>
      ),
    },
  ];

  return (
    <div className="w-full">
      <div className="flex items-center gap-3 pb-4 border-b border-cn-border mb-6 flex-wrap">
        <div className="flex-1 min-w-0">
          <h1 className="font-heading font-bold text-2xl text-violet-950">Hostel</h1>
          <p className="text-ink-500 text-[13px] mt-1">Hostels, rooms and student allocations</p>
        </div>
        <div className="flex gap-2">
          <Button variant={tab === "rooms" ? "primary" : "outline"} size="compact" onClick={() => setTab("rooms")}>
            Rooms
          </Button>
          <Button variant={tab === "allocations" ? "primary" : "outline"} size="compact" onClick={() => setTab("allocations")}>
            Allocations
          </Button>
        </div>
      </div>

      {tab === "rooms" && (
        <>
          <div className="flex items-center gap-3 mb-4 flex-wrap">
            <SelectBox className="w-56" label="Hostel" fieldName="hostel" value={selectedHostel} onChange={(e) => setSelectedHostel(e.target.value)} options={hostelOptions} />
            <Button variant="outline" icon={<Plus size={16} />} onClick={() => setShowHostelModal(true)}>
              Add hostel
            </Button>
            {selectedHostel && (
              <Button variant="primary" icon={<Plus size={16} />} onClick={() => setShowRoomModal(true)}>
                Add room
              </Button>
            )}
          </div>
          <Table columns={roomColumns} data={rooms} loading={loadingRooms} emptyMessage="No rooms in this hostel yet" />
        </>
      )}

      {tab === "allocations" && (
        <>
          <div className="flex justify-end mb-4">
            <Button variant="primary" icon={<Plus size={16} />} onClick={openAllocModal}>
              Allocate a room
            </Button>
          </div>
          <Table columns={allocColumns} data={allocations} loading={loadingAllocations} emptyMessage="No active allocations" />
        </>
      )}

      <Modal isOpen={showHostelModal} onClose={() => setShowHostelModal(false)} title="Add hostel">
        <div className="flex flex-col gap-3 w-[320px] max-w-full">
          <BlackInputField label="Name" fieldName="name" value={hostelForm.name} onChange={(e) => setHostelForm((p) => ({ ...p, name: e.target.value }))} required />
          <BlackInputField label="Address" fieldName="address" value={hostelForm.address} onChange={(e) => setHostelForm((p) => ({ ...p, address: e.target.value }))} />
          <div className="flex gap-3 justify-end pt-2">
            <Button variant="outline" onClick={() => setShowHostelModal(false)}>
              Cancel
            </Button>
            <Button variant="primary" onClick={handleSaveHostel} loading={saving}>
              Save
            </Button>
          </div>
        </div>
      </Modal>

      <Modal isOpen={showRoomModal} onClose={() => setShowRoomModal(false)} title="Add room">
        <div className="flex flex-col gap-3 w-[280px] max-w-full">
          <BlackInputField label="Room number" fieldName="room_number" value={roomForm.room_number} onChange={(e) => setRoomForm((p) => ({ ...p, room_number: e.target.value }))} required />
          <BlackInputField label="Capacity" fieldName="capacity" type="number" value={roomForm.capacity} onChange={(e) => setRoomForm((p) => ({ ...p, capacity: e.target.value }))} />
          <div className="flex gap-3 justify-end pt-2">
            <Button variant="outline" onClick={() => setShowRoomModal(false)}>
              Cancel
            </Button>
            <Button variant="primary" onClick={handleSaveRoom} loading={saving}>
              Save
            </Button>
          </div>
        </div>
      </Modal>

      <Modal isOpen={showAllocModal} onClose={() => setShowAllocModal(false)} title="Allocate a room">
        <div className="flex flex-col gap-3 w-[340px] max-w-full">
          <SelectBox label="Hostel" fieldName="alloc_hostel" value={allocForm.hostel} onChange={(e) => handleAllocHostelChange(e.target.value)} options={allocHostelOptions} />
          <SelectBox
            label="Room"
            fieldName="room"
            value={allocForm.room}
            onChange={(e) => setAllocForm((p) => ({ ...p, room: e.target.value }))}
            options={allocRooms.length ? allocRoomOptions : [{ label: "No available rooms", value: "" }]}
          />
          <SelectBox label="Class" fieldName="class_section" value={allocForm.class_section} onChange={(e) => handleAllocClassChange(e.target.value)} options={classSectionOptions} />
          <SelectBox
            label="Student"
            fieldName="student"
            value={allocForm.student}
            onChange={(e) => setAllocForm((p) => ({ ...p, student: e.target.value }))}
            options={studentOptions.length ? studentOptions : [{ label: "Pick a class first", value: "" }]}
          />
          <div className="flex gap-3 justify-end pt-2">
            <Button variant="outline" onClick={() => setShowAllocModal(false)}>
              Cancel
            </Button>
            <Button variant="primary" onClick={handleAllocate} loading={saving}>
              Allocate
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default Hostel;
