import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: ["class"],
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        background: "#05070b",
        foreground: "#f6f8ff",
        border: "rgba(255,255,255,0.1)",
        muted: "rgba(255,255,255,0.58)",
        card: "#0a0f18",
        primary: "#7c5cff",
        cyan: "#26e6ff",
        success: "#42f5b9"
      },
      boxShadow: {
        glow: "0 0 80px rgba(124, 92, 255, 0.24)"
      },
      fontFamily: {
        sans: ["Inter", "ui-sans-serif", "system-ui", "sans-serif"]
      }
    }
  },
  plugins: [require("tailwindcss-animate")]
};

export default config;
