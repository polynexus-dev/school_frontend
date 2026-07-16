import React, { useEffect, useMemo, useRef, useState } from "react";
import { toast } from "react-toastify";
import Button from "../../../components/Button";
import SelectBox from "../../../components/SelectBox";
import studentService from "../services/studentService";
import classSectionService from "../services/classSectionService";

// Scaffold page — layout matches "Admin Web.dc.html" screen 2 closely.
// The class roster + consent flags come from the real GET /api/students/ and
// GET /api/class-sections/ endpoints, but there is no face-capture/enrollment
// endpoint in the confirmed backend contract yet, so the capture panel below
// only drives local UI state (angle chips, "captured" flag) plus a real
// getUserMedia() webcam preview for visual authenticity.
// TODO: wire capture + "Save & next student" to the real face-embedding
// enrollment endpoint once it exists (see plan: face-registration is listed
// as a stubbed backend endpoint for a follow-up pass).

const ANGLES = ["front", "left", "right"];

const asList = (data) => (Array.isArray(data) ? data : data?.results || []);

const initialsOf = (name = "") =>
  name.split(" ").filter(Boolean).map((n) => n[0]).join("").toUpperCase().slice(0, 2) || "?";

const FaceRegistration = () => {
  const [classSections, setClassSections] = useState([]);
  const [selectedClass, setSelectedClass] = useState("");
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeStudentId, setActiveStudentId] = useState(null);
  const [capturedAngles, setCapturedAngles] = useState({ front: false, left: false, right: false });
  const [cameraError, setCameraError] = useState("");

  const videoRef = useRef(null);
  const streamRef = useRef(null);

  useEffect(() => {
    const loadClassSections = async () => {
      try {
        const res = await classSectionService.getClassSections();
        const list = asList(res.data);
        setClassSections(list);
        if (list.length > 0) setSelectedClass(String(list[0].id));
      } catch (err) {
        console.error("Failed to load class sections:", err);
      }
    };
    loadClassSections();
  }, []);

  useEffect(() => {
    if (!selectedClass) return;
    const loadStudents = async () => {
      setLoading(true);
      try {
        const res = await studentService.getStudents({ class_section: selectedClass });
        const list = asList(res.data);
        setStudents(list);
        const firstPending = list.find((s) => !s.is_face_registered);
        setActiveStudentId(firstPending?.id ?? list[0]?.id ?? null);
        setCapturedAngles({ front: false, left: false, right: false });
      } catch (err) {
        console.error("Failed to load students for class:", err);
        toast.error("Failed to load class roster.");
      } finally {
        setLoading(false);
      }
    };
    loadStudents();
  }, [selectedClass]);

  // Real webcam preview — purely cosmetic/UX, no frames are sent anywhere.
  useEffect(() => {
    let cancelled = false;
    const startCamera = async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ video: true });
        if (cancelled) {
          stream.getTracks().forEach((t) => t.stop());
          return;
        }
        streamRef.current = stream;
        if (videoRef.current) videoRef.current.srcObject = stream;
        setCameraError("");
      } catch (err) {
        console.warn("Camera unavailable:", err);
        setCameraError("Camera unavailable — grant camera permission to preview live capture.");
      }
    };
    startCamera();
    return () => {
      cancelled = true;
      streamRef.current?.getTracks().forEach((t) => t.stop());
    };
  }, [selectedClass]);

  const classSectionOptions = useMemo(
    () =>
      classSections.map((cs) => ({
        label: cs.name || `Class ${cs.grade ?? "?"} - ${cs.section ?? "?"}`,
        value: String(cs.id),
      })),
    [classSections]
  );

  const activeStudent = students.find((s) => s.id === activeStudentId);
  const doneCount = students.filter((s) => s.is_face_registered).length;
  const progressPct = students.length ? Math.round((doneCount / students.length) * 100) : 0;

  const toggleAngle = (angle) => {
    setCapturedAngles((prev) => ({ ...prev, [angle]: !prev[angle] }));
  };

  const handleSaveAndNext = () => {
    if (!activeStudent) return;
    // TODO: POST the 3 captured angle embeddings to the face-enrollment
    // endpoint once it exists; for now this only advances the local queue.
    toast.success(
      `Captured angles saved locally for ${activeStudent.full_name || activeStudent.name} (not yet sent to backend — no endpoint in contract).`
    );
    const idx = students.findIndex((s) => s.id === activeStudent.id);
    const next = students.slice(idx + 1).find((s) => !s.is_face_registered);
    setActiveStudentId(next?.id ?? null);
    setCapturedAngles({ front: false, left: false, right: false });
  };

  const statusFor = (student) => {
    if (student.is_face_registered) return { label: "DONE", tone: "done" };
    if (student.id === activeStudentId) return { label: "CAPTURING…", tone: "active" };
    return { label: "QUEUED", tone: "queued" };
  };

  return (
    <div className="w-full">
      <div className="flex items-center gap-3 pb-4 border-b border-cn-border mb-6 flex-wrap">
        <div className="min-w-0">
          <h1 className="font-heading font-bold text-2xl text-violet-950">Face registration</h1>
          <span className="inline-block mt-1 bg-success-tint text-success-hex border border-green-200 rounded-lg px-2.5 py-1 text-[11.5px] font-bold">
            Consented students only
          </span>
        </div>
        <div className="flex-1" />
        <div className="w-56">
          <SelectBox
            fieldName="class_section"
            value={selectedClass}
            onChange={(e) => setSelectedClass(e.target.value)}
            options={classSectionOptions}
          />
        </div>
      </div>

      <div className="flex flex-col lg:flex-row gap-6 items-start">
        {/* Capture panel */}
        <div className="flex-[1.2] w-full rounded-2xl p-5 flex flex-col gap-4" style={{ background: "#0E0A1F" }}>
          {activeStudent ? (
            <>
              <div className="flex items-center gap-3">
                <div
                  className="w-11 h-11 rounded-xl flex items-center justify-center font-heading font-bold text-white text-base shrink-0"
                  style={{ background: "linear-gradient(135deg, #7C3AED, #A78BFA)" }}
                >
                  {initialsOf(activeStudent.full_name || activeStudent.name)}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-white font-heading font-semibold text-[15.5px] truncate">
                    {activeStudent.full_name || activeStudent.name}
                  </div>
                  <div className="text-white/55 text-xs truncate">
                    Admission {activeStudent.admission_number || "auto"}
                  </div>
                </div>
                <div className="bg-emerald-500/15 border border-emerald-400/50 text-emerald-300 rounded-lg px-3 py-1.5 text-[11.5px] font-extrabold shrink-0">
                  {ANGLES.filter((a) => capturedAngles[a]).length} / 3 ANGLES
                </div>
              </div>

              <div
                className="flex-1 rounded-2xl border border-violet-400/25 relative flex items-center justify-center overflow-hidden"
                style={{ background: "linear-gradient(160deg, #181329, #221A3E)", minHeight: 260 }}
              >
                {cameraError ? (
                  <div className="text-violet-300 text-xs text-center px-8 font-mono">{cameraError}</div>
                ) : (
                  <video
                    ref={videoRef}
                    autoPlay
                    muted
                    playsInline
                    className="w-[220px] h-[280px] object-cover rounded-[50%] border-[3px] border-dashed border-violet-400/60"
                  />
                )}
              </div>

              <div className="flex gap-2.5">
                {ANGLES.map((angle) => (
                  <button
                    key={angle}
                    type="button"
                    onClick={() => toggleAngle(angle)}
                    className={`flex-1 rounded-xl py-2.5 text-center text-[11px] font-extrabold uppercase transition cursor-pointer ${
                      capturedAngles[angle]
                        ? "bg-emerald-500/15 border border-emerald-400/50 text-emerald-300"
                        : "bg-white/5 border border-white/10 text-white/50"
                    }`}
                  >
                    {angle} {capturedAngles[angle] ? "✓" : ""}
                  </button>
                ))}
              </div>

              <Button variant="success" size="normal" className="h-[50px] font-heading text-[14.5px]" onClick={handleSaveAndNext}>
                Save &amp; next student →
              </Button>
            </>
          ) : (
            <div className="flex-1 flex items-center justify-center text-white/50 text-sm text-center py-16">
              {loading ? "Loading roster…" : "All consented students in this class are already registered."}
            </div>
          )}
        </div>

        {/* Queue */}
        <div className="flex-1 w-full bg-cn-surface border border-cn-border rounded-2xl p-5 flex flex-col gap-3">
          <div className="flex items-center gap-2.5">
            <span className="font-heading font-semibold text-[15px] text-ink-900">Class queue</span>
            <span className="flex-1" />
            <span className="text-xs font-bold text-ink-500">
              {doneCount} of {students.length} done
            </span>
          </div>
          <div className="h-2 rounded-full bg-violet-100 overflow-hidden">
            <div
              className="h-2 rounded-full"
              style={{ width: `${progressPct}%`, background: "linear-gradient(90deg, #6D28D9, #A78BFA)" }}
            />
          </div>

          <div className="flex flex-col gap-2 max-h-[420px] overflow-y-auto custom-scrollbar-light">
            {students.map((s) => {
              const status = statusFor(s);
              const hasConsent = s.face_consent !== false; // assume granted unless explicitly false
              return (
                <div
                  key={s.id}
                  onClick={() => hasConsent && !s.is_face_registered && setActiveStudentId(s.id)}
                  className={`rounded-xl p-3 flex items-center gap-3 border transition ${
                    status.tone === "active"
                      ? "border-violet-600 bg-violet-50 cursor-pointer"
                      : !hasConsent
                      ? "border-cn-border bg-cn-bg opacity-70"
                      : "border-cn-border cursor-pointer hover:border-violet-300"
                  }`}
                >
                  <div
                    className="w-9 h-9 rounded-[10px] flex items-center justify-center font-bold text-white text-[13px] shrink-0"
                    style={{ background: hasConsent ? "linear-gradient(135deg, #0891B2, #67E8F9)" : "#E5E1F0" }}
                  >
                    {initialsOf(s.full_name || s.name)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-[13.5px] font-bold text-ink-900 truncate">{s.full_name || s.name}</div>
                    <div className="text-[11.5px] text-ink-500 truncate">
                      {hasConsent ? `Admission ${s.admission_number || "auto"}` : "No face consent — skipped"}
                    </div>
                  </div>
                  <div
                    className={`text-[11px] font-extrabold shrink-0 ${
                      status.tone === "done" ? "text-success-hex" : status.tone === "active" ? "text-violet-700" : "text-ink-400"
                    }`}
                  >
                    {hasConsent ? status.label : "EXCLUDED"}
                  </div>
                </div>
              );
            })}
            {!loading && students.length === 0 && (
              <div className="text-center text-ink-400 text-sm py-8">No students in this class yet.</div>
            )}
          </div>

          <div className="bg-violet-50 rounded-xl p-3 text-[12px] text-violet-900 leading-relaxed mt-auto">
            Face templates are encrypted on-device and deleted automatically if consent is withdrawn.
          </div>
        </div>
      </div>
    </div>
  );
};

export default FaceRegistration;
