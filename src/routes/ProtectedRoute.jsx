import React, { useEffect, useState } from "react";
import { Navigate, Outlet } from "react-router-dom";
import authService from "../features/auth/services/authService";
import Loader from "../components/Loader";

const ProtectedRoute = () => {
  const [loading, setLoading] = useState(true);
  const [isValid, setIsValid] = useState(false);

  useEffect(() => {
    const verifySession = async () => {
      const token = localStorage.getItem("accessToken");
      if (!token) {
        setLoading(false);
        return;
      }

      try {
        // No dedicated /token/verify/ endpoint in the confirmed contract, so
        // GET /api/profile/ doubles as the verification call — api.jsx's
        // response interceptor will silently refresh the token if it's
        // merely expired, so only a truly dead session lands in the catch.
        await authService.getProfile();
        setIsValid(true);
      } catch (err) {
        console.error("Session invalid:", err);
        localStorage.removeItem("accessToken");
        localStorage.removeItem("refreshToken");
        localStorage.removeItem("tenantSchema");
        setIsValid(false);
      } finally {
        setLoading(false);
      }
    };

    verifySession();
  }, []);

  if (loading) {
    return (
      <div className="h-screen w-screen flex items-center justify-center bg-cn-bg">
        <Loader />
      </div>
    );
  }

  return isValid ? <Outlet /> : <Navigate to="/login" replace />;
};

export default ProtectedRoute;
