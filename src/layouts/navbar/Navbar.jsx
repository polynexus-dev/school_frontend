import React from "react";
import SearchBar from "./SearchBar";
import NotificationButton from "./NotificationButton";
import ProfileButton from "./ProfileButton";
import useUser from "../../features/auth/hooks/useUser";
import { Menu, PanelLeftClose, PanelLeftOpen } from "lucide-react";

const Navbar = ({ onToggleSidebar, isCollapsed, onToggleCollapse }) => {
  const { user } = useUser();
  const profile = user?.data;
  const tenantName = profile?.tenant || "Vidyam School";
  const initials = tenantName.charAt(0).toUpperCase();

  return (
    <div className="flex items-center gap-3 w-full">
      {/* Mobile Drawer Trigger */}
      <button
        onClick={onToggleSidebar}
        title="Open Sidebar"
        className="md:hidden w-[40px] h-[40px] bg-violet-950 text-white border border-violet-900 rounded-xl hover:bg-violet-900 transition shadow-sm cursor-pointer shrink-0 flex items-center justify-center outline-none"
      >
        <Menu size={18} />
      </button>

      {/* Desktop Collapse / Expand Toggle */}
      <button
        onClick={onToggleCollapse}
        title={isCollapsed ? "Expand Sidebar" : "Minimize Sidebar"}
        className="hidden md:flex w-[38px] h-[38px] bg-violet-50 text-violet-900 border border-violet-200/80 rounded-xl hover:bg-violet-100 transition shadow-2xs cursor-pointer shrink-0 items-center justify-center outline-none"
      >
        {isCollapsed ? <PanelLeftOpen size={18} /> : <PanelLeftClose size={18} />}
      </button>

      <div className="flex-1 min-w-0">
        <SearchBar />
      </div>

      <div className="flex gap-2.5 shrink-0 items-center">
        {/* School Logo & Tenant Badge */}
        <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 bg-violet-50/70 border border-violet-200/80 rounded-xl text-violet-950 shadow-2xs select-none">
          <div className="w-5 h-5 rounded-md bg-gradient-to-tr from-violet-600 to-indigo-600 text-white flex items-center justify-center font-bold text-[11px] shrink-0 shadow-xs">
            {initials}
          </div>
          <span className="text-xs font-bold truncate max-w-[130px]">{tenantName}</span>
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse shrink-0" title="Institution Portal Online"></span>
        </div>

        <NotificationButton />
        <ProfileButton />
      </div>
    </div>
  );
};

export default Navbar;

