import React, { useEffect, useMemo, useState } from "react";
import { toast } from "react-toastify";
import Button from "../../../components/Button";
import announcementService from "../services/announcementService";
import classSectionService from "../../students/services/classSectionService";

// Layout matches "Admin Web.dc.html" screen 6 (announcement composer).
// Publishing is fully wired to POST /api/announcements/ and the recent list
// at the bottom is fully wired to GET /api/announcements/. Audience-by-class
// uses the real GET /api/class-sections/ endpoint; audience-by-bus-route uses
// mock routes (same TODO as the Transport page — no bus-route endpoint yet).
// The reach-preview number is an illustrative client-side estimate, not a
// server-computed count.

const CATEGORIES = ["General", "Academics", "Transport", "Fees", "Events"];

const MOCK_ROUTES = [
  { id: 1, name: "Shivaji Nagar – Line 3", students: 38 },
  { id: 2, name: "Kothrud – Line 1", students: 44 },
  { id: 3, name: "Baner Road – Line 2", students: 41 },
];

const asList = (data) => (Array.isArray(data) ? data : data?.results || []);

const AnnouncementComposer = () => {
  const [title, setTitle] = useState("");
  const [category, setCategory] = useState("General");
  const [message, setMessage] = useState("");
  const [schedule, setSchedule] = useState("now");
  const [translate, setTranslate] = useState(true);
  const [pushEnabled, setPushEnabled] = useState(true);

  const [audienceType, setAudienceType] = useState("whole_school"); // whole_school | class | bus_route | teachers
  const [classSections, setClassSections] = useState([]);
  const [selectedClassIds, setSelectedClassIds] = useState([]);
  const [selectedRouteIds, setSelectedRouteIds] = useState([]);
  const [includeTeachers, setIncludeTeachers] = useState(false);

  const [publishing, setPublishing] = useState(false);
  const [recent, setRecent] = useState([]);
  const [loadingRecent, setLoadingRecent] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        const res = await classSectionService.getClassSections();
        setClassSections(asList(res.data));
      } catch (err) {
        console.error("Failed to load class sections:", err);
      }
    };
    load();
    fetchRecent();
  }, []);

  const fetchRecent = async () => {
    setLoadingRecent(true);
    try {
      const res = await announcementService.getAnnouncements();
      setRecent(asList(res.data).slice(0, 5));
    } catch (err) {
      console.error("Failed to load recent announcements:", err);
    } finally {
      setLoadingRecent(false);
    }
  };

  const toggleClass = (id) => {
    setSelectedClassIds((prev) => (prev.includes(id) ? prev.filter((c) => c !== id) : [...prev, id]));
  };
  const toggleRoute = (id) => {
    setSelectedRouteIds((prev) => (prev.includes(id) ? prev.filter((r) => r !== id) : [...prev, id]));
  };

  const reachEstimate = useMemo(() => {
    if (audienceType === "whole_school") return { count: 1240, note: "Every enrolled family" };
    if (audienceType === "class") {
      const n = selectedClassIds.length;
      return { count: n * 32, note: `${n} class section(s) selected · ~32 students each` };
    }
    if (audienceType === "bus_route") {
      const students = MOCK_ROUTES.filter((r) => selectedRouteIds.includes(r.id)).reduce((sum, r) => sum + r.students, 0);
      return { count: Math.round(students * 0.97), note: `${students} students on selected route(s) · ~1 sibling pair shares a parent` };
    }
    return { count: 86, note: "Teaching staff only" };
  }, [audienceType, selectedClassIds, selectedRouteIds]);

  const resetForm = () => {
    setTitle("");
    setCategory("General");
    setMessage("");
    setAudienceType("whole_school");
    setSelectedClassIds([]);
    setSelectedRouteIds([]);
    setIncludeTeachers(false);
  };

  const handlePublish = async () => {
    if (!title.trim() || !message.trim()) {
      toast.error("Title and message are required.");
      return;
    }
    setPublishing(true);
    try {
      await announcementService.createAnnouncement({
        title,
        message,
        category,
        audience_type: audienceType,
        class_sections: audienceType === "class" ? selectedClassIds : [],
        include_teachers: includeTeachers,
        push_notification: pushEnabled,
        translate,
        schedule,
      });
      toast.success("Announcement published.");
      resetForm();
      fetchRecent();
    } catch (err) {
      console.error(err);
      toast.error("Failed to publish announcement.");
    } finally {
      setPublishing(false);
    }
  };

  return (
    <div className="w-full">
      <div className="flex items-center gap-3 pb-4 border-b border-cn-border mb-6 flex-wrap">
        <h1 className="font-heading font-bold text-2xl text-violet-950">New announcement</h1>
        <div className="flex-1" />
        <Button variant="outline" onClick={resetForm}>
          Save draft
        </Button>
        <Button variant="primary" onClick={handlePublish} loading={publishing}>
          Publish &amp; notify
        </Button>
      </div>

      <div className="flex flex-col lg:flex-row gap-6 items-start">
        {/* Compose form */}
        <div className="flex-[1.5] w-full flex flex-col gap-4">
          <div>
            <div className="text-[11.5px] font-extrabold text-ink-400 tracking-wide mb-2">TITLE</div>
            <input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Route Line 3 diversion on Friday"
              className="w-full bg-cn-surface border border-violet-600 rounded-2xl px-4 py-3.5 text-[15px] font-semibold text-ink-900 focus:outline-none"
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
                    category === c ? "bg-violet-700 text-white" : "bg-cn-surface border border-cn-border text-ink-500"
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
                onClick={() => toast.info("File attachments aren't wired to a backend endpoint yet.")}
                className="w-full bg-cn-surface border border-dashed border-violet-300 rounded-2xl px-4 py-3 text-[13px] font-bold text-violet-700 cursor-pointer"
              >
                + Add file
              </button>
            </div>
          </div>

          <div className="bg-violet-50 rounded-2xl px-4 py-3.5 flex items-center gap-3">
            <button
              type="button"
              onClick={() => setPushEnabled((p) => !p)}
              className={`w-11 h-6.5 rounded-full relative shrink-0 cursor-pointer transition ${pushEnabled ? "bg-violet-700" : "bg-ink-400/40"}`}
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

          {/* Recent announcements — real GET wiring */}
          <div className="bg-cn-surface border border-cn-border rounded-2xl p-4">
            <div className="font-heading font-semibold text-[13.5px] text-ink-900 mb-2">Recently sent</div>
            {loadingRecent && <div className="text-ink-400 text-xs">Loading…</div>}
            {!loadingRecent && recent.length === 0 && <div className="text-ink-400 text-xs">No announcements yet.</div>}
            <div className="flex flex-col gap-1.5">
              {recent.map((a, idx) => (
                <div key={a.id ?? idx} className="text-[12.5px] text-ink-700 flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-violet-400 shrink-0" />
                  <span className="font-semibold text-ink-900 truncate">{a.title}</span>
                  <span className="text-ink-400 truncate">· {a.category || "General"}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Audience */}
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

            <label className="border border-cn-border rounded-2xl px-3.5 py-3 flex items-center gap-2.5 cursor-pointer">
              <input
                type="checkbox"
                checked={includeTeachers}
                onChange={(e) => setIncludeTeachers(e.target.checked)}
                className="w-4 h-4"
              />
              <span className="flex-1 text-[13.5px] font-semibold text-ink-900">Teachers too</span>
              <span className="text-[11.5px] text-ink-400">86 staff</span>
            </label>
          </div>

          <div className="flex-1" />
          <div className="m-4 bg-success-tint border border-green-200 rounded-2xl p-4">
            <div className="text-[12px] font-extrabold text-success-hex tracking-wide">REACH PREVIEW</div>
            <div className="font-heading font-bold text-[22px] text-green-800 mt-1">
              {reachEstimate.count.toLocaleString()} {includeTeachers ? "recipients" : "parents"}
            </div>
            <div className="text-[12px] text-success-hex mt-0.5">{reachEstimate.note}</div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AnnouncementComposer;
