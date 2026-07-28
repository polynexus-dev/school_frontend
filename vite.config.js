import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: {
    host: true,
    allowedHosts: [".vidyam.co.in", "vidyam.co.in", ".campusnexus.in", "localhost"],
    proxy: {
      "/api": {
        target: "http://127.0.0.1:8000",
        changeOrigin: true,
      },
    },
  },
  preview: {
    host: true,
    allowedHosts: [".vidyam.co.in", "vidyam.co.in", ".campusnexus.in", "localhost"],
  },
});
