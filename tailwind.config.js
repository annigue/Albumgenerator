/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx}",
    "./components/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        retro: {
          bg: "#F9F8EE", // cremiges Weiß
          text: "#111111", // tiefes Schwarz
          accent: "#C43114", // warmes Rot
          border: "#000000", // kräftiger schwarzer Rahmen
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
