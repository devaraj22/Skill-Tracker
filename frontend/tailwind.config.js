/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: { ink: { DEFAULT: "#0f172a", soft: "#475569", faint: "#64748b" }, brand: { 50: "#eef2ff", 100: "#e0e7ff", 600: "#4f46e5", 700: "#4338ca" } },
      fontFamily: { sans: ["Inter", "ui-sans-serif", "system-ui", "-apple-system", "Segoe UI", "Roboto", "sans-serif"] },
      boxShadow: { card: "0 1px 2px rgba(15,23,42,.05)" },
    },
  },
  plugins: [],
};
