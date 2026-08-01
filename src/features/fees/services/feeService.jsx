import api from "../../../services/api";

// GET/POST /api/fees/categories/ — each category can carry an income_account
// (Plan 2 accrual auto-posting) so invoicing it knows which GL account to credit.
const getCategories = async (params = {}) => {
  const response = await api.get("fees/categories/", { params });
  return { status: response.status, data: response.data };
};

const createCategory = async (payload) => {
  const response = await api.post("fees/categories/", payload);
  return { status: response.status, data: response.data };
};

const updateCategory = async (id, payload) => {
  const response = await api.patch(`fees/categories/${id}/`, payload);
  return { status: response.status, data: response.data };
};

// GET/POST /api/fees/invoices/, GET/PUT/DELETE /api/fees/invoices/{id}/
const getInvoices = async (params = {}) => {
  const response = await api.get("fees/invoices/", { params });
  return { status: response.status, data: response.data };
};

// `items_input` — Plan 2 nested-write exception (see StudentFeeInvoiceSerializer):
// invoice + line items are created together so the accrual posting knows
// which income account(s) to credit. total_amount is computed server-side
// from the items, so it doesn't need to be sent.
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

const feeService = { getCategories, createCategory, updateCategory, getInvoices, createInvoice, getPayments, recordPayment };

export default feeService;
