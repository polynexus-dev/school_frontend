import React from "react";
import { useNavigate, useLocation } from "react-router-dom";
import SidebarItem from "./SidebarItem";
import useUser from "../../features/auth/hooks/useUser";
import Logo from "../../assets/campusnexus_logo.svg";
import {
  X,
  LayoutDashboard,
  GraduationCap,
  Users,
  CalendarCheck2,
  Bus,
  Wallet,
  Megaphone,
  Bell,
  Settings as SettingsIcon,
  ClipboardList,
  BookOpen,
  BookCheck,
  CalendarDays,
  ClipboardCheck,
  UserCheck,
  FileText,
  MessageSquare,
  MessageSquareWarning,
  CalendarClock,
  Building2,
  Library as LibraryIcon,
  Hotel,
  UserPlus,
  DoorOpen,
  FolderOpen,
  Award,
  Boxes,
  FileBarChart2,
  HeartPulse,
  FileCheck,
} from "lucide-react";
import VidyamLogoMark from "../../components/common/VidyamLogo";

// Matches Admin Web.dc.html's flat nav: Dashboard / Students / Parents &
// Linking / Attendance / Transport / Fees / Announcements / Settings.
// Face registration + Promote class live under Students (not separate nav
// items) — same as every Admin Web screen highlighting "Students" for those
// two sub-flows.
const navItems = [
  { label: "Dashboard", path: "/dashboard", icon: <LayoutDashboard size={17} /> },
  { label: "Students", path: "/students", icon: <GraduationCap size={17} />, matchPrefix: true },
  { label: "Syllabus Progress", path: "/syllabus-progress", icon: <BookCheck size={17} /> },
  { label: "Study Notes", path: "/study-notes", icon: <FileText size={17} /> },
  { label: "Paper Setting", path: "/paper-setting", icon: <ClipboardList size={17} />, matchPrefix: true },
  { label: "Homework", path: "/homework", icon: <BookOpen size={17} /> },


  { label: "Timetable", path: "/timetable", icon: <CalendarDays size={17} /> },
  { label: "Report Cards", path: "/report-cards", icon: <FileText size={17} /> },
  { label: "Messages", path: "/messages", icon: <MessageSquare size={17} /> },
  { label: "Principal Feedback", path: "/feedback", icon: <MessageSquareWarning size={17} /> },
  { label: "PTM", path: "/ptm", icon: <CalendarClock size={17} /> },
  { label: "Library", path: "/library", icon: <LibraryIcon size={17} /> },
  { label: "Hostel", path: "/hostel", icon: <Hotel size={17} /> },
  { label: "Visitor Log", path: "/visitors", icon: <UserPlus size={17} /> },
  { label: "Gate Passes", path: "/gate-passes", icon: <DoorOpen size={17} /> },
  { label: "Calendar", path: "/calendar", icon: <CalendarDays size={17} /> },
  { label: "Documents", path: "/documents", icon: <FolderOpen size={17} /> },
  { label: "Certificates", path: "/certificates", icon: <Award size={17} /> },
  { label: "Transfer Certificates", path: "/transfer-certificates", icon: <FileCheck size={17} /> },
  { label: "Infirmary", path: "/infirmary", icon: <HeartPulse size={17} /> },
  { label: "Inventory", path: "/inventory", icon: <Boxes size={17} /> },
  { label: "Reports", path: "/reports", icon: <FileBarChart2 size={17} /> },
  { label: "Chain Dashboard", path: "/chain-dashboard", icon: <Building2 size={17} /> },
  { label: "Leave", path: "/hr/leave", icon: <ClipboardCheck size={17} /> },
  { label: "Staff Attendance", path: "/hr/attendance", icon: <UserCheck size={17} /> },
  { label: "Parents & Linking", path: "/parents-linking", icon: <Users size={17} /> },
  { label: "Attendance", path: "/attendance", icon: <CalendarCheck2 size={17} /> },
  { label: "Transport", path: "/transport", icon: <Bus size={17} /> },
  { label: "Fees", path: "/fees", icon: <Wallet size={17} /> },
  { label: "Announcements", path: "/announcements", icon: <Megaphone size={17} /> },
  { label: "Notifications", path: "/notifications", icon: <Bell size={17} /> },
  { label: "Settings", path: "/settings", icon: <SettingsIcon size={17} /> },
];

const Sidebar = ({ onClose }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useUser();

  const profile = user?.data;
  // /profile/ nests user fields under `profile.user` (see UserProfileView) —
  // there's no top-level full_name/first_name/username on the profile itself.
  const fullName =
    profile?.full_name ||
    [profile?.user?.first_name, profile?.user?.last_name].filter(Boolean).join(" ") ||
    profile?.user?.username ||
    "School Office";
  const roleName = profile?.role || "Admin";
  const initials = fullName
    .split(" ")
    .filter(Boolean)
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2) || "SA";

  return (
    <aside
      className="h-full w-[240px] text-white flex flex-col justify-between p-4 px-3.5 overflow-hidden shrink-0"
      style={{ background: "linear-gradient(180deg, #3B0764, #4C1D95)" }}
    >
      <div className="flex flex-col flex-1 overflow-hidden">
        <div className="flex items-center gap-2.5 px-1.5 pb-5 border-b border-white/12 justify-between">
          <div className="flex items-center gap-2.5 min-w-0">
            <VidyamLogoMark size={34} />
            <div className="min-w-0">
              <div className="font-heading font-bold text-[14.5px] truncate">VIDYAM</div>
              <div className="text-white/50 text-[10.5px] font-semibold tracking-[0.06em]">SCHOOL EDITION</div>
            </div>
          </div>
          <button
            onClick={onClose}
            className="md:hidden p-1.5 rounded-lg text-white/80 hover:bg-white/10 hover:text-white transition-all cursor-pointer shrink-0"
          >
            <X size={18} />
          </button>
        </div>

        <nav className="flex flex-col gap-1 pt-4 overflow-y-auto custom-scrollbar">
          {navItems
            .filter((item) => {
              if (roleName === "Parent") {
                return ["Dashboard", "Homework", "Timetable", "Report Cards", "Messages", "PTM", "Calendar", "Documents", "Attendance", "Transport", "Fees", "Announcements", "Notifications"].includes(item.label);
              }
              if (roleName === "Teacher") {
                return ["Dashboard", "Students", "Paper Setting", "Homework", "Timetable", "Report Cards", "Messages", "PTM", "Library", "Gate Passes", "Calendar", "Documents", "Reports", "Attendance", "Transport", "Announcements", "Notifications", "Leave", "Staff Attendance"].includes(item.label);
              }
              if (roleName === "Conductor") {
                return ["Dashboard", "Transport", "Announcements", "Notifications", "Leave", "Staff Attendance", "Calendar", "Documents"].includes(item.label);
              }
              if (roleName === "Student") {
                return ["Dashboard", "Homework", "Timetable", "Report Cards", "Attendance", "Announcements", "Calendar", "Documents", "Notifications"].includes(item.label);
              }
              // Chain Dashboard spans schools, not scoped to one — only the
              // chain-owning SaaS Admin should see it, not per-school staff.
              if (item.label === "Chain Dashboard") {
                return roleName === "SaaS Admin";
              }
              return true; // School Admin, Management, Admin, SaaS Admin
            })
            .map((item) => {
              const isActive = item.matchPrefix
                ? location.pathname.startsWith(item.path)
                : location.pathname === item.path;
              return (
                <div
                  key={item.path}
                  onClick={() => {
                    navigate(item.path);
                    if (onClose) onClose();
                  }}
                >
                  <SidebarItem icon={item.icon} label={item.label} active={isActive} />
                </div>
              );
            })}
        </nav>
      </div>

      <div className="rounded-2xl bg-white/8 p-3 flex items-center gap-2.5 shrink-0">
        <div
          className="w-8 h-8 rounded-[10px] flex items-center justify-center font-bold text-[13px] shrink-0"
          style={{ background: "linear-gradient(135deg, #7C3AED, #A78BFA)" }}
        >
          {initials}
        </div>
        <div className="min-w-0 flex-1">
          <div className="text-[12.5px] font-bold truncate">{fullName}</div>
          <div className="text-white/50 text-[10.5px] truncate">
            {roleName === 'Parent' ? 'Parent Portal' : roleName === 'Teacher' ? 'Teacher Portal' : roleName === 'Conductor' ? 'Conductor Portal' : roleName === 'Student' ? 'Student Portal' : `School Office · ${roleName}`}
          </div>
        </div>
      </div>
    </aside>
  );
};

export default Sidebar;
