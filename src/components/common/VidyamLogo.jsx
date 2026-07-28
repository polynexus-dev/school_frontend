import React from "react";

export const VidyamLogoMark = ({ size = 44, className = "" }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 120 120"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className={`shrink-0 ${className}`}
  >
    <defs>
      <linearGradient id="vGradLeft" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#1E40AF" />
        <stop offset="50%" stopColor="#4338CA" />
        <stop offset="100%" stopColor="#06B6D4" />
      </linearGradient>
      <linearGradient id="vGradRight" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#10B981" />
        <stop offset="50%" stopColor="#06B6D4" />
        <stop offset="100%" stopColor="#4338CA" />
      </linearGradient>
      <linearGradient id="goldGlow" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#F59E0B" />
        <stop offset="100%" stopColor="#FBBF24" />
      </linearGradient>
    </defs>

    <rect width="120" height="120" rx="28" fill="#0B071A" />

    <g transform="translate(10, 10)">
      {/* Left Wing */}
      <path
        d="M 20 15 C 38 15, 62 45, 50 85 C 48 88, 44 85, 42 78 C 35 55, 20 32, 10 22 C 8 18, 12 15, 20 15 Z"
        fill="url(#vGradLeft)"
      />
      {/* Right Wing */}
      <path
        d="M 80 15 C 62 15, 38 45, 50 85 C 52 88, 56 85, 58 78 C 65 55, 80 32, 90 22 C 92 18, 88 15, 80 15 Z"
        fill="url(#vGradRight)"
      />
      {/* Neural Core Node */}
      <circle cx="50" cy="38" r="7" fill="url(#goldGlow)" />
      <circle
        cx="50"
        cy="38"
        r="11"
        stroke="url(#goldGlow)"
        strokeWidth="1.5"
        strokeDasharray="2 2"
        opacity="0.8"
      />
      {/* Shield Outer Arc */}
      <path
        d="M 24 20 C 35 12, 65 12, 76 20 C 85 45, 75 75, 50 94 C 25 75, 15 45, 24 20 Z"
        fill="none"
        stroke="url(#vGradLeft)"
        strokeWidth="2.5"
        opacity="0.35"
      />
    </g>
  </svg>
);

export default VidyamLogoMark;
