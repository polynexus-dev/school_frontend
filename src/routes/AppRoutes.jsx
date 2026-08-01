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
import ExamPapers from "../features/academics/pages/ExamPapers";
import SyllabusTopics from "../features/academics/pages/SyllabusTopics";
import QuestionBank from "../features/academics/pages/QuestionBank";
import ExamPaperBuilder from "../features/academics/pages/ExamPaperBuilder";
import GradeExamPaper from "../features/academics/pages/GradeExamPaper";
import HomeworkBoard from "../features/academics/pages/HomeworkBoard";
import Timetable from "../features/academics/pages/Timetable";
import ReportCards from "../features/academics/pages/ReportCards";
import ExamDatesheet from "../features/academics/pages/ExamDatesheet";
import ExamRooms from "../features/academics/pages/ExamRooms";
import SeatingArrangementPage from "../features/academics/pages/SeatingArrangementPage";
import HallTicket from "../features/academics/pages/HallTicket";
import Messages from "../features/messaging/pages/Messages";
import PTMSlots from "../features/ptm/pages/PTMSlots";
import ChainDashboard from "../features/chain/pages/ChainDashboard";
import Library from "../features/library/pages/Library";
import Hostel from "../features/hostel/pages/Hostel";
import VisitorLog from "../features/gate/pages/VisitorLog";
import GatePasses from "../features/gate/pages/GatePasses";
import Calendar from "../features/events/pages/Calendar";
import Documents from "../features/documents/pages/Documents";
import Certificates from "../features/certificates/pages/Certificates";
import Inventory from "../features/inventory/pages/Inventory";
import Reports from "../features/reports/pages/Reports";
import LeaveRequests from "../features/hr/pages/LeaveRequests";
import StaffAttendance from "../features/hr/pages/StaffAttendance";
import StudentProgress from "../features/students/pages/StudentProgress";

import ParentFeedback from "../features/feedback/pages/ParentFeedback";
import SyllabusProgress from "../features/academics/pages/SyllabusProgress";
import StudyNotes from "../features/notes/pages/StudyNotes";

import Infirmary from "../features/hr/pages/Infirmary";
import TransferCertificates from "../features/students/pages/TransferCertificates";
import BoardCompliance from "../features/reports/pages/BoardCompliance";
import AuditPackage from "../features/reports/pages/AuditPackage";
import ComplianceDocuments from "../features/reports/pages/ComplianceDocuments";
import CAAccess from "../features/accounting/pages/CAAccess";
import LandingPage from "../pages/LandingPage";
import ChartOfAccounts from "../features/accounting/pages/ChartOfAccounts";
import JournalEntries from "../features/accounting/pages/JournalEntries";
import ExpenseVouchers from "../features/accounting/pages/ExpenseVouchers";
import Donations from "../features/donations/pages/Donations";
import BankReconciliation from "../features/accounting/pages/BankReconciliation";
import Investments from "../features/accounting/pages/Investments";
import Trustees from "../features/accounting/pages/Trustees";
import Bills from "../features/accounting/pages/Bills";
import Grants from "../features/accounting/pages/Grants";
import StatutoryChallans from "../features/accounting/pages/StatutoryChallans";
import ProvisionSchedules from "../features/accounting/pages/ProvisionSchedules";


const AppRoutes = () => {
  return (
    <Routes>
      <Route path="/" element={<LandingPage />} />
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
            <Route path="students/:id/progress" element={<StudentProgress />} />

            {/* Paper Setting, Syllabus Progress & Study Notes */}
            <Route path="study-notes" element={<StudyNotes />} />
            <Route path="syllabus-progress" element={<SyllabusProgress />} />
            <Route path="paper-setting" element={<ExamPapers />} />
            <Route path="paper-setting/syllabus-topics" element={<SyllabusTopics />} />
            <Route path="paper-setting/question-bank" element={<QuestionBank />} />
            <Route path="paper-setting/:id" element={<ExamPaperBuilder />} />
            <Route path="paper-setting/:id/grade" element={<GradeExamPaper />} />
            <Route path="homework" element={<HomeworkBoard />} />
            <Route path="timetable" element={<Timetable />} />
            <Route path="report-cards" element={<ReportCards />} />
            <Route path="academics/exam-datesheet" element={<ExamDatesheet />} />
            <Route path="academics/exam-rooms" element={<ExamRooms />} />
            <Route path="academics/seating-arrangements" element={<SeatingArrangementPage />} />
            <Route path="academics/hall-ticket" element={<HallTicket />} />
            <Route path="messages" element={<Messages />} />
            <Route path="ptm" element={<PTMSlots />} />
            <Route path="chain-dashboard" element={<ChainDashboard />} />
            <Route path="library" element={<Library />} />
            <Route path="hostel" element={<Hostel />} />
            <Route path="visitors" element={<VisitorLog />} />
            <Route path="gate-passes" element={<GatePasses />} />
            <Route path="calendar" element={<Calendar />} />
            <Route path="documents" element={<Documents />} />
            <Route path="certificates" element={<Certificates />} />
            <Route path="inventory" element={<Inventory />} />
            <Route path="reports" element={<Reports />} />
            <Route path="reports/board-compliance" element={<BoardCompliance />} />
            <Route path="reports/audit-package" element={<AuditPackage />} />
            <Route path="reports/compliance-documents" element={<ComplianceDocuments />} />

            <Route path="accounting/chart-of-accounts" element={<ChartOfAccounts />} />
            <Route path="accounting/journal-entries" element={<JournalEntries />} />
            <Route path="accounting/expense-vouchers" element={<ExpenseVouchers />} />
            <Route path="donations" element={<Donations />} />
            <Route path="accounting/bank-reconciliation" element={<BankReconciliation />} />
            <Route path="accounting/investments" element={<Investments />} />
            <Route path="accounting/trustees" element={<Trustees />} />
            <Route path="accounting/bills" element={<Bills />} />
            <Route path="accounting/grants" element={<Grants />} />
            <Route path="accounting/statutory-challans" element={<StatutoryChallans />} />
            <Route path="accounting/provision-schedules" element={<ProvisionSchedules />} />
            <Route path="accounting/ca-access" element={<CAAccess />} />

            <Route path="feedback" element={<ParentFeedback />} />
            <Route path="hr/leave" element={<LeaveRequests />} />
            <Route path="hr/attendance" element={<StaffAttendance />} />
            <Route path="infirmary" element={<Infirmary />} />
            <Route path="transfer-certificates" element={<TransferCertificates />} />

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
