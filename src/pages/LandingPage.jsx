import React, { useState, useEffect, useRef } from "react";
import { Link } from "react-router-dom";
import {
  ShieldCheck,
  Bot,
  HeartPulse,
  Bus,
  CreditCard,
  Users,
  Sun,
  Moon,
  Menu,
  X,
  ArrowRight,
  QrCode,
  FileText,
  Scan,
  GraduationCap,
  Stethoscope,
  Lock,
  Download,
  Timer,
  MapPin,
  Smartphone,
  Zap,
  CheckCircle2,
  ChevronRight,
  Star,
  Eye,
  Activity,
  School,
  CircuitBoard,
  Fingerprint,
} from "lucide-react";
import { VidyamLogoMark } from "../components/common/VidyamLogo";

/* ─────────────────────────── SECTION DATA ─────────────────────────── */

const FEATURE_SECTIONS = [
  {
    id: "ai-engine",
    badge: "🤖 AI & Smart Automation Engine",
    badgeColor: "purple",
    title: "Intelligent Automation That Saves 45+ Minutes Daily",
    subtitle:
      "From automated substitute allocation to 1-click batch promotions — eliminate repetitive manual work that drains your admin team every single day.",
    features: [
      {
        icon: <Bot size={22} />,
        emoji: "🤖",
        name: "Automated Substitute Teacher Allocator",
        tag: "NEW",
        tagColor: "purple",
        school:
          "Saves 45+ minutes of principal stress every morning. Automatically ranks available free teachers based on subject match (+50 pts), grade experience (+20 pts), and daily workload (-15 penalty). 1-click confirm auto-syncs substitute cards directly to teachers' mobile dashboards.",
        parent:
          "Guarantees zero unassigned free periods for their child; classes stay productive even when regular teachers take leave.",
        link: "/timetable",
        linkText: "Open Timetable →",
      },
      {
        icon: <Fingerprint size={22} />,
        emoji: "📸",
        name: "Device-Bound Face Recognition Attendance",
        tag: null,
        school:
          "Eliminates 15 minutes of manual roll-call per period. Anti-proxy device binding ensures roll-call is marked inside the classroom only.",
        parent:
          "Real-time push alert if their child is absent or late before period 1 ends.",
        link: "/attendance",
        linkText: "Open Attendance →",
      },
      {
        icon: <GraduationCap size={22} />,
        emoji: "🎓",
        name: "1-Click Year-End Student Promotion Workflow",
        tag: null,
        school:
          "Auto-promotes entire grade batches to the next academic year, transferring transport routes, roll numbers, and fee templates automatically.",
        parent:
          "Smooth transition into the new academic session without repeating registration paperwork.",
        link: "/students",
        linkText: "Open Students →",
      },
    ],
    mockup: {
      type: "scoring",
      header: "AI SUBSTITUTE ALLOCATOR",
      headerIcon: <Bot size={14} />,
      headerColor: "violet",
      scenario: "Period 3 · Grade 10-A (Mathematics)",
      absent: "Absent: Teacher Vikram Mehta",
      candidates: [
        {
          name: "Mrs. Sunita Rao",
          role: "Senior Mathematics Faculty",
          score: 100,
          tags: ["+50 Subject", "+30 Section", "+20 Grade"],
          recommended: true,
        },
        {
          name: "Mr. Amit Kumar",
          role: "Physics Teacher",
          score: 35,
          tags: ["+20 Grade", "+15 Free"],
          recommended: false,
        },
        {
          name: "Ms. Priya Nair",
          role: "Chemistry Teacher",
          score: 20,
          tags: ["+20 Grade", "-15 Overload"],
          recommended: false,
        },
      ],
    },
  },
  {
    id: "dpdp-shield",
    badge: "🛡️ DPDP Act 2023 Legal Shield",
    badgeColor: "emerald",
    title: "India's First Built-in DPDP Compliance Engine",
    subtitle:
      "Processing children's data without verifiable parental consent carries severe non-compliance penalties. VIDYAM automatically collects, logs, and audits parental consent with full legal proof.",
    features: [
      {
        icon: <ShieldCheck size={22} />,
        emoji: "🛡️",
        name: "Verifiable Parental Consent & DPDP Certificate",
        tag: "NEW",
        tagColor: "emerald",
        school:
          "Protects the school from heavy legal penalties under Section 6 & 9 of India's DPDP Act 2023. Generates a downloadable Parental Consent Certificate with IP address logs and timestamped cryptographic verification.",
        parent:
          "Full transparency and control over their child's personal data, biometrics, GPS tracking, and photo publication.",
        link: "/parents-linking",
        linkText: "View Consent Manager →",
      },
      {
        icon: <Lock size={22} />,
        emoji: "📜",
        name: "Immutable Consent Lifecycle Timeline",
        tag: "NEW",
        tagColor: "emerald",
        school:
          "Maintains a tamper-proof audit log of every time a parent grants or revokes consent, establishing clear legal proof under Section 6(10).",
        parent:
          "Allows parents to toggle opt-in features (like Face Biometrics or Photo Sharing) ON or OFF anytime from their mobile app.",
        link: "/parents-linking",
        linkText: "View Timeline →",
      },
      {
        icon: <Download size={22} />,
        emoji: "📦",
        name: "Self-Serve Data Export (/api/compliance/my-data/)",
        tag: null,
        school:
          "Fully satisfies Section 11 & 12 Data Principal access & erasure requirements without requiring manual data collection by IT staff.",
        parent:
          "1-click download of all personal data held by the school in structured format.",
        link: "/parents-linking",
        linkText: "View Compliance →",
      },
    ],
    mockup: {
      type: "certificate",
      header: "DPDP PARENTAL CONSENT CERTIFICATE",
      headerIcon: <ShieldCheck size={14} />,
      headerColor: "emerald",
      rows: [
        { label: "Legal Framework", value: "DPDP Act 2023 · Section 6 & 9" },
        {
          label: "Guardian Name",
          value: "Rajesh Sharma (9876543210)",
        },
        {
          label: "Face Recognition Attendance",
          value: "GRANTED (v1.0 Audit Logged)",
          valueColor: "emerald",
        },
        {
          label: "Bus GPS Tracking",
          value: "GRANTED (v1.0 Audit Logged)",
          valueColor: "emerald",
        },
        {
          label: "Photo Publication",
          value: "REVOKED — 12 Jul 2026, 14:32 IST",
          valueColor: "red",
        },
      ],
    },
  },
  {
    id: "infirmary",
    badge: "🏥 School Infirmary & Medical Alerts",
    badgeColor: "red",
    title: "Life-Saving Medical Alert System for Every Child",
    subtitle:
      "Severe food/drug allergies flagged with High-Risk badges across Teacher, PE Instructor, and Canteen staff dashboards — because a 30-second delay can be fatal.",
    features: [
      {
        icon: <HeartPulse size={22} />,
        emoji: "🏥",
        name: "High-Risk Allergy & Medical Alert System",
        tag: "NEW",
        tagColor: "red",
        school:
          "Flags severe food/drug allergies (e.g., Peanuts, Penicillin) and chronic asthma with High-Risk Medical Badges across Teacher, PE Instructor, and Canteen staff dashboards.",
        parent:
          "Peace of mind knowing PE teachers and canteen staff are immediately aware of their child's life-threatening allergies.",
        link: "/infirmary",
        linkText: "Open Infirmary →",
      },
      {
        icon: <Stethoscope size={22} />,
        emoji: "🩺",
        name: "Nurse Visit Log & Daily Medication Tracking",
        tag: "NEW",
        tagColor: "red",
        school:
          "School nurses log symptoms, treatment given, and rest duration. Tracks daily in-school medication schedules.",
        parent:
          "Instant app notification when their child visits the school infirmary or receives medication.",
        link: "/infirmary",
        linkText: "Open Infirmary →",
      },
    ],
    mockup: {
      type: "alert",
      header: "MEDICAL ALLERGY ALERT",
      headerIcon: <HeartPulse size={14} />,
      headerColor: "red",
      student: "Aarav Sharma (Class 10-A)",
      badges: [
        { text: "HIGH RISK", color: "red" },
        { text: "ANAPHYLAXIS PROTOCOL", color: "orange" },
      ],
      alerts: [
        "⚠️ Severe Peanut & Penicillin Allergy",
        "🫁 Chronic Asthma — Inhaler in Infirmary",
      ],
      flagged: "Flagged on Teacher, PE & Canteen apps",
    },
  },
  {
    id: "tc-portal",
    badge: "📄 Digital Transfer Certificate & QR Portal",
    badgeColor: "indigo",
    title: "1-Second Multi-Department Clearance & Tamper-Proof TCs",
    subtitle:
      "Eliminate the signature-hunting exodus across 4 departments. Auto-check fee dues, library books, and hostel allocations in 1 second — then issue a QR-verified Transfer Certificate.",
    features: [
      {
        icon: <Zap size={22} />,
        emoji: "⚡",
        name: "Multi-Module Automated Clearance Checker",
        tag: "NEW",
        tagColor: "indigo",
        school:
          "Auto-checks 3 clearance departments in 1 second: Fee Dues (StudentFeeInvoice), Library Unreturned Books (BookIssue), and Hostel Allocations (HostelAllocation).",
        parent:
          "Eliminates signature-hunting across 4 departments during student exit.",
        link: "/transfer-certificates",
        linkText: "Open TC Module →",
      },
      {
        icon: <QrCode size={22} />,
        emoji: "🔒",
        name: "Public QR Verification Portal",
        tag: "NEW",
        tagColor: "indigo",
        school:
          "Issues TCs with a tamper-proof QR code. Receiving schools scan to instantly verify authenticity without calling the office.",
        parent:
          "Prevents TC forgery and speeds up admissions at new schools.",
        link: "/transfer-certificates",
        linkText: "Open TC Module →",
      },
    ],
    mockup: {
      type: "clearance",
      header: "MULTI-DEPARTMENT CLEARANCE",
      headerIcon: <FileText size={14} />,
      headerColor: "indigo",
      checks: [
        { dept: "Fee Accounts", status: "CLEARED", icon: "💳", time: "0.2s" },
        {
          dept: "Library",
          status: "CLEARED",
          icon: "📚",
          time: "0.3s",
        },
        { dept: "Hostel", status: "N/A", icon: "🏠", time: "0.1s" },
      ],
      tc: {
        number: "TC-2026-VDM-00417",
        student: "Riya Patel (Class 12-B)",
        qr: true,
      },
    },
  },
  {
    id: "transport",
    badge: "🚌 Smart Safety, Transport & Multi-Child Portal",
    badgeColor: "sky",
    title: "Real-Time Bus Tracking & Unified Parent Dashboard",
    subtitle:
      "Live GPS bus tracking with conductor QR scans, multi-child single-login portal, and integrated digital fee checkout — everything a modern parent expects.",
    features: [
      {
        icon: <Bus size={22} />,
        emoji: "🚌",
        name: "Live Bus GPS & Conductor Scan",
        tag: null,
        school:
          "Conductors scan student QR/NFC cards upon boarding/alighting; route trails auto-sync to campus map.",
        parent:
          "Live bus location on map + notification when child boards or steps off bus.",
        link: "/transport",
        linkText: "Open Transport →",
      },
      {
        icon: <Users size={22} />,
        emoji: "👨‍👩‍👧‍👦",
        name: "Multi-Child Single Login Portal",
        tag: null,
        school:
          "Office staff link all siblings under one verified guardian profile (GuardianStudentLink).",
        parent:
          "Parents with 2 or 3 kids in different grades manage fees, homework, and attendance from one single app login.",
        link: "/parents-linking",
        linkText: "Open Parents →",
      },
      {
        icon: <CreditCard size={22} />,
        emoji: "💳",
        name: "Integrated Digital Fee Checkout",
        tag: null,
        school:
          "Instant online fee invoicing with automated Razorpay checkout and instant receipt generation.",
        parent:
          "24/7 digital payment via UPI, Credit Card, or NetBanking without standing in fee queues.",
        link: "/fees",
        linkText: "Open Fees →",
      },
    ],
    mockup: {
      type: "transport",
      header: "LIVE BUS TRACKING",
      headerIcon: <Bus size={14} />,
      headerColor: "sky",
      routes: [
        {
          name: "Route A — Koramangala",
          bus: "KA-01-MN-4521",
          students: 34,
          status: "En Route",
        },
        {
          name: "Route B — Whitefield",
          bus: "KA-01-MN-7892",
          students: 28,
          status: "Boarding",
        },
      ],
    },
  },
];

const COMPARISON_ROWS = [
  {
    feature: "Substitute Teacher Allocation",
    vidyam: "AI-scored auto-allocation in 10 seconds",
    legacy: "45 min manual phone calls every morning",
  },
  {
    feature: "DPDP Act 2023 Compliance",
    vidyam: "Built-in consent certificates with crypto audit",
    legacy: "No compliance — heavy legal penalty risk",
  },
  {
    feature: "Transfer Certificate Clearance",
    vidyam: "1-second auto-check across 3 departments",
    legacy: "2-3 days of manual signature hunting",
  },
  {
    feature: "Medical Allergy Alerts",
    vidyam: "Real-time HIGH RISK badges on all staff dashboards",
    legacy: "Paper file in principal's office",
  },
  {
    feature: "Parent Communication",
    vidyam: "Real-time push notifications + multi-child portal",
    legacy: "Printed circulars & WhatsApp groups",
  },
  {
    feature: "Fee Collection",
    vidyam: "24/7 UPI/Card/NetBanking with instant receipts",
    legacy: "Cash counter queues with manual receipts",
  },
  {
    feature: "Bus Tracking",
    vidyam: "Live GPS + conductor QR scan boarding alerts",
    legacy: "No tracking — parent anxiety daily",
  },
  {
    feature: "UI & Technology Stack",
    vidyam: "Modern React + responsive mobile-first design",
    legacy: "2005-era cluttered ERP tables",
  },
];

const STATS = [
  { value: "100%", label: "DPDP Act 2023 Compliant", color: "purple" },
  { value: "45 min", label: "Saved Daily per Principal", color: "emerald" },
  { value: "1 sec", label: "Multi-Dept TC Clearance", color: "purple" },
  { value: "Instant", label: "Public QR Verification", color: "emerald" },
];

/* ─────────────────────────── REVEAL HOOK ─────────────────────────── */

function useReveal() {
  const ref = useRef(null);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          el.classList.add("lp-visible");
          observer.unobserve(el);
        }
      },
      { threshold: 0.12 }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);
  return ref;
}

function RevealSection({ children, className = "", delay = 0 }) {
  const ref = useReveal();
  return (
    <div
      ref={ref}
      className={`lp-reveal ${className}`}
      style={{ transitionDelay: `${delay}ms` }}
    >
      {children}
    </div>
  );
}

/* ─────────────────────────── COLOR MAPS ─────────────────────────── */

const colorMap = {
  purple: {
    badge: "bg-purple-100 dark:bg-purple-950/80 text-purple-700 dark:text-purple-300 border-purple-200 dark:border-purple-700/50",
    tagBg: "bg-purple-500",
    card: "border-purple-500/20 hover:border-purple-500/40",
    glow: "from-purple-600/20 via-transparent to-transparent",
    icon: "bg-purple-100 dark:bg-purple-900/60 text-purple-600 dark:text-purple-400",
    mockupBorder: "border-purple-500/30",
    mockupGlow: "shadow-purple-500/10",
    headerText: "text-purple-400",
    headerBg: "bg-purple-500/20 text-purple-300",
  },
  emerald: {
    badge: "bg-emerald-100 dark:bg-emerald-950/80 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-700/50",
    tagBg: "bg-emerald-500",
    card: "border-emerald-500/20 hover:border-emerald-500/40",
    glow: "from-emerald-600/20 via-transparent to-transparent",
    icon: "bg-emerald-100 dark:bg-emerald-900/60 text-emerald-600 dark:text-emerald-400",
    mockupBorder: "border-emerald-500/30",
    mockupGlow: "shadow-emerald-500/10",
    headerText: "text-emerald-400",
    headerBg: "bg-emerald-500/20 text-emerald-300",
  },
  red: {
    badge: "bg-red-100 dark:bg-red-950/80 text-red-700 dark:text-red-300 border-red-200 dark:border-red-700/50",
    tagBg: "bg-red-500",
    card: "border-red-500/20 hover:border-red-500/40",
    glow: "from-red-600/20 via-transparent to-transparent",
    icon: "bg-red-100 dark:bg-red-900/60 text-red-600 dark:text-red-400",
    mockupBorder: "border-red-500/30",
    mockupGlow: "shadow-red-500/10",
    headerText: "text-red-400",
    headerBg: "bg-red-500/20 text-red-300",
  },
  indigo: {
    badge: "bg-indigo-100 dark:bg-indigo-950/80 text-indigo-700 dark:text-indigo-300 border-indigo-200 dark:border-indigo-700/50",
    tagBg: "bg-indigo-500",
    card: "border-indigo-500/20 hover:border-indigo-500/40",
    glow: "from-indigo-600/20 via-transparent to-transparent",
    icon: "bg-indigo-100 dark:bg-indigo-900/60 text-indigo-600 dark:text-indigo-400",
    mockupBorder: "border-indigo-500/30",
    mockupGlow: "shadow-indigo-500/10",
    headerText: "text-indigo-400",
    headerBg: "bg-indigo-500/20 text-indigo-300",
  },
  sky: {
    badge: "bg-sky-100 dark:bg-sky-950/80 text-sky-700 dark:text-sky-300 border-sky-200 dark:border-sky-700/50",
    tagBg: "bg-sky-500",
    card: "border-sky-500/20 hover:border-sky-500/40",
    glow: "from-sky-600/20 via-transparent to-transparent",
    icon: "bg-sky-100 dark:bg-sky-900/60 text-sky-600 dark:text-sky-400",
    mockupBorder: "border-sky-500/30",
    mockupGlow: "shadow-sky-500/10",
    headerText: "text-sky-400",
    headerBg: "bg-sky-500/20 text-sky-300",
  },
};

/* ──────────────────── MOCKUP RENDERERS ──────────────────── */

function ScoringMockup({ data, colors }) {
  return (
    <div className={`rounded-2xl bg-white dark:bg-slate-900 border ${colors.mockupBorder} shadow-2xl ${colors.mockupGlow} overflow-hidden`}>
      {/* Header bar */}
      <div className="px-5 py-3 bg-slate-50 dark:bg-slate-950 border-b border-slate-200 dark:border-slate-800/80 flex items-center justify-between">
        <div className={`flex items-center gap-2 ${colors.headerText} font-extrabold text-xs tracking-wider`}>
          {data.headerIcon} {data.header}
        </div>
        <span className={`text-[10px] font-bold px-2 py-0.5 rounded ${colors.headerBg}`}>LIVE</span>
      </div>
      <div className="p-5 space-y-3">
        <div className="text-sm font-bold text-slate-900 dark:text-white">{data.scenario}</div>
        <div className="text-xs text-slate-500 dark:text-slate-400">{data.absent}</div>
        {data.candidates.map((c, i) => (
          <div
            key={i}
            className={`p-3.5 rounded-xl border transition-all ${c.recommended
              ? `bg-purple-50 dark:bg-purple-950/40 border-purple-300 dark:border-purple-700/60`
              : "bg-slate-50 dark:bg-slate-800/40 border-slate-200 dark:border-slate-700/60"
              }`}
          >
            <div className="flex items-center justify-between">
              <div>
                <span className={`font-bold text-sm ${c.recommended ? "text-purple-900 dark:text-purple-200" : "text-slate-700 dark:text-slate-300"}`}>
                  {c.name}
                </span>
                <span className="text-xs text-slate-400 block">{c.role}</span>
              </div>
              <span
                className={`text-xs font-extrabold px-3 py-1 rounded-full ${c.recommended
                  ? "bg-purple-600 text-white"
                  : "bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300"
                  }`}
              >
                {c.score} pts
              </span>
            </div>
            {c.tags && (
              <div className="flex flex-wrap gap-1.5 mt-2">
                {c.tags.map((t, j) => (
                  <span
                    key={j}
                    className={`text-[10px] font-bold px-2 py-0.5 rounded ${t.startsWith("-")
                      ? "bg-red-100 dark:bg-red-900/60 text-red-700 dark:text-red-300"
                      : "bg-purple-200 dark:bg-purple-900 text-purple-800 dark:text-purple-200"
                      }`}
                  >
                    {t}
                  </span>
                ))}
              </div>
            )}
            {c.recommended && (
              <div className="mt-2 flex items-center gap-1.5 text-emerald-500 text-xs font-bold">
                <CheckCircle2 size={14} /> Recommended — Auto-Confirmed
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

function CertificateMockup({ data, colors }) {
  return (
    <div className={`rounded-2xl bg-white dark:bg-slate-900 border ${colors.mockupBorder} shadow-2xl ${colors.mockupGlow} overflow-hidden`}>
      <div className="px-5 py-3 bg-slate-50 dark:bg-slate-950 border-b border-slate-200 dark:border-slate-800/80 flex items-center justify-between">
        <div className={`flex items-center gap-2 ${colors.headerText} font-extrabold text-xs tracking-wider`}>
          {data.headerIcon} {data.header}
        </div>
        <span className="text-[10px] font-mono font-bold bg-slate-100 dark:bg-slate-800 px-2.5 py-1 rounded text-slate-500 dark:text-slate-400">
          DPDP-CERT-2026
        </span>
      </div>
      <div className="p-5 space-y-2.5">
        {data.rows.map((r, i) => (
          <div
            key={i}
            className="flex justify-between items-center border-b border-slate-100 dark:border-slate-800/60 pb-2.5 last:border-0 last:pb-0"
          >
            <span className="text-xs text-slate-500 dark:text-slate-400 shrink-0">{r.label}:</span>
            <span
              className={`text-xs font-bold text-right ${r.valueColor === "emerald"
                ? "text-emerald-500"
                : r.valueColor === "red"
                  ? "text-red-500"
                  : "text-slate-900 dark:text-white"
                }`}
            >
              {r.value}
            </span>
          </div>
        ))}
        <div className="mt-4 p-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-200 dark:border-emerald-800/50 flex items-center justify-between">
          <span className="text-xs font-bold text-emerald-800 dark:text-emerald-300">
            ✓ Legal Audit Proof Valid
          </span>
          <span className="text-[10px] font-mono text-slate-500">SHA-256 Verified</span>
        </div>
      </div>
    </div>
  );
}

function AlertMockup({ data, colors }) {
  return (
    <div className={`rounded-2xl bg-white dark:bg-slate-900 border ${colors.mockupBorder} shadow-2xl ${colors.mockupGlow} overflow-hidden`}>
      <div className="px-5 py-3 bg-slate-50 dark:bg-slate-950 border-b border-slate-200 dark:border-slate-800/80 flex items-center justify-between">
        <div className={`flex items-center gap-2 ${colors.headerText} font-extrabold text-xs tracking-wider`}>
          {data.headerIcon} {data.header}
        </div>
        <div className="flex gap-1.5">
          {data.badges.map((b, i) => (
            <span
              key={i}
              className={`text-[10px] font-extrabold px-2 py-0.5 rounded ${b.color === "red"
                ? "bg-red-500/20 text-red-400"
                : "bg-orange-500/20 text-orange-400"
                }`}
            >
              {b.text}
            </span>
          ))}
        </div>
      </div>
      <div className="p-5">
        <div className="text-sm font-bold text-slate-900 dark:text-white mb-3">{data.student}</div>
        <div className="space-y-2">
          {data.alerts.map((a, i) => (
            <div
              key={i}
              className="text-xs text-white bg-red-950/90 dark:bg-red-950/80 p-2.5 rounded-lg border border-red-800/50 font-semibold"
            >
              {a}
            </div>
          ))}
        </div>
        <div className="mt-3 text-[11px] text-slate-400 italic flex items-center gap-1.5">
          <Eye size={12} /> {data.flagged}
        </div>
        <div className="mt-4 grid grid-cols-3 gap-2">
          {["Teacher App", "PE Coach App", "Canteen App"].map((app, i) => (
            <div
              key={i}
              className="text-center p-2 rounded-lg bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-800/40"
            >
              <div className="text-[10px] font-bold text-red-600 dark:text-red-400">{app}</div>
              <div className="text-[10px] text-red-500 mt-0.5">🔴 Flagged</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function ClearanceMockup({ data, colors }) {
  return (
    <div className={`rounded-2xl bg-white dark:bg-slate-900 border ${colors.mockupBorder} shadow-2xl ${colors.mockupGlow} overflow-hidden`}>
      <div className="px-5 py-3 bg-slate-50 dark:bg-slate-950 border-b border-slate-200 dark:border-slate-800/80 flex items-center justify-between">
        <div className={`flex items-center gap-2 ${colors.headerText} font-extrabold text-xs tracking-wider`}>
          {data.headerIcon} {data.header}
        </div>
        <span className={`text-[10px] font-bold px-2 py-0.5 rounded ${colors.headerBg}`}>AUTO</span>
      </div>
      <div className="p-5 space-y-3">
        {data.checks.map((c, i) => (
          <div
            key={i}
            className="flex items-center justify-between p-3 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-700/60"
          >
            <div className="flex items-center gap-3">
              <span className="text-lg">{c.icon}</span>
              <span className="text-sm font-bold text-slate-900 dark:text-white">{c.dept}</span>
            </div>
            <div className="flex items-center gap-3">
              <span className="text-[10px] font-mono text-slate-400">{c.time}</span>
              <span
                className={`text-[11px] font-extrabold px-2.5 py-0.5 rounded ${c.status === "CLEARED"
                  ? "bg-emerald-100 dark:bg-emerald-900/60 text-emerald-600 dark:text-emerald-400"
                  : "bg-slate-100 dark:bg-slate-700 text-slate-500"
                  }`}
              >
                {c.status === "CLEARED" ? "✓ " : ""}{c.status}
              </span>
            </div>
          </div>
        ))}
        <div className="mt-4 p-4 rounded-xl bg-indigo-50 dark:bg-indigo-950/40 border border-indigo-200 dark:border-indigo-700/50">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-xs font-bold text-indigo-900 dark:text-indigo-200">{data.tc.number}</div>
              <div className="text-[11px] text-slate-500 mt-0.5">{data.tc.student}</div>
            </div>
            <div className="flex items-center gap-2">
              <QrCode size={20} className="text-indigo-500" />
              <span className="text-[10px] font-bold text-indigo-600 dark:text-indigo-400">QR Ready</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function TransportMockup({ data, colors }) {
  return (
    <div className={`rounded-2xl bg-white dark:bg-slate-900 border ${colors.mockupBorder} shadow-2xl ${colors.mockupGlow} overflow-hidden`}>
      <div className="px-5 py-3 bg-slate-50 dark:bg-slate-950 border-b border-slate-200 dark:border-slate-800/80 flex items-center justify-between">
        <div className={`flex items-center gap-2 ${colors.headerText} font-extrabold text-xs tracking-wider`}>
          {data.headerIcon} {data.header}
        </div>
        <span className="flex items-center gap-1.5 text-[10px] font-bold text-emerald-400">
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse inline-block" /> GPS Active
        </span>
      </div>
      {/* Simulated map area */}
      <div className="h-32 bg-gradient-to-br from-sky-100 via-sky-50 to-emerald-50 dark:from-slate-800 dark:via-slate-850 dark:to-slate-800 relative overflow-hidden">
        <div className="absolute inset-0 opacity-20 dark:opacity-10" style={{
          backgroundImage: `radial-gradient(circle at 1px 1px, currentColor 1px, transparent 0)`,
          backgroundSize: '20px 20px',
        }} />
        <div className="absolute top-8 left-1/4 w-3 h-3 rounded-full bg-sky-500 shadow-lg shadow-sky-500/50 animate-pulse" />
        <div className="absolute top-16 right-1/3 w-3 h-3 rounded-full bg-emerald-500 shadow-lg shadow-emerald-500/50 animate-pulse" />
        <MapPin className="absolute top-6 left-1/4 -ml-2 -mt-4 text-sky-600" size={18} />
        <MapPin className="absolute top-14 right-1/3 -mr-2 -mt-4 text-emerald-600" size={18} />
      </div>
      <div className="p-5 space-y-3">
        {data.routes.map((r, i) => (
          <div
            key={i}
            className="flex items-center justify-between p-3 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-700/60"
          >
            <div>
              <div className="text-sm font-bold text-slate-900 dark:text-white">{r.name}</div>
              <div className="text-[11px] text-slate-400 mt-0.5">{r.bus} · {r.students} students</div>
            </div>
            <span
              className={`text-[11px] font-bold px-2.5 py-1 rounded-lg ${r.status === "En Route"
                ? "bg-sky-100 dark:bg-sky-900/60 text-sky-600 dark:text-sky-400"
                : "bg-amber-100 dark:bg-amber-900/60 text-amber-600 dark:text-amber-400"
                }`}
            >
              {r.status}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

function renderMockup(section) {
  const colors = colorMap[section.badgeColor];
  const m = section.mockup;
  switch (m.type) {
    case "scoring":
      return <ScoringMockup data={m} colors={colors} />;
    case "certificate":
      return <CertificateMockup data={m} colors={colors} />;
    case "alert":
      return <AlertMockup data={m} colors={colors} />;
    case "clearance":
      return <ClearanceMockup data={m} colors={colors} />;
    case "transport":
      return <TransportMockup data={m} colors={colors} />;
    default:
      return null;
  }
}

/* ──────────────────── FEATURE SECTION COMPONENT ──────────────────── */

function FeatureSection({ section, index }) {
  const [activeFeature, setActiveFeature] = useState(0);
  const colors = colorMap[section.badgeColor];
  const isReversed = index % 2 === 1;
  const feat = section.features[activeFeature];

  return (
    <section
      id={section.id}
      className={`py-20 md:py-28 ${index % 2 === 0
        ? "bg-white dark:bg-slate-900/60"
        : "bg-violet-50/40 dark:bg-slate-950/60"
        } border-t border-slate-200/80 dark:border-slate-800/80 relative overflow-hidden`}
    >
      {/* Subtle gradient glow */}
      <div className={`absolute top-0 ${isReversed ? "right-0" : "left-0"} w-96 h-96 bg-gradient-radial ${colors.glow} rounded-full blur-3xl opacity-40 pointer-events-none`} />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative">
        {/* Section header */}
        <RevealSection className="text-center max-w-3xl mx-auto mb-16">
          <div className={`inline-flex items-center gap-2 px-4 py-1.5 rounded-full border text-xs font-bold uppercase tracking-wider mb-5 ${colors.badge}`}>
            {section.badge}
          </div>
          <h2 className="font-extrabold text-3xl sm:text-4xl lg:text-5xl text-slate-900 dark:text-white tracking-tight leading-tight">
            {section.title}
          </h2>
          <p className="mt-4 text-base sm:text-lg text-slate-600 dark:text-slate-300 leading-relaxed font-medium">
            {section.subtitle}
          </p>
        </RevealSection>

        {/* Two-column layout: features + mockup */}
        <div className={`grid grid-cols-1 lg:grid-cols-12 gap-12 xl:gap-16 items-start ${isReversed ? "lg:flex-row-reverse" : ""}`}>
          {/* Feature list column */}
          <RevealSection
            className={`lg:col-span-7 ${isReversed ? "lg:order-2" : "lg:order-1"}`}
            delay={100}
          >
            {/* Feature tab buttons */}
            <div className="flex flex-wrap gap-2 mb-6">
              {section.features.map((f, i) => (
                <button
                  key={i}
                  onClick={() => setActiveFeature(i)}
                  className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all duration-200 ${activeFeature === i
                    ? `bg-slate-900 dark:bg-white text-white dark:text-slate-900 shadow-lg`
                    : "bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600"
                    }`}
                >
                  <span className="text-sm">{f.emoji}</span>
                  <span className="hidden sm:inline">{f.name.split(" ").slice(0, 3).join(" ")}</span>
                  <span className="sm:hidden">{f.name.split(" ").slice(0, 2).join(" ")}</span>
                  {f.tag && (
                    <span className={`${colorMap[f.tagColor || section.badgeColor].tagBg} text-white text-[9px] px-1.5 py-0.5 rounded font-extrabold`}>
                      {f.tag}
                    </span>
                  )}
                </button>
              ))}
            </div>

            {/* Active feature detail */}
            <div key={activeFeature} className="lp-tab-content">
              <div className="rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xl p-6 sm:p-8">
                <div className="flex items-start gap-4 mb-6">
                  <div className={`w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 ${colors.icon}`}>
                    {feat.icon}
                  </div>
                  <div>
                    <h3 className="font-bold text-lg text-slate-900 dark:text-white flex items-center gap-2 flex-wrap">
                      {feat.name}
                      {feat.tag && (
                        <span className={`${colorMap[feat.tagColor || section.badgeColor].tagBg} text-white text-[10px] px-2 py-0.5 rounded font-extrabold`}>
                          {feat.tag}
                        </span>
                      )}
                    </h3>
                  </div>
                </div>

                {/* School & Parent benefit columns */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  <div className="p-4 rounded-xl bg-violet-50 dark:bg-violet-950/30 border border-violet-200 dark:border-violet-800/40">
                    <div className="flex items-center gap-2 mb-2">
                      <School size={14} className="text-violet-600 dark:text-violet-400" />
                      <span className="text-[11px] font-extrabold uppercase tracking-wider text-violet-700 dark:text-violet-300">
                        For Schools & Principals
                      </span>
                    </div>
                    <p className="text-xs text-slate-700 dark:text-slate-300 leading-relaxed">
                      {feat.school}
                    </p>
                  </div>
                  <div className="p-4 rounded-xl bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800/40">
                    <div className="flex items-center gap-2 mb-2">
                      <Users size={14} className="text-emerald-600 dark:text-emerald-400" />
                      <span className="text-[11px] font-extrabold uppercase tracking-wider text-emerald-700 dark:text-emerald-300">
                        For Parents
                      </span>
                    </div>
                    <p className="text-xs text-slate-700 dark:text-slate-300 leading-relaxed">
                      {feat.parent}
                    </p>
                  </div>
                </div>

                {/* Link */}
                <Link
                  to={feat.link}
                  className={`mt-5 inline-flex items-center gap-1.5 text-xs font-bold ${section.badgeColor === "purple"
                    ? "text-purple-600 hover:text-purple-700 dark:text-purple-400"
                    : section.badgeColor === "emerald"
                      ? "text-emerald-600 hover:text-emerald-700 dark:text-emerald-400"
                      : section.badgeColor === "red"
                        ? "text-red-600 hover:text-red-700 dark:text-red-400"
                        : section.badgeColor === "indigo"
                          ? "text-indigo-600 hover:text-indigo-700 dark:text-indigo-400"
                          : "text-sky-600 hover:text-sky-700 dark:text-sky-400"
                    } transition-colors`}
                >
                  {feat.linkText} <ChevronRight size={14} />
                </Link>
              </div>
            </div>
          </RevealSection>

          {/* Mockup column */}
          <RevealSection
            className={`lg:col-span-5 ${isReversed ? "lg:order-1" : "lg:order-2"}`}
            delay={250}
          >
            <div className="lp-float-slow">{renderMockup(section)}</div>
          </RevealSection>
        </div>
      </div>
    </section>
  );
}

/* ─────────────────────────── MAIN COMPONENT ─────────────────────────── */

const LandingPage = () => {
  const [darkMode, setDarkMode] = useState(true);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }
  }, [darkMode]);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const navLinks = [
    { href: "#ai-engine", label: "AI Engine" },
    { href: "#dpdp-shield", label: "DPDP Shield" },
    { href: "#infirmary", label: "Infirmary" },
    { href: "#tc-portal", label: "TC Portal" },
    { href: "#transport", label: "Transport" },
    { href: "#comparison", label: "Why VIDYAM" },
  ];

  return (
    <div
      className={`min-h-screen font-sans transition-colors duration-300 ${darkMode
        ? "dark bg-[#0b071a] text-slate-100"
        : "bg-white text-slate-800"
        }`}
    >
      {/* ═══════════════ HEADER ═══════════════ */}
      <header
        className={`sticky top-0 z-50 transition-all duration-300 ${scrolled
          ? "backdrop-blur-xl bg-white/95 dark:bg-slate-950/90 shadow-lg shadow-slate-900/5 dark:shadow-purple-900/10"
          : "backdrop-blur-md bg-white/95 dark:bg-slate-950/80"
          } border-b border-slate-200/80 dark:border-purple-900/40`}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-3 group">
            <VidyamLogoMark size={44} className="group-hover:scale-105 transition-transform" />
            <div className="flex flex-col">
              <span className="font-extrabold text-2xl tracking-tight text-slate-900 dark:text-white">
                VIDYAM
              </span>
              <span className="text-[10px] font-bold tracking-widest text-purple-600 dark:text-purple-300 uppercase -mt-1">
                SCHOOL OPERATING SYSTEM
              </span>
            </div>
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden lg:flex items-center gap-6 text-sm font-semibold text-slate-600 dark:text-slate-300">
            {navLinks.map((link) => (
              <a
                key={link.href}
                href={link.href}
                className="hover:text-purple-600 dark:hover:text-purple-300 transition-colors relative group"
              >
                {link.label}
                <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-purple-500 group-hover:w-full transition-all duration-300" />
              </a>
            ))}
          </nav>

          {/* Right Controls */}
          <div className="flex items-center gap-3">
            <button
              onClick={() => setDarkMode(!darkMode)}
              className="p-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 transition"
              aria-label="Toggle Theme"
            >
              {darkMode ? <Sun size={18} /> : <Moon size={18} />}
            </button>

            <Link
              to="/login"
              className="hidden sm:inline-flex items-center justify-center px-5 py-2.5 rounded-xl font-bold text-sm text-white bg-gradient-to-r from-purple-600 to-violet-700 hover:from-purple-500 hover:to-violet-600 shadow-md shadow-purple-500/20 hover:shadow-purple-500/40 transition-all transform hover:-translate-y-0.5"
            >
              Portal Login
            </Link>

            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="lg:hidden p-2 rounded-xl text-slate-600 dark:text-slate-300"
            >
              {mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
            </button>
          </div>
        </div>

        {/* Mobile Menu */}
        {mobileMenuOpen && (
          <div className="lg:hidden px-4 pt-2 pb-6 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-purple-900/40 flex flex-col gap-3 lp-fade-up">
            {navLinks.map((link) => (
              <a
                key={link.href}
                href={link.href}
                onClick={() => setMobileMenuOpen(false)}
                className="py-2 text-sm font-semibold text-slate-700 dark:text-slate-200"
              >
                {link.label}
              </a>
            ))}
            <Link
              to="/login"
              className="w-full text-center py-3 rounded-xl font-bold text-sm text-white bg-purple-600 mt-2"
            >
              Portal Login
            </Link>
          </div>
        )}
      </header>

      {/* ═══════════════ HERO ═══════════════ */}
      <section className="relative pt-16 pb-24 md:pt-24 md:pb-36 overflow-hidden">
        {/* Animated gradient orbs */}
        <div className="absolute top-20 left-1/4 w-72 h-72 bg-purple-500/20 rounded-full blur-3xl lp-float-slow pointer-events-none" />
        <div className="absolute bottom-20 right-1/4 w-96 h-96 bg-emerald-500/10 rounded-full blur-3xl lp-float pointer-events-none" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-violet-600/5 rounded-full blur-3xl pointer-events-none" />

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative">
          <div className="text-center max-w-4xl mx-auto">
            {/* Pill Badge */}
            <div className="lp-fade-up inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-purple-100 dark:bg-purple-950/80 border border-purple-200 dark:border-purple-700/50 text-purple-700 dark:text-purple-300 text-xs font-bold uppercase tracking-wider mb-6">
              <span className="relative flex h-2 w-2">
                <span className="lp-ping-slow absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
              </span>
              Next-Gen AI School OS 
            </div>

            <h1
              className="lp-fade-up font-extrabold text-4xl sm:text-6xl lg:text-7xl tracking-tight text-slate-900 dark:text-white leading-[1.1]"
              style={{ animationDelay: "100ms" }}
            >
              The Intelligent Operating System for{" "}
              <span className="lp-gradient-text">Modern Schools & Parents</span>
            </h1>

            <p
              className="lp-fade-up mt-6 text-lg sm:text-xl text-slate-600 dark:text-slate-300 max-w-3xl mx-auto font-medium leading-relaxed"
              style={{ animationDelay: "200ms" }}
            >
              Automate morning substitute allocation, eliminate 90% exit
              paperwork with digital QR Transfer Certificates, and shield your
              school with India's first built-in DPDP Act 2023 compliance
              engine.
            </p>

            <div
              className="lp-fade-up mt-10 flex flex-col sm:flex-row items-center justify-center gap-4"
              style={{ animationDelay: "300ms" }}
            >
              <Link
                to="/login"
                className="w-full sm:w-auto px-8 py-4 rounded-2xl font-bold text-base text-white bg-gradient-to-r from-purple-600 to-violet-700 hover:from-purple-500 hover:to-violet-600 shadow-xl shadow-purple-600/30 hover:shadow-purple-600/50 transition-all transform hover:-translate-y-0.5 text-center flex items-center justify-center gap-2"
              >
                Access School Portal <ArrowRight size={18} />
              </Link>
              <a
                href="#ai-engine"
                className="w-full sm:w-auto px-8 py-4 rounded-2xl font-bold text-base text-slate-700 dark:text-slate-200 bg-white/80 dark:bg-slate-800/80 hover:bg-slate-100 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700 transition text-center"
              >
                Explore Features ↓
              </a>
            </div>

            {/* Trust Stats */}
            <div
              className="lp-fade-up mt-14 grid grid-cols-2 md:grid-cols-4 gap-4 text-center border-t border-slate-200/80 dark:border-slate-800/80 pt-8"
              style={{ animationDelay: "400ms" }}
            >
              {STATS.map((s, i) => (
                <div key={i}>
                  <div
                    className={`font-extrabold text-2xl sm:text-3xl ${s.color === "purple"
                      ? "text-purple-600 dark:text-purple-400"
                      : "text-emerald-500"
                      }`}
                  >
                    {s.value}
                  </div>
                  <div className="text-xs font-semibold text-slate-500 dark:text-slate-400 mt-0.5">
                    {s.label}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* ── Live Dashboard Mockup ── */}
          <RevealSection className="mt-16 relative max-w-5xl mx-auto" delay={200}>
            <div className="rounded-3xl p-3 bg-gradient-to-b from-purple-500/20 to-transparent border border-purple-500/30">
              <div className="rounded-2xl bg-slate-900 overflow-hidden shadow-2xl border border-slate-800">
                {/* Browser bar */}
                <div className="px-4 py-3 bg-slate-950 border-b border-slate-800/80 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="w-3 h-3 rounded-full bg-red-500 inline-block" />
                    <span className="w-3 h-3 rounded-full bg-yellow-500 inline-block" />
                    <span className="w-3 h-3 rounded-full bg-green-500 inline-block" />
                    <span className="ml-4 text-xs font-mono text-slate-400">
                      vidyam.school/dashboard/principal
                    </span>
                  </div>
                  <span className="text-xs font-semibold text-slate-400 bg-slate-800/80 px-2.5 py-1 rounded-md">
                    LIVE ERP DASHBOARD
                  </span>
                </div>

                {/* Mock widgets */}
                <div className="p-6 md:p-8 bg-slate-900 grid grid-cols-1 md:grid-cols-3 gap-6 text-left">
                  {/* AI Substitute */}
                  <div className="bg-slate-800/90 rounded-xl p-4 border border-slate-700/80 lp-beam-card">
                    <div className="flex items-center justify-between text-xs font-bold text-violet-400 mb-2">
                      <span className="flex items-center gap-1">
                        <Bot size={14} /> AI SUBSTITUTE ALLOCATOR
                      </span>
                      <span className="bg-violet-500/20 text-violet-300 px-2 py-0.5 rounded">
                        Scored +50
                      </span>
                    </div>
                    <div className="text-sm font-bold text-white">
                      Period 3 · Grade 10-A (Mathematics)
                    </div>
                    <div className="text-xs text-slate-400 mt-1">
                      Absent: Teacher Vikram Mehta
                    </div>
                    <div className="mt-3 p-2.5 rounded-lg bg-violet-950/60 border border-violet-800/50 flex items-center justify-between text-xs">
                      <span className="text-white font-semibold">
                        Recommended: Mrs. Sunita Rao
                      </span>
                      <span className="text-emerald-400 font-bold">
                        Confirmed ✓
                      </span>
                    </div>
                  </div>

                  {/* DPDP Shield */}
                  <div className="bg-slate-800/90 rounded-xl p-4 border border-slate-700/80 lp-beam-card">
                    <div className="flex items-center justify-between text-xs font-bold text-emerald-400 mb-2">
                      <span className="flex items-center gap-1">
                        <ShieldCheck size={14} /> DPDP 2023 COMPLIANCE
                      </span>
                      <span className="bg-emerald-500/20 text-emerald-300 px-2 py-0.5 rounded">
                        Sec 6 & 9
                      </span>
                    </div>
                    <div className="text-sm font-bold text-white">
                      Verifiable Parent Consent Certificate
                    </div>
                    <div className="text-xs text-slate-400 mt-1">
                      Guardian: Rajesh Sharma (9876543210)
                    </div>
                    <div className="mt-3 p-2.5 rounded-lg bg-emerald-950/60 border border-emerald-800/50 flex items-center justify-between text-xs">
                      <span className="text-white font-semibold">
                        Biometrics & GPS Granted
                      </span>
                      <span className="text-slate-300 font-mono">
                        v1.0 Audit
                      </span>
                    </div>
                  </div>

                  {/* Medical Alert */}
                  <div className="bg-slate-800/90 rounded-xl p-4 border border-slate-700/80 lp-beam-card">
                    <div className="flex items-center justify-between text-xs font-bold text-red-400 mb-2">
                      <span className="flex items-center gap-1">
                        <HeartPulse size={14} /> MEDICAL ALLERGY ALERT
                      </span>
                      <span className="bg-red-500/20 text-red-300 px-2 py-0.5 rounded font-extrabold">
                        HIGH RISK
                      </span>
                    </div>
                    <div className="text-sm font-bold text-white">
                      Aarav Sharma (Class 10-A)
                    </div>
                    <div className="text-xs text-slate-300 mt-1 bg-red-950/80 p-2 rounded border border-red-800/50">
                      ⚠️ Severe Peanut & Penicillin Allergy
                    </div>
                    <div className="mt-2 text-[11px] text-slate-400 italic">
                      Flagged on Teacher, PE & Canteen apps
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </RevealSection>
        </div>
      </section>

      {/* ═══════════════ FEATURE SECTIONS ═══════════════ */}
      {FEATURE_SECTIONS.map((section, i) => (
        <FeatureSection key={section.id} section={section} index={i} />
      ))}

      {/* ═══════════════ COMPARISON TABLE ═══════════════ */}
      <section
        id="comparison"
        className="py-20 md:py-28 bg-slate-50 dark:bg-[#0c081e] border-t border-slate-200 dark:border-slate-800 relative"
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <RevealSection className="text-center max-w-3xl mx-auto mb-16">
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-purple-100 dark:bg-purple-950/80 border border-purple-200 dark:border-purple-700/50 text-purple-700 dark:text-purple-300 text-xs font-bold uppercase tracking-wider mb-5">
              🏆 Why Schools Choose VIDYAM
            </div>
            <h2 className="font-extrabold text-3xl sm:text-4xl lg:text-5xl text-slate-900 dark:text-white tracking-tight">
              VIDYAM vs Legacy ERPs
            </h2>
            <p className="mt-4 text-base text-slate-600 dark:text-slate-300 leading-relaxed">
              See why modern schools are switching from outdated 2005-era ERP tables to VIDYAM's intelligent platform.
            </p>
          </RevealSection>

          <RevealSection delay={150}>
            <div className="overflow-x-auto rounded-2xl bg-white dark:bg-[#140e33] border border-slate-200 dark:border-purple-900/50 shadow-2xl">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-slate-100 dark:bg-[#1c1444] border-b border-slate-200 dark:border-purple-900/50">
                    <th className="text-left p-4.5 font-extrabold text-slate-800 dark:text-slate-100 w-1/4">Feature</th>
                    <th className="text-left p-4.5 w-[37.5%]">
                      <div className="flex items-center gap-2">
                        <span className="w-8 h-8 rounded-lg bg-gradient-to-tr from-purple-600 to-emerald-500 flex items-center justify-center text-white text-xs font-extrabold shadow-md">V</span>
                        <span className="font-extrabold text-purple-700 dark:text-purple-300 text-base">VIDYAM</span>
                      </div>
                    </th>
                    <th className="text-left p-4.5 w-[37.5%]">
                      <span className="font-extrabold text-slate-500 dark:text-slate-400 text-base">Legacy ERPs</span>
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-purple-950/60">
                  {COMPARISON_ROWS.map((row, i) => (
                    <tr
                      key={i}
                      className="hover:bg-purple-50/60 dark:hover:bg-purple-900/30 transition-colors"
                    >
                      <td className="p-4 font-bold text-slate-900 dark:text-white text-xs sm:text-sm">
                        {row.feature}
                      </td>
                      <td className="p-4">
                        <div className="flex items-start gap-2.5">
                          <CheckCircle2
                            size={18}
                            className="text-emerald-500 dark:text-emerald-400 shrink-0 mt-0.5"
                          />
                          <span className="text-xs sm:text-sm text-slate-800 dark:text-slate-100 font-semibold leading-relaxed">
                            {row.vidyam}
                          </span>
                        </div>
                      </td>
                      <td className="p-4">
                        <div className="flex items-start gap-2.5">
                          <X
                            size={18}
                            className="text-red-500 dark:text-red-400 shrink-0 mt-0.5"
                          />
                          <span className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 font-normal leading-relaxed">
                            {row.legacy}
                          </span>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </RevealSection>

          {/* Why VIDYAM pillars */}
          <RevealSection delay={300}>
            <div className="mt-16 grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="rounded-2xl p-6 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-lg hover:shadow-xl transition-shadow group">
                <div className="w-12 h-12 rounded-2xl bg-purple-100 dark:bg-purple-900/50 text-purple-600 dark:text-purple-400 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                  <CircuitBoard size={24} />
                </div>
                <h4 className="font-bold text-lg text-slate-900 dark:text-white mb-2">
                  Modern Stack & UI
                </h4>
                <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                  Sleek, vibrant web UI + native mobile app vs. outdated
                  2005-era cluttered ERP tables. Built with React, real-time
                  WebSocket updates, and responsive design.
                </p>
              </div>
              <div className="rounded-2xl p-6 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-lg hover:shadow-xl transition-shadow group">
                <div className="w-12 h-12 rounded-2xl bg-emerald-100 dark:bg-emerald-900/50 text-emerald-600 dark:text-emerald-400 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                  <ShieldCheck size={24} />
                </div>
                <h4 className="font-bold text-lg text-slate-900 dark:text-white mb-2">
                  Built-in Compliance
                </h4>
                <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                  Only ERP with full DPDP Act 2023 compliance, verifiable
                  consent certificates, and CERT-In audit logging built-in —
                  not bolted on as an afterthought.
                </p>
              </div>
              <div className="rounded-2xl p-6 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-lg hover:shadow-xl transition-shadow group">
                <div className="w-12 h-12 rounded-2xl bg-violet-100 dark:bg-violet-900/50 text-violet-600 dark:text-violet-400 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                  <Zap size={24} />
                </div>
                <h4 className="font-bold text-lg text-slate-900 dark:text-white mb-2">
                  True Automation
                </h4>
                <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                  Automated substitute allocation, automated multi-department
                  TC clearance, and automated batch promotion — not just
                  digitized paper forms.
                </p>
              </div>
            </div>
          </RevealSection>
        </div>
      </section>

      {/* ═══════════════ CTA ═══════════════ */}
      <section className="relative py-20 md:py-28 overflow-hidden">
        {/* Animated gradient background */}
        <div className="absolute inset-0 bg-gradient-to-tr from-purple-900 via-violet-800 to-purple-950 lp-gradient-bg" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-emerald-500/10 via-transparent to-transparent" />

        {/* Floating elements */}
        <div className="absolute top-16 left-16 w-20 h-20 bg-purple-500/10 rounded-full blur-xl lp-float" />
        <div className="absolute bottom-16 right-20 w-32 h-32 bg-emerald-500/10 rounded-full blur-xl lp-float-slow" />

        <div className="max-w-4xl mx-auto px-4 text-center relative">
          <RevealSection>
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/10 border border-white/20 text-purple-200 text-xs font-bold uppercase tracking-wider mb-6">
              <Star size={12} className="text-amber-400" /> Trusted by Forward-Thinking Schools
            </div>
            <h2 className="font-extrabold text-3xl sm:text-5xl lg:text-6xl tracking-tight text-white leading-tight">
              Ready to Modernize Your{" "}
            </h2>
            <p className="mt-6 text-lg text-purple-200/80 max-w-2xl mx-auto font-medium">
              Join the new generation of AI-powered, legally-compliant school management. Schedule a demo or access your portal today.
            </p>
            <div className="mt-10 flex flex-col sm:flex-row justify-center gap-4">
              <Link
                to="/login"
                className="px-8 py-4 rounded-2xl font-bold text-base text-slate-900 bg-white hover:bg-slate-100 shadow-xl transition-all transform hover:-translate-y-0.5 flex items-center justify-center gap-2"
              >
                Go to Portal Login <ArrowRight size={18} />
              </Link>
              <a
                href="#ai-engine"
                className="px-8 py-4 rounded-2xl font-bold text-base text-white bg-white/10 hover:bg-white/20 border border-white/20 transition text-center"
              >
                Watch Features Tour ↑
              </a>
            </div>
          </RevealSection>
        </div>
      </section>

      {/* ═══════════════ FOOTER ═══════════════ */}
      <footer className="bg-slate-950 border-t border-slate-800/80 py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-purple-600 to-emerald-500 flex items-center justify-center text-white font-extrabold text-sm">
                V
              </div>
              <div>
                <span className="font-extrabold text-lg text-white">VIDYAM</span>
              </div>
            </div>
            <div className="flex items-center gap-8 text-xs font-semibold text-slate-400">
              <a href="#ai-engine" className="hover:text-purple-300 transition-colors">AI Engine</a>
              <a href="#dpdp-shield" className="hover:text-purple-300 transition-colors">DPDP Shield</a>
              <a href="#infirmary" className="hover:text-purple-300 transition-colors">Infirmary</a>
              <a href="#tc-portal" className="hover:text-purple-300 transition-colors">TC Portal</a>
              <a href="#comparison" className="hover:text-purple-300 transition-colors">Why VIDYAM</a>
            </div>
            <div className="text-xs text-slate-400">
              © {new Date().getFullYear()} VIDYAM. A product of{" "}
              <a
                href="https://polynexus.in"
                target="_blank"
                rel="noopener noreferrer"
                className="text-purple-400 hover:text-purple-300 underline underline-offset-2 transition-colors font-medium"
              >
                polynexus.in
              </a>
              . All rights reserved.
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default LandingPage;
