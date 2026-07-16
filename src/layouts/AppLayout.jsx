import React, { useState } from "react";
import { Outlet, useLocation, Navigate } from "react-router-dom";
import Sidebar from "./sidebar/Sidebar";
import Navbar from "./navbar/Navbar";
import useUser from "../features/auth/hooks/useUser";

const AppLayout = () => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const location = useLocation();
  const { user } = useUser();

  const profile = user?.data;
  const roleName = profile?.role || "Admin";

  const isRouteAllowed = () => {
    const path = location.pathname;
    if (roleName === "Parent") {
      return ["/dashboard", "/attendance", "/transport", "/fees", "/announcements"].some(allowed => path.startsWith(allowed));
    }
    if (roleName === "Teacher") {
      return ["/dashboard", "/students", "/attendance", "/transport", "/announcements"].some(allowed => path.startsWith(allowed));
    }
    if (roleName === "Conductor") {
      return ["/dashboard", "/transport", "/announcements"].some(allowed => path.startsWith(allowed));
    }
    return true;
  };

  if (!isRouteAllowed()) {
    return <Navigate to="/dashboard" replace />;
  }

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
