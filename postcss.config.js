// Empty on purpose: this project styles via the @tailwindcss/vite plugin
// (see vite.config.js), not a classic PostCSS pipeline. Without this file,
// Vite's PostCSS config resolution walks up the filesystem looking for one
// and can pick up an unrelated postcss.config.js from a parent directory —
// stopping the search here avoids that.
export default {};
