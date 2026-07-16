import axios from "axios";

// Simpler than the CampusFlow (college) frontend's api.jsx on purpose: this
// product doesn't need the tenant-subdomain/nip.io host-rewriting dance yet
// (see the plan doc) — just a plain VITE_API_URL base. Add that complexity
// back if/when School Edition needs tenant subdomains from the browser.
export const getBaseURL = () =>
  import.meta.env.VITE_API_URL || "http://localhost:8000/api/";

const api = axios.create({
  baseURL: getBaseURL(),
  timeout: 60000,
  headers: {
    "Content-Type": "application/json",
  },
});

// Attach the JWT + tenant schema header to every outgoing request.
api.interceptors.request.use((config) => {
  const token = localStorage.getItem("accessToken");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }

  const tenantSchema = localStorage.getItem("tenantSchema");
  if (tenantSchema) {
    config.headers["X-Tenant"] = tenantSchema;
  }

  config.baseURL = getBaseURL();
  return config;
});

// Silent-refresh-once-on-401. JWT access tokens are short-lived, so without
// this every dropped token would boot the admin back to /login mid-task.
// Queues up any requests that 401 while a refresh is already in flight so
// they all retry once the new access token lands, instead of each kicking
// off their own refresh call.
let isRefreshing = false;
let pendingQueue = [];

const flushQueue = (error) => {
  pendingQueue.forEach(({ resolve, reject }) => (error ? reject(error) : resolve()));
  pendingQueue = [];
};

const clearSessionAndRedirect = () => {
  localStorage.removeItem("accessToken");
  localStorage.removeItem("refreshToken");
  localStorage.removeItem("tenantSchema");
  if (window.location.pathname !== "/login") {
    window.location.href = "/login";
  }
};

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config || {};
    const isAuthEndpoint = originalRequest.url?.includes("token/");

    if (error.response?.status !== 401 || originalRequest._retry || isAuthEndpoint) {
      return Promise.reject(error);
    }

    const refreshToken = localStorage.getItem("refreshToken");
    if (!refreshToken) {
      clearSessionAndRedirect();
      return Promise.reject(error);
    }

    if (isRefreshing) {
      return new Promise((resolve, reject) => {
        pendingQueue.push({ resolve, reject });
      }).then(() => api(originalRequest));
    }

    originalRequest._retry = true;
    isRefreshing = true;

    try {
      const { data } = await axios.post(`${getBaseURL()}token/refresh/`, {
        refresh: refreshToken,
      });
      localStorage.setItem("accessToken", data.access);
      flushQueue(null);
      return api(originalRequest);
    } catch (refreshError) {
      flushQueue(refreshError);
      clearSessionAndRedirect();
      return Promise.reject(refreshError);
    } finally {
      isRefreshing = false;
    }
  }
);

export default api;
