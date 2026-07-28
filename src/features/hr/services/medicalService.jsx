import api from "../../../services/api";

const getMedicalProfiles = async (params = {}) => {
  const response = await api.get("medical/profiles/", { params });
  return { status: response.status, data: response.data };
};

const createOrUpdateMedicalProfile = async (payload) => {
  if (payload.id) {
    const response = await api.put(`medical/profiles/${payload.id}/`, payload);
    return { status: response.status, data: response.data };
  }
  const response = await api.post("medical/profiles/", payload);
  return { status: response.status, data: response.data };
};

const getInfirmaryVisits = async (params = {}) => {
  const response = await api.get("medical/infirmary-visits/", { params });
  return { status: response.status, data: response.data };
};

const createInfirmaryVisit = async (payload) => {
  const response = await api.post("medical/infirmary-visits/", payload);
  return { status: response.status, data: response.data };
};

const getMedicalAlerts = async (params = {}) => {
  const response = await api.get("medical/alerts/", { params });
  return { status: response.status, data: response.data };
};

const medicalService = {
  getMedicalProfiles,
  createOrUpdateMedicalProfile,
  getInfirmaryVisits,
  createInfirmaryVisit,
  getMedicalAlerts,
};

export default medicalService;
