import React, { useEffect, useRef, useState } from "react";
import { ChevronDown, LogOut, User } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import useUser from "../../features/auth/hooks/useUser";
import authService from "../../features/auth/services/authService";

const ProfileButton = () => {
  const [open, setOpen] = useState(false);
  const dropdownRef = useRef();
  const { user, setUser } = useUser();
  const navigate = useNavigate();

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleLogout = () => {
    authService.logout();
    setUser(null);
    setOpen(false);
    navigate("/login");
  };

  const profile = user?.data;
  // /profile/ nests user fields under `profile.user` (see UserProfileView) —
  // there's no top-level full_name/first_name/username on the profile itself.
  const displayName =
    profile?.full_name ||
    [profile?.user?.first_name, profile?.user?.last_name].filter(Boolean).join(" ") ||
    profile?.user?.username ||
    "Guest";
  const initials = displayName
    .split(" ")
    .filter(Boolean)
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2) || "U";

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        className="flex cursor-pointer items-center justify-center gap-2 h-[42px] px-3.5 rounded-xl bg-violet-950 border border-violet-900 text-white hover:bg-violet-900 transition-all duration-200 outline-none"
        onClick={() => setOpen((prev) => !prev)}
      >
        <span className="w-7 h-7 rounded-full bg-gradient-to-br from-violet-500 to-violet-300 flex items-center justify-center text-[11px] font-bold shrink-0">
          {initials}
        </span>
        <span className="text-[13px] font-semibold tracking-wide truncate max-w-[100px]">{displayName}</span>
        <ChevronDown size={14} className={`text-white/80 transition-transform duration-200 ${open ? "rotate-180" : ""}`} />
      </button>

      {open && (
        <div className="absolute right-0 mt-2 w-64 bg-white shadow-[0_12px_40px_rgba(59,7,100,.14)] rounded-xl border border-cn-border z-50 p-2">
          {profile && (
            <div className="flex items-center gap-3 p-2.5 pb-3 border-b border-cn-border">
              <span className="w-10 h-10 rounded-full bg-gradient-to-br from-violet-500 to-violet-300 flex items-center justify-center text-xs font-bold text-white">
                {initials}
              </span>
              <div className="min-w-0">
                <p className="font-semibold text-sm text-ink-900 truncate">{displayName}</p>
                <p className="text-xs text-ink-500 truncate">{profile?.email || profile?.username}</p>
              </div>
            </div>
          )}

          <ul className="text-sm text-ink-700 mt-2 space-y-0.5">
            <li className="py-2 px-3 hover:bg-violet-50 rounded-lg cursor-pointer transition-colors duration-150" onClick={() => setOpen(false)}>
              <Link to="/settings" className="flex items-center gap-2 text-ink-700 hover:text-ink-900 w-full">
                <User size={15} className="text-ink-400" />
                <span>Profile Settings</span>
              </Link>
            </li>
          </ul>
          <button
            className="w-full mt-1.5 py-2 px-3 text-sm text-red-500 hover:bg-red-50/60 hover:text-red-600 flex items-center gap-2 rounded-lg cursor-pointer transition-colors duration-150"
            onClick={handleLogout}
          >
            <LogOut size={15} /> <span>Logout</span>
          </button>
        </div>
      )}
    </div>
  );
};

export default ProfileButton;
