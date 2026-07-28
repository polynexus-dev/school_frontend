import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import VidyamLogoMark from "../../../components/common/VidyamLogo";
import Logo from "../../../assets/campusnexus_logo.svg";
import authService from "../services/authService";
import Loader from "../../../components/Loader";
import { Eye, EyeOff, X } from "lucide-react";
import useUser from "../hooks/useUser";

// Pixel-matches "Web Portal (Recreation).dc.html" screen 1: dark split-screen
// login, #17141F/#1B1723 form panel, #A020F0 login button, "Connecting
// Campus, Empowering Minds." hero tagline, "Powered by Polynexus" branding.
const Login = () => {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [error, setError] = useState("");
  const [fieldErrors, setFieldErrors] = useState({});
  const [loading, setLoading] = useState(false);

  const navigate = useNavigate();
  const { setUser } = useUser();

  useEffect(() => {
    const remembered = localStorage.getItem("rememberedUsername");
    if (remembered) {
      setUsername(remembered);
      setRememberMe(true);
    }
    if (localStorage.getItem("accessToken")) {
      navigate("/dashboard");
    }
  }, [navigate]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    const errors = {};
    if (!username.trim()) errors.username = "Username is required";
    if (!password.trim()) errors.password = "Password is required";
    setFieldErrors(errors);
    if (Object.keys(errors).length > 0) return;

    setLoading(true);
    try {
      const response = await authService.login(username, password);
      if (response.status === 200) {
        localStorage.setItem("accessToken", response.data.access);
        localStorage.setItem("refreshToken", response.data.refresh);
        // Not guaranteed by the contract yet, but stash it if the backend
        // sends it back so the X-Tenant header interceptor picks it up.
        const tenantSchema = response.data.tenant_schema || response.data.tenant?.schema || "public";
        localStorage.setItem("tenantSchema", tenantSchema);

        if (rememberMe) {
          localStorage.setItem("rememberedUsername", username);
        } else {
          localStorage.removeItem("rememberedUsername");
        }

        const profile = await authService.getProfile();
        setUser(profile);
        navigate("/dashboard");
      }
    } catch (err) {
      setError(err?.response?.data?.detail || err?.response?.data?.message || "Invalid username or password.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="h-screen w-screen flex flex-row overflow-hidden bg-[#1B1723] font-sans">
      {/* Left — hero panel */}
      <div className="w-1/2 relative hidden md:flex flex-col select-none h-full bg-[#14121d] overflow-hidden">
        <div
          className="absolute inset-0"
          style={{
            backgroundImage:
              "repeating-linear-gradient(45deg, #2A2440, #2A2440 14px, #241E38 14px, #241E38 28px)",
          }}
        />
        <div
          className="absolute inset-0"
          style={{ background: "linear-gradient(180deg, rgba(10,8,20,.25), rgba(10,8,20,.55))" }}
        />

        <div className="relative flex justify-between items-start p-9">
          <div>
            <div className="text-white/70 text-[11px] font-extrabold uppercase tracking-[0.2em]">
              Enterprise Suite
            </div>
            <div className="mt-3 font-heading font-bold text-base text-white flex items-center gap-2">
              <VidyamLogoMark size={24} /> VIDYAM
            </div>
          </div>
          <a
            href="https://polynexus.in"
            target="_blank"
            rel="noopener noreferrer"
            className="text-white/85 text-xs font-semibold bg-white/10 hover:bg-white/20 transition backdrop-blur-md px-4 py-2 rounded-full"
          >
            polynexus.in &rarr;
          </a>
        </div>

        <div className="relative flex-1" />

        <div className="relative p-10 pb-12">
          <h3 className="font-heading font-bold text-[40px] leading-[1.25] text-white">
            Connecting Campus,<br />Empowering Minds.
          </h3>
          <div className="flex gap-2 mt-6 items-center">
            <span className="w-8 h-1.5 bg-white rounded-full"></span>
            <span className="w-2 h-1.5 bg-white/40 rounded-full"></span>
            <span className="w-2 h-1.5 bg-white/40 rounded-full"></span>
          </div>
        </div>
      </div>

      {/* Right — form panel */}
      <div className="w-full md:w-1/2 flex flex-col justify-between p-8 sm:p-16 md:p-20 bg-[#1B1723] overflow-y-auto h-full">
        <div className="flex-grow flex flex-col justify-center max-w-[420px] w-full mx-auto">
          <div className="flex flex-col items-center mb-2">
            <VidyamLogoMark size={74} />
            <div className="text-[13px] font-extrabold tracking-[0.22em] text-violet-400 mt-3">
              VIDYAM
            </div>
            <div className="text-[9px] font-extrabold tracking-[0.22em] text-white/40 mt-0.5">
              POWERED BY POLYNEXUS
            </div>
          </div>

          <div className="text-center mt-8">
            <h2 className="font-heading font-semibold text-[34px] text-white">Welcome back</h2>
            <p className="text-[14.5px] text-white/50 mt-2.5">
              Access the school management portal.
            </p>
          </div>

          {error && (
            <div className="relative text-sm text-red-300 mt-6 border border-red-500/30 bg-red-500/10 p-3 pr-10 rounded-xl">
              {error}
              <button
                type="button"
                onClick={() => setError("")}
                className="absolute top-1/2 right-3 -translate-y-1/2 text-red-300 hover:opacity-80 cursor-pointer"
              >
                <X size={16} />
              </button>
            </div>
          )}

          <form onSubmit={handleSubmit} className="mt-8">
            <div className="mb-5">
              <label className="block text-[11.5px] font-extrabold text-white/60 mb-2 uppercase tracking-[0.08em]">
                Username or Email
              </label>
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="Enter your username"
                className="w-full px-4 py-3.5 bg-[#221D30] border border-[#3A3350] hover:border-white/20 focus:border-violet-400 focus:outline-none rounded-[10px] text-white placeholder-[#6F6A85] text-[14.5px] transition"
              />
              {fieldErrors.username && <p className="text-xs text-red-400 mt-1">{fieldErrors.username}</p>}
            </div>

            <div className="mb-5">
              <label className="block text-[11.5px] font-extrabold text-white/60 mb-2 uppercase tracking-[0.08em]">
                Password
              </label>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter your password"
                  className="w-full px-4 py-3.5 bg-[#221D30] border border-[#3A3350] hover:border-white/20 focus:border-violet-400 focus:outline-none rounded-[10px] text-white placeholder-[#6F6A85] text-[14.5px] transition pr-12"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((prev) => !prev)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-white/40 hover:text-white transition cursor-pointer"
                >
                  {showPassword ? <Eye size={18} /> : <EyeOff size={18} />}
                </button>
              </div>
              {fieldErrors.password && <p className="text-xs text-red-400 mt-1">{fieldErrors.password}</p>}
            </div>

            <div className="flex items-center justify-between text-[13px] text-white/60 mb-7">
              <label className="flex items-center gap-2 cursor-pointer hover:text-white transition">
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  className="rounded bg-[#221D30] border-white/20 text-violet-500 focus:ring-0 cursor-pointer"
                />
                Remember me
              </label>
              <button
                type="button"
                onClick={() => navigate("/forgot-password")}
                className="hover:text-white transition cursor-pointer"
              >
                Forgot password?
              </button>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3.5 bg-[#A020F0] hover:brightness-110 active:brightness-95 text-white font-heading font-semibold rounded-[10px] transition-all duration-200 flex items-center justify-center shadow-[0_10px_30px_rgba(160,32,240,.35)] cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed text-[16px] tracking-wide"
            >
              {loading ? <Loader /> : "Login"}
            </button>
          </form>
        </div>

        <div className="text-center text-[12.5px] text-white/40 mt-8">
          &copy; {new Date().getFullYear()} VIDYAM. A product of{" "}
          <a
            href="https://polynexus.in"
            target="_blank"
            rel="noopener noreferrer"
            className="text-violet-300 hover:text-violet-200 underline underline-offset-2 transition font-medium"
          >
            polynexus.in
          </a>
          . All rights reserved.
        </div>
      </div>
    </div>
  );
};

export default Login;
