"use client";
import { useMemo, useState } from "react";

const FALLBACK = "https://media.giphy.com/media/3o7aD2saalBwwftBIY/giphy.gif";

const GIFS = {
  Hit: "https://media.giphy.com/media/26ufnwz3wDUli7GU0/giphy.gif",
  "Geht in Ordnung": "https://media.giphy.com/media/l0HlBO7eyXzSZkJri/giphy.gif",
  Niete: "https://media.giphy.com/media/3o6ZtaO9BZHcOjmErm/giphy.gif",
};

export default function GiphyGif({ verdict }) {
  const [broken, setBroken] = useState(false);

  const src = useMemo(() => GIFS[verdict] || FALLBACK, [verdict]);

  return (
    <div className="flex justify-center mt-4">
      <img
        src={broken ? FALLBACK : src}
        alt={`GIF: ${verdict ?? "neutral"}`}
        className="w-64 h-48 object-cover border-2 border-retro-border"
        loading="lazy"
        onError={() => setBroken(true)}
      />
    </div>
  );
}
