import { defineConfig } from "vite";

// Base is relative so the built dist/ can be opened from file:// or any
// static file server without configuration — no backend required.
export default defineConfig({
  base: "./",
  build: {
    target: "es2022",
    sourcemap: false,
  },
});
