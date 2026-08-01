import api from "../../../services/api";

// Chart of Accounts — GET/POST /api/accounting/ledger-accounts/, GET/PUT/DELETE .../{id}/
const getLedgerAccounts = async (params = {}) => {
  const response = await api.get("accounting/ledger-accounts/", { params });
  return { status: response.status, data: response.data };
};

const createLedgerAccount = async (payload) => {
  const response = await api.post("accounting/ledger-accounts/", payload);
  return { status: response.status, data: response.data };
};

const updateLedgerAccount = async (id, payload) => {
  const response = await api.patch(`accounting/ledger-accounts/${id}/`, payload);
  return { status: response.status, data: response.data };
};

const deleteLedgerAccount = async (id) => {
  const response = await api.delete(`accounting/ledger-accounts/${id}/`);
  return { status: response.status, data: response.data };
};

// Payment-method -> GL account mapping
const getPaymentMethodMappings = async (params = {}) => {
  const response = await api.get("accounting/payment-method-mappings/", { params });
  return { status: response.status, data: response.data };
};

const createPaymentMethodMapping = async (payload) => {
  const response = await api.post("accounting/payment-method-mappings/", payload);
  return { status: response.status, data: response.data };
};

const updatePaymentMethodMapping = async (id, payload) => {
  const response = await api.patch(`accounting/payment-method-mappings/${id}/`, payload);
  return { status: response.status, data: response.data };
};

// Journal Entries — lines are written nested via `lines_input` on create
// (see JournalEntrySerializer.create()); post/reverse are dedicated actions.
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

// Expense Categories & Vouchers (Plan 2)
const getExpenseCategories = async (params = {}) => {
  const response = await api.get("accounting/expense-categories/", { params });
  return { status: response.status, data: response.data };
};

const createExpenseCategory = async (payload) => {
  const response = await api.post("accounting/expense-categories/", payload);
  return { status: response.status, data: response.data };
};

const getExpenseVouchers = async (params = {}) => {
  const response = await api.get("accounting/expense-vouchers/", { params });
  return { status: response.status, data: response.data };
};

const createExpenseVoucher = async (payload) => {
  const response = await api.post("accounting/expense-vouchers/", payload);
  return { status: response.status, data: response.data };
};

const postExpenseVoucher = async (id) => {
  const response = await api.post(`accounting/expense-vouchers/${id}/post_voucher/`);
  return { status: response.status, data: response.data };
};

// Bank Reconciliation (Plan 7)
const getBankAccounts = async (params = {}) => {
  const response = await api.get("accounting/bank-accounts/", { params });
  return { status: response.status, data: response.data };
};

const createBankAccount = async (payload) => {
  const response = await api.post("accounting/bank-accounts/", payload);
  return { status: response.status, data: response.data };
};

const importBankStatement = async (bankAccountId, file) => {
  const formData = new FormData();
  formData.append("file", file);
  const response = await api.post(`accounting/bank-accounts/${bankAccountId}/import-statement/`, formData, {
    headers: { "Content-Type": "multipart/form-data" },
  });
  return { status: response.status, data: response.data };
};

const getReconciliationSummary = async (bankAccountId) => {
  const response = await api.get(`accounting/bank-accounts/${bankAccountId}/reconciliation_summary/`);
  return { status: response.status, data: response.data };
};

const getStatementLines = async (params = {}) => {
  const response = await api.get("accounting/bank-statement-lines/", { params });
  return { status: response.status, data: response.data };
};

const getMatchSuggestions = async (statementLineId) => {
  const response = await api.get("accounting/bank-statement-lines/suggestions/", { params: { statement_line: statementLineId } });
  return { status: response.status, data: response.data };
};

const matchStatementLine = async (statementLineId, journalEntryLineId) => {
  const response = await api.post(`accounting/bank-statement-lines/${statementLineId}/match/`, { journal_entry_line: journalEntryLineId });
  return { status: response.status, data: response.data };
};

const unmatchStatementLine = async (statementLineId) => {
  const response = await api.post(`accounting/bank-statement-lines/${statementLineId}/unmatch/`);
  return { status: response.status, data: response.data };
};

// Investment Register (Sec 11(5) compliance)
const getInvestments = async (params = {}) => {
  const response = await api.get("accounting/investments/", { params });
  return { status: response.status, data: response.data };
};

const createInvestment = async (payload) => {
  const response = await api.post("accounting/investments/", payload);
  return { status: response.status, data: response.data };
};

const redeemInvestment = async (id, redemptionAmount, redemptionDate) => {
  const response = await api.post(`accounting/investments/${id}/redeem/`, {
    redemption_amount: redemptionAmount, redemption_date: redemptionDate,
  });
  return { status: response.status, data: response.data };
};

// Trustees / Related Parties (Section 13(3))
const getTrustees = async (params = {}) => {
  const response = await api.get("accounting/trustees/", { params });
  return { status: response.status, data: response.data };
};

const createTrustee = async (payload) => {
  const response = await api.post("accounting/trustees/", payload);
  return { status: response.status, data: response.data };
};

const updateTrustee = async (id, payload) => {
  const response = await api.patch(`accounting/trustees/${id}/`, payload);
  return { status: response.status, data: response.data };
};

// Vendor / Bill (Accounts Payable)
const getVendors = async (params = {}) => {
  const response = await api.get("accounting/vendors/", { params });
  return { status: response.status, data: response.data };
};

const createVendor = async (payload) => {
  const response = await api.post("accounting/vendors/", payload);
  return { status: response.status, data: response.data };
};

const getBills = async (params = {}) => {
  const response = await api.get("accounting/bills/", { params });
  return { status: response.status, data: response.data };
};

const createBill = async (payload) => {
  const response = await api.post("accounting/bills/", payload);
  return { status: response.status, data: response.data };
};

const recordBillPayment = async (payload) => {
  const response = await api.post("accounting/bill-payments/", payload);
  return { status: response.status, data: response.data };
};

// Grant Register
const getGrants = async (params = {}) => {
  const response = await api.get("accounting/grants/", { params });
  return { status: response.status, data: response.data };
};

const createGrant = async (payload) => {
  const response = await api.post("accounting/grants/", payload);
  return { status: response.status, data: response.data };
};

const recordGrantUtilization = async (payload) => {
  const response = await api.post("accounting/grant-utilizations/", payload);
  return { status: response.status, data: response.data };
};

const issueUtilizationCertificate = async (grantId) => {
  const response = await api.post(`accounting/grants/${grantId}/issue-utilization-certificate/`);
  return { status: response.status, data: response.data };
};

// Statutory Challan Register
const getStatutoryChallans = async (params = {}) => {
  const response = await api.get("accounting/statutory-challans/", { params });
  return { status: response.status, data: response.data };
};

const createStatutoryChallan = async (payload) => {
  const response = await api.post("accounting/statutory-challans/", payload);
  return { status: response.status, data: response.data };
};

// Provisions & Year-End Schedules
const getProvisionSchedules = async (params = {}) => {
  const response = await api.get("accounting/provision-schedules/", { params });
  return { status: response.status, data: response.data };
};

const createProvisionSchedule = async (payload) => {
  const response = await api.post("accounting/provision-schedules/", payload);
  return { status: response.status, data: response.data };
};

const releaseProvisionSchedule = async (id, releaseAmount, releaseDate) => {
  const response = await api.post(`accounting/provision-schedules/${id}/release/`, {
    release_amount: releaseAmount, release_date: releaseDate,
  });
  return { status: response.status, data: response.data };
};

const accountingService = {
  getLedgerAccounts, createLedgerAccount, updateLedgerAccount, deleteLedgerAccount,
  getPaymentMethodMappings, createPaymentMethodMapping, updatePaymentMethodMapping,
  getJournalEntries, createJournalEntry, postJournalEntry, reverseJournalEntry, deleteJournalEntry,
  getExpenseCategories, createExpenseCategory, getExpenseVouchers, createExpenseVoucher, postExpenseVoucher,
  getBankAccounts, createBankAccount, importBankStatement, getReconciliationSummary,
  getStatementLines, getMatchSuggestions, matchStatementLine, unmatchStatementLine,
  getInvestments, createInvestment, redeemInvestment,
  getTrustees, createTrustee, updateTrustee,
  getVendors, createVendor, getBills, createBill, recordBillPayment,
  getGrants, createGrant, recordGrantUtilization, issueUtilizationCertificate,
  getStatutoryChallans, createStatutoryChallan,
  getProvisionSchedules, createProvisionSchedule, releaseProvisionSchedule,
};

export default accountingService;
