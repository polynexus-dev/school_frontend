import React, { useState } from "react";
import { Outlet } from "react-router-dom";
import Sidebar from "./sidebar/Sidebar";
import Navbar from "./navbar/Navbar";

// Role-based route gating lives solely in RoleRoute.jsx (nested inside this
// layout's Outlet) — this file used to keep its own copy of the same
// allowlist, which drifted out of sync (missing homework/timetable/hr/
// paper-setting/notifications) and silently redirected valid pages to
// /dashboard before RoleRoute's up-to-date check ever ran.
const AppLayout = () => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  return (
    <div className="flex h-screen w-full overflow-hidden bg-cn-bg font-sans">
      <div
        className={`h-full z-40 transition-all duration-300 md:relative md:flex md:left-0 md:translate-x-0 ${
          isSidebarOpen ? "fixed left-0 top-0 bottom-0 translate-x-0" : "fixed -translate-x-full md:translate-x-0"
        }`}
      >
        <Sidebar onClose={() => setIsSidebarOpen(false)} />
      </div>

      <div className="flex-1 min-w-0 h-full flex flex-col overflow-hidden">
        <header className="h-[64px] shrink-0 bg-cn-surface border-b border-cn-border flex items-center px-6">
          <Navbar onToggleSidebar={() => setIsSidebarOpen((prev) => !prev)} />
        </header>
        <main className="flex-1 overflow-y-auto px-8 py-7 md:pb-24 bg-cn-bg">
          <Outlet />
        </main>
      </div>

      {isSidebarOpen && (
        <div className="fixed inset-0 bg-black/40 z-40 md:hidden" onClick={() => setIsSidebarOpen(false)} />
      )}
    </div>
  );
};

export default AppLayout;
