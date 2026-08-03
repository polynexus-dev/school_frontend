import api from "../../../services/api";

const getCompetencies = async (reportCardId) => {
  const response = await api.get("academics/report-card-competencies/", { params: { report_card: reportCardId } });
  return { status: response.status, data: response.data };
};

const createCompetency = async (payload) => {
  const response = await api.post("academics/report-card-competencies/", payload);
  return { status: response.status, data: response.data };
};

const deleteCompetency = async (id) => {
  const response = await api.delete(`academics/report-card-competencies/${id}/`);
  return { status: response.status, data: response.data };
};

const reportCardCompetencyService = { getCompetencies, createCompetency, deleteCompetency };

export default reportCardCompetencyService;
