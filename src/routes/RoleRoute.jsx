import React from "react";
import { Navigate, Outlet, useLocation } from "react-router-dom";
import useUser from "../features/auth/hooks/useUser";
import Loader from "../components/Loader";

// Mirrors the nav visibility rules in layouts/sidebar/Sidebar.jsx — a role
// should never be able to reach a page it can't see in its own nav just by
// typing the URL directly. The backend already rejects unauthorized writes,
// but this closes the "dangling admin controls visible to the wrong role"
// exposure. Any role not listed here (School Admin/Management/Admin/SaaS
// Admin) gets full access.
const ROLE_ALLOWED_PREFIXES = {
  // "academics" covers exam-datesheet/hall-ticket/exam-rooms/seating-arrangements
  // /online-tests — all already shown to these roles in Sidebar.jsx's
  // isItemVisible, and already scoped correctly server-side (self/own-class
  // only) — this list was just missing the prefix, silently bouncing every
  // click on those sidebar links back to /dashboard.
  Parent: ["dashboard", "academics", "attendance", "transport", "fees", "announcements", "notifications", "homework", "timetable", "report-cards", "messages", "ptm", "calendar", "documents"],
  Teacher: ["dashboard", "academics", "students", "attendance", "transport", "announcements", "notifications", "paper-setting", "homework", "timetable", "hr", "report-cards", "messages", "ptm", "library", "gate-passes", "calendar", "documents", "reports"],
  Conductor: ["dashboard", "transport", "announcements", "notifications", "hr", "calendar", "documents"],
  // Read-only: no fees/transport/messages/ptm — those are Parent-facing
  // concerns. Students get exactly the same modules the Student mobile app
  // would have covered, just via the web portal instead.
  Student: ["dashboard", "academics", "homework", "timetable", "report-cards", "attendance", "announcements", "calendar", "documents", "notifications"],
  // CA/Auditor — read-only accounting access only. Deliberately excludes
  // "accounting" itself (the CRUD pages for journal entries, expense
  // vouchers, etc.) — a CA only ever needs Reports (which is a pure
  // read-only viewer) and the audit package/compliance documents, both of
  // which live under /reports/*. The backend enforces this independently
  // (IsCAOrAdminReadOnly), this is just the matching nav-level guard.
  CA: ["dashboard", "reports"],
};

const RoleRoute = () => {
  const { user } = useUser();
  const location = useLocation();

  if (!user) {
    return (
      <div className="h-screen w-screen flex items-center justify-center bg-cn-bg">
        <Loader />
      </div>
    );
  }

  const role = user?.data?.role;
  const allowedPrefixes = ROLE_ALLOWED_PREFIXES[role];
  if (allowedPrefixes) {
    const segment = location.pathname.replace(/^\/+/, "").split("/")[0];
    if (!allowedPrefixes.includes(segment)) {
      return <Navigate to="/dashboard" replace />;
    }
  }

  return <Outlet />;
};

export default RoleRoute;
