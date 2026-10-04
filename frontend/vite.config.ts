/// <reference types="vitest" />
import react from "@vitejs/plugin-react";
import path from "node:path";
import { defineConfig } from "vite";

// In development the API is proxied so the browser sees ONE origin: cookies and CSRF just work.
export default defineConfig({
  plugins: [react()],
  resolve: { alias: { "@": path.resolve(__dirname, "src") } },
  server: { port: 5173, proxy: { "/api": { target: process.env.VITE_DEV_API_TARGET ?? "http://localhost:8000", changeOrigin: false } } },
  test: { environment: "jsdom", globals: true, setupFiles: ["./src/test/setup.ts"], css: false },
});
