import api from "../../../services/api";

// GET/POST /api/auditors/ — POSTing a nested `user: {username, email, first_name,
// last_name, password?}` block creates the User + 'CA' Group membership +
// AuditorProfile in one call (mirrors StudentProfileViewSet's enrollment flow).
const getAuditors = async (params = {}) => {
  const response = await api.get("auditors/", { params });
  return { status: response.status, data: response.data };
};

const inviteAuditor = async (payload) => {
  const response = await api.post("auditors/", payload);
  return { status: response.status, data: response.data };
};

const updateAuditor = async (id, payload) => {
  const response = await api.patch(`auditors/${id}/`, payload);
  return { status: response.status, data: response.data };
};

const auditorService = { getAuditors, inviteAuditor, updateAuditor };

export default auditorService;
