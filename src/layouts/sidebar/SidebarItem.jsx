import React from "react";

const SidebarItem = ({ icon, label, active }) => {
  return (
    <div
      className={`group flex items-center gap-3 px-3.5 py-2.5 rounded-xl cursor-pointer transition-all duration-150 ${
        active ? "bg-white/14 text-white font-bold" : "text-white/70 hover:bg-white/10 hover:text-white font-semibold"
      }`}
    >
      <span className={`w-[18px] h-[18px] flex items-center justify-center shrink-0 transition-all duration-150 ${active ? "text-white" : "text-white/70 group-hover:text-white"}`}>
        {icon}
      </span>
      <span className="text-[13.5px] tracking-wide">{label}</span>
    </div>
  );
};

export default SidebarItem;
