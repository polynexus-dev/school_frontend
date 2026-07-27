import React, { useEffect, useMemo, useState } from "react";
import { toast } from "react-toastify";
import { Building2, Users, GraduationCap, CalendarCheck2, Wallet, AlertTriangle, ClipboardCheck } from "lucide-react";
import SelectBox from "../../../components/SelectBox";
import Table from "../../../components/Table";
import chainService from "../services/chainService";

const asList = (data) => (Array.isArray(data) ? data : data?.results || []);
const currency = (n) => `Rs. ${Number(n || 0).toLocaleString("en-IN")}`;

const ChainDashboard = () => {
  const [chains, setChains] = useState([]);
  const [chainId, setChainId] = useState("");
  const [dashboard, setDashboard] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const res = await chainService.getChains();
        const list = asList(res.data);
        setChains(list);
        if (list.length > 0) setChainId(String(list[0].id));
      } catch (err) {
        console.error("Failed to load school chains:", err);
        toast.error("Failed to load school chains.");
      }
    })();
  }, []);

  useEffect(() => {
    if (!chainId) return;
    setLoading(true);
    chainService
      .getChainDashboard(chainId)
      .then((res) => setDashboard(res.data))
      .catch((err) => {
        console.error("Failed to load chain dashboard:", err);
        toast.error("Failed to load chain dashboard.");
      })
      .finally(() => setLoading(false));
  }, [chainId]);

  const chainOptions = useMemo(() => chains.map((c) => ({ label: `${c.name} (${c.school_count} schools)`, value: String(c.id) })), [chains]);

  const totals = dashboard?.totals;
  const summaryCards = [
    { label: "Total Students", value: totals?.total_students, icon: <GraduationCap size={20} />, tint: "bg-violet-50 text-violet-700" },
    { label: "Total Staff", value: totals?.total_staff, icon: <Users size={20} />, tint: "bg-info-tint text-info-hex" },
    { label: "Avg. Attendance Today", value: totals?.attendance_today_pct != null ? `${totals.attendance_today_pct}%` : "—", icon: <CalendarCheck2 size={20} />, tint: "bg-success-tint text-success-hex" },
    { label: "Fees Collected (This Month)", value: currency(totals?.fees_collected_this_month), icon: <Wallet size={20} />, tint: "bg-violet-50 text-violet-700" },
    { label: "Fees Outstanding", value: currency(totals?.fees_outstanding), icon: <AlertTriangle size={20} />, tint: "bg-warning-tint text-warning-hex" },
    { label: "Pending Leave Requests", value: totals?.pending_leave_requests_count, icon: <ClipboardCheck size={20} />, tint: "bg-info-tint text-info-hex" },
  ];

  const columns = [
    { header: "School", accessor: (row) => <span className="font-semibold text-ink-900">{row.school_name}</span> },
    { header: "Students", accessor: "total_students" },
    { header: "Staff", accessor: "total_staff" },
    { header: "Attendance Today", accessor: (row) => (row.attendance_today_pct != null ? `${row.attendance_today_pct}%` : "—") },
    { header: "Fees Collected", accessor: (row) => currency(row.fees_collected_this_month) },
    { header: "Fees Outstanding", accessor: (row) => currency(row.fees_outstanding) },
    { header: "Pending Leave", accessor: "pending_leave_requests_count" },
  ];

  return (
    <div className="w-full">
      <div className="flex items-center gap-3 pb-4 border-b border-cn-border mb-6 flex-wrap">
        <div className="flex-1 min-w-0">
          <h1 className="font-heading font-bold text-2xl text-violet-950 flex items-center gap-2">
            <Building2 size={22} className="text-violet-700" />
            Chain Dashboard
          </h1>
          <p className="text-ink-500 text-[13px] mt-1">Cross-school comparison and consolidated totals</p>
        </div>
        {chains.length > 1 && (
          <SelectBox className="w-64" label="Chain" fieldName="chain" value={chainId} onChange={(e) => setChainId(e.target.value)} options={chainOptions} />
        )}
      </div>

      {chains.length === 0 ? (
        <p className="text-ink-400 text-[13px]">No school chains configured yet.</p>
      ) : (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
            {summaryCards.map((card) => (
              <div key={card.label} className="bg-cn-surface border border-cn-border rounded-2xl p-5 shadow-sm">
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center mb-4 ${card.tint}`}>{card.icon}</div>
                <div className="font-heading font-extrabold text-[22px] text-ink-900">{loading ? "…" : card.value ?? "—"}</div>
                <div className="text-[13px] text-ink-500 mt-1 font-medium">{card.label}</div>
              </div>
            ))}
          </div>

          <h2 className="font-heading font-semibold text-base text-ink-900 mb-3">Per-school comparison</h2>
          <Table columns={columns} data={dashboard?.schools || []} loading={loading} emptyMessage="No schools in this chain" />
        </>
      )}
    </div>
  );
};

export default ChainDashboard;
