import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: ["selector", ".rabbit-dark"],
  content: [
    "./app/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
    "./lib/**/*.{ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // Light theme: `ink` = backgrounds (white → light grays),
        // `haze` = text/foreground (mid grays → near-black).
        ink: {
          950: "#ffffff",
          900: "#ffffff",
          850: "#f7f7f8",
          800: "#f1f1f3",
          700: "#e9e9ec",
          600: "#dededf",
          500: "#cfcfd2",
        },
        haze: {
          400: "#8c8c93",
          300: "#5c5c63",
          200: "#3a3a40",
          100: "#1b1b1f",
        },
        rabbit: {
          DEFAULT: "#f0641e",
          soft: "#ff8a4c",
          dim: "#7a3414",
        },
        iris: "#7c6cff",
        moss: "#3fd29a",
        sky: "#54b8ff",
      },
      fontFamily: {
        sans: ["var(--font-sans)", "ui-sans-serif", "system-ui", "sans-serif"],
        mono: ["var(--font-mono)", "ui-monospace", "SFMono-Regular", "monospace"],
      },
      boxShadow: {
        card: "0 1px 2px rgba(17,17,20,0.04), 0 12px 32px -18px rgba(17,17,20,0.18)",
        glow: "0 0 0 1px rgba(240,100,30,0.2), 0 14px 40px -18px rgba(240,100,30,0.3)",
      },
      keyframes: {
        "fade-up": {
          "0%": { opacity: "0", transform: "translateY(8px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        shimmer: {
          "100%": { transform: "translateX(100%)" },
        },
      },
      animation: {
        "fade-up": "fade-up 0.5s cubic-bezier(0.16,1,0.3,1) both",
      },
    },
  },
  plugins: [],
};

export default config;
