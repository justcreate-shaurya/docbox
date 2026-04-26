import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        "dark-bg": "#0D0D0D",
        "dark-secondary": "#111111",
        "dark-text": "#FFFFFF",
        "dark-text-secondary": "#A0A0A0",
        "accent-bronze": "#B68D74",
      },
      spacing: {
        "px-2": "2px",
      },
    },
  },
  plugins: [],
};
export default config;
