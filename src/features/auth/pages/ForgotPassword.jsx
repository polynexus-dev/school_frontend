import React, { useState } from "react";
import { Link } from "react-router-dom";
import Logo from "../../../assets/campusnexus_logo.svg";
import authService from "../services/authService";
import Loader from "../../../components/Loader";
import { X } from "lucide-react";

// Pixel-matches Login.jsx's split-screen shell so the pre-login flow reads
// as one continuous experience.
const ForgotPassword = () => {
  const [identifier, setIdentifier] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    if (!identifier.trim()) {
      setError("Enter your username or email.");
      return;
    }
    setLoading(true);
    try {
      await authService.requestPasswordReset(identifier.trim());
    } catch (err) {
      // Backend always returns a generic success message regardless of
      // whether the account exists, so a thrown error here means something
      // actually went wrong (network/5xx), not "account not found".
      setError(err?.response?.data?.error || "Something went wrong. Please try again.");
      setLoading(false);
      return;
    }
    setLoading(false);
    setSubmitted(true);
  };

  return (
    <div className="h-screen w-screen flex flex-row overflow-hidden bg-[#1B1723] font-sans">
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
            <div className="mt-3 font-heading font-bold text-base text-white">
              VIDYAM
            </div>
          </div>
        </div>
        <div className="relative flex-1" />
        <div className="relative p-10 pb-12">
          <h3 className="font-heading font-bold text-[40px] leading-[1.25] text-white">
            Connecting Campus,<br />Empowering Minds.
          </h3>
        </div>
      </div>

      <div className="w-full md:w-1/2 flex flex-col justify-between p-8 sm:p-16 md:p-20 bg-[#1B1723] overflow-y-auto h-full">
        <div className="flex-grow flex flex-col justify-center max-w-[420px] w-full mx-auto">
          <div className="flex flex-col items-center mb-2">
            <img src={Logo} alt="VIDYAM" className="h-[74px] w-auto" />
          </div>

          <div className="text-center mt-8">
            <h2 className="font-heading font-semibold text-[34px] text-white">Forgot password</h2>
            <p className="text-[14.5px] text-white/50 mt-2.5">
              Enter your username or email and we'll send you a reset link.
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

          {submitted ? (
            <div className="mt-8 text-sm text-white/70 border border-white/10 bg-white/5 p-4 rounded-xl">
              If an account exists for that username/email, a reset link has been sent. Check your inbox.
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="mt-8">
              <div className="mb-5">
                <label className="block text-[11.5px] font-extrabold text-white/60 mb-2 uppercase tracking-[0.08em]">
                  Username or Email
                </label>
                <input
                  type="text"
                  value={identifier}
                  onChange={(e) => setIdentifier(e.target.value)}
                  placeholder="Enter your username or email"
                  className="w-full px-4 py-3.5 bg-[#221D30] border border-[#3A3350] hover:border-white/20 focus:border-violet-400 focus:outline-none rounded-[10px] text-white placeholder-[#6F6A85] text-[14.5px] transition"
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-3.5 bg-[#A020F0] hover:brightness-110 active:brightness-95 text-white font-heading font-semibold rounded-[10px] transition-all duration-200 flex items-center justify-center shadow-[0_10px_30px_rgba(160,32,240,.35)] cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed text-[16px] tracking-wide"
              >
                {loading ? <Loader /> : "Send reset link"}
              </button>
            </form>
          )}

          <div className="text-center text-[13px] text-white/60 mt-7">
            <Link to="/login" className="hover:text-white transition">
              Back to login
            </Link>
          </div>
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

export default ForgotPassword;
