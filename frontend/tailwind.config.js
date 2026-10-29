/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        ink: { DEFAULT: "#0f172a", soft: "#334155", faint: "#64748b" },
        navy: {
          50: "#f0f4f9",
          100: "#dbe5f1",
          200: "#b8cde3",
          700: "#0f345c",
          800: "#0b2545",
          900: "#0a2540",
          950: "#051322",
        },
        ssm: {
          red: "#dc2626",
          redDark: "#b91c1c",
          redSoft: "#fef2f2",
          navy: "#0a2540",
          navyDark: "#051322",
          navySoft: "#f0f4f9",
          gold: "#f59e0b",
          goldDark: "#d97706",
          goldSoft: "#fffbeb",
          orange: "#ea580c",
        },
        brand: {
          50: "#f0f4f9",
          100: "#dbe5f1",
          200: "#b8cde3",
          500: "#0f345c",
          600: "#0a2540",
          700: "#051322",
          800: "#030d17",
        },
        accent: {
          50: "#fffbeb",
          100: "#fef3c7",
          200: "#fde68a",
          400: "#fbbf24",
          500: "#f59e0b",
          600: "#ea580c",
          700: "#c2410c",
        },
      },
      fontFamily: { sans: ["Inter", "ui-sans-serif", "system-ui", "-apple-system", "Segoe UI", "Roboto", "sans-serif"] },
      boxShadow: { 
        card: "0 1px 3px rgba(15,23,42,.06), 0 1px 2px rgba(15,23,42,.04)",
        lift: "0 10px 25px -5px rgba(10, 37, 64, 0.08), 0 8px 10px -6px rgba(10, 37, 64, 0.04)"
      },
      keyframes: {
        fadeInUp: {
          "0%": { opacity: "0", transform: "translateY(8px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        pulseSlow: {
          "0%, 100%": { opacity: "1" },
          "50%": { opacity: "0.45" },
        },
      },
      animation: {
        fadeInUp: "fadeInUp 0.4s cubic-bezier(0.16, 1, 0.3, 1) forwards",
        pulseSlow: "pulseSlow 3s cubic-bezier(0.4, 0, 0.6, 1) infinite",
      },
    },
  },
  plugins: [],
};
