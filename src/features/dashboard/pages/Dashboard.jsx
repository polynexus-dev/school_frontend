import React, { useEffect, useState } from "react";
import { GraduationCap, Users, CalendarCheck2, Megaphone, Wallet, AlertTriangle, ClipboardCheck, TrendingDown, ShieldAlert } from "lucide-react";
import api from "../../../services/api";
import schoolDashboardService from "../services/schoolDashboardService";
import useUser from "../../../features/auth/hooks/useUser";

const asList = (data) => (Array.isArray(data) ? data : data?.results || []);
const asCount = (data) => {
  if (Array.isArray(data)) return data.length;
  if (typeof data?.count === "number") return data.count;
  return asList(data).length;
};

const currency = (n) => `Rs. ${Number(n || 0).toLocaleString("en-IN")}`;

// Intentionally simple — this isn't one of the 5 School Edition design
// screens, so it stays a lightweight stat-card placeholder rather than the
// full donut+bar chart shell from the existing CampusFlow dashboard.
const Dashboard = () => {
  const { user } = useUser();
  const profile = user?.data;
  const roleName = profile?.role || "Admin";
  // HM sees the school-wide rollup too, even though "Teacher" is their base role.
  const isSchoolWide = !["Teacher", "Parent", "Conductor", "Student"].includes(roleName) || profile?.is_hm;

  const [stats, setStats] = useState({ students: null, classSections: null, attendanceToday: null, announcements: null });
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(true);
  const [summaryLoading, setSummaryLoading] = useState(isSchoolWide);

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

  useEffect(() => {
    if (!isSchoolWide) return;
    const loadSummary = async () => {
      try {
        const res = await schoolDashboardService.getSchoolSummary();
        setSummary(res.data);
      } catch (err) {
        console.error("Failed to load school summary:", err);
      } finally {
        setSummaryLoading(false);
      }
    };
    loadSummary();
    // eslint-disable-next-line react-hooks/exhaustive-deps
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

      {isSchoolWide && (
        <div className="mb-8">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
            <div className="bg-cn-surface border border-cn-border rounded-2xl p-5 shadow-sm">
              <div className="w-10 h-10 rounded-xl flex items-center justify-center mb-4 bg-success-tint text-success-hex">
                <CalendarCheck2 size={20} />
              </div>
              <div className="font-heading font-extrabold text-[28px] text-ink-900">
                {summaryLoading ? "…" : summary?.attendance_today_pct != null ? `${summary.attendance_today_pct}%` : "—"}
              </div>
              <div className="text-[13px] text-ink-500 mt-1 font-medium">Attendance Today</div>
            </div>
            <div className="bg-cn-surface border border-cn-border rounded-2xl p-5 shadow-sm">
              <div className="w-10 h-10 rounded-xl flex items-center justify-center mb-4 bg-info-tint text-info-hex">
                <Wallet size={20} />
              </div>
              <div className="font-heading font-extrabold text-[22px] text-ink-900">
                {summaryLoading ? "…" : currency(summary?.fees_collected_this_month)}
              </div>
              <div className="text-[13px] text-ink-500 mt-1 font-medium">Fees Collected (This Month)</div>
            </div>
            <div className="bg-cn-surface border border-cn-border rounded-2xl p-5 shadow-sm">
              <div className="w-10 h-10 rounded-xl flex items-center justify-center mb-4 bg-warning-tint text-warning-hex">
                <AlertTriangle size={20} />
              </div>
              <div className="font-heading font-extrabold text-[22px] text-ink-900">
                {summaryLoading ? "…" : currency(summary?.fees_outstanding)}
              </div>
              <div className="text-[13px] text-ink-500 mt-1 font-medium">Fees Outstanding</div>
            </div>
            <div className="bg-cn-surface border border-cn-border rounded-2xl p-5 shadow-sm">
              <div className="w-10 h-10 rounded-xl flex items-center justify-center mb-4 bg-violet-50 text-violet-700">
                <ClipboardCheck size={20} />
              </div>
              <div className="font-heading font-extrabold text-[28px] text-ink-900">
                {summaryLoading ? "…" : summary?.pending_leave_requests_count ?? "—"}
              </div>
              <div className="text-[13px] text-ink-500 mt-1 font-medium">Pending Leave Requests</div>
            </div>
          </div>

          <div className="bg-cn-surface border border-cn-border rounded-2xl p-5">
            <h2 className="font-heading font-semibold text-base text-ink-900 mb-3">School-wide weak topics</h2>
            {summaryLoading ? (
              <p className="text-ink-400 text-[13px]">Loading…</p>
            ) : !summary?.weak_topics?.length ? (
              <p className="text-ink-400 text-[13px]">No per-question marks data published yet.</p>
            ) : (
              <div className="flex flex-col gap-2">
                {summary.weak_topics.map((t) => (
                  <div key={t.topic_id} className="flex items-center gap-3">
                    <div className="w-40 shrink-0 text-[13px] font-semibold text-ink-900 truncate">{t.topic_name}</div>
                    <div className="flex-1 h-2 rounded-full bg-cn-bg overflow-hidden">
                      <div
                        className={`h-full rounded-full ${t.percentage < 40 ? "bg-error-hex" : "bg-warning-hex"}`}
                        style={{ width: `${Math.min(100, t.percentage)}%` }}
                      />
                    </div>
                    <div className="w-12 text-right text-[12.5px] font-bold text-ink-700">{t.percentage}%</div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mt-4">
            <div className="bg-cn-surface border border-cn-border rounded-2xl p-5">
              <h2 className="font-heading font-semibold text-[13.5px] text-ink-900 mb-3 flex items-center gap-2">
                <ShieldAlert size={16} className="text-error-hex" />
                At-Risk Students
              </h2>
              {summaryLoading ? (
                <p className="text-ink-400 text-[13px]">Loading…</p>
              ) : !summary?.insights?.at_risk_students?.length ? (
                <p className="text-ink-400 text-[13px]">No students currently flagged.</p>
              ) : (
                <div className="flex flex-col gap-2.5">
                  {summary.insights.at_risk_students.map((s) => (
                    <div key={s.student_id} className="text-[12.5px]">
                      <div className="font-semibold text-ink-900">{s.student_name} <span className="text-ink-400 font-normal">· {s.class_section}</span></div>
                      <div className="text-error-hex">{s.attendance_pct}% attendance · {s.marks_pct}% marks</div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="bg-cn-surface border border-cn-border rounded-2xl p-5">
              <h2 className="font-heading font-semibold text-[13.5px] text-ink-900 mb-3 flex items-center gap-2">
                <Wallet size={16} className="text-warning-hex" />
                Fee Default Risk
              </h2>
              {summaryLoading ? (
                <p className="text-ink-400 text-[13px]">Loading…</p>
              ) : !summary?.insights?.fee_default_risks?.length ? (
                <p className="text-ink-400 text-[13px]">No overdue invoices past the risk window.</p>
              ) : (
                <div className="flex flex-col gap-2.5">
                  {summary.insights.fee_default_risks.map((s) => (
                    <div key={s.student_id} className="text-[12.5px]">
                      <div className="font-semibold text-ink-900">{s.student_name} <span className="text-ink-400 font-normal">· {s.class_section}</span></div>
                      <div className="text-warning-hex">{currency(s.outstanding_amount)} · {s.days_overdue} days overdue</div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="bg-cn-surface border border-cn-border rounded-2xl p-5">
              <h2 className="font-heading font-semibold text-[13.5px] text-ink-900 mb-3 flex items-center gap-2">
                <TrendingDown size={16} className="text-error-hex" />
                Performance Decline
              </h2>
              {summaryLoading ? (
                <p className="text-ink-400 text-[13px]">Loading…</p>
              ) : !summary?.insights?.performance_decline_trends?.length ? (
                <p className="text-ink-400 text-[13px]">No significant drops between the last two exam terms.</p>
              ) : (
                <div className="flex flex-col gap-2.5">
                  {summary.insights.performance_decline_trends.map((s) => (
                    <div key={s.student_id} className="text-[12.5px]">
                      <div className="font-semibold text-ink-900">{s.student_name} <span className="text-ink-400 font-normal">· {s.class_section}</span></div>
                      <div className="text-error-hex">{s.previous_pct}% → {s.latest_pct}% (-{s.drop_points} pts)</div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

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

      {!["Teacher", "Parent", "Conductor", "Student"].includes(roleName) && (
        <div className="mt-8 bg-cn-surface border border-cn-border rounded-2xl p-6">
          <h2 className="font-heading font-semibold text-lg text-ink-900 mb-2">Getting started</h2>
          <p className="text-[13.5px] text-ink-500 leading-relaxed max-w-2xl">
            Head to <b className="text-violet-700">Students</b> to enroll your first student, invite a guardian and
            record DPDP consent. From there you can register faces for classroom roll-call, run the year-end class
            promotion, manage bus routes and send announcements.
          </p>
        </div>
      )}
    </div>
  );
};

export default Dashboard;
