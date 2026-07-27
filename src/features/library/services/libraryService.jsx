import api from "../../../services/api";

// GET/POST/PUT/DELETE /api/library/books/, /copies/, /issues/ — Teacher+
// read, Admin write (issues are Teacher+ write too, see BookIssueViewSet).
const getBooks = async (params = {}) => {
  const response = await api.get("library/books/", { params });
  return { status: response.status, data: response.data };
};

const createBook = async (payload) => {
  const response = await api.post("library/books/", payload);
  return { status: response.status, data: response.data };
};

const updateBook = async (id, payload) => {
  const response = await api.patch(`library/books/${id}/`, payload);
  return { status: response.status, data: response.data };
};

const getCopies = async (bookId) => {
  const response = await api.get("library/copies/", { params: { book: bookId } });
  return { status: response.status, data: response.data };
};

const createCopy = async (payload) => {
  const response = await api.post("library/copies/", payload);
  return { status: response.status, data: response.data };
};

const getIssues = async (params = {}) => {
  const response = await api.get("library/issues/", { params });
  return { status: response.status, data: response.data };
};

const createIssue = async (payload) => {
  const response = await api.post("library/issues/", payload);
  return { status: response.status, data: response.data };
};

const returnBook = async (issueId) => {
  const response = await api.post(`library/issues/${issueId}/return_book/`);
  return { status: response.status, data: response.data };
};

const libraryService = { getBooks, createBook, updateBook, getCopies, createCopy, getIssues, createIssue, returnBook };

export default libraryService;
