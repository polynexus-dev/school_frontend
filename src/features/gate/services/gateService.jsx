import api from "../../../services/api";

// GET/POST /api/gate/visitors/ + check_out action — staff-only.
const getVisitors = async (params = {}) => {
  const response = await api.get("gate/visitors/", { params });
  return { status: response.status, data: response.data };
};

const checkInVisitor = async (payload) => {
  const response = await api.post("gate/visitors/", payload);
  return { status: response.status, data: response.data };
};

const checkOutVisitor = async (id) => {
  const response = await api.post(`gate/visitors/${id}/check_out/`);
  return { status: response.status, data: response.data };
};

// GET/POST /api/gate/passes/ + approve/reject/release actions.
const getGatePasses = async (params = {}) => {
  const response = await api.get("gate/passes/", { params });
  return { status: response.status, data: response.data };
};

const createGatePass = async (payload) => {
  const response = await api.post("gate/passes/", payload);
  return { status: response.status, data: response.data };
};

const approveGatePass = async (id) => {
  const response = await api.post(`gate/passes/${id}/approve/`);
  return { status: response.status, data: response.data };
};

const rejectGatePass = async (id) => {
  const response = await api.post(`gate/passes/${id}/reject/`);
  return { status: response.status, data: response.data };
};

const releaseGatePass = async (id, payload) => {
  const response = await api.post(`gate/passes/${id}/release/`, payload);
  return { status: response.status, data: response.data };
};

const gateService = { getVisitors, checkInVisitor, checkOutVisitor, getGatePasses, createGatePass, approveGatePass, rejectGatePass, releaseGatePass };

export default gateService;
