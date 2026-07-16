import api from "../../../services/api";

// Matches the confirmed backend contract exactly:
//   POST /api/token/            {username,password} -> {access,refresh}
//   POST /api/token/refresh/    {refresh}            -> {access}
//   GET  /api/profile/          -> current user profile

const login = async (username, password) => {
  const response = await api.post("token/", { username, password });
  return {
    status: response.status,
    data: response.data,
  };
};

const refreshAccessToken = async (refresh) => {
  const response = await api.post("token/refresh/", { refresh });
  return {
    status: response.status,
    data: response.data,
  };
};

const getProfile = async () => {
  const response = await api.get("profile/");
  return {
    status: response.status,
    data: response.data,
  };
};

// No server-side logout/blacklist endpoint in the confirmed contract yet —
// this is a purely client-side session teardown.
const logout = () => {
  localStorage.removeItem("accessToken");
  localStorage.removeItem("refreshToken");
  localStorage.removeItem("tenantSchema");
};

const authService = {
  login,
  refreshAccessToken,
  getProfile,
  logout,
};

export default authService;
