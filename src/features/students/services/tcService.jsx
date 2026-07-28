import api from "../../../services/api";

const getTransferCertificates = async (params = {}) => {
  const response = await api.get("transfer-certificates/", { params });
  return { status: response.status, data: response.data };
};

const checkClearance = async (studentId) => {
  const response = await api.post("transfer-certificates/check-clearance/", { student_id: studentId });
  return { status: response.status, data: response.data };
};

const generateTC = async (payload) => {
  const response = await api.post("transfer-certificates/generate/", payload);
  return { status: response.status, data: response.data };
};

const verifyTC = async (uuid) => {
  const response = await api.get(`public/verify-tc/${uuid}/`);
  return { status: response.status, data: response.data };
};

const tcService = {
  getTransferCertificates,
  checkClearance,
  generateTC,
  verifyTC,
};

export default tcService;
