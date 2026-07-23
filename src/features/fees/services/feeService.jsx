import api from "../../../services/api";

// GET/POST /api/fees/invoices/, GET/PUT/DELETE /api/fees/invoices/{id}/
const getInvoices = async (params = {}) => {
  const response = await api.get("fees/invoices/", { params });
  return { status: response.status, data: response.data };
};

const createInvoice = async (payload) => {
  const response = await api.post("fees/invoices/", payload);
  return { status: response.status, data: response.data };
};

// GET/POST /api/fees/payments/ — offline/manual payment recording (cash/UPI-at-office/cheque).
// FeePayment.save() auto-updates the parent invoice's paid_amount/status.
const getPayments = async (params = {}) => {
  const response = await api.get("fees/payments/", { params });
  return { status: response.status, data: response.data };
};

const recordPayment = async (payload) => {
  const response = await api.post("fees/payments/", payload);
  return { status: response.status, data: response.data };
};

const feeService = { getInvoices, createInvoice, getPayments, recordPayment };

export default feeService;
