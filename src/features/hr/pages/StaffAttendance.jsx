import React, { useEffect, useState } from "react";
import { toast } from "react-toastify";
import { CheckCircle2 } from "lucide-react";
import Button from "../../../components/Button";
import Table from "../../../components/Table";
import BlackInputField from "../../../components/BlackInputField";
import staffAttendanceService from "../services/staffAttendanceService";
import useUser from "../../auth/hooks/useUser";

const asList = (data) => (Array.isArray(data) ? data : data?.results || []);
const todayLocal = () => {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
};

const STATUS_TONE = {
  present: "bg-success-tint text-success-hex",
  absent: "bg-error-tint text-error-hex",
  half_day: "bg-warning-tint text-warning-hex",
  on_leave: "bg-cn-bg text-ink-500",
};

const StaffAttendance = () => {
  const { user } = useUser();
  const roleName = user?.data?.role || "Admin";
  const isAdmin = !["Teacher", "Parent", "Conductor"].includes(roleName);

  const [date, setDate] = useState(todayLocal());
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(false);
  const [checkingIn, setCheckingIn] = useState(false);

  const load = async () => {
    setLoading(true);
    try {
      const res = await staffAttendanceService.getAttendance(isAdmin ? { date } : {});
      setRecords(asList(res.data));
    } catch (err) {
      console.error("Failed to load staff attendance:", err);
      toast.error("Failed to load attendance records.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [date]);

  const alreadyCheckedInToday = !isAdmin && records.some((r) => r.date === todayLocal());

  const handleCheckIn = async () => {
    setCheckingIn(true);
    try {
      await staffAttendanceService.checkIn({ date: todayLocal(), status: "present", check_in_time: new Date().toISOString() });
      toast.success("Checked in for today.");
      load();
    } catch (err) {
      console.error("Failed to check in:", err);
      toast.error(err?.response?.data?.non_field_errors?.[0] || "Failed to check in — you may already have a record for today.");
    } finally {
      setCheckingIn(false);
    }
  };

  const columns = [
    ...(isAdmin ? [{ header: "Staff", accessor: (row) => row.staff_name || `#${row.staff}` }] : []),
    { header: "Date", accessor: "date" },
    {
      header: "Status",
      accessor: (row) => (
        <span className={`inline-flex items-center text-[11.5px] font-bold rounded-full px-2.5 py-0.5 ${STATUS_TONE[row.status] || "bg-cn-bg text-ink-500"}`}>
          {row.status.replace("_", " ").toUpperCase()}
        </span>
      ),
    },
    { header: "Check-in", accessor: (row) => (row.check_in_time ? new Date(row.check_in_time).toLocaleTimeString() : "—") },
    { header: "Remarks", accessor: (row) => <span className="text-ink-500">{row.remarks || "—"}</span> },
  ];

  return (
    <div className="w-full">
      <div className="flex items-center gap-3 pb-4 border-b border-cn-border mb-6 flex-wrap">
        <div className="flex-1 min-w-0">
          <h1 className="font-heading font-bold text-2xl text-violet-950">Staff attendance</h1>
          <p className="text-ink-500 text-[13px] mt-1">{isAdmin ? "Every staff member's daily attendance" : "Your daily check-in history"}</p>
        </div>
        {isAdmin ? (
          <BlackInputField fieldName="date" type="date" value={date} onChange={(e) => setDate(e.target.value)} />
        ) : (
          <Button variant="primary" icon={<CheckCircle2 size={16} />} onClick={handleCheckIn} loading={checkingIn} disabled={alreadyCheckedInToday}>
            {alreadyCheckedInToday ? "Checked in today" : "Check in today"}
          </Button>
        )}
      </div>

      <Table columns={columns} data={records} loading={loading} emptyMessage="No attendance records yet" />
    </div>
  );
};

export default StaffAttendance;
