import React from "react";
import { Link } from "react-router-dom";

const PageNotFound = () => {
  return (
    <div className="flex flex-col justify-between min-h-screen bg-cn-bg p-6">
      <div className="flex-1 flex items-center justify-center">
        <div className="text-center">
          <h2 className="font-heading text-6xl font-bold text-violet-950 dark:text-white">404</h2>
          <p className="text-lg mt-4 text-ink-700 dark:text-slate-300">The page you are looking for does not exist.</p>
          <div className="mt-6">
            <Link to="/dashboard" className="text-violet-700 dark:text-violet-400 hover:underline font-semibold">
              Go back to Dashboard
            </Link>
          </div>
        </div>
      </div>
      <footer className="pt-6 border-t border-cn-border text-center text-xs text-slate-500 dark:text-slate-400">
        © {new Date().getFullYear()} VIDYAM. A product of{" "}
        <a
          href="https://polynexus.in"
          target="_blank"
          rel="noopener noreferrer"
          className="text-violet-600 dark:text-violet-400 hover:underline font-medium"
        >
          polynexus.in
        </a>
        . All rights reserved.
      </footer>
    </div>
  );
};

export default PageNotFound;
