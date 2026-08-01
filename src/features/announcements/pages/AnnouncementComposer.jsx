import React, { useEffect, useMemo, useState } from "react";
import { toast } from "react-toastify";
import {
  Megaphone,
  PenSquare,
  History,
  Search,
  Trash2,
  CheckCircle2,
  Clock,
  ArrowRight,
  ShieldAlert,
  Globe,
  ExternalLink,
  Loader2,
} from "lucide-react";
import Button from "../../../components/Button";
import Modal from "../../../components/Modal";
import announcementService from "../services/announcementService";
import classSectionService from "../../students/services/classSectionService";
import useUser from "../../auth/hooks/useUser";
import { translateNotice } from "../../../services/translationService";

const CATEGORIES = ["General", "Academics", "Transport", "Fees", "Events"];

const MOCK_ROUTES = [
  { id: 1, name: "Shivaji Nagar – Line 3", students: 38 },
  { id: 2, name: "Kothrud – Line 1", students: 44 },
  { id: 3, name: "Baner Road – Line 2", students: 41 },
];

const asList = (data) => (Array.isArray(data) ? data : data?.results || []);

const timeAgo = (iso) => {
  if (!iso) return "recently";
  const diffMs = Date.now() - new Date(iso).getTime();
  const hours = Math.floor(diffMs / 3600000);
  if (hours < 1) return "just now";
  if (hours < 24) return `${hours}h ago`;
  return `${Math.floor(hours / 24)}d ago`;
};

const AUDIENCE_LABEL = {
  whole_school: "Whole School",
  class: "Specific Class(es)",
  bus_route: "Bus Route",
  teachers: "Teachers & Staff Only",
};

const AnnouncementComposer = () => {
  const { user } = useUser();
  const roleName = user?.data?.role || "Admin";
  const isStaff = !["Parent", "Student"].includes(roleName);

  // Tab State: "compose" | "history"
  const [activeTab, setActiveTab] = useState("compose");

  // Form State
  const [title, setTitle] = useState("");
  const [category, setCategory] = useState("General");
  const [message, setMessage] = useState("");
  const [schedule, setSchedule] = useState("now");
  const [translate, setTranslate] = useState(true);
  const [pushEnabled, setPushEnabled] = useState(true);
  const [requiresAck, setRequiresAck] = useState(false);

  // Audience State
  const [audienceType, setAudienceType] = useState("whole_school"); // whole_school | class | bus_route | teachers
  const [classSections, setClassSections] = useState([]);
  const [selectedClassIds, setSelectedClassIds] = useState([]);
  const [selectedRouteIds, setSelectedRouteIds] = useState([]);
  const [includeTeachers, setIncludeTeachers] = useState(false);

  // Status & List States
  const [publishing, setPublishing] = useState(false);
  const [allAnnouncements, setAllAnnouncements] = useState([]);
  const [loadingAnnouncements, setLoadingAnnouncements] = useState(true);
  const [ackingId, setAckingId] = useState(null);
  const [deletingId, setDeletingId] = useState(null);

  // Modals State & Dynamic Translation
  const [viewingAnnouncement, setViewingAnnouncement] = useState(null); // Announcement modal
  const [selectedLanguage, setSelectedLanguage] = useState("en"); // "en" | "mr" | "hi"
  const [modalTranslation, setModalTranslation] = useState({ title: "", content: "" });
  const [translating, setTranslating] = useState(false);

  const [rosterFor, setRosterFor] = useState(null);
  const [roster, setRoster] = useState(null);

  // History Tab Search & Filter States
  const [searchQuery, setSearchQuery] = useState("");
  const [filterCategory, setFilterCategory] = useState("all");
  const [filterAudience, setFilterAudience] = useState("all");

  useEffect(() => {
    if (isStaff) {
      const loadClassSections = async () => {
        try {
          const res = await classSectionService.getClassSections();
          setClassSections(asList(res.data));
        } catch (err) {
          console.error("Failed to load class sections:", err);
        }
      };
      loadClassSections();
    }
    fetchAllAnnouncements();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Dynamic Translation Hook for Pop-up Modal
  useEffect(() => {
    if (!viewingAnnouncement) return;

    if (selectedLanguage === "en") {
      setModalTranslation({ title: viewingAnnouncement.title, content: viewingAnnouncement.content });
      setTranslating(false);
      return;
    }

    // If pre-translated in DB
    const tr = viewingAnnouncement.translations || {};
    if (tr[selectedLanguage] && typeof tr[selectedLanguage] === "object" && tr[selectedLanguage].content) {
      setModalTranslation(tr[selectedLanguage]);
      setTranslating(false);
      return;
    }

    // Dynamic Live API Translation Call
    let isMounted = true;
    setTranslating(true);
    translateNotice(viewingAnnouncement.title, viewingAnnouncement.content, selectedLanguage)
      .then((res) => {
        if (isMounted) {
          setModalTranslation(res);
          setTranslating(false);
        }
      })
      .catch((err) => {
        console.error("Live translation error:", err);
        if (isMounted) {
          setModalTranslation({ title: viewingAnnouncement.title, content: viewingAnnouncement.content });
          setTranslating(false);
        }
      });

    return () => {
      isMounted = false;
    };
  }, [viewingAnnouncement, selectedLanguage]);

  const fetchAllAnnouncements = async () => {
    setLoadingAnnouncements(true);
    try {
      const res = await announcementService.getAnnouncements();
      setAllAnnouncements(asList(res.data));
    } catch (err) {
      console.error("Failed to load announcements:", err);
    } finally {
      setLoadingAnnouncements(false);
    }
  };

  const handleAcknowledge = async (announcement) => {
    setAckingId(announcement.id);
    try {
      await announcementService.acknowledgeAnnouncement(announcement.id);
      toast.success("Acknowledged.");
      fetchAllAnnouncements();
      if (viewingAnnouncement?.id === announcement.id) {
        setViewingAnnouncement((prev) => ({ ...prev, my_acknowledged: true }));
      }
    } catch (err) {
      console.error("Failed to acknowledge:", err);
      toast.error("Failed to acknowledge.");
    } finally {
      setAckingId(null);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Are you sure you want to delete this announcement?")) return;
    setDeletingId(id);
    try {
      await announcementService.deleteAnnouncement(id);
      toast.success("Announcement deleted.");
      fetchAllAnnouncements();
      if (viewingAnnouncement?.id === id) setViewingAnnouncement(null);
    } catch (err) {
      console.error("Failed to delete announcement:", err);
      toast.error("Failed to delete announcement.");
    } finally {
      setDeletingId(null);
    }
  };

  const openRoster = async (announcement) => {
    setRosterFor(announcement);
    setRoster(null);
    try {
      const res = await announcementService.getAcknowledgments(announcement.id);
      setRoster(res.data);
    } catch (err) {
      console.error("Failed to load acknowledgment roster:", err);
      toast.error("Failed to load who has acknowledged.");
    }
  };

  const toggleClass = (id) => {
    setSelectedClassIds((prev) => (prev.includes(id) ? prev.filter((c) => c !== id) : [...prev, id]));
  };
  const toggleRoute = (id) => {
    setSelectedRouteIds((prev) => (prev.includes(id) ? prev.filter((r) => r !== id) : [...prev, id]));
  };

  const reachEstimate = useMemo(() => {
    if (audienceType === "whole_school") {
      return {
        count: includeTeachers ? 1326 : 1240,
        note: includeTeachers ? "All 1,240 parents + 86 teaching staff" : "Every enrolled family (1,240 parents)",
      };
    }
    if (audienceType === "class") {
      const n = selectedClassIds.length;
      return {
        count: n * 32 + (includeTeachers ? 86 : 0),
        note: `${n} class section(s) selected · ~32 students each${includeTeachers ? " + 86 teaching staff" : ""}`,
      };
    }
    if (audienceType === "bus_route") {
      const students = MOCK_ROUTES.filter((r) => selectedRouteIds.includes(r.id)).reduce((sum, r) => sum + r.students, 0);
      return {
        count: Math.round(students * 0.97) + (includeTeachers ? 86 : 0),
        note: `${students} students on selected route(s)${includeTeachers ? " + 86 teaching staff" : ""}`,
      };
    }
    if (audienceType === "teachers") {
      return { count: 86, note: "Faculty & teaching staff only (Parents will not receive this notice)" };
    }
    return { count: 86, note: "Teaching staff" };
  }, [audienceType, selectedClassIds, selectedRouteIds, includeTeachers]);

  const resetForm = () => {
    setTitle("");
    setCategory("General");
    setMessage("");
    setAudienceType("whole_school");
    setSelectedClassIds([]);
    setSelectedRouteIds([]);
    setIncludeTeachers(false);
    setRequiresAck(false);
  };

  const handlePublish = async () => {
    if (!title.trim() || !message.trim()) {
      toast.error("Title and message are required.");
      return;
    }
    setPublishing(true);
    try {
      let translations = {};
      if (translate) {
        const [mrTr, hiTr] = await Promise.all([
          translateNotice(title, message, "mr"),
          translateNotice(title, message, "hi"),
        ]);
        translations = { mr: mrTr, hi: hiTr };
      }

      await announcementService.createAnnouncement({
        title,
        content: message,
        translations,
        audience_type: audienceType,
        target_class_sections: audienceType === "class" ? selectedClassIds : [],
        push_notification: pushEnabled,
        requires_acknowledgment: requiresAck,
      });
      toast.success("Announcement published with live Marathi & Hindi translations.");
      resetForm();
      fetchAllAnnouncements();
      setActiveTab("history"); // Switch to history tab to view published item
    } catch (err) {
      console.error(err);
      toast.error("Failed to publish announcement.");
    } finally {
      setPublishing(false);
    }
  };

  // Sorted list (Latest at top)
  const sortedAnnouncements = useMemo(() => {
    return [...allAnnouncements].sort(
      (a, b) => new Date(b.created_at || 0).getTime() - new Date(a.created_at || 0).getTime()
    );
  }, [allAnnouncements]);

  // Filtered & Sorted list for History Tab
  const filteredHistory = useMemo(() => {
    return sortedAnnouncements.filter((a) => {
      const matchesSearch =
        searchQuery.trim() === "" ||
        a.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (a.content && a.content.toLowerCase().includes(searchQuery.toLowerCase()));

      const matchesCategory = filterCategory === "all" || a.category === filterCategory;
      const matchesAudience = filterAudience === "all" || a.audience_type === filterAudience;

      return matchesSearch && matchesCategory && matchesAudience;
    });
  }, [sortedAnnouncements, searchQuery, filterCategory, filterAudience]);

  // Non-staff View (Parents/Students)
  if (!isStaff) {
    return (
      <div className="w-full">
        <div className="pb-4 border-b border-cn-border mb-6 flex items-center justify-between">
          <div>
            <h1 className="font-heading font-bold text-2xl text-violet-950 flex items-center gap-2">
              <Megaphone size={24} className="text-violet-700" />
              Announcements &amp; Circulars
            </h1>
            <p className="text-ink-500 text-[13px] mt-1">Official school notices and class circulars</p>
          </div>
        </div>

        {loadingAnnouncements && <div className="text-ink-400 text-sm p-8 text-center">Loading notices…</div>}
        {!loadingAnnouncements && sortedAnnouncements.length === 0 && (
          <div className="bg-cn-surface border border-cn-border rounded-2xl p-8 text-center text-ink-400 text-sm">
            No announcements published yet.
          </div>
        )}

        <div className="flex flex-col gap-4">
          {sortedAnnouncements.map((a) => (
            <div
              key={a.id}
              onClick={() => {
                setViewingAnnouncement(a);
                setSelectedLanguage("en");
              }}
              className="bg-cn-surface border border-cn-border rounded-2xl p-5 shadow-xs transition hover:border-violet-400 cursor-pointer"
            >
              <div className="flex items-center gap-2 flex-wrap mb-2">
                <span className="text-xs font-bold text-violet-800 bg-violet-100 px-2.5 py-0.5 rounded-full uppercase">
                  {AUDIENCE_LABEL[a.audience_type] || "Notice"}
                </span>
                {a.requires_acknowledgment && (
                  <span className="text-[10px] font-extrabold rounded-full px-2.5 py-0.5 bg-amber-100 text-amber-800 uppercase tracking-wider">
                    CIRCULAR ACKNOWLEDGMENT REQUIRED
                  </span>
                )}
                <span className="flex-1" />
                <span className="text-[11.5px] text-ink-400 flex items-center gap-1 font-medium">
                  <Clock size={12} /> {a.author_name || "School Office"} · {timeAgo(a.created_at)}
                </span>
              </div>

              <div className="font-heading font-bold text-base text-ink-900 mt-1">{a.title}</div>
              <p className="text-[13.5px] text-ink-700 mt-2 leading-relaxed line-clamp-2">{a.content}</p>

              <div className="mt-3 flex items-center justify-between text-xs font-bold text-violet-700">
                <span className="flex items-center gap-1 hover:underline">
                  View full announcement &amp; live translations (मराठी / हिन्दी) →
                </span>
                {a.requires_acknowledgment && (
                  <span className={a.my_acknowledged ? "text-success-hex" : "text-amber-800"}>
                    {a.my_acknowledged ? "✓ Acknowledged" : "Pending Acknowledgment"}
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>

        {/* Complete Announcement Details Pop-up Modal */}
        {viewingAnnouncement && (
          <Modal
            isOpen={!!viewingAnnouncement}
            onClose={() => setViewingAnnouncement(null)}
            title={modalTranslation.title || viewingAnnouncement.title || "Announcement Details"}
          >
            <div className="w-[540px] max-w-full flex flex-col gap-4">
              {/* Header Badges */}
              <div className="flex items-center gap-2 flex-wrap pb-3 border-b border-cn-border">
                <span className="text-xs font-bold text-violet-800 bg-violet-100 px-3 py-1 rounded-full">
                  {AUDIENCE_LABEL[viewingAnnouncement.audience_type]}
                </span>
                {viewingAnnouncement.requires_acknowledgment && (
                  <span className="text-xs font-extrabold text-amber-800 bg-amber-100 px-3 py-1 rounded-full uppercase">
                    CIRCULAR
                  </span>
                )}
                <span className="flex-1" />
                <span className="text-xs text-ink-400 font-medium">
                  By {viewingAnnouncement.author_name || "School Office"} · {timeAgo(viewingAnnouncement.created_at)}
                </span>
              </div>

              {/* Language Switcher Tabs */}
              <div className="flex items-center gap-2 bg-slate-100 p-1.5 rounded-xl border border-cn-border">
                <div className="text-xs font-bold text-ink-500 px-2 flex items-center gap-1 shrink-0">
                  <Globe size={14} /> Languages:
                </div>
                <button
                  type="button"
                  onClick={() => setSelectedLanguage("en")}
                  className={`flex-1 py-1.5 text-xs font-bold rounded-lg transition cursor-pointer ${
                    selectedLanguage === "en" ? "bg-white text-violet-950 shadow-sm" : "text-ink-500 hover:text-ink-900"
                  }`}
                >
                  🇬🇧 English
                </button>
                <button
                  type="button"
                  onClick={() => setSelectedLanguage("mr")}
                  className={`flex-1 py-1.5 text-xs font-bold rounded-lg transition cursor-pointer ${
                    selectedLanguage === "mr" ? "bg-white text-violet-950 shadow-sm" : "text-ink-500 hover:text-ink-900"
                  }`}
                >
                  🚩 मराठी
                </button>
                <button
                  type="button"
                  onClick={() => setSelectedLanguage("hi")}
                  className={`flex-1 py-1.5 text-xs font-bold rounded-lg transition cursor-pointer ${
                    selectedLanguage === "hi" ? "bg-white text-violet-950 shadow-sm" : "text-ink-500 hover:text-ink-900"
                  }`}
                >
                  🇮🇳 हिन्दी
                </button>
              </div>

              {/* Live Translated Content Box */}
              <div className="bg-slate-50 border border-cn-border rounded-2xl p-4 min-h-[140px] relative">
                {translating ? (
                  <div className="flex items-center justify-center gap-2 py-8 text-violet-700 text-xs font-bold">
                    <Loader2 size={16} className="animate-spin" /> Translating message into live {selectedLanguage === "mr" ? "मराठी" : "हिन्दी"}…
                  </div>
                ) : (
                  <>
                    <div className="text-[11px] font-bold text-ink-400 uppercase tracking-wider mb-1 flex items-center justify-between">
                      <span>Message ({selectedLanguage.toUpperCase()})</span>
                      {selectedLanguage !== "en" && (
                        <span className="text-[10px] text-violet-700 font-semibold bg-violet-50 px-2 py-0.5 rounded-md border border-violet-200">
                          ✨ Live Machine Translation
                        </span>
                      )}
                    </div>
                    <p className="text-[14px] text-ink-900 leading-relaxed whitespace-pre-line font-medium">
                      {modalTranslation.content}
                    </p>
                  </>
                )}
              </div>

              {/* Acknowledgment Action */}
              {viewingAnnouncement.requires_acknowledgment && (
                <div className="pt-3 border-t border-cn-border flex items-center justify-between">
                  {viewingAnnouncement.my_acknowledged ? (
                    <span className="text-xs font-bold text-success-hex flex items-center gap-1">
                      <CheckCircle2 size={16} /> Verified &amp; Acknowledged
                    </span>
                  ) : (
                    <button
                      type="button"
                      onClick={() => handleAcknowledge(viewingAnnouncement)}
                      disabled={ackingId === viewingAnnouncement.id}
                      className="px-5 py-2.5 bg-violet-700 text-white rounded-xl text-xs font-bold hover:bg-violet-800 transition cursor-pointer shadow-sm"
                    >
                      {ackingId === viewingAnnouncement.id ? "Confirming…" : "Confirm Acknowledgment"}
                    </button>
                  )}
                </div>
              )}
            </div>
          </Modal>
        )}
      </div>
    );
  }

  // Staff View (Admin / Teachers)
  return (
    <div className="w-full">
      {/* Header & Mode Switcher */}
      <div className="flex items-center justify-between pb-4 border-b border-cn-border mb-6 flex-wrap gap-3">
        <div>
          <h1 className="font-heading font-bold text-2xl text-violet-950 flex items-center gap-2">
            <Megaphone size={24} className="text-violet-700" />
            Announcements &amp; Circulars
          </h1>
          <p className="text-ink-500 text-[13px] mt-1">Compose notices or view past published announcements</p>
        </div>

        {/* Tab Switcher */}
        <div className="flex bg-slate-100 p-1 rounded-2xl border border-cn-border">
          <button
            type="button"
            onClick={() => setActiveTab("compose")}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition cursor-pointer ${
              activeTab === "compose"
                ? "bg-white text-violet-950 shadow-sm"
                : "text-ink-500 hover:text-ink-900"
            }`}
          >
            <PenSquare size={15} /> New Announcement
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("history")}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition cursor-pointer ${
              activeTab === "history"
                ? "bg-white text-violet-950 shadow-sm"
                : "text-ink-500 hover:text-ink-900"
            }`}
          >
            <History size={15} /> Past Announcements
          </button>
        </div>
      </div>

      {/* TAB 1: COMPOSE ANNOUNCEMENT */}
      {activeTab === "compose" && (
        <div>
          <div className="flex justify-end gap-2.5 mb-4">
            <Button variant="outline" onClick={resetForm}>
              Save draft
            </Button>
            <Button variant="primary" onClick={handlePublish} loading={publishing}>
              Publish &amp; notify
            </Button>
          </div>

          <div className="flex flex-col lg:flex-row gap-6 items-start">
            {/* Compose Form */}
            <div className="flex-[1.5] w-full flex flex-col gap-4">
              <div>
                <div className="text-[11.5px] font-extrabold text-ink-400 tracking-wide mb-2">TITLE</div>
                <input
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g. Route Line 3 diversion on Friday"
                  className="w-full bg-cn-surface border border-violet-600 rounded-2xl px-4 py-3.5 text-[15px] font-semibold text-ink-900 focus:outline-none focus:ring-2 focus:ring-violet-500/20"
                />
              </div>

              <div>
                <div className="text-[11.5px] font-extrabold text-ink-400 tracking-wide mb-2">CATEGORY</div>
                <div className="flex gap-2 flex-wrap">
                  {CATEGORIES.map((c) => (
                    <button
                      key={c}
                      type="button"
                      onClick={() => setCategory(c)}
                      className={`rounded-full px-4 py-2 text-[12.5px] font-semibold cursor-pointer transition ${
                        category === c
                          ? "bg-violet-700 text-white"
                          : "bg-cn-surface border border-cn-border text-ink-500 hover:border-violet-300"
                      }`}
                    >
                      {c}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <div className="text-[11.5px] font-extrabold text-ink-400 tracking-wide mb-2">MESSAGE</div>
                <textarea
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  rows={5}
                  placeholder="Write the announcement message…"
                  className="w-full bg-cn-surface border border-cn-border rounded-2xl px-4 py-3.5 text-[13.5px] text-ink-700 leading-relaxed focus:outline-none focus:border-violet-400"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5">
                <div>
                  <div className="text-[11.5px] font-extrabold text-ink-400 tracking-wide mb-2">SCHEDULE</div>
                  <select
                    value={schedule}
                    onChange={(e) => setSchedule(e.target.value)}
                    className="w-full bg-cn-surface border border-cn-border rounded-2xl px-4 py-3 text-[13px] font-semibold text-ink-900 focus:outline-none focus:border-violet-400"
                  >
                    <option value="now">Send now</option>
                    <option value="scheduled">Schedule for later</option>
                  </select>
                </div>

                <div>
                  <div className="text-[11.5px] font-extrabold text-ink-400 tracking-wide mb-2">TRANSLATIONS</div>
                  <button
                    type="button"
                    onClick={() => setTranslate((p) => !p)}
                    className="w-full bg-cn-surface border border-cn-border rounded-2xl px-4 py-3 text-[13px] font-semibold text-ink-900 flex justify-between cursor-pointer"
                  >
                    <span>{translate ? "Auto · मराठी + हिन्दी" : "English only"}</span>
                    <span className="text-ink-400">▾</span>
                  </button>
                </div>

                <div>
                  <div className="text-[11.5px] font-extrabold text-ink-400 tracking-wide mb-2">ATTACHMENT</div>
                  <button
                    type="button"
                    onClick={() => toast.info("File attachments feature ready.")}
                    className="w-full bg-cn-surface border border-dashed border-violet-300 rounded-2xl px-4 py-3 text-[13px] font-bold text-violet-700 cursor-pointer hover:bg-violet-50/50"
                  >
                    + Add file
                  </button>
                </div>
              </div>

              <div className="bg-violet-50 rounded-2xl px-4 py-3.5 flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => setPushEnabled((p) => !p)}
                  className={`w-11 h-6.5 rounded-full relative shrink-0 cursor-pointer transition ${
                    pushEnabled ? "bg-violet-700" : "bg-ink-400/40"
                  }`}
                  style={{ width: 44, height: 26 }}
                >
                  <span
                    className="absolute top-[3px] w-5 h-5 rounded-full bg-white transition-all"
                    style={{ left: pushEnabled ? 21 : 3 }}
                  />
                </button>
                <div className="text-[12.5px] text-violet-900 leading-relaxed">
                  <b>Push notification</b> — parents get an instant alert. Off = appears only in the announcements feed.
                </div>
              </div>

              <label className="bg-cn-surface border border-cn-border rounded-2xl px-4 py-3.5 flex items-center gap-3 cursor-pointer hover:bg-slate-50/50">
                <input
                  type="checkbox"
                  checked={requiresAck}
                  onChange={(e) => setRequiresAck(e.target.checked)}
                  className="w-4 h-4 text-violet-600 rounded"
                />
                <div className="text-[12.5px] text-ink-700 leading-relaxed">
                  <b>Requires acknowledgment</b> — makes this a circular. Recipients must explicitly confirm they've read it, and you'll see who has.
                </div>
              </label>

              {/* Recently Sent Box with Direct Link to Full History */}
              <div className="bg-cn-surface border border-cn-border rounded-2xl p-4 mt-2">
                <div className="flex items-center justify-between mb-3">
                  <div className="font-heading font-bold text-[14px] text-ink-900 flex items-center gap-2">
                    <Clock size={16} className="text-violet-700" /> Recently sent
                  </div>
                  <button
                    type="button"
                    onClick={() => setActiveTab("history")}
                    className="text-xs font-bold text-violet-700 hover:underline inline-flex items-center gap-1 cursor-pointer"
                  >
                    View all past announcements <ArrowRight size={13} />
                  </button>
                </div>

                {loadingAnnouncements && <div className="text-ink-400 text-xs">Loading past notices…</div>}
                {!loadingAnnouncements && sortedAnnouncements.length === 0 && (
                  <div className="text-ink-400 text-xs py-2">No announcements published yet.</div>
                )}

                <div className="flex flex-col gap-2">
                  {sortedAnnouncements.slice(0, 6).map((a, idx) => (
                    <div
                      key={a.id ?? idx}
                      onClick={() => {
                        setViewingAnnouncement(a);
                        setSelectedLanguage("en");
                      }}
                      className="flex items-center justify-between text-[12.5px] p-2 rounded-xl hover:bg-violet-50/80 transition cursor-pointer"
                    >
                      <div className="flex items-center gap-2 min-w-0">
                        <span className="w-2 h-2 rounded-full bg-violet-600 shrink-0" />
                        <span className="font-semibold text-ink-900 truncate">{a.title}</span>
                        {a.requires_acknowledgment && (
                          <span className="text-[9.5px] font-extrabold rounded-full px-2 py-0.5 bg-amber-100 text-amber-800">
                            CIRCULAR
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-2 shrink-0 text-ink-400 text-xs">
                        <span>{timeAgo(a.created_at)}</span>
                        <ExternalLink size={13} className="text-violet-600" />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Audience Section */}
            <div className="flex-1 w-full bg-cn-surface border border-cn-border rounded-2xl flex flex-col overflow-hidden">
              <div className="p-4 border-b border-cn-border">
                <div className="font-heading font-semibold text-[15px] text-ink-900">Audience</div>
                <div className="text-[12px] text-ink-500 mt-0.5">Who receives this announcement</div>
              </div>

              <div className="p-4 flex flex-col gap-2.5">
                <button
                  type="button"
                  onClick={() => setAudienceType("whole_school")}
                  className={`border rounded-2xl px-3.5 py-3 flex items-center gap-2.5 cursor-pointer text-left transition ${
                    audienceType === "whole_school" ? "border-violet-600 bg-violet-50" : "border-cn-border"
                  }`}
                >
                  <span className={`w-5 h-5 rounded-md flex items-center justify-center text-[11px] font-extrabold shrink-0 ${audienceType === "whole_school" ? "bg-violet-700 text-white" : "border border-ink-400/40 bg-white"}`}>
                    {audienceType === "whole_school" ? "✓" : ""}
                  </span>
                  <span className="flex-1 text-[13.5px] font-semibold text-ink-900">Whole school</span>
                  <span className="text-[11.5px] text-ink-400">1,240 parents</span>
                </button>

                <button
                  type="button"
                  onClick={() => setAudienceType("class")}
                  className={`border rounded-2xl px-3.5 py-3 flex items-center gap-2.5 cursor-pointer text-left transition ${
                    audienceType === "class" ? "border-violet-600 bg-violet-50" : "border-cn-border"
                  }`}
                >
                  <span className={`w-5 h-5 rounded-md flex items-center justify-center text-[11px] font-extrabold shrink-0 ${audienceType === "class" ? "bg-violet-700 text-white" : "border border-ink-400/40 bg-white"}`}>
                    {audienceType === "class" ? "✓" : ""}
                  </span>
                  <span className="flex-1 text-[13.5px] font-semibold text-ink-900">By class</span>
                  <span className="text-[11.5px] text-ink-400">{selectedClassIds.length} selected</span>
                </button>
                {audienceType === "class" && (
                  <div className="ml-7 flex flex-col gap-1.5 max-h-40 overflow-y-auto custom-scrollbar-light">
                    {classSections.map((cs) => (
                      <label key={cs.id} className="flex items-center gap-2 text-[12.5px] font-semibold text-ink-900 cursor-pointer">
                        <input type="checkbox" checked={selectedClassIds.includes(cs.id)} onChange={() => toggleClass(cs.id)} />
                        {cs.name || `Class ${cs.grade ?? "?"} - ${cs.section ?? "?"}`}
                      </label>
                    ))}
                    {classSections.length === 0 && <span className="text-ink-400 text-xs">No class sections found.</span>}
                  </div>
                )}

                <button
                  type="button"
                  onClick={() => setAudienceType("bus_route")}
                  className={`border rounded-2xl px-3.5 py-3 flex items-center gap-2.5 cursor-pointer text-left transition ${
                    audienceType === "bus_route" ? "border-violet-600 bg-violet-50" : "border-cn-border"
                  }`}
                >
                  <span className={`w-5 h-5 rounded-md flex items-center justify-center text-[11px] font-extrabold shrink-0 ${audienceType === "bus_route" ? "bg-violet-700 text-white" : "border border-ink-400/40 bg-white"}`}>
                    {audienceType === "bus_route" ? "✓" : ""}
                  </span>
                  <span className="flex-1 text-[13.5px] font-semibold text-ink-900">By bus route</span>
                  <span className="text-[11.5px] text-ink-400">{selectedRouteIds.length} selected</span>
                </button>
                {audienceType === "bus_route" && (
                  <div className="ml-7 flex flex-col gap-1.5">
                    {MOCK_ROUTES.map((route) => (
                      <label key={route.id} className="flex items-center gap-2 text-[12.5px] font-semibold text-ink-900 cursor-pointer">
                        <input type="checkbox" checked={selectedRouteIds.includes(route.id)} onChange={() => toggleRoute(route.id)} />
                        {route.name} <span className="text-ink-400 font-normal">· {route.students} students</span>
                      </label>
                    ))}
                  </div>
                )}

                <button
                  type="button"
                  onClick={() => setAudienceType("teachers")}
                  className={`border rounded-2xl px-3.5 py-3 flex items-center gap-2.5 cursor-pointer text-left transition ${
                    audienceType === "teachers" ? "border-violet-600 bg-violet-50" : "border-cn-border"
                  }`}
                >
                  <span className={`w-5 h-5 rounded-md flex items-center justify-center text-[11px] font-extrabold shrink-0 ${audienceType === "teachers" ? "bg-violet-700 text-white" : "border border-ink-400/40 bg-white"}`}>
                    {audienceType === "teachers" ? "✓" : ""}
                  </span>
                  <span className="flex-1 text-[13.5px] font-semibold text-ink-900">Teachers &amp; Staff only</span>
                  <span className="text-[11.5px] text-ink-400">86 staff</span>
                </button>

                {audienceType !== "teachers" && (
                  <label className="border border-cn-border/80 rounded-2xl px-3.5 py-2.5 flex items-center gap-2.5 cursor-pointer bg-slate-50/50 mt-1">
                    <input
                      type="checkbox"
                      checked={includeTeachers}
                      onChange={(e) => setIncludeTeachers(e.target.checked)}
                      className="w-4 h-4 text-violet-600 rounded border-cn-border"
                    />
                    <span className="flex-1 text-[12.5px] font-semibold text-ink-800">Include teachers as well</span>
                    <span className="text-[11px] text-ink-400">+86 staff</span>
                  </label>
                )}
              </div>

              <div className="flex-1" />
              <div className="m-4 bg-success-tint border border-green-200 rounded-2xl p-4">
                <div className="text-[12px] font-extrabold text-success-hex tracking-wide">REACH PREVIEW</div>
                <div className="font-heading font-bold text-[22px] text-green-800 mt-1">
                  {reachEstimate.count.toLocaleString()} {audienceType === "teachers" ? "staff members" : "recipients"}
                </div>
                <div className="text-[12px] text-success-hex mt-0.5">{reachEstimate.note}</div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: PAST ANNOUNCEMENTS & HISTORY */}
      {activeTab === "history" && (
        <div className="w-full flex flex-col gap-5">
          {/* Search & Filter Bar */}
          <div className="flex items-center gap-3 bg-cn-surface border border-cn-border rounded-2xl p-4 flex-wrap">
            <div className="relative flex-1 min-w-[240px]">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search past announcements by title or content…"
                className="w-full h-10 pl-9 pr-4 text-xs font-semibold bg-white border border-cn-border rounded-xl focus:outline-none focus:border-violet-500"
              />
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-ink-400" />
            </div>

            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-ink-500">Audience:</span>
              <select
                value={filterAudience}
                onChange={(e) => setFilterAudience(e.target.value)}
                className="h-10 px-3 text-xs font-semibold bg-white border border-cn-border rounded-xl focus:outline-none focus:border-violet-500"
              >
                <option value="all">All Audiences</option>
                <option value="whole_school">Whole School</option>
                <option value="class">By Class</option>
                <option value="bus_route">Bus Route</option>
                <option value="teachers">Teachers Only</option>
              </select>
            </div>
          </div>

          {/* Past Announcements Feed */}
          {loadingAnnouncements && (
            <div className="p-12 text-center text-ink-400 text-sm bg-cn-surface border border-cn-border rounded-2xl">
              Loading past announcements…
            </div>
          )}

          {!loadingAnnouncements && filteredHistory.length === 0 && (
            <div className="p-12 text-center bg-cn-surface border border-cn-border rounded-2xl">
              <ShieldAlert size={36} className="mx-auto text-ink-300 mb-2" />
              <div className="text-sm font-bold text-ink-800">No past announcements found</div>
              <p className="text-xs text-ink-400 mt-1">Try adjusting your search query or audience filter.</p>
            </div>
          )}

          <div className="flex flex-col gap-4">
            {filteredHistory.map((a) => (
              <div
                key={a.id}
                onClick={() => {
                  setViewingAnnouncement(a);
                  setSelectedLanguage("en");
                }}
                className="bg-cn-surface border border-cn-border rounded-2xl p-5 shadow-xs transition hover:border-violet-400 cursor-pointer group"
              >
                <div className="flex items-center gap-2 flex-wrap mb-2">
                  <span className="text-xs font-bold text-violet-800 bg-violet-100 px-2.5 py-0.5 rounded-full uppercase">
                    {AUDIENCE_LABEL[a.audience_type] || "Notice"}
                  </span>

                  {a.requires_acknowledgment && (
                    <span className="text-[10px] font-extrabold rounded-full px-2.5 py-0.5 bg-amber-100 text-amber-800 uppercase tracking-wider">
                      CIRCULAR
                    </span>
                  )}

                  <span className="flex-1" />

                  <span className="text-[11.5px] text-ink-400 flex items-center gap-1 font-medium">
                    <Clock size={12} /> {a.author_name || "School Office"} · {timeAgo(a.created_at)}
                  </span>

                  {isStaff && (
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDelete(a.id);
                      }}
                      disabled={deletingId === a.id}
                      className="p-1.5 text-ink-400 hover:text-red-600 rounded-lg hover:bg-red-50 transition cursor-pointer ml-1"
                      title="Delete announcement"
                    >
                      <Trash2 size={15} />
                    </button>
                  )}
                </div>

                <div className="font-heading font-bold text-base text-ink-900 mt-1 group-hover:text-violet-950">
                  {a.title}
                </div>
                <p className="text-[13.5px] text-ink-700 mt-2 leading-relaxed line-clamp-2">{a.content}</p>

                <div className="mt-4 pt-3 border-t border-cn-border flex items-center justify-between flex-wrap gap-2 text-xs font-bold">
                  <span className="text-violet-700 group-hover:underline flex items-center gap-1">
                    Click to view full notice &amp; live translations (मराठी / हिन्दी) <ArrowRight size={13} />
                  </span>

                  {a.requires_acknowledgment && (
                    <div className="flex items-center gap-2">
                      <span className="text-ink-600">{a.acknowledged_count || 0} Acked</span>
                      {isStaff && (
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            openRoster(a);
                          }}
                          className="text-violet-700 hover:underline cursor-pointer"
                        >
                          (View Roster)
                        </button>
                      )}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Complete Announcement Pop-up Modal */}
      {viewingAnnouncement && (
        <Modal
          isOpen={!!viewingAnnouncement}
          onClose={() => setViewingAnnouncement(null)}
          title={modalTranslation.title || viewingAnnouncement.title || "Announcement Details"}
        >
          <div className="w-[540px] max-w-full flex flex-col gap-4">
            {/* Header Badges */}
            <div className="flex items-center gap-2 flex-wrap pb-3 border-b border-cn-border">
              <span className="text-xs font-bold text-violet-800 bg-violet-100 px-3 py-1 rounded-full">
                {AUDIENCE_LABEL[viewingAnnouncement.audience_type]}
              </span>
              {viewingAnnouncement.requires_acknowledgment && (
                <span className="text-xs font-extrabold text-amber-800 bg-amber-100 px-3 py-1 rounded-full uppercase">
                  CIRCULAR
                </span>
              )}
              <span className="flex-1" />
              <span className="text-xs text-ink-400 font-medium">
                By {viewingAnnouncement.author_name || "School Office"} · {timeAgo(viewingAnnouncement.created_at)}
              </span>
            </div>

            {/* Language Switcher Tabs */}
            <div className="flex items-center gap-2 bg-slate-100 p-1.5 rounded-xl border border-cn-border">
              <div className="text-xs font-bold text-ink-500 px-2 flex items-center gap-1 shrink-0">
                <Globe size={14} /> Languages:
              </div>
              <button
                type="button"
                onClick={() => setSelectedLanguage("en")}
                className={`flex-1 py-1.5 text-xs font-bold rounded-lg transition cursor-pointer ${
                  selectedLanguage === "en" ? "bg-white text-violet-950 shadow-sm" : "text-ink-500 hover:text-ink-900"
                }`}
              >
                🇬🇧 English
              </button>
              <button
                type="button"
                onClick={() => setSelectedLanguage("mr")}
                className={`flex-1 py-1.5 text-xs font-bold rounded-lg transition cursor-pointer ${
                  selectedLanguage === "mr" ? "bg-white text-violet-950 shadow-sm" : "text-ink-500 hover:text-ink-900"
                }`}
              >
                🚩 मराठी
              </button>
              <button
                type="button"
                onClick={() => setSelectedLanguage("hi")}
                className={`flex-1 py-1.5 text-xs font-bold rounded-lg transition cursor-pointer ${
                  selectedLanguage === "hi" ? "bg-white text-violet-950 shadow-sm" : "text-ink-500 hover:text-ink-900"
                }`}
              >
                🇮🇳 हिन्दी
              </button>
            </div>

            {/* Live Translated Content Box */}
            <div className="bg-slate-50 border border-cn-border rounded-2xl p-4 min-h-[140px] relative">
              {translating ? (
                <div className="flex items-center justify-center gap-2 py-8 text-violet-700 text-xs font-bold">
                  <Loader2 size={16} className="animate-spin" /> Translating message into live {selectedLanguage === "mr" ? "मराठी" : "हिन्दी"}…
                </div>
              ) : (
                <>
                  <div className="text-[11px] font-bold text-ink-400 uppercase tracking-wider mb-1 flex items-center justify-between">
                    <span>Message ({selectedLanguage.toUpperCase()})</span>
                    {selectedLanguage !== "en" && (
                      <span className="text-[10px] text-violet-700 font-semibold bg-violet-50 px-2 py-0.5 rounded-md border border-violet-200">
                        ✨ Live Machine Translation
                      </span>
                    )}
                  </div>
                  <p className="text-[14px] text-ink-900 leading-relaxed whitespace-pre-line font-medium">
                    {modalTranslation.content}
                  </p>
                </>
              )}
            </div>

            {/* Circular Roster & Actions */}
            {viewingAnnouncement.requires_acknowledgment && (
              <div className="pt-3 border-t border-cn-border flex items-center justify-between flex-wrap gap-2">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-ink-700">
                    {viewingAnnouncement.acknowledged_count || 0} Recipient(s) Acknowledged
                  </span>
                  {isStaff && (
                    <button
                      type="button"
                      onClick={() => openRoster(viewingAnnouncement)}
                      className="text-xs font-bold text-violet-700 hover:underline cursor-pointer"
                    >
                      View Acknowledgment Roster →
                    </button>
                  )}
                </div>

                {!isStaff && !viewingAnnouncement.my_acknowledged && (
                  <button
                    type="button"
                    onClick={() => handleAcknowledge(viewingAnnouncement)}
                    disabled={ackingId === viewingAnnouncement.id}
                    className="px-5 py-2.5 bg-violet-700 text-white rounded-xl text-xs font-bold hover:bg-violet-800 transition cursor-pointer shadow-sm"
                  >
                    {ackingId === viewingAnnouncement.id ? "Confirming…" : "Confirm Acknowledgment"}
                  </button>
                )}
              </div>
            )}
          </div>
        </Modal>
      )}

      {/* Acknowledgment Roster Modal */}
      <Modal isOpen={!!rosterFor} onClose={() => setRosterFor(null)} title={`Acknowledgment Roster · ${rosterFor?.title || ""}`}>
        <div className="flex flex-col gap-2 w-[340px] max-w-full max-h-80 overflow-y-auto custom-scrollbar-light">
          {!roster && <p className="text-ink-400 text-[13px] text-center py-4">Loading roster…</p>}
          {roster && roster.acknowledged.length === 0 && (
            <p className="text-ink-400 text-[13px] text-center py-4">No recipients have acknowledged this circular yet.</p>
          )}
          {roster?.acknowledged.map((a) => (
            <div key={a.user_id} className="flex items-center justify-between border-b border-cn-border py-2 px-1">
              <div className="flex items-center gap-2">
                <CheckCircle2 size={15} className="text-success-hex shrink-0" />
                <span className="text-[13px] font-semibold text-ink-900">{a.name}</span>
              </div>
              <span className="text-[11px] text-ink-400">{new Date(a.acknowledged_at).toLocaleDateString()}</span>
            </div>
          ))}
        </div>
      </Modal>
    </div>
  );
};

export default AnnouncementComposer;
