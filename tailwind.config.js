@tailwind base;
@tailwind components;
@tailwind utilities;

:root {
  --retro-accent: #C43114;
  --retro-bg: #F9F8EE;
  --retro-border: #000000;
  --retro-text: #111111;
}

body {
  background-color: var(--retro-bg);
  color: var(--retro-text);
  font-family: 'Inter', sans-serif;
  line-height: 1.6;
}

.font-display {
  font-family: 'Bebas Neue', sans-serif;
  letter-spacing: 0.05em;
}

button {
  cursor: pointer;
  transition: all 0.2s ease-in-out;
}

img {
  display: block;
  max-width: 100%;
  height: auto;
}
