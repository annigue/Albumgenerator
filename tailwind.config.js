/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
  extend: {
    colors: {
      brandPink: "#ff4040",
      brandOrange: "#ffa54f",
      brandlightgrey: "#d3d3d3",
      brandlgreen: "#66cdaa",
    },
  },
},
  plugins: [],
};
