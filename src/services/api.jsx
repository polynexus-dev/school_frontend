import axios from "axios";

// Automatically extracts tenant schema from subdomain (e.g. demo.localhost or demo.vidyam.in)
export const getSubdomainTenant = () => {
  if (typeof window === "undefined" || !window.location.hostname) return null;
  const parts = window.location.hostname.split(".");
  // Handles demo.localhost:5173 or demo.school.com
  if (parts.length > 1) {
    const sub = parts[0].toLowerCase();
    if (!["www", "app", "localhost", "127"].includes(sub)) {
      return sub;
    }
  }
  return null;
};

export const getBaseURL = () => {
  const envUrl = import.meta.env.VITE_API_URL;
  if (envUrl && !envUrl.includes("127.0.0.1") && !envUrl.includes("localhost")) {
    return envUrl;
  }
  const hostname = typeof window !== "undefined" && window.location.hostname ? window.location.hostname : "127.0.0.1";
  return `http://${hostname}:8000/api/`;
};

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

  // Priority 1: Subdomain (e.g. demo.localhost / demo.vidyam.in)
  // Priority 2: Stored tenant schema from login
  const tenantSchema = getSubdomainTenant() || localStorage.getItem("tenantSchema");
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
