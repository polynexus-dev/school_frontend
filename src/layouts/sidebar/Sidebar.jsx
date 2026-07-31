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
  Landmark,
  BookText,
  PanelLeftClose,
  PanelLeftOpen,
} from "lucide-react";
import VidyamLogoMark from "../../components/common/VidyamLogo";

// Grouped Enterprise Domain Hierarchy
const domainCategories = [
  {
    id: "academics",
    label: "Academics & Teaching",
    icon: <GraduationCap size={17} />,
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
    icon: <MessageSquare size={17} />,
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
    icon: <ShieldCheck size={17} />,
    items: [
      { label: "Visitor Log", path: "/visitors", icon: <UserPlus size={16} /> },
      { label: "Gate Passes", path: "/gate-passes", icon: <DoorOpen size={16} /> },
    ],
  },
  {
    id: "operations",
    label: "Operations & Facilities",
    icon: <Building2 size={17} />,
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
    id: "accounting",
    label: "Accounting & Ledger",
    icon: <Landmark size={17} />,
    items: [
      { label: "Chart of Accounts", path: "/accounting/chart-of-accounts", icon: <Landmark size={16} /> },
      { label: "Journal Entries", path: "/accounting/journal-entries", icon: <BookText size={16} /> },
    ],
  },
  {
    id: "hr",
    label: "HR & Staff Governance",
    icon: <UserCheck size={17} />,
    items: [
      { label: "Staff Attendance", path: "/hr/attendance", icon: <UserCheck size={16} /> },
      { label: "Staff Leave Requests", path: "/hr/leave", icon: <ClipboardCheck size={16} /> },
      { label: "Chain Dashboard", path: "/chain-dashboard", icon: <Building2 size={16} /> },
    ],
  },
  {
    id: "reports",
    label: "Reports & Compliance",
    icon: <FileBarChart2 size={17} />,
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
  "Chart of Accounts": "accounting",
  "Journal Entries": "accounting",
};

const Sidebar = ({
  onClose,
  isCollapsed = false,
  onToggleCollapse,
  onStartResizing,
  onResetWidth,
  currentWidth = 250,
}) => {
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
      className="h-full w-full text-white flex flex-col justify-between p-3 select-none overflow-hidden shrink-0 shadow-xl relative"
      style={{ background: "linear-gradient(180deg, #2E0854 0%, #3B0764 50%, #4C1D95 100%)" }}
    >
      {/* Resizer Handle on Desktop Right Edge */}
      {onStartResizing && (
        <div
          onMouseDown={onStartResizing}
          onDoubleClick={onResetWidth}
          title={`Drag to adjust width (${currentWidth}px) | Double click to reset`}
          className="hidden md:block absolute top-0 right-0 w-2 h-full cursor-ew-resize group/resizer z-50 hover:bg-violet-400/40 transition-colors"
        >
          <div className="w-1 h-10 bg-white/40 group-hover/resizer:bg-amber-300 rounded-full absolute top-1/2 -translate-y-1/2 right-0.5 opacity-0 group-hover/resizer:opacity-100 transition-all shadow-sm" />
        </div>
      )}

      <div className="flex flex-col flex-1 overflow-hidden">
        {/* Brand Header */}
        <div className={`flex items-center pb-3 border-b border-white/10 ${isCollapsed ? "justify-center px-0" : "justify-between px-2"}`}>
          <div className={`flex items-center gap-2.5 min-w-0 ${isCollapsed ? "justify-center" : ""}`}>
            <div className="shrink-0 cursor-pointer" onClick={isCollapsed ? onToggleCollapse : undefined} title="VIDYAM School OS">
              <VidyamLogoMark size={isCollapsed ? 30 : 32} />
            </div>
            {!isCollapsed && (
              <div className="min-w-0 flex-1">
                <div className="font-heading font-extrabold text-[15px] tracking-wide text-white truncate">VIDYAM</div>
                <div className="text-violet-200/60 text-[9.5px] font-bold tracking-[0.08em] uppercase truncate">School Operating OS</div>
              </div>
            )}
          </div>

          <div className="flex items-center gap-1 shrink-0">
            {/* Collapse/Expand Toggle Button on Sidebar Header */}
            {!isCollapsed && onToggleCollapse && (
              <button
                onClick={onToggleCollapse}
                title="Minimize Sidebar"
                className="hidden md:flex p-1.5 rounded-lg text-white/70 hover:bg-white/10 hover:text-white transition-all cursor-pointer"
              >
                <PanelLeftClose size={17} />
              </button>
            )}

            {/* Mobile Close Button */}
            <button
              onClick={onClose}
              title="Close Navigation"
              className="md:hidden p-1.5 rounded-lg text-white/80 hover:bg-white/10 hover:text-white transition-all cursor-pointer"
            >
              <X size={18} />
            </button>
          </div>
        </div>

        {/* Scrollable Grouped Navigation */}
        <nav className="flex flex-col gap-1.5 pt-3 overflow-y-auto custom-scrollbar pr-1 flex-1">
          {/* Top Anchor: Dashboard */}
          {isCollapsed ? (
            <div className="relative group/dash flex justify-center">
              <button
                onClick={() => {
                  navigate("/dashboard");
                  if (onClose) onClose();
                }}
                className={`w-10 h-10 flex items-center justify-center rounded-xl transition-all cursor-pointer ${
                  location.pathname === "/dashboard"
                    ? "bg-white/25 text-amber-300 border border-white/30 shadow-md"
                    : "text-violet-200/80 hover:bg-white/10 hover:text-white"
                }`}
                title="Dashboard"
              >
                <LayoutDashboard size={18} className={location.pathname === "/dashboard" ? "text-amber-300" : ""} />
              </button>
              {/* Tooltip */}
              <div className="hidden group-hover/dash:flex fixed left-[74px] bg-purple-950 border border-violet-400/30 text-white text-xs font-bold px-2.5 py-1.5 rounded-lg shadow-xl z-50 whitespace-nowrap pointer-events-none">
                Dashboard
              </div>
            </div>
          ) : (
            <button
              onClick={() => {
                navigate("/dashboard");
                if (onClose) onClose();
              }}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer min-w-0 ${
                location.pathname === "/dashboard"
                  ? "bg-white/20 text-white shadow-md border border-white/20"
                  : "text-violet-200/80 hover:bg-white/10 hover:text-white"
              }`}
            >
              <LayoutDashboard size={17} className={`shrink-0 ${location.pathname === "/dashboard" ? "text-amber-300" : ""}`} />
              <span className="truncate">Dashboard</span>
            </button>
          )}

          {/* Grouped Categories */}
          {domainCategories.map((cat) => {
            const visibleItems = cat.items.filter(isItemVisible);
            if (visibleItems.length === 0) return null;

            const isExpanded = !!expandedCategories[cat.id];
            const hasActiveChild = visibleItems.some((item) =>
              item.matchPrefix ? location.pathname.startsWith(item.path) : location.pathname === item.path
            );

            // COLLAPSED / MINIMIZED MODE
            if (isCollapsed) {
              return (
                <div key={cat.id} className="relative group/cat flex justify-center py-0.5">
                  <button
                    onClick={() => toggleCategory(cat.id)}
                    className={`w-10 h-10 flex items-center justify-center rounded-xl transition-all cursor-pointer ${
                      hasActiveChild
                        ? "bg-amber-400/20 text-amber-300 border border-amber-400/30 shadow-sm"
                        : "text-violet-200/80 hover:bg-white/10 hover:text-white"
                    }`}
                  >
                    {cat.icon}
                  </button>

                  {/* Flyout Popover Menu for Collapsed Mode */}
                  <div className="hidden group-hover/cat:flex flex-col fixed left-[74px] bg-slate-950/95 backdrop-blur-xl border border-violet-500/30 text-white rounded-2xl p-2 shadow-2xl z-50 min-w-[210px] animate-in fade-in slide-in-from-left-2 duration-150">
                    <div className="px-3 py-1.5 mb-1.5 border-b border-white/10 flex items-center justify-between">
                      <span className="text-[11px] font-bold text-amber-300 uppercase tracking-wider">{cat.label}</span>
                      <span className="text-[9px] font-extrabold bg-white/15 px-1.5 py-0.5 rounded-full">{visibleItems.length}</span>
                    </div>
                    <div className="flex flex-col gap-0.5 max-h-[320px] overflow-y-auto custom-scrollbar pr-0.5">
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
                            className={`flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-semibold transition-all cursor-pointer text-left ${
                              isActive
                                ? "bg-white text-purple-950 font-bold shadow-sm"
                                : "text-violet-200/90 hover:bg-white/10 hover:text-white"
                            }`}
                          >
                            <span className={isActive ? "text-purple-700 shrink-0" : "text-violet-300 shrink-0"}>{item.icon}</span>
                            <span className="truncate">{item.label}</span>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                </div>
              );
            }

            // EXPANDED MODE
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
                  <div className="flex items-center gap-2 min-w-0 flex-1">
                    <span className={`shrink-0 ${hasActiveChild ? "text-amber-300" : "text-violet-300"}`}>{cat.icon}</span>
                    <span className="truncate">{cat.label}</span>
                  </div>
                  <div className="flex items-center gap-1.5 shrink-0 ml-1">
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
                          className={`w-full flex items-center gap-2.5 px-2.5 py-2 rounded-lg text-xs font-semibold transition-all cursor-pointer text-left min-w-0 ${
                            isActive
                              ? "bg-white text-purple-950 font-bold shadow-md transform translate-x-0.5"
                              : "text-violet-200/80 hover:bg-white/10 hover:text-white"
                          }`}
                        >
                          <span className={`shrink-0 ${isActive ? "text-purple-700" : "text-violet-300"}`}>{item.icon}</span>
                          <span className="truncate flex-1 min-w-0">{item.label}</span>
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
            isCollapsed ? (
              <div className="relative group/set flex justify-center mt-1">
                <button
                  onClick={() => {
                    navigate("/settings");
                    if (onClose) onClose();
                  }}
                  className={`w-10 h-10 flex items-center justify-center rounded-xl transition-all cursor-pointer ${
                    location.pathname === "/settings"
                      ? "bg-white/25 text-amber-300 border border-white/30 shadow-md"
                      : "text-violet-200/80 hover:bg-white/10 hover:text-white"
                  }`}
                  title="Settings & Policies"
                >
                  <SettingsIcon size={18} className={location.pathname === "/settings" ? "text-amber-300" : ""} />
                </button>
                <div className="hidden group-hover/set:flex fixed left-[74px] bg-purple-950 border border-violet-400/30 text-white text-xs font-bold px-2.5 py-1.5 rounded-lg shadow-xl z-50 whitespace-nowrap pointer-events-none">
                  Settings &amp; Policies
                </div>
              </div>
            ) : (
              <button
                onClick={() => {
                  navigate("/settings");
                  if (onClose) onClose();
                }}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer mt-1 min-w-0 ${
                  location.pathname === "/settings"
                    ? "bg-white/20 text-white shadow-md border border-white/20"
                    : "text-violet-200/80 hover:bg-white/10 hover:text-white"
                }`}
              >
                <SettingsIcon size={17} className={`shrink-0 ${location.pathname === "/settings" ? "text-amber-300" : ""}`} />
                <span className="truncate">Settings &amp; Policies</span>
              </button>
            )
          )}
        </nav>
      </div>

      {/* User Footer Card */}
      {isCollapsed ? (
        <div className="relative group/user flex justify-center mt-2 pt-2 border-t border-white/10">
          <div
            className="w-9 h-9 rounded-xl flex items-center justify-center font-bold text-[13px] shrink-0 text-white shadow-sm cursor-pointer"
            style={{ background: "linear-gradient(135deg, #7C3AED, #A78BFA)" }}
          >
            {initials}
          </div>
          <div className="hidden group-hover/user:flex flex-col fixed left-[74px] bottom-4 bg-slate-950/95 backdrop-blur-xl border border-violet-500/30 text-white rounded-xl p-3 shadow-2xl z-50 min-w-[180px] pointer-events-none">
            <div className="text-xs font-bold truncate">{fullName}</div>
            <div className="text-violet-300 text-[10px] truncate font-medium mt-0.5">{roleName}</div>
          </div>
        </div>
      ) : (
        <div className="rounded-2xl bg-white/10 backdrop-blur-md p-2.5 flex items-center gap-2.5 shrink-0 border border-white/10 mt-2 min-w-0">
          <div
            className="w-8 h-8 rounded-xl flex items-center justify-center font-bold text-[12px] shrink-0 text-white shadow-sm"
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
      )}
    </aside>
  );
};

export default Sidebar;
