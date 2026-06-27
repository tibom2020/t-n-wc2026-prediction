import type { Config } from "tailwindcss";
const config: Config = {
  content: ["./src/**/*.{js,ts,jsx,tsx,mdx}"],
  theme: {
    extend: {
      colors: {
        wc: { green: "#1a5f2a", dark: "#0d3d18", gold: "#f5c518", light: "#e8f5e9" },
        home: { DEFAULT: "#1d4ed8", light: "#dbeafe", dark: "#1e3a8a" },
        away: { DEFAULT: "#ea580c", light: "#ffedd5", dark: "#c2410c" },
        draw: { DEFAULT: "#6b7280", light: "#f3f4f6", dark: "#374151" },
      },
    },
  },
  plugins: [],
};
export default config;
