import api from "../../../services/api";

// GET/POST /api/guardians/ and GET/POST /api/guardian-links/
// Used both by the Students enrollment flow (invite a guardian + link them
// to the new student) and by the standalone Parents & Linking manager.
const getGuardians = async (params = {}) => {
  const response = await api.get("guardians/", { params });
  return { status: response.status, data: response.data };
};

const createGuardian = async (payload) => {
  const response = await api.post("guardians/", payload);
  return { status: response.status, data: response.data };
};

const getGuardianLinks = async (params = {}) => {
  const response = await api.get("guardian-links/", { params });
  return { status: response.status, data: response.data };
};

const createGuardianLink = async (payload) => {
  const response = await api.post("guardian-links/", payload);
  return { status: response.status, data: response.data };
};

const verifyGuardianLink = async (id, notes = "") => {
  const response = await api.post(`guardian-links/${id}/verify/`, { notes });
  return { status: response.status, data: response.data };
};

const rejectGuardianLink = async (id, notes = "") => {
  const response = await api.post(`guardian-links/${id}/reject/`, { notes });
  return { status: response.status, data: response.data };
};

const guardianService = {
  getGuardians,
  createGuardian,
  getGuardianLinks,
  createGuardianLink,
  verifyGuardianLink,
  rejectGuardianLink,
};

export default guardianService;
