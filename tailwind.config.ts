import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: ["class"],
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        background: "var(--background)",
        foreground: "var(--foreground)",
        primary: {
          DEFAULT: "var(--primary)",
          foreground: "var(--primary-foreground)",
          50: "#f0fdf4",
          100: "#dcfce7",
          500: "#22c55e",
          600: "#16a34a",
          700: "#15803d",
        },
        club: {
          gold: "#D97706",
          goldLight: "#FEF3C7",
          silver: "#64748B",
          silverLight: "#F1F5F9",
          junior: "#2563EB",
          juniorLight: "#DBEAFE",
          court: "#059669",
          courtLight: "#D1FAE5",
          bar: "#EA580C",
          barLight: "#FFEDD5",
          shop: "#7C3AED",
          shopLight: "#EDE9FE",
        },
        card: {
          DEFAULT: "var(--card)",
          foreground: "var(--card-foreground)",
        },
        border: "var(--border)",
      },
    },
  },
  plugins: [],
};
export default config;
