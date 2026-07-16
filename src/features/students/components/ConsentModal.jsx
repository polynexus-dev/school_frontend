import React, { useEffect, useState } from "react";
import { toast } from "react-toastify";
import Modal from "../../../components/Modal";
import Button from "../../../components/Button";
import guardianService from "../../guardians/services/guardianService";
import consentService from "../services/consentService";

// DPDP Act 2023 consent panel — recorded per guardian, per type. Wired to the
// real POST /api/consent/grant/ + POST /api/consent/withdraw/ endpoints.
// Which guardian to record against is resolved by looking up this student's
// primary link via GET /api/guardian-links/?student={id}, since the students
// list itself doesn't carry guardian info in the confirmed contract.
const CONSENT_TYPES = [
  { key: "app_notifications", label: "App notifications & academic records", required: true },
  { key: "bus_gps", label: "Bus GPS tracking & boarding alerts", required: false },
  { key: "face_recognition", label: "Face recognition for attendance", required: false },
];

const ConsentModal = ({ isOpen, onClose, student }) => {
  const [primaryLink, setPrimaryLink] = useState(null);
  const [loadingGuardian, setLoadingGuardian] = useState(false);
  const [consentState, setConsentState] = useState({
    app_notifications: true,
    bus_gps: false,
    face_recognition: false,
  });
  const [busyKey, setBusyKey] = useState(null);

  useEffect(() => {
    if (!isOpen || !student) return;
    setConsentState({ app_notifications: true, bus_gps: false, face_recognition: false });
    setPrimaryLink(null);

    const loadPrimaryGuardian = async () => {
      setLoadingGuardian(true);
      try {
        const res = await guardianService.getGuardianLinks({ student: student.id });
        const links = Array.isArray(res.data) ? res.data : res.data?.results || [];
        setPrimaryLink(links.find((l) => l.is_primary) || links[0] || null);
      } catch (err) {
        console.error("Failed to load guardian links for consent panel:", err);
      } finally {
        setLoadingGuardian(false);
      }
    };
    loadPrimaryGuardian();
  }, [isOpen, student]);

  const guardianId =
    primaryLink?.guardian?.id ?? (typeof primaryLink?.guardian === "number" ? primaryLink.guardian : primaryLink?.guardian_id);

  const handleToggle = async (type) => {
    if (type.required || !guardianId || busyKey) return;
    const currentlyGranted = consentState[type.key];
    setBusyKey(type.key);
    try {
      if (currentlyGranted) {
        await consentService.withdrawConsent({ guardianId, studentId: student.id, consentType: type.key });
        toast.success(`${type.label} consent withdrawn.`);
      } else {
        await consentService.grantConsent({ guardianId, studentId: student.id, consentType: type.key });
        toast.success(`${type.label} consent granted.`);
      }
      setConsentState((prev) => ({ ...prev, [type.key]: !currentlyGranted }));
    } catch (err) {
      toast.error("Failed to update consent. Please try again.");
      console.error(err);
    } finally {
      setBusyKey(null);
    }
  };

  if (!student) return null;

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={`DPDP consent · ${student.full_name || student.name || "Student"}`}>
      <div className="w-[420px] max-w-full flex flex-col gap-3">
        <p className="text-xs text-ink-500 leading-relaxed">
          Recorded against the primary guardian. Face data needs an explicit opt-in — it is never assumed.
        </p>

        {loadingGuardian && <p className="text-xs text-ink-400">Loading guardian link…</p>}
        {!loadingGuardian && !guardianId && (
          <div className="bg-warning-tint border border-amber-200 text-warning-hex rounded-lg p-3 text-xs">
            No linked guardian found yet — invite a guardian for this student before recording consent.
          </div>
        )}

        {CONSENT_TYPES.map((type) => {
          const granted = consentState[type.key];
          return (
            <div
              key={type.key}
              className={`border rounded-xl p-3 flex items-center gap-3 ${
                granted ? "border-violet-300 bg-violet-50/50" : "border-cn-border"
              }`}
            >
              <button
                type="button"
                disabled={type.required || !guardianId || busyKey === type.key}
                onClick={() => handleToggle(type)}
                className={`w-6 h-6 rounded-lg flex items-center justify-center text-xs font-extrabold shrink-0 transition ${
                  granted ? "bg-violet-700 text-white" : "border-2 border-amber-400 bg-white"
                } ${type.required || !guardianId ? "cursor-not-allowed opacity-80" : "cursor-pointer"}`}
              >
                {granted ? "✓" : ""}
              </button>
              <div className="flex-1 text-[13px] font-semibold text-ink-900">{type.label}</div>
              <div
                className={`text-[11px] font-extrabold shrink-0 ${
                  type.required ? "text-success-hex" : granted ? "text-ink-500" : "text-warning-hex"
                }`}
              >
                {type.required ? "REQUIRED" : granted ? "GRANTED" : "PENDING"}
              </div>
            </div>
          );
        })}

        <div className="flex justify-end pt-2">
          <Button variant="secondary" onClick={onClose}>
            Close
          </Button>
        </div>
      </div>
    </Modal>
  );
};

export default ConsentModal;
