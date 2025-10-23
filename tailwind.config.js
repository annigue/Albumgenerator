/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        retro: {
          bg: "#F9F8EE",
          text: "#111111",
          accent: "#C43114",
          border: "#000000",
        },
      },
      fontFamily: {
        sans: ["Inter", "sans-serif"],
        display: ["Bebas Neue", "sans-serif"],
      },
    },
  },
  plugins: [],
};
