import React from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import PageNotFound from "../pages/PageNotFound";
import Login from "../features/auth/pages/Login";
import ForgotPassword from "../features/auth/pages/ForgotPassword";
import ResetPassword from "../features/auth/pages/ResetPassword";
import AppLayout from "../layouts/AppLayout";
import ProtectedRoute from "./ProtectedRoute";
import RoleRoute from "./RoleRoute";

import Dashboard from "../features/dashboard/pages/Dashboard";
import Students from "../features/students/pages/Students";
import FaceRegistration from "../features/students/pages/FaceRegistration";
import PromoteClass from "../features/students/pages/PromoteClass";
import GuardianLinking from "../features/guardians/pages/GuardianLinking";
import Attendance from "../features/attendance/pages/Attendance";
import Transport from "../features/transport/pages/RouteEditor";
import Fees from "../features/fees/pages/Fees";
import Announcements from "../features/announcements/pages/AnnouncementComposer";
import Notifications from "../features/notifications/pages/Notifications";
import Settings from "../features/settings/pages/Settings";

const AppRoutes = () => {
  return (
    <Routes>
      <Route path="/" element={<Navigate to="/login" replace />} />
      <Route path="/login" element={<Login />} />
      <Route path="/forgot-password" element={<ForgotPassword />} />
      <Route path="/reset-password" element={<ResetPassword />} />

      <Route element={<ProtectedRoute />}>
        <Route element={<AppLayout />}>
          <Route element={<RoleRoute />}>
            <Route path="dashboard" element={<Dashboard />} />

            {/* Students / Enrollment & consent — fully wired feature */}
            <Route path="students" element={<Students />} />
            <Route path="students/face-registration" element={<FaceRegistration />} />
            <Route path="students/promote-class" element={<PromoteClass />} />

            <Route path="parents-linking" element={<GuardianLinking />} />
            <Route path="attendance" element={<Attendance />} />
            <Route path="transport" element={<Transport />} />
            <Route path="fees" element={<Fees />} />
            <Route path="announcements" element={<Announcements />} />
            <Route path="notifications" element={<Notifications />} />
            <Route path="settings" element={<Settings />} />
          </Route>
        </Route>
      </Route>

      <Route path="*" element={<PageNotFound />} />
    </Routes>
  );
};

export default AppRoutes;
