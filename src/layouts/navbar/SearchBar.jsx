import React, { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Search, ShieldAlert } from "lucide-react";

// Lightweight client-side search over the app's own nav surface (no
// permissions/module-listing endpoint exists in the confirmed contract yet,
// unlike the college frontend's server-driven allowed-modules search).
const searchableItems = [
  { label: "Dashboard", path: "/dashboard", description: "Overview & quick stats" },
  { label: "Students", path: "/students", description: "Enrollment, roster & DPDP consent" },
  { label: "Face registration", path: "/students/face-registration", description: "Capture 3-angle face samples per class" },
  { label: "Promote class", path: "/students/promote-class", description: "Year-end bulk class promotion" },
  { label: "Parents & Linking", path: "/parents-linking", description: "Guardian link requests & family view" },
  { label: "Attendance", path: "/attendance", description: "Daily attendance records" },
  { label: "Transport", path: "/transport", description: "Bus routes & stop editor" },
  { label: "Fees", path: "/fees", description: "Fee collection & invoices" },
  { label: "Announcements", path: "/announcements", description: "Compose & target school announcements" },
  { label: "Settings", path: "/settings", description: "School & account settings" },
];

const SearchBar = () => {
  const navigate = useNavigate();
  const [query, setQuery] = useState("");
  const [isOpen, setIsOpen] = useState(false);
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

  const results =
    query.trim() === ""
      ? searchableItems.slice(0, 5)
      : searchableItems.filter(
          (item) =>
            item.label.toLowerCase().includes(query.toLowerCase()) ||
            item.description.toLowerCase().includes(query.toLowerCase())
        );

  const handleSelect = (path) => {
    navigate(path);
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
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search modules, features, or settings…"
          className="w-full h-[42px] px-4 pl-10 text-[13px] text-ink-700 bg-white border border-cn-border rounded-xl focus:outline-none focus:ring-2 focus:ring-violet-500/20 focus:border-violet-400 transition-all shadow-sm placeholder-ink-400"
        />
        <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-ink-400" />
      </div>

      {isOpen && results.length > 0 && (
        <div className="absolute left-0 right-0 mt-2 bg-white rounded-xl shadow-[0_12px_40px_rgba(59,7,100,.14)] border border-cn-border z-50 p-2 max-h-96 overflow-y-auto custom-scrollbar-light">
          {results.map((item) => (
            <div
              key={item.path}
              onClick={() => handleSelect(item.path)}
              className="flex items-center justify-between p-2.5 rounded-lg cursor-pointer transition-all duration-150 text-ink-700 hover:bg-violet-50"
            >
              <div>
                <div className="text-[13px] font-semibold text-ink-900">{item.label}</div>
                <div className="text-xs text-ink-400 font-normal">{item.description}</div>
              </div>
            </div>
          ))}
        </div>
      )}

      {isOpen && query.trim() !== "" && results.length === 0 && (
        <div className="absolute left-0 right-0 mt-2 bg-white rounded-xl shadow-2xl border border-cn-border z-50 p-6 text-center">
          <ShieldAlert className="mx-auto text-ink-300 mb-2" size={32} />
          <div className="text-sm font-semibold text-ink-700">No matching modules found</div>
        </div>
      )}
    </div>
  );
};

export default SearchBar;
