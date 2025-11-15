import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  darkMode: "class",
  theme: {
    extend: {
      colors: {
        accent: {
          DEFAULT: "#32DE84", // Main green accent
          muted: "#6fffc2", // lighter green
        },
        monster: {
          DEFAULT: "#32DE84",
          dark: "#229e5c",
        },
        background: {
          DEFAULT: "#0a0a0a",
          dark: "#171717",
        },
        foreground: {
          DEFAULT: "#ededed",
          dark: "#b3ffb3",
        },
        card: {
          DEFAULT: "#1a1a1a",
          highlight: "#32DE84",
        },
      },
      borderRadius: {
        sm: "6px",
        md: "12px",
        lg: "20px",
      },
    },
  },
  plugins: [],
};

export default config;
