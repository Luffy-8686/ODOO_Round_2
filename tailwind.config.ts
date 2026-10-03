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
      fontFamily: {
        serif: ["'Playfair Display'", "Georgia", "Cambria", "'Times New Roman'", "serif"],
        sans: ["'Montserrat'", "'Poppins'", "system-ui", "-apple-system", "sans-serif"],
      },
      colors: {
        background: "var(--background)",
        foreground: "var(--foreground)",
        primary: {
          DEFAULT: "var(--primary)",
          foreground: "var(--primary-foreground)",
          50: "#fdf4f4",
          100: "#fce8e8",
          500: "#921111",
          600: "#800c0c",
          700: "#6e0909",
        },
        nyac: {
          crimson: "#921111",
          crimsonDark: "#720C0C",
          crimsonLight: "#A81E24",
          crimson50: "#FDF6F6",
          gold: "#C5A059",
          goldLight: "#DFCA9B",
          goldDark: "#9E8040",
          gold50: "#FCF9F2",
          gold100: "#F7F1E1",
          navy: "#0B1320",
          navyLight: "#162032",
          navyDark: "#060A10",
          cream: "#FAF8F5",
          creamLight: "#FDFBF7",
          creamMuted: "#F4EFEA",
          stone: "#E5DFD5",
          stoneDark: "#263244",
        },
        club: {
          gold: "#C5A059",
          goldLight: "#FCF9F2",
          silver: "#64748B",
          silverLight: "#F1F5F9",
          junior: "#1E3A8A",
          juniorLight: "#EFF6FF",
          court: "#15803D",
          courtLight: "#F0FDF4",
          bar: "#921111",
          barLight: "#FDF6F6",
          shop: "#7C2D12",
          shopLight: "#FEF2F2",
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
