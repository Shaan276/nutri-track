import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        background: {
          amoled: "#000000",
          midnight: "#090d16",
          card: "#0f172a",
          surface: "#111827",
          elevated: "#1e293b",
        },
        foreground: {
          DEFAULT: "#ffffff",
          primary: "#ffffff",
          secondary: "#e2e8f0", // Slate 200 - High contrast secondary
          muted: "#94a3b8",     // Slate 400 - High contrast readable muted text
          subtle: "#cbd5e1",    // Slate 300
        },
        brand: {
          50: "#ecfdf5",
          100: "#d1fae5",
          200: "#a7f3d0",
          300: "#6ee7b7",
          400: "#34d399",
          500: "#10b981", // Emerald 500
          600: "#059669",
          700: "#047857",
          teal: "#14b8a6",
          dark: "#064e3b",
        },
        system: {
          success: "#22c55e",
          warning: "#eab308",
          error: "#ef4444",
          info: "#3b82f6",
        },
        border: {
          subtle: "rgba(255, 255, 255, 0.10)",
          default: "rgba(255, 255, 255, 0.16)",
          highlight: "rgba(16, 185, 129, 0.4)",
        },
      },
      fontFamily: {
        sans: ["var(--font-sans)", "system-ui", "-apple-system", "sans-serif"],
        mono: ["var(--font-mono)", "monospace"],
      },
      boxShadow: {
        "brand-glow": "0 0 25px -5px rgba(16, 185, 129, 0.25)",
        "brand-glow-lg": "0 0 50px -10px rgba(16, 185, 129, 0.35)",
        "surface-card": "0 4px 20px -2px rgba(0, 0, 0, 0.5)",
      },
    },
  },
  plugins: [],
};

export default config;
