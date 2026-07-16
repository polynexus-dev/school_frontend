import React from "react";
import { Bell } from "lucide-react";

const NotificationButton = () => {
  return (
    <button className="w-[42px] h-[42px] bg-violet-950 flex items-center justify-center rounded-xl border border-violet-900 text-white hover:bg-violet-900 transition-all duration-200 cursor-pointer outline-none shrink-0">
      <Bell size={16} />
    </button>
  );
};

export default NotificationButton;
