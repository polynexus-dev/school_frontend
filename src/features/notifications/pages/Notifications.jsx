import React, { useState } from "react";
import { toast } from "react-toastify";
import {
  Bell, Wallet, CalendarCheck2, Megaphone, Users, GraduationCap, FileText, ArrowUpCircle, Info,
} from "lucide-react";
import Button from "../../../components/Button";
import Pagination from "../../../components/Pagination";
import usePaginatedList from "../../../hooks/usePaginatedList";
import notificationService from "../services/notificationService";

const TYPE_ICON = {
  fee_invoice: Wallet,
  fee_payment: Wallet,
  attendance_correction: CalendarCheck2,
  announcement: Megaphone,
  guardian_link: Users,
  marks_published: GraduationCap,
  report_card: FileText,
  promotion: ArrowUpCircle,
  general: Info,
};

const timeAgo = (iso) => {
  const diffMs = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diffMs / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
};

const Notifications = () => {
  const [filter, setFilter] = useState("all"); // 'all' | 'unread'
  const [markingAll, setMarkingAll] = useState(false);

  const params = filter === "unread" ? { is_read: "false" } : {};
  const {
    items: notifications,
    page,
    setPage,
    totalPages,
    count,
    pageSize,
    loading,
    refetch,
  } = usePaginatedList(notificationService.getNotifications, params);

  const handleMarkRead = async (n) => {
    if (n.is_read) return;
    try {
      await notificationService.markRead(n.id);
      refetch();
    } catch (err) {
      console.error("Failed to mark notification read:", err);
      toast.error("Failed to mark notification as read.");
    }
  };

  const handleMarkAllRead = async () => {
    setMarkingAll(true);
    try {
      await notificationService.markAllRead();
      refetch();
    } catch (err) {
      console.error("Failed to mark all notifications read:", err);
      toast.error("Failed to mark all as read.");
    } finally {
      setMarkingAll(false);
    }
  };

  return (
    <div className="w-full">
      <div className="flex items-center gap-3 pb-4 border-b border-cn-border mb-6 flex-wrap">
        <div className="flex-1 min-w-0">
          <h1 className="font-heading font-bold text-2xl text-violet-950">Notifications</h1>
          <p className="text-ink-500 text-[13px] mt-1">Fees, corrections, announcements, promotions and more</p>
        </div>
        <div className="flex gap-1.5 bg-cn-bg border border-cn-border rounded-xl p-1">
          <button
            type="button"
            onClick={() => setFilter("all")}
            className={`px-3.5 py-1.5 rounded-lg text-[12.5px] font-bold cursor-pointer transition ${
              filter === "all" ? "bg-violet-700 text-white" : "text-ink-500 hover:bg-white"
            }`}
          >
            All
          </button>
          <button
            type="button"
            onClick={() => setFilter("unread")}
            className={`px-3.5 py-1.5 rounded-lg text-[12.5px] font-bold cursor-pointer transition ${
              filter === "unread" ? "bg-violet-700 text-white" : "text-ink-500 hover:bg-white"
            }`}
          >
            Unread
          </button>
        </div>
        <Button variant="outline" onClick={handleMarkAllRead} loading={markingAll}>
          Mark all read
        </Button>
      </div>

      <div className="flex flex-col gap-2.5">
        {loading && <div className="text-center text-ink-400 text-sm py-10">Loading…</div>}
        {!loading && notifications.length === 0 && (
          <div className="bg-cn-surface border border-cn-border rounded-2xl p-10 text-center text-ink-400 text-sm flex flex-col items-center gap-2">
            <Bell size={22} className="text-ink-300" />
            {filter === "unread" ? "No unread notifications." : "No notifications yet."}
          </div>
        )}
        {notifications.map((n) => {
          const Icon = TYPE_ICON[n.notification_type] || Info;
          return (
            <button
              key={n.id}
              type="button"
              onClick={() => handleMarkRead(n)}
              className={`text-left bg-cn-surface border rounded-2xl p-4 flex items-start gap-3.5 transition cursor-pointer hover:border-violet-300 ${
                n.is_read ? "border-cn-border opacity-70" : "border-violet-200"
              }`}
            >
              <div
                className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${
                  n.is_read ? "bg-cn-bg text-ink-400" : "bg-violet-100 text-violet-700"
                }`}
              >
                <Icon size={16} />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="text-[13.5px] font-bold text-ink-900 truncate">{n.title}</span>
                  {!n.is_read && <span className="w-1.5 h-1.5 rounded-full bg-violet-600 shrink-0" />}
                </div>
                {n.message && <div className="text-[12.5px] text-ink-500 mt-0.5 leading-relaxed">{n.message}</div>}
                <div className="text-[11px] text-ink-400 mt-1.5">{timeAgo(n.created_at)}</div>
              </div>
            </button>
          );
        })}
      </div>
      <Pagination page={page} totalPages={totalPages} count={count} pageSize={pageSize} onPageChange={setPage} loading={loading} />
    </div>
  );
};

export default Notifications;
