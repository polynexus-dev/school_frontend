import React from "react";
import SearchBar from "./SearchBar";
import NotificationButton from "./NotificationButton";
import ProfileButton from "./ProfileButton";
import { Menu } from "lucide-react";

const Navbar = ({ onToggleSidebar }) => {
  return (
    <div className="flex items-center gap-3 w-full">
      <button
        onClick={onToggleSidebar}
        className="md:hidden w-[42px] h-[42px] bg-violet-950 text-white border border-violet-900 rounded-xl hover:bg-violet-900 transition shadow-sm cursor-pointer shrink-0 flex items-center justify-center outline-none"
      >
        <Menu size={18} />
      </button>

      <div className="flex-1 min-w-0">
        <SearchBar />
      </div>

      <div className="flex gap-3 shrink-0 items-center">
        <NotificationButton />
        <ProfileButton />
      </div>
    </div>
  );
};

export default Navbar;
