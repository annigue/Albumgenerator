"use client";

import { useEffect, useMemo, useState } from "react";

export default function GiphyGif({ verdict, seed }) {
  const [gifUrl, setGifUrl] = useState(null);

  const key = useMemo(() => `${verdict || ""}|${seed || ""}`, [verdict, seed]);

  useEffect(() => {
    if (!verdict) return;

    let cancelled = false;
    setGifUrl(null);

    (async () => {
      const qs = new URLSearchParams({
        verdict,
        seed: seed ?? "default",
      });
      const res = await fetch(`/api/giphy?${qs.toString()}`);
      const data = await res.json().catch(() => ({}));
      if (!res.ok) return;
      if (!cancelled) setGifUrl(data.gifUrl || null);
    })();

    return () => {
      cancelled = true;
    };
  }, [key, verdict, seed]);

  if (!gifUrl) return null;

  return (
    <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-20">
      <img
        src={gifUrl}
        alt={`GIF: ${verdict}`}
        className="w-64 h-48 object-cover border-2 border-retro-border bg-white"
        loading="lazy"
      />
    </div>
  );
}
