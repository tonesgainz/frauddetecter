import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./src/**/*.{js,ts,jsx,tsx,mdx}"],
  theme: {
    extend: {
      colors: {
        // Enterprise neutral palette
        surface: {
          DEFAULT: "#F9FAFB",
          elevated: "#FFFFFF",
          muted: "#F3F4F6",
        },
        // Primary: Slate Blue / Navy for actions
        primary: {
          DEFAULT: "#334155",
          hover: "#1e293b",
          muted: "rgba(51, 65, 85, 0.08)",
        },
        // Status: muted pastels
        success: {
          DEFAULT: "#059669",
          muted: "#d1fae5",
        },
        danger: {
          DEFAULT: "#dc2626",
          muted: "#fecaca",
        },
        warning: {
          DEFAULT: "#ea580c",
          muted: "#ffedd5",
        },
        border: {
          DEFAULT: "#e5e7eb",
          subtle: "#f3f4f6",
        },
      },
      fontFamily: {
        sans: ["Inter", "system-ui", "-apple-system", "sans-serif"],
      },
      fontSize: {
        "2xs": ["0.6875rem", { lineHeight: "1rem" }],
      },
      boxShadow: {
        card: "0 1px 3px 0 rgb(0 0 0 / 0.06), 0 1px 2px -1px rgb(0 0 0 / 0.06)",
        "card-hover": "0 4px 6px -1px rgb(0 0 0 / 0.05), 0 2px 4px -2px rgb(0 0 0 / 0.05)",
      },
      animation: {
        "fade-in": "fadeIn 0.2s ease-out",
        "slide-up": "slideUp 0.2s ease-out",
      },
      keyframes: {
        fadeIn: {
          "0%": { opacity: "0" },
          "100%": { opacity: "1" },
        },
        slideUp: {
          "0%": { opacity: "0", transform: "translateY(4px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
      },
    },
  },
  plugins: [],
};

export default config;
