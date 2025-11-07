/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        retro: {
          bg: "#F9F8EE",      // warmes Cremeweiß
          text: "#111111",    // tiefes Schwarz
          accent: "#C43114",  // dein Retro-Rotton
          border: "#000000",  // klarer schwarzer Rahmen
        },
      },
      fontFamily: {
        sans: ["Inter", "sans-serif"],          // Lesefreundlich für Fließtext
        display: ["Bebas Neue", "sans-serif"],  // Headline-Schrift im Retro-Stil
      },
      boxShadow: {
        retro: "4px 4px 0px 0px rgba(0,0,0,1)", // harter Retro-Schatten
      },
      borderRadius: {
        retro: "1rem", // leichte Rundung für den „Polaroid“-Look
      },
    },
  },
  plugins: [],
};
