import api from "../../../services/api";

// GET/POST /api/saas/chains/, GET /api/saas/chains/{id}/dashboard/ — SaaS
// Admin only, resolved against the public schema (no X-Tenant scoping).
const getChains = async () => {
  const response = await api.get("saas/chains/");
  return { status: response.status, data: response.data };
};

const getChainDashboard = async (chainId) => {
  const response = await api.get(`saas/chains/${chainId}/dashboard/`);
  return { status: response.status, data: response.data };
};

const chainService = { getChains, getChainDashboard };

export default chainService;
