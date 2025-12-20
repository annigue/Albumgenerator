"use client";

import { useEffect, useMemo, useState } from "react";

export default function GiphyGif({ verdict, seed }) {
  const [gifUrl, setGifUrl] = useState(null);
  const [err, setErr] = useState(null);

  const key = useMemo(() => `${verdict || ""}|${seed || ""}`, [verdict, seed]);

  useEffect(() => {
    if (!verdict) return;

    let cancelled = false;
    setGifUrl(null);
    setErr(null);

    (async () => {
      try {
        const qs = new URLSearchParams({
          verdict,
          seed: seed ?? "default",
        });

        const res = await fetch(`/api/giphy?${qs.toString()}`);
        const data = await res.json().catch(() => ({}));

        if (!res.ok) throw new Error(data?.error || "Failed to load gif");

        if (!cancelled) setGifUrl(data.gifUrl || null);
      } catch (e) {
        if (!cancelled) setErr(e.message);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [key, verdict, seed]);

  if (!verdict) return null;

  // Optional: falls nix gefunden wird, einfach gar nichts anzeigen (statt Fehlertext)
  if (err || !gifUrl) return null;

  return (
    <div className="flex justify-center mt-4">
      <img
        src={gifUrl}
        alt={`GIF: ${verdict}`}
        className="w-64 h-48 object-cover border-2 border-retro-border"
        loading="lazy"
      />
    </div>
  );
}
