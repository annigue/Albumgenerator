"use client";

import { useEffect, useState } from "react";
import { supabase } from "../lib/supabaseClient";

function Stamp({ rating }) {
  const label =
    rating === "Hit"
      ? "HIT"
      : rating === "Geht in Ordnung"
      ? "GEHT IN ORDNUNG"
      : rating === "Niete"
      ? "NIETE"
      : "KEINE STIMMEN";

  const styleByRating =
    rating === "Hit"
      ? { color: "#0f766e" }
      : rating === "Geht in Ordnung"
      ? { color: "#b45309" }
      : rating === "Niete"
      ? { color: "#b91c1c" }
      : { color: "#374151" };

  return (
    <div style={{ display: "inline-flex", justifyContent: "center" }}>
      <div
        style={{
          ...styleByRating,
          position: "relative",
          display: "inline-block",
          padding: label.length > 14 ? "10px 14px" : "10px 16px",
          border: "2px solid currentColor",
          borderRadius: 14,
          transform: "rotate(-8deg)",
          fontWeight: 900,
          letterSpacing: 0.6,
          textTransform: "uppercase",
          lineHeight: 1,
          userSelect: "none",
          opacity: 0.92,
          boxShadow:
            "0 2px 0 rgba(0,0,0,0.15), 0 10px 20px rgba(0,0,0,0.10)",
          background:
            "linear-gradient(180deg, rgba(255,255,255,0.06), rgba(0,0,0,0.06))",
          filter: "contrast(1.05) saturate(1.1)",
        }}
        aria-label={`Bewertung: ${label}`}
        title={`Bewertung: ${label}`}
      >
        <span
          style={{
            position: "absolute",
            inset: 0,
            transform: "translate(1px, 1px)",
            color: "currentColor",
            opacity: 0.18,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            pointerEvents: "none",
          }}
        >
          {label}
        </span>

        <span style={{ position: "relative", zIndex: 1 }}>{label}</span>

        <span
          style={{
            position: "absolute",
            inset: -2,
            borderRadius: 14,
            pointerEvents: "none",
            background:
              "radial-gradient(circle at 20% 30%, rgba(255,255,255,0.08), transparent 40%), radial-gradient(circle at 80% 70%, rgba(0,0,0,0.10), transparent 45%)",
            mixBlendMode: "multiply",
            opacity: 0.55,
          }}
        />
      </div>
    </div>
  );
}

export default function AlbumOfWeekCard() {
  const [row, setRow] = useState(null);
  const [loading, setLoading] = useState(true);
  const [errMsg, setErrMsg] = useState("");

  useEffect(() => {
    console.log("NEXT_PUBLIC_SUPABASE_URL:", process.env.NEXT_PUBLIC_SUPABASE_URL);

    async function load() {
      setLoading(true);
      setErrMsg("");

      const { data, error } = await supabase
        .from("album_of_week_with_score")
        .select("*")
        .order("week_start_date", { ascending: false })
        .limit(1)
        .maybeSingle();

      if (error) {
        console.error("AlbumOfWeekCard error:", error);
        setErrMsg(error.message ?? "Unbekannter Fehler");
        setRow(null);
        setLoading(false);
        return;
      }

      setRow(data ?? null);
      onLoaded?.(data ?? null);
    }

    load();
  }, []);

  if (loading) return <div>Lade Album der Woche …</div>;

  if (errMsg) {
    return (
      <div style={{ padding: 16, border: "1px solid #ccc", borderRadius: 12 }}>
        <p style={{ fontWeight: 700 }}>Fehler beim Laden</p>
        <p style={{ opacity: 0.8 }}>{errMsg}</p>
      </div>
    );
  }

  if (!row) return <div>Noch kein Album der Woche</div>;

  return (
    <div style={{ padding: 16, border: "1px solid #ccc", borderRadius: 12 }}>
      <div style={{ display: "flex", gap: 16, alignItems: "flex-start" }}>
        <div style={{ position: "relative" }}>
          {row.cover_url ? (
            <img
              src={row.cover_url}
              alt={`${row.title} Cover`}
              style={{ width: 140, height: 140, objectFit: "cover", borderRadius: 12 }}
            />
          ) : (
            <div
              style={{
                width: 140,
                height: 140,
                borderRadius: 12,
                border: "2px dashed #ccc",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                opacity: 0.7,
              }}
            >
              No cover
            </div>
          )}

          <div style={{ position: "absolute", left: -10, bottom: -14 }}>
            <Stamp rating={row.final_rating} />
          </div>
        </div>

        <div style={{ flex: 1 }}>
          <h2 style={{ margin: 0 }}>{row.title}</h2>
          <p style={{ marginTop: 6, opacity: 0.85 }}>{row.artist}</p>

          {row.spotify_url && (
            <a href={row.spotify_url} target="_blank" rel="noreferrer">
              Auf Spotify öffnen
            </a>
          )}

          <p style={{ marginTop: 10 }}>
            Votes: {row.votes_total} – Hit {row.hits} / Geht in Ordnung {row.okays} / Niete {row.flops}
          </p>
        </div>
      </div>
    </div>
  );
}
