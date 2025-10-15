/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        brandPink: {
          400: "#ff6230", // etwas kräftiger
          500: "#ff4500", // Originalfarbe
          600: "#e03c00", // leicht dunkler, satter
        },
        brandOrange: {
          400: "#ffc733", // kräftig, sonnig
          500: "#ffb90f", // Originalfarbe – Goldenrod
          600: "#e6a70d", // etwas dunkler, satter
        },
        brandlgreen: {
          400: "#4edd4e",
          500: "#32cd32",
          600: "#28a428",
        },
        brandlightgrey: {
          400: "#e0e0e0",
          500: "#d3d3d3",
          600: "#b0b0b0",
        },
      },
    },
  },
  plugins: [],
};
