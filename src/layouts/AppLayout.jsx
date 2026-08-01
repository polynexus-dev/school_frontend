import React, { useState, useEffect } from "react";
import { Outlet } from "react-router-dom";
import Sidebar from "./sidebar/Sidebar";
import Navbar from "./navbar/Navbar";

const AppLayout = () => {
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const [isDragging, setIsDragging] = useState(false);

  const [sidebarWidth, setSidebarWidth] = useState(() => {
    const saved = localStorage.getItem("vidyam_sidebar_width");
    const num = parseInt(saved, 10);
    return num >= 200 && num <= 420 ? num : 250;
  });

  const [isCollapsed, setIsCollapsed] = useState(() => {
    return localStorage.getItem("vidyam_sidebar_collapsed") === "true";
  });

  const toggleCollapse = () => {
    setIsCollapsed((prev) => {
      const next = !prev;
      localStorage.setItem("vidyam_sidebar_collapsed", String(next));
      return next;
    });
  };

  const handleWidthChange = (newWidth) => {
    const clamped = Math.min(Math.max(newWidth, 200), 420);
    setSidebarWidth(clamped);
    localStorage.setItem("vidyam_sidebar_width", String(clamped));
  };

  const handleResetWidth = () => {
    setSidebarWidth(250);
    localStorage.setItem("vidyam_sidebar_width", "250");
  };

  useEffect(() => {
    if (!isDragging) return;

    const handleMouseMove = (e) => {
      const newWidth = e.clientX;
      if (newWidth < 140) {
        if (!isCollapsed) {
          setIsCollapsed(true);
          localStorage.setItem("vidyam_sidebar_collapsed", "true");
        }
      } else {
        if (isCollapsed) {
          setIsCollapsed(false);
          localStorage.setItem("vidyam_sidebar_collapsed", "false");
        }
        const clamped = Math.min(Math.max(newWidth, 200), 420);
        setSidebarWidth(clamped);
      }
    };

    const handleMouseUp = () => {
      setIsDragging(false);
      localStorage.setItem("vidyam_sidebar_width", String(sidebarWidth));
    };

    window.addEventListener("mousemove", handleMouseMove);
    window.addEventListener("mouseup", handleMouseUp);
    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mouseup", handleMouseUp);
    };
  }, [isDragging, isCollapsed, sidebarWidth]);

  const activeDesktopWidth = isCollapsed ? 68 : sidebarWidth;

  return (
    <div className={`flex h-screen w-full overflow-hidden bg-cn-bg font-sans ${isDragging ? "select-none cursor-ew-resize" : ""}`}>
      {/* Desktop & Mobile Sidebar Container */}
      <div
        style={{
          width: undefined, // width handled via class/style below
        }}
        className={`h-full z-40 ${isDragging ? "" : "transition-all duration-300"} md:relative md:flex md:left-0 md:translate-x-0 ${
          isMobileOpen ? "fixed left-0 top-0 bottom-0 translate-x-0 w-[260px]" : "fixed -translate-x-full md:translate-x-0"
        }`}
      >
        <div
          className="h-full relative flex flex-col shrink-0 min-h-0"
          style={{ width: isMobileOpen ? "260px" : `${activeDesktopWidth}px` }}
        >
          <Sidebar
            onClose={() => setIsMobileOpen(false)}
            isCollapsed={isCollapsed}
            onToggleCollapse={toggleCollapse}
            onStartResizing={() => setIsDragging(true)}
            onResetWidth={handleResetWidth}
            currentWidth={sidebarWidth}
          />
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 min-w-0 h-full flex flex-col overflow-hidden">
        <header className="h-[64px] shrink-0 bg-cn-surface border-b border-cn-border flex items-center px-6">
          <Navbar
            onToggleSidebar={() => setIsMobileOpen((prev) => !prev)}
            isCollapsed={isCollapsed}
            onToggleCollapse={toggleCollapse}
          />
        </header>
        <main className="flex-1 overflow-y-auto px-4 sm:px-6 md:px-8 py-7 bg-cn-bg flex flex-col justify-between">
          <div className="flex-1">
            <Outlet />
          </div>
          <footer className="mt-12 pt-6 border-t border-cn-border text-center text-xs text-slate-500 dark:text-slate-400">
            © {new Date().getFullYear()} VIDYAM. A product of{" "}
            <a
              href="https://polynexus.in"
              target="_blank"
              rel="noopener noreferrer"
              className="text-violet-600 dark:text-violet-400 hover:underline font-medium"
            >
              polynexus.in
            </a>
            . All rights reserved.
          </footer>
        </main>
      </div>

      {/* Mobile Backdrop */}
      {isMobileOpen && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-xs z-30 md:hidden" onClick={() => setIsMobileOpen(false)} />
      )}
    </div>
  );
};

export default AppLayout;

