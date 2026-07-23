import React, { useEffect, useState } from "react";
import { toast } from "react-toastify";
import Button from "../../../components/Button";
import BlackInputField from "../../../components/BlackInputField";
import Table from "../../../components/Table";
import attendanceService from "../services/attendanceService";
import useUser from "../../auth/hooks/useUser";
import api from "../../../services/api";
import Pagination from "../../../components/Pagination";
import usePaginatedList from "../../../hooks/usePaginatedList";

// Not one of the 5 School Edition design screens — kept intentionally light,
// but still fully wired to the real GET/POST /api/attendance/ endpoints.
const emptyForm = { student: "", date: new Date().toISOString().slice(0, 10), status: "present" };

const Attendance = () => {
  const { user } = useUser();
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);
  const [children, setChildren] = useState([]);
  const [selectedChildId, setSelectedChildId] = useState("");

  const profile = user?.data;
  const roleName = profile?.role || "Admin";

  const attendanceParams = roleName === "Parent" && selectedChildId ? { student: selectedChildId } : {};
  const {
    items: records,
    page,
    setPage,
    totalPages,
    count,
    pageSize,
    loading,
    refetch: fetchAttendance,
  } = usePaginatedList(attendanceService.getAttendance, attendanceParams);

  useEffect(() => {
    const fetchChildren = async () => {
      if (roleName === "Parent") {
        try {
          const res = await api.get("students/");
          const kids = Array.isArray(res.data) ? res.data : res.data?.results || [];
          setChildren(kids);
          if (kids.length > 0) {
            setSelectedChildId(kids[0].id);
          }
        } catch (err) {
          console.error("Failed to fetch children:", err);
        }
      }
    };
    fetchChildren();
  }, [roleName]);

  const columns = [
    { header: "Student", accessor: (row) => row.student_name || `Student #${row.student}` },
    { header: "Date", accessor: "date" },
    {
      header: "Status",
      accessor: (row) => (
        <span
          className={`inline-flex text-[11.5px] font-bold rounded-full px-2.5 py-0.5 ${
            row.status === "present" ? "bg-success-tint text-success-hex" : "bg-error-tint text-error-hex"
          }`}
        >
          {(row.status || "present").toUpperCase()}
        </span>
      ),
    },
  ];

  const handleMark = async () => {
    if (!form.student.trim() || !form.date) {
      toast.error("Student ID and date are required.");
      return;
    }
    setSaving(true);
    try {
      await attendanceService.markAttendance({ student: Number(form.student), date: form.date, status: form.status });
      toast.success("Attendance recorded.");
      setForm(emptyForm);
      fetchAttendance();
    } catch (err) {
      console.error(err);
      toast.error("Failed to record attendance.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="w-full">
      <div className="pb-4 border-b border-cn-border mb-6">
        <h1 className="font-heading font-bold text-2xl text-violet-950">Attendance</h1>
        <p className="text-ink-500 text-[13px] mt-1">Daily attendance records</p>
      </div>

      {roleName === "Parent" && children.length > 0 && (
        <div className="flex items-center gap-3.5 mb-6 bg-violet-50/70 border border-violet-100 rounded-2xl p-4">
          <span className="text-[13.5px] font-bold text-violet-950">Select Child:</span>
          <div className="flex gap-2">
            {children.map((child) => (
              <button
                key={child.id}
                type="button"
                onClick={() => setSelectedChildId(child.id)}
                className={`px-4 py-1.5 rounded-xl text-[12.5px] font-bold transition cursor-pointer ${
                  selectedChildId === child.id
                    ? "bg-violet-600 text-white shadow-sm"
                    : "bg-white border border-cn-border text-ink-700 hover:bg-slate-50"
                }`}
              >
                {child.full_name || child.name}
              </button>
            ))}
          </div>
        </div>
      )}

      {roleName !== "Parent" && (
        <div className="bg-cn-surface border border-cn-border rounded-2xl p-5 mb-6 flex flex-col md:flex-row items-end gap-3">
          <BlackInputField label="Student ID" fieldName="student" value={form.student} onChange={(e) => setForm((p) => ({ ...p, student: e.target.value }))} placeholder="e.g. 108" />
          <BlackInputField label="Date" fieldName="date" type="date" value={form.date} onChange={(e) => setForm((p) => ({ ...p, date: e.target.value }))} />
          <div className="mb-2">
            <label className="block text-sm font-medium mb-1 text-dark">Status</label>
            <select
              value={form.status}
              onChange={(e) => setForm((p) => ({ ...p, status: e.target.value }))}
              className="px-4 py-2 border border-slate-300 rounded-md text-[0.85rem] focus:outline-none focus:border-violet-500"
            >
              <option value="present">Present</option>
              <option value="absent">Absent</option>
            </select>
          </div>
          <Button variant="primary" onClick={handleMark} loading={saving} className="mb-2">
            Mark attendance
          </Button>
        </div>
      )}

      <Table columns={columns} data={records} loading={loading} emptyMessage="No attendance records yet" />
      <Pagination page={page} totalPages={totalPages} count={count} pageSize={pageSize} onPageChange={setPage} loading={loading} />
    </div>
  );
};

export default Attendance;
