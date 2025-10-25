/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        retro: {
          bg: "#F9F8EE", // warmes Cremeweiß
          text: "#111111", // tiefes Schwarz
          accent: "#C43114", // dein Rotton
          border: "#000000", // klarer schwarzer Rahmen
        },
      },
      fontFamily: {
        sans: ["Inter", "sans-serif"], // Lesefreundlich
        display: ["Bebas Neue", "sans-serif"], // Headline-Schrift
      },
    },
  },
  plugins: [],
};
