import api from "../../../services/api";

// POST /api/consent/grant/ and POST /api/consent/withdraw/ — DPDP Act 2023
// consent, recorded per-guardian per-type (e.g. "app_notifications",
// "bus_gps", "face_recognition"). The exact payload shape isn't nailed down
// by the backend yet, so this sends the fields that make sense from the
// design (guardian, student, consent_type) — adjust field names here once
// the real serializer lands.
const grantConsent = async ({ guardianId, studentId, consentType }) => {
  const response = await api.post("consent/grant/", {
    guardian: guardianId,
    student: studentId,
    consent_type: consentType,
  });
  return { status: response.status, data: response.data };
};

const withdrawConsent = async ({ guardianId, studentId, consentType }) => {
  const response = await api.post("consent/withdraw/", {
    guardian: guardianId,
    student: studentId,
    consent_type: consentType,
  });
  return { status: response.status, data: response.data };
};

const consentService = {
  grantConsent,
  withdrawConsent,
};

export default consentService;
