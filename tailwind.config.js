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
          bg: "#f9f5ec",     // leichtes warmes Beige
          text: "#1c1c1c",   // dunkles Anthrazit
          accent: "#d72638", // warmes Rot
          border: "#2e2e2e", // dunkler Rahmen
        },
      },
      fontFamily: {
        sans: ["Space Grotesk", "sans-serif"],
        display: ["Bebas Neue", "sans-serif"],
      },
      letterSpacing: {
        wide: "0.08em",
      },
      borderRadius: {
        xl: "0.75rem",
      },
    },
  },
  plugins: [],
};
