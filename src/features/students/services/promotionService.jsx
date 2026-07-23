import api from "../../../services/api";

// POST /api/promotion/batches/  {academic_year_from, academic_year_to} -> PromotionBatch (status="draft")
const createBatch = async ({ academicYearFrom, academicYearTo }) => {
  const response = await api.post("promotion/batches/", {
    academic_year_from: Number(academicYearFrom),
    academic_year_to: Number(academicYearTo),
  });
  return { status: response.status, data: response.data };
};

// POST /api/promotion/batches/{id}/run/  {mappings, outcomes} -> {status, summary, batch}
const runBatch = async (batchId, { mappings, outcomes }) => {
  const response = await api.post(`promotion/batches/${batchId}/run/`, { mappings, outcomes });
  return { status: response.status, data: response.data };
};

// POST /api/promotion/batches/{id}/revert/ -> {status, summary} (only within the 7-day window)
const revertBatch = async (batchId) => {
  const response = await api.post(`promotion/batches/${batchId}/revert/`);
  return { status: response.status, data: response.data };
};

const promotionService = { createBatch, runBatch, revertBatch };

export default promotionService;
