/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // ✅ Primary Brand (now supports opacity like bg-primary/10)
        primary: {
          DEFAULT: "#2563EB",
          light: "#3B82F6",
          dark: "#1D4ED8",
        },

        // ✅ Status Colors
        success: "#10B981",
        warning: "#F59E0B",
        error: "#EF4444",
        info: "#3B82F6",

        // ✅ Neutral Colors
        white: "#FFFFFF",
        "gray-light": "#F3F4F6",
        "gray-text": "#718096",
        gray: "#9CA3AF",
        "gray-dark": "#374151",
        "gray-bg": "#f9fafb",

        // ✅ Chart Colors
        "chart-blue": "#2563EB",
        "chart-green": "#10B981",
        "chart-yellow": "#F59E0B",
        "chart-red": "#EF4444",
        "chart-purple": "#8B5CF6",
      },

      // ✅ Shadows
      boxShadow: {
        soft: "0 1px 3px rgba(0, 0, 0, 0.08)",
        card: "0 4px 8px rgba(0, 0, 0, 0.10)",
      },

      // ✅ Border Radius
      borderRadius: {
        xl: "1rem",
        "2xl": "1.25rem",
      },
    },
  },
  plugins: [],
};
