"use client";

import { useMemo } from "react";

// deterministischer Zufall (damit die Wolke pro Album stabil aussieht)
function mulberry32(seed) {
  let a = seed >>> 0;
  return function () {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function normalize(v) {
  return String(v ?? "")
    .trim()
    .replace(/\s+/g, " ");
}

export default function WordCloud({
  favorites = [],
  worst = [],
  seed = 1,
  maxWords = 18,
}) {
  const safeSeed = useMemo(() => {
    const n = Number(seed);
    return Number.isFinite(n) && n > 0 ? n : 1;
  }, [seed]);

  const rnd = useMemo(() => mulberry32(safeSeed), [safeSeed]);

  const words = useMemo(() => {
    const favArr = Array.isArray(favorites) ? favorites : [];
    const badArr = Array.isArray(worst) ? worst : [];

    const fav = favArr.map(normalize).filter(Boolean);
    const bad = badArr.map(normalize).filter(Boolean);

    if (!fav.length && !bad.length) return [];

    const freq = new Map();

    for (const s of fav) freq.set(s, (freq.get(s) ?? 0) + 1);
    for (const s of bad) freq.set(s, (freq.get(s) ?? 0) + 1.2); // worst leicht stärker

    const badSet = new Set(bad);

    const arr = Array.from(freq.entries()).map(([text, count]) => ({
      text,
      count,
      type: badSet.has(text) ? "worst" : "fav",
    }));

    arr.sort((a, b) => b.count - a.count);
    return arr.slice(0, maxWords);
  }, [favorites, worst, maxWords]);

  const maxCount = useMemo(() => {
    if (!words.length) return 1;
    return Math.max(...words.map((w) => w.count));
  }, [words]);

  if (!words.length) return null;

  return (
    <div className="border-2 border-retro-border bg-[#fff8eb] p-4">
      <p className="meta text-center mb-3">AUS DEN BEWERTUNGEN</p>

      <div className="flex flex-wrap justify-center gap-x-3 gap-y-2">
        {words.map((w) => {
          const t = Math.min(1, w.count / maxCount);
          const size = 12 + t * 22; // 12..34px
          const rot = rnd() < 0.22 ? (rnd() < 0.5 ? -6 : 6) : 0;

          const cls =
            w.type === "worst"
              ? "text-retro-text opacity-85"
              : "text-retro-accent";

          return (
            <span
              key={w.text}
              className={`${cls} font-display`}
              style={{
                fontSize: `${size}px`,
                transform: `rotate(${rot}deg)`,
                display: "inline-block",
                letterSpacing: "0.04em",
              }}
            >
              {w.text}
            </span>
          );
        })}
      </div>

      <div className="mt-3 flex justify-center gap-4 text-xs opacity-70">
        <span className="font-display tracking-wide text-retro-accent">
          ● Lieblingslied
        </span>
        <span className="font-display tracking-wide text-retro-text">
          ● Schlechtestes Lied
        </span>
      </div>
    </div>
  );
}
