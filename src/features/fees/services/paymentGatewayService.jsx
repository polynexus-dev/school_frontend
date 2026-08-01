import api from "../../../services/api";

// GET /api/fees/payment-gateway-registry/ — every gateway VIDYAM knows how to
// integrate with (credential fields, checkout mode, pricing note) merged
// with this school's current configuration state.
const getRegistry = async () => {
  const response = await api.get("fees/payment-gateway-registry/");
  return { status: response.status, data: response.data };
};

const getCredentials = async () => {
  const response = await api.get("fees/payment-gateway-credentials/");
  return { status: response.status, data: response.data };
};

const createCredential = async (payload) => {
  const response = await api.post("fees/payment-gateway-credentials/", payload);
  return { status: response.status, data: response.data };
};

const updateCredential = async (id, payload) => {
  const response = await api.patch(`fees/payment-gateway-credentials/${id}/`, payload);
  return { status: response.status, data: response.data };
};

const deleteCredential = async (id) => {
  const response = await api.delete(`fees/payment-gateway-credentials/${id}/`);
  return { status: response.status, data: response.data };
};

const setDefaultCredential = async (id) => {
  const response = await api.post(`fees/payment-gateway-credentials/${id}/set_default/`, {});
  return { status: response.status, data: response.data };
};

// GET /api/fees/payment-gateway-pricing-check/{gateway}/ — live-fetches the
// gateway's own pricing page right now and returns whatever fee-related
// snippets it could find, plus the page URL to cross-verify directly.
const checkLivePricing = async (gateway) => {
  const response = await api.get(`fees/payment-gateway-pricing-check/${gateway}/`);
  return { status: response.status, data: response.data };
};

const paymentGatewayService = {
  getRegistry,
  getCredentials,
  createCredential,
  updateCredential,
  deleteCredential,
  setDefaultCredential,
  checkLivePricing,
};

export default paymentGatewayService;
