import api from "../../../services/api";

// GET/POST /api/accounting/ledger-accounts/, GET/PUT/DELETE .../{id}/
const getAccounts = async (params = {}) => {
  const response = await api.get("accounting/ledger-accounts/", { params });
  return { status: response.status, data: response.data };
};

const createAccount = async (payload) => {
  const response = await api.post("accounting/ledger-accounts/", payload);
  return { status: response.status, data: response.data };
};

const updateAccount = async (id, payload) => {
  const response = await api.patch(`accounting/ledger-accounts/${id}/`, payload);
  return { status: response.status, data: response.data };
};

const deleteAccount = async (id) => {
  const response = await api.delete(`accounting/ledger-accounts/${id}/`);
  return { status: response.status, data: response.data };
};

// GET/POST /api/accounting/payment-method-mappings/
const getPaymentMethodMappings = async (params = {}) => {
  const response = await api.get("accounting/payment-method-mappings/", { params });
  return { status: response.status, data: response.data };
};

const upsertPaymentMethodMapping = async (payload) => {
  const response = await api.post("accounting/payment-method-mappings/", payload);
  return { status: response.status, data: response.data };
};

// GET/POST /api/accounting/journal-entries/ — `lines_input` accepts the
// full set of Dr/Cr rows nested on create (see JournalEntrySerializer).
const getJournalEntries = async (params = {}) => {
  const response = await api.get("accounting/journal-entries/", { params });
  return { status: response.status, data: response.data };
};

const createJournalEntry = async (payload) => {
  const response = await api.post("accounting/journal-entries/", payload);
  return { status: response.status, data: response.data };
};

const postJournalEntry = async (id) => {
  const response = await api.post(`accounting/journal-entries/${id}/post/`);
  return { status: response.status, data: response.data };
};

const reverseJournalEntry = async (id, narration) => {
  const response = await api.post(`accounting/journal-entries/${id}/reverse/`, { narration });
  return { status: response.status, data: response.data };
};

const deleteJournalEntry = async (id) => {
  const response = await api.delete(`accounting/journal-entries/${id}/`);
  return { status: response.status, data: response.data };
};

const accountingService = {
  getAccounts,
  createAccount,
  updateAccount,
  deleteAccount,
  getPaymentMethodMappings,
  upsertPaymentMethodMapping,
  getJournalEntries,
  createJournalEntry,
  postJournalEntry,
  reverseJournalEntry,
  deleteJournalEntry,
};

export default accountingService;
