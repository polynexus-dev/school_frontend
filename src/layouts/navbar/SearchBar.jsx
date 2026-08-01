import React, { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Search, ShieldAlert, GraduationCap, UserCheck, LayoutGrid, Loader2 } from "lucide-react";
import api from "../../services/api";

const searchableItems = [
  { label: "Dashboard", path: "/dashboard", description: "Overview & quick stats", category: "Modules" },
  { label: "Students", path: "/students", description: "Enrollment, roster & DPDP consent", category: "Modules" },
  { label: "Face registration", path: "/students/face-registration", description: "Capture 3-angle face samples per class", category: "Modules" },
  { label: "Promote class", path: "/students/promote-class", description: "Year-end bulk class promotion", category: "Modules" },
  { label: "Parents & Linking", path: "/parents-linking", description: "Guardian link requests & family view", category: "Modules" },
  { label: "Attendance", path: "/attendance", description: "Daily student attendance records", category: "Modules" },
  { label: "Staff Attendance", path: "/hr/attendance", description: "Teacher & staff attendance tracking", category: "Modules" },
  { label: "Staff Leave Requests", path: "/hr/leave", description: "Approve & track staff leaves", category: "Modules" },
  { label: "Transport & GPS", path: "/transport", description: "Bus routes, stops & live tracking", category: "Modules" },
  { label: "Fees & Collections", path: "/fees", description: "Fee collection & invoices", category: "Modules" },
  { label: "Annual Audit Package", path: "/reports/audit-package", description: "Export books of accounts & CA attestation", category: "Modules" },
  { label: "Compliance Documents", path: "/reports/compliance-documents", description: "Statutory 12A/80G & FD certificates", category: "Modules" },
  { label: "Grant Register", path: "/accounting/grants", description: "Government & CSR grant tracking", category: "Modules" },
  { label: "Statutory Challans", path: "/accounting/statutory-challans", description: "PF, ESI, PT & TDS remittances", category: "Modules" },
  { label: "Announcements", path: "/announcements", description: "Compose & target school announcements", category: "Modules" },
  { label: "Settings & Policies", path: "/settings", description: "School, role & module permissions", category: "Modules" },
];

const SearchBar = () => {
  const navigate = useNavigate();
  const [query, setQuery] = useState("");
  const [isOpen, setIsOpen] = useState(false);
  const [apiResults, setApiResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const dropdownRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Debounced API search for Students and Faculty/Staff
  useEffect(() => {
    const trimmed = query.trim();
    if (trimmed.length < 2) {
      setApiResults([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    const timer = setTimeout(async () => {
      try {
        const response = await api.get("global-search/", { params: { q: trimmed } });
        setApiResults(response.data?.results || []);
      } catch (err) {
        console.error("Global search request failed:", err);
        setApiResults([]);
      } finally {
        setLoading(false);
      }
    }, 250);

    return () => clearTimeout(timer);
  }, [query]);

  // Client-side module filtering
  const moduleResults =
    query.trim() === ""
      ? searchableItems.slice(0, 5)
      : searchableItems.filter(
          (item) =>
            item.label.toLowerCase().includes(query.toLowerCase()) ||
            item.description.toLowerCase().includes(query.toLowerCase())
        );

  const studentResults = apiResults.filter((r) => r.category === "Students");
  const staffResults = apiResults.filter((r) => r.category === "Faculty & Staff");

  const hasAnyResults = moduleResults.length > 0 || studentResults.length > 0 || staffResults.length > 0;

  const handleSelect = (item) => {
    navigate(item.path);
    setQuery("");
    setIsOpen(false);
  };

  return (
    <div className="w-full relative" ref={dropdownRef}>
      <div className="relative">
        <input
          type="text"
          value={query}
          onFocus={() => setIsOpen(true)}
          onChange={(e) => setIsOpen(true) || setQuery(e.target.value)}
          placeholder="Search students, faculty, modules, or settings…"
          className="w-full h-[42px] px-4 pl-10 pr-9 text-[13px] text-ink-700 bg-white border border-cn-border rounded-xl focus:outline-none focus:ring-2 focus:ring-violet-500/20 focus:border-violet-400 transition-all shadow-sm placeholder-ink-400"
        />
        <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-ink-400" />
        {loading && (
          <Loader2 size={14} className="absolute right-3.5 top-1/2 -translate-y-1/2 text-violet-600 animate-spin" />
        )}
      </div>

      {isOpen && hasAnyResults && (
        <div className="absolute left-0 right-0 mt-2 bg-white rounded-xl shadow-[0_16px_48px_rgba(59,7,100,.18)] border border-cn-border z-50 p-2 max-h-[460px] overflow-y-auto custom-scrollbar-light">
          
          {/* Section 1: Students */}
          {studentResults.length > 0 && (
            <div className="mb-2">
              <div className="px-3 py-1.5 text-[10.5px] font-extrabold uppercase tracking-wider text-violet-700 bg-violet-50/70 rounded-lg flex items-center gap-1.5 mb-1">
                <GraduationCap size={13} /> Students ({studentResults.length})
              </div>
              {studentResults.map((item) => (
                <div
                  key={`std-${item.id}`}
                  onClick={() => handleSelect(item)}
                  className="flex items-center justify-between p-2.5 rounded-lg cursor-pointer transition-all duration-150 text-ink-700 hover:bg-violet-50/80"
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div className="w-7 h-7 rounded-lg bg-violet-100 text-violet-800 flex items-center justify-center font-bold text-xs shrink-0">
                      {item.label.charAt(0)}
                    </div>
                    <div className="min-w-0">
                      <div className="text-[13px] font-bold text-ink-900 truncate">{item.label}</div>
                      <div className="text-[11.5px] text-ink-500 truncate font-medium">{item.description}</div>
                    </div>
                  </div>
                  <span className="text-[10px] font-bold text-violet-700 bg-violet-100/70 px-2 py-0.5 rounded-full shrink-0">
                    Student
                  </span>
                </div>
              ))}
            </div>
          )}

          {/* Section 2: Faculty & Staff */}
          {staffResults.length > 0 && (
            <div className="mb-2">
              <div className="px-3 py-1.5 text-[10.5px] font-extrabold uppercase tracking-wider text-amber-700 bg-amber-50/70 rounded-lg flex items-center gap-1.5 mb-1">
                <UserCheck size={13} /> Faculty &amp; Staff ({staffResults.length})
              </div>
              {staffResults.map((item) => (
                <div
                  key={`stf-${item.id}`}
                  onClick={() => handleSelect(item)}
                  className="flex items-center justify-between p-2.5 rounded-lg cursor-pointer transition-all duration-150 text-ink-700 hover:bg-amber-50/80"
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div className="w-7 h-7 rounded-lg bg-amber-100 text-amber-900 flex items-center justify-center font-bold text-xs shrink-0">
                      {item.label.charAt(0)}
                    </div>
                    <div className="min-w-0">
                      <div className="text-[13px] font-bold text-ink-900 truncate">{item.label}</div>
                      <div className="text-[11.5px] text-ink-500 truncate font-medium">{item.description}</div>
                    </div>
                  </div>
                  <span className="text-[10px] font-bold text-amber-800 bg-amber-100/70 px-2 py-0.5 rounded-full shrink-0">
                    Faculty
                  </span>
                </div>
              ))}
            </div>
          )}

          {/* Section 3: Modules & Features */}
          {moduleResults.length > 0 && (
            <div>
              <div className="px-3 py-1.5 text-[10.5px] font-extrabold uppercase tracking-wider text-slate-500 bg-slate-100/80 rounded-lg flex items-center gap-1.5 mb-1">
                <LayoutGrid size={13} /> Modules &amp; Pages ({moduleResults.length})
              </div>
              {moduleResults.map((item) => (
                <div
                  key={`mod-${item.path}`}
                  onClick={() => handleSelect(item)}
                  className="flex items-center justify-between p-2.5 rounded-lg cursor-pointer transition-all duration-150 text-ink-700 hover:bg-slate-50"
                >
                  <div>
                    <div className="text-[13px] font-semibold text-ink-900">{item.label}</div>
                    <div className="text-xs text-ink-400 font-normal">{item.description}</div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {isOpen && query.trim() !== "" && !loading && !hasAnyResults && (
        <div className="absolute left-0 right-0 mt-2 bg-white rounded-xl shadow-2xl border border-cn-border z-50 p-6 text-center">
          <ShieldAlert className="mx-auto text-ink-300 mb-2" size={32} />
          <div className="text-sm font-semibold text-ink-700">No matching students, faculty, or modules found</div>
          <p className="text-xs text-ink-400 mt-1">Try searching by student name, roll number, admission ID, teacher name, or module keyword.</p>
        </div>
      )}
    </div>
  );
};

export default SearchBar;
