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
          bg: "#F9F8EE", // warmes Cremeweiß
          text: "#111111", // tiefes Schwarz
          accent: "#C43114", // Rotton für Überschriften & Buttons
          border: "#000000", // klarer schwarzer Rahmen
        },
      },
      fontFamily: {
        sans: ["Inter", "sans-serif"], // Lesefreundliche Standardschrift
        display: ["Bebas Neue", "sans-serif"], // Für Überschriften
      },
      boxShadow: {
        retro: "6px 6px 0 #000000",
      },
      borderRadius: {
        "2xl": "1rem",
      },
    },
  },
  plugins: [],
};
