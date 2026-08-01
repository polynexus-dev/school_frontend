import React, { useState } from "react";
import { toast } from "react-toastify";
import { Plus } from "lucide-react";
import Button from "../../../components/Button";
import Table from "../../../components/Table";
import Modal from "../../../components/Modal";
import BlackInputField from "../../../components/BlackInputField";
import Pagination from "../../../components/Pagination";
import usePaginatedList from "../../../hooks/usePaginatedList";
import examSchedulingService from "../services/examSchedulingService";

const emptyForm = { id: null, name: "", capacity: "", location: "" };

const ExamRooms = () => {
  const [showModal, setShowModal] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [errors, setErrors] = useState({});
  const [saving, setSaving] = useState(false);

  const {
    items: rooms,
    page,
    setPage,
    totalPages,
    count,
    pageSize,
    loading,
    refetch,
  } = usePaginatedList(examSchedulingService.getRooms, { include_inactive: "true" });

  const resetForm = () => {
    setForm(emptyForm);
    setErrors({});
    setIsEditing(false);
  };

  const openCreate = () => {
    resetForm();
    setShowModal(true);
  };

  const openEdit = (row) => {
    setForm({ id: row.id, name: row.name, capacity: String(row.capacity), location: row.location || "" });
    setIsEditing(true);
    setErrors({});
    setShowModal(true);
  };

  const handleDelete = async (row) => {
    if (!window.confirm(`Deactivate room "${row.name}"? It will no longer be selectable for new schedules/seating.`)) return;
    try {
      await examSchedulingService.updateRoom(row.id, { is_active: false });
      toast.success("Room deactivated.");
      refetch();
    } catch (err) {
      console.error("Failed to deactivate room:", err);
      toast.error(err?.response?.data?.detail || "Failed to deactivate room.");
    }
  };

  const validate = () => {
    const newErrors = {};
    if (!form.name.trim()) newErrors.name = "Required";
    if (!form.capacity || Number(form.capacity) <= 0) newErrors.capacity = "Required";
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async () => {
    if (!validate()) {
      toast.error("Please fill in all required fields.");
      return;
    }
    setSaving(true);
    try {
      const payload = { name: form.name.trim(), capacity: Number(form.capacity), location: form.location.trim() || null };
      if (isEditing) {
        await examSchedulingService.updateRoom(form.id, payload);
        toast.success("Room updated.");
      } else {
        await examSchedulingService.createRoom(payload);
        toast.success("Room added.");
      }
      setShowModal(false);
      resetForm();
      refetch();
    } catch (err) {
      console.error("Failed to save room:", err);
      toast.error(err?.response?.data?.name?.[0] || err?.response?.data?.error || "Failed to save room.");
    } finally {
      setSaving(false);
    }
  };

  const columns = [
    { header: "Room", accessor: (row) => <span className="font-semibold text-ink-900">{row.name}</span> },
    { header: "Capacity", accessor: (row) => row.capacity },
    { header: "Location", accessor: (row) => row.location || "—" },
    {
      header: "Status",
      accessor: (row) => (
        <span className={`inline-flex items-center gap-1 text-[11.5px] font-bold rounded-full px-2.5 py-0.5 ${row.is_active ? "bg-success-tint text-success-hex" : "bg-cn-bg text-ink-500"}`}>
          {row.is_active ? "ACTIVE" : "INACTIVE"}
        </span>
      ),
    },
  ];

  return (
    <div className="w-full">
      <div className="flex items-center gap-3 pb-4 border-b border-cn-border mb-6 flex-wrap">
        <div className="flex-1 min-w-0">
          <h1 className="font-heading font-bold text-2xl text-violet-950">Exam Rooms</h1>
          <p className="text-ink-500 text-[13px] mt-1">Physical rooms/halls used for datesheets and seating arrangements</p>
        </div>
        <Button variant="primary" icon={<Plus size={16} />} onClick={openCreate}>
          Add Room
        </Button>
      </div>

      <Table
        columns={columns}
        data={rooms}
        loading={loading}
        onEdit={openEdit}
        onDelete={handleDelete}
        emptyMessage="No exam rooms yet"
        emptyDescription="Add a room here so it can be used in the datesheet and seating arrangements."
      />
      <Pagination page={page} totalPages={totalPages} count={count} pageSize={pageSize} onPageChange={setPage} loading={loading} />

      <Modal isOpen={showModal} onClose={() => setShowModal(false)} title={isEditing ? "Edit room" : "Add room"}>
        <div className="flex flex-col gap-3 w-[380px] max-w-full">
          <BlackInputField label="Room Name" fieldName="name" value={form.name} onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))} required error={errors.name} />
          <BlackInputField label="Capacity" fieldName="capacity" type="number" value={form.capacity} onChange={(e) => setForm((p) => ({ ...p, capacity: e.target.value }))} required error={errors.capacity} />
          <BlackInputField label="Location (optional)" fieldName="location" value={form.location} onChange={(e) => setForm((p) => ({ ...p, location: e.target.value }))} />
          <div className="flex gap-3 justify-end pt-2">
            <Button variant="outline" onClick={() => setShowModal(false)}>
              Cancel
            </Button>
            <Button variant="primary" onClick={handleSubmit} loading={saving}>
              {isEditing ? "Save changes" : "Add room"}
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default ExamRooms;
