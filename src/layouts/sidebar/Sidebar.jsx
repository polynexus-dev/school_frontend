import React, { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import useUser from "../../features/auth/hooks/useUser";
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
  ChevronDown,
  ChevronRight,
  ShieldCheck,
} from "lucide-react";
import VidyamLogoMark from "../../components/common/VidyamLogo";

// Grouped Enterprise Domain Hierarchy
const domainCategories = [
  {
    id: "academics",
    label: "Academics & Teaching",
    icon: <GraduationCap size={16} />,
    items: [
      { label: "Students", path: "/students", icon: <GraduationCap size={16} />, matchPrefix: true },
      { label: "Syllabus Progress", path: "/syllabus-progress", icon: <BookCheck size={16} /> },
      { label: "Study Notes", path: "/study-notes", icon: <FileText size={16} /> },
      { label: "Paper Setting", path: "/paper-setting", icon: <ClipboardList size={16} />, matchPrefix: true },
      { label: "Homework", path: "/homework", icon: <BookOpen size={16} /> },
      { label: "Timetable", path: "/timetable", icon: <CalendarDays size={16} /> },
      { label: "Attendance", path: "/attendance", icon: <CalendarCheck2 size={16} /> },
      { label: "Report Cards", path: "/report-cards", icon: <FileText size={16} /> },
    ],
  },
  {
    id: "communication",
    label: "Communication & PTM",
    icon: <MessageSquare size={16} />,
    items: [
      { label: "Messages", path: "/messages", icon: <MessageSquare size={16} /> },
      { label: "Principal Feedback", path: "/feedback", icon: <MessageSquareWarning size={16} /> },
      { label: "PTM Meetings", path: "/ptm", icon: <CalendarClock size={16} /> },
      { label: "Announcements", path: "/announcements", icon: <Megaphone size={16} /> },
      { label: "Calendar", path: "/calendar", icon: <CalendarDays size={16} /> },
      { label: "Notifications", path: "/notifications", icon: <Bell size={16} /> },
    ],
  },
  {
    id: "safety",
    label: "Campus Safety & Gate",
    icon: <ShieldCheck size={16} />,
    items: [
      { label: "Visitor Log", path: "/visitors", icon: <UserPlus size={16} /> },
      { label: "Gate Passes", path: "/gate-passes", icon: <DoorOpen size={16} /> },
    ],
  },
  {
    id: "operations",
    label: "Operations & Facilities",
    icon: <Building2 size={16} />,
    items: [
      { label: "Transport & GPS", path: "/transport", icon: <Bus size={16} /> },
      { label: "Fees & Collections", path: "/fees", icon: <Wallet size={16} /> },
      { label: "Parents & Linking", path: "/parents-linking", icon: <Users size={16} /> },
      { label: "Library System", path: "/library", icon: <LibraryIcon size={16} /> },
      { label: "Hostel Occupancy", path: "/hostel", icon: <Hotel size={16} /> },
      { label: "Infirmary & CWSN", path: "/infirmary", icon: <HeartPulse size={16} /> },
      { label: "Inventory Log", path: "/inventory", icon: <Boxes size={16} /> },
      { label: "Documents Vault", path: "/documents", icon: <FolderOpen size={16} /> },
      { label: "Certificates", path: "/certificates", icon: <Award size={16} /> },
      { label: "Transfer Certificates", path: "/transfer-certificates", icon: <FileCheck size={16} /> },
    ],
  },
  {
    id: "hr",
    label: "HR & Staff Governance",
    icon: <UserCheck size={16} />,
    items: [
      { label: "Staff Attendance", path: "/hr/attendance", icon: <UserCheck size={16} /> },
      { label: "Staff Leave Requests", path: "/hr/leave", icon: <ClipboardCheck size={16} /> },
      { label: "Chain Dashboard", path: "/chain-dashboard", icon: <Building2 size={16} /> },
    ],
  },
  {
    id: "reports",
    label: "Reports & Compliance",
    icon: <FileBarChart2 size={16} />,
    items: [
      { label: "Executive Reports", path: "/reports", icon: <FileBarChart2 size={16} /> },
      { label: "Board Compliance", path: "/reports/board-compliance", icon: <FileCheck size={16} /> },
    ],
  },
];

const labelToModuleMap = {
  "Attendance": "attendance",
  "Fees & Collections": "fees",
  "Gate Passes": "gate_passes",
  "Visitor Log": "gate_passes",
  "Certificates": "certificates",
  "Transfer Certificates": "transfer_certificates",
  "Infirmary & CWSN": "infirmary",
  "Inventory Log": "inventory",
  "Staff Leave Requests": "leave",
  "Staff Attendance": "staff_attendance",
  "Transport & GPS": "transport",
  "Announcements": "announcements",
  "Executive Reports": "reports",
  "PTM Meetings": "ptm",
  "Library System": "library",
};

const Sidebar = ({ onClose }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useUser();

  const profile = user?.data;
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

  const delegatedModules = profile?.delegated_modules || [];

  // Filter items based on user role and permissions
  const isItemVisible = (item) => {
    const moduleCode = labelToModuleMap[item.label];
    if (moduleCode && delegatedModules.includes(moduleCode)) {
      return true;
    }
    if (roleName === "Parent") {
      return ["Dashboard", "Homework", "Timetable", "Report Cards", "Messages", "PTM Meetings", "Calendar", "Documents Vault", "Attendance", "Transport & GPS", "Fees & Collections", "Announcements", "Notifications"].includes(item.label);
    }
    if (roleName === "Teacher") {
      return ["Dashboard", "Students", "Syllabus Progress", "Study Notes", "Paper Setting", "Homework", "Timetable", "Report Cards", "Messages", "Principal Feedback", "PTM Meetings", "Library System", "Hostel Occupancy", "Visitor Log", "Gate Passes", "Calendar", "Documents Vault", "Certificates", "Transfer Certificates", "Infirmary & CWSN", "Executive Reports", "Board Compliance", "Staff Leave Requests", "Staff Attendance", "Attendance", "Transport & GPS", "Announcements", "Notifications", "Settings"].includes(item.label);
    }
    if (roleName === "Conductor") {
      return ["Dashboard", "Transport & GPS", "Announcements", "Notifications", "Staff Leave Requests", "Staff Attendance", "Calendar", "Documents Vault", "Settings"].includes(item.label);
    }
    if (roleName === "Student") {
      return ["Dashboard", "Homework", "Timetable", "Report Cards", "Attendance", "Announcements", "Calendar", "Documents Vault", "Notifications", "Settings"].includes(item.label);
    }
    if (item.label === "Chain Dashboard") {
      return roleName === "SaaS Admin";
    }
    return true;
  };

  // Determine active category based on current URL path
  const getActiveCategoryId = () => {
    for (const cat of domainCategories) {
      if (cat.items.some((item) => item.matchPrefix ? location.pathname.startsWith(item.path) : location.pathname === item.path)) {
        return cat.id;
      }
    }
    return null;
  };

  const [expandedCategories, setExpandedCategories] = useState(() => {
    const activeCatId = getActiveCategoryId();
    return activeCatId ? { [activeCatId]: true } : { academics: true };
  });

  useEffect(() => {
    const activeCatId = getActiveCategoryId();
    if (activeCatId) {
      setExpandedCategories((prev) => ({ ...prev, [activeCatId]: true }));
    }
  }, [location.pathname]);

  const toggleCategory = (catId) => {
    setExpandedCategories((prev) => ({ ...prev, [catId]: !prev[catId] }));
  };

  return (
    <aside
      className="h-full w-[250px] text-white flex flex-col justify-between p-4 px-3 overflow-hidden shrink-0 shadow-xl"
      style={{ background: "linear-gradient(180deg, #2E0854, #4C1D95)" }}
    >
      <div className="flex flex-col flex-1 overflow-hidden">
        {/* Brand Header */}
        <div className="flex items-center gap-2.5 px-2 pb-4 border-b border-white/10 justify-between">
          <div className="flex items-center gap-2.5 min-w-0">
            <VidyamLogoMark size={32} />
            <div className="min-w-0">
              <div className="font-heading font-extrabold text-[15px] tracking-wide text-white">VIDYAM</div>
              <div className="text-violet-200/60 text-[10px] font-bold tracking-[0.08em] uppercase">School Operating OS</div>
            </div>
          </div>
          <button
            onClick={onClose}
            className="md:hidden p-1.5 rounded-lg text-white/80 hover:bg-white/10 hover:text-white transition-all cursor-pointer shrink-0"
          >
            <X size={18} />
          </button>
        </div>

        {/* Scrollable Grouped Navigation */}
        <nav className="flex flex-col gap-1.5 pt-3 overflow-y-auto custom-scrollbar pr-1">
          {/* Top Anchor: Dashboard */}
          <button
            onClick={() => {
              navigate("/dashboard");
              if (onClose) onClose();
            }}
            className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              location.pathname === "/dashboard"
                ? "bg-white/20 text-white shadow-md border border-white/20"
                : "text-violet-200/80 hover:bg-white/10 hover:text-white"
            }`}
          >
            <LayoutDashboard size={17} className={location.pathname === "/dashboard" ? "text-amber-300" : ""} />
            <span>Dashboard</span>
          </button>

          {/* Grouped Accordion Categories */}
          {domainCategories.map((cat) => {
            const visibleItems = cat.items.filter(isItemVisible);
            if (visibleItems.length === 0) return null;

            const isExpanded = !!expandedCategories[cat.id];
            const hasActiveChild = visibleItems.some((item) =>
              item.matchPrefix ? location.pathname.startsWith(item.path) : location.pathname === item.path
            );

            return (
              <div key={cat.id} className="rounded-xl overflow-hidden transition-all">
                {/* Category Header */}
                <button
                  onClick={() => toggleCategory(cat.id)}
                  className={`w-full flex items-center justify-between px-3 py-2 text-[11.5px] font-bold tracking-wider uppercase transition-all cursor-pointer rounded-xl ${
                    hasActiveChild
                      ? "text-amber-300 bg-white/10"
                      : "text-violet-200/70 hover:text-white hover:bg-white/5"
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <span className={hasActiveChild ? "text-amber-300" : "text-violet-300"}>{cat.icon}</span>
                    <span className="truncate">{cat.label}</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="px-1.5 py-0.2 text-[9px] font-extrabold rounded-full bg-white/15 text-white/90">
                      {visibleItems.length}
                    </span>
                    {isExpanded ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
                  </div>
                </button>

                {/* Sub-Items Accordion Content */}
                {isExpanded && (
                  <div className="flex flex-col gap-0.5 mt-1 ml-2.5 pl-2 border-l border-white/15 animate-in fade-in duration-150">
                    {visibleItems.map((item) => {
                      const isActive = item.matchPrefix
                        ? location.pathname.startsWith(item.path)
                        : location.pathname === item.path;

                      return (
                        <button
                          key={item.path}
                          onClick={() => {
                            navigate(item.path);
                            if (onClose) onClose();
                          }}
                          className={`w-full flex items-center gap-2.5 px-2.5 py-2 rounded-lg text-xs font-semibold transition-all cursor-pointer text-left ${
                            isActive
                              ? "bg-white text-purple-950 font-bold shadow-md transform translate-x-0.5"
                              : "text-violet-200/80 hover:bg-white/10 hover:text-white"
                          }`}
                        >
                          <span className={isActive ? "text-purple-700" : "text-violet-300"}>{item.icon}</span>
                          <span className="truncate">{item.label}</span>
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}

          {/* Bottom Anchor: Settings */}
          {isItemVisible({ label: "Settings" }) && (
            <button
              onClick={() => {
                navigate("/settings");
                if (onClose) onClose();
              }}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer mt-1 ${
                location.pathname === "/settings"
                  ? "bg-white/20 text-white shadow-md border border-white/20"
                  : "text-violet-200/80 hover:bg-white/10 hover:text-white"
              }`}
            >
              <SettingsIcon size={17} className={location.pathname === "/settings" ? "text-amber-300" : ""} />
              <span>Settings &amp; Policies</span>
            </button>
          )}
        </nav>
      </div>

      {/* User Footer Card */}
      <div className="rounded-2xl bg-white/10 backdrop-blur-md p-3 flex items-center gap-2.5 shrink-0 border border-white/10 mt-2">
        <div
          className="w-8 h-8 rounded-xl flex items-center justify-center font-bold text-[13px] shrink-0 text-white shadow-sm"
          style={{ background: "linear-gradient(135deg, #7C3AED, #A78BFA)" }}
        >
          {initials}
        </div>
        <div className="min-w-0 flex-1">
          <div className="text-[12px] font-bold truncate text-white">{fullName}</div>
          <div className="text-violet-200/60 text-[10px] truncate font-medium">
            {roleName === "Parent"
              ? "Parent Portal"
              : roleName === "Teacher"
              ? "Teacher Portal"
              : roleName === "Conductor"
              ? "Conductor Portal"
              : roleName === "Student"
              ? "Student Portal"
              : `School Office · ${roleName}`}
          </div>
        </div>
      </div>
    </aside>
  );
};

export default Sidebar;
