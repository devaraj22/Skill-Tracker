/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        ink: { DEFAULT: "#1E293B", soft: "#334155", faint: "#64748B" },
        // Poster Royal Navy palette
        navy: {
          50: "#F0F4FA",
          100: "#D0DCEF",
          200: "#99B2D8",
          700: "#0D357A",
          800: "#08214D",
          900: "#0B2A63",
          950: "#061838",
        },
        // Official Poster Brand Tokens
        ssm: {
          red: "#D32F2F",
          redDark: "#B71C1C",
          redSoft: "#FEF2F2",
          crimson: "#991B1B",
          navy: "#0B2A63",
          navyDark: "#061838",
          navySoft: "#F0F4FA",
          gold: "#F59E0B",
          goldDark: "#D97706",
          goldSoft: "#FFFBEB",
          amber: "#FBBF24",
          cream: "#FCFBF7",
          pill: "#0B2A63",
        },
        brand: {
          50: "#F0F4FA",
          100: "#D0DCEF",
          200: "#99B2D8",
          500: "#0D357A",
          600: "#0B2A63",
          700: "#061838",
          800: "#041026",
        },
        accent: {
          50: "#FFFBEB",
          100: "#FEF3C7",
          200: "#FDE68A",
          400: "#FBBF24",
          500: "#F59E0B",
          600: "#D97706",
          700: "#B45309",
        },
      },
      fontFamily: {
        sans: ["Inter", "ui-sans-serif", "system-ui", "-apple-system", "Segoe UI", "Roboto", "sans-serif"],
        serif: ["Georgia", "Cambria", "'Times New Roman'", "Times", "serif"],
      },
      boxShadow: {
        card: "0 1px 3px rgba(11,42,99,.06), 0 1px 2px rgba(11,42,99,.04)",
        lift: "0 10px 25px -5px rgba(11, 42, 99, 0.08), 0 8px 10px -6px rgba(11, 42, 99, 0.04)",
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
