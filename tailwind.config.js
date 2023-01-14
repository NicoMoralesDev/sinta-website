// tailwind.config.js
const { fontFamily } = require("tailwindcss/defaultTheme");

/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./app/**/*.{js,ts,jsx,tsx}"],
  screens: {
    sm: "320px",
    md: "769px",
    lg: "1024px",
  },
  theme: {
    extend: {
      fontFamily: {
        sans: ["var(--font-roboto_flex)", ...fontFamily.sans],
      },
    },
  },
  plugins: [],
};
