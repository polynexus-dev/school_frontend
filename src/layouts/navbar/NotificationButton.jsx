import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Bell } from "lucide-react";
import notificationService from "../../features/notifications/services/notificationService";

const POLL_INTERVAL_MS = 60000;

const NotificationButton = () => {
  const navigate = useNavigate();
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    let cancelled = false;
    const fetchCount = async () => {
      try {
        const res = await notificationService.getUnreadCount();
        if (!cancelled) setUnreadCount(res.data?.unread_count || 0);
      } catch (err) {
        console.error("Failed to fetch unread notification count:", err);
      }
    };
    fetchCount();
    const interval = setInterval(fetchCount, POLL_INTERVAL_MS);
    return () => {
      cancelled = true;
      clearInterval(interval);
    };
  }, []);

  return (
    <button
      onClick={() => navigate("/notifications")}
      className="relative w-[42px] h-[42px] bg-violet-950 flex items-center justify-center rounded-xl border border-violet-900 text-white hover:bg-violet-900 transition-all duration-200 cursor-pointer outline-none shrink-0"
    >
      <Bell size={16} />
      {unreadCount > 0 && (
        <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] px-1 rounded-full bg-error-hex text-white text-[10px] font-extrabold flex items-center justify-center border-2 border-[#1B1723]">
          {unreadCount > 9 ? "9+" : unreadCount}
        </span>
      )}
    </button>
  );
};

export default NotificationButton;
