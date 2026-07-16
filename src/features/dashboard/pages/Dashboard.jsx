import React, { useEffect, useState } from "react";
import { GraduationCap, Users, CalendarCheck2, Megaphone } from "lucide-react";
import api from "../../../services/api";
import useUser from "../../../features/auth/hooks/useUser";

const asList = (data) => (Array.isArray(data) ? data : data?.results || []);
const asCount = (data) => {
  if (Array.isArray(data)) return data.length;
  if (typeof data?.count === "number") return data.count;
  return asList(data).length;
};

// Intentionally simple — this isn't one of the 5 School Edition design
// screens, so it stays a lightweight stat-card placeholder rather than the
// full donut+bar chart shell from the existing CampusFlow dashboard.
const Dashboard = () => {
  const { user } = useUser();
  const [stats, setStats] = useState({ students: null, classSections: null, attendanceToday: null, announcements: null });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadStats = async () => {
      const results = await Promise.allSettled([
        api.get("students/"),
        api.get("class-sections/"),
        api.get("attendance/"),
        api.get("announcements/"),
      ]);

      const [studentsRes, classSectionsRes, attendanceRes, announcementsRes] = results;
      setStats({
        students: studentsRes.status === "fulfilled" ? asCount(studentsRes.value.data) : null,
        classSections: classSectionsRes.status === "fulfilled" ? asCount(classSectionsRes.value.data) : null,
        attendanceToday: attendanceRes.status === "fulfilled" ? asCount(attendanceRes.value.data) : null,
        announcements: announcementsRes.status === "fulfilled" ? asCount(announcementsRes.value.data) : null,
      });
      setLoading(false);
    };
    loadStats();
  }, []);

  const cards = [
    { label: "Total Students", value: stats.students, icon: <GraduationCap size={20} />, tint: "bg-violet-50 text-violet-700" },
    { label: "Class Sections", value: stats.classSections, icon: <Users size={20} />, tint: "bg-info-tint text-info-hex" },
    { label: "Attendance Records", value: stats.attendanceToday, icon: <CalendarCheck2 size={20} />, tint: "bg-success-tint text-success-hex" },
    { label: "Announcements", value: stats.announcements, icon: <Megaphone size={20} />, tint: "bg-warning-tint text-warning-hex" },
  ];

  return (
    <div className="w-full">
      <div className="pb-4 border-b border-cn-border mb-6">
        <h1 className="font-heading font-bold text-3xl text-violet-950">Dashboard</h1>
        <p className="text-ink-500 mt-1 text-[14.5px]">
          Welcome back{user?.data?.full_name ? `, ${user.data.full_name}` : ""} — live counts from your school's data.
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {cards.map((card) => (
          <div key={card.label} className="bg-cn-surface border border-cn-border rounded-2xl p-5 shadow-sm">
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center mb-4 ${card.tint}`}>
              {card.icon}
            </div>
            <div className="font-heading font-extrabold text-[28px] text-ink-900">
              {loading ? "…" : card.value ?? "—"}
            </div>
            <div className="text-[13px] text-ink-500 mt-1 font-medium">{card.label}</div>
          </div>
        ))}
      </div>

      <div className="mt-8 bg-cn-surface border border-cn-border rounded-2xl p-6">
        <h2 className="font-heading font-semibold text-lg text-ink-900 mb-2">Getting started</h2>
        <p className="text-[13.5px] text-ink-500 leading-relaxed max-w-2xl">
          Head to <b className="text-violet-700">Students</b> to enroll your first student, invite a guardian and
          record DPDP consent. From there you can register faces for classroom roll-call, run the year-end class
          promotion, manage bus routes and send announcements.
        </p>
      </div>
    </div>
  );
};

export default Dashboard;
