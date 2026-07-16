import React from "react";
import { Link } from "react-router-dom";

const PageNotFound = () => {
  return (
    <div className="flex items-center justify-center min-h-screen bg-cn-bg">
      <div className="text-center">
        <h2 className="font-heading text-6xl font-bold text-violet-950">404</h2>
        <p className="text-lg mt-4 text-ink-700">The page you are looking for does not exist.</p>
        <div className="mt-6">
          <Link to="/dashboard" className="text-violet-700 hover:underline font-semibold">
            Go back to Dashboard
          </Link>
        </div>
      </div>
    </div>
  );
};

export default PageNotFound;
