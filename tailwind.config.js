/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        brandPink: {
          400: "#ff7070",
          500: "#ff4040",
          600: "#cc3333",
        },
        brandOrange: {
          400: "#ffc27a",
          500: "#ffa54f",
          600: "#e68e38",
        },
        brandlgreen: {
          400: "#80e0b0",
          500: "#66cdaa",
          600: "#4ba885",
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
