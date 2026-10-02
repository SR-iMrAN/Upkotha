import daisyui from "daisyui";

/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        upkotha: {
          primary: "#047857",
          primaryDark: "#065F46",
          primaryLight: "#D1FAE5",
          dark: "#0F172A",
          charcoal: "#1E293B",
          surface: "#F8FAFC",
          border: "#E2E8F0",
          accent: "#D97706",
          danger: "#DC2626",
        },
      },
      fontFamily: {
        sans: ["Inter", "Noto Sans Bengali", "sans-serif"],
        bengali: ["Noto Sans Bengali", "sans-serif"],
      },
    },
  },
  plugins: [daisyui],
  daisyui: {
    themes: [
      {
        upkotha: {
          "primary": "#047857",
          "secondary": "#0D9488",
          "accent": "#D97706",
          "neutral": "#1E293B",
          "base-100": "#FFFFFF",
          "base-200": "#F8FAFC",
          "base-300": "#E2E8F0",
          "info": "#2563EB",
          "success": "#059669",
          "warning": "#D97706",
          "error": "#DC2626",
        },
      },
      "light",
    ],
    defaultTheme: "upkotha",
  },
};
