"use client";

import { useEffect, useState } from "react";
import { supabase } from "../lib/supabaseClient";

function Stamp({ rating }) {
  const label =
    rating === "Hit"
      ? "Hit"
      : rating === "Geht in Ordnung"
      ? "Geht in Ordnung"
      : rating === "Niete"
      ? "Niete"
      : "Keine Stimmen";

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
          display: "inline-flex",
          alignItems: "center",
          justifyContent: "center",
          padding: label.length > 14 ? "10px 14px" : "10px 16px",
          border: "2px solid currentColor",
          borderRadius: 14,
          transform: "rotate(-8deg)",
          fontWeight: 900,
          letterSpacing: 0.6,
          textTransform: "uppercase",
          lineHeight: 1,
          userSelect: "none",

          // Stempel-Feeling
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
        {/* leichte “Offset”-Druckspur */}
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

        {/* Haupttext */}
        <span style={{ position: "relative", zIndex: 1 }}>{label}</span>

        {/* Textur */}
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

  useEffect(() => {
    let cancelled = false;

    async function load() {
      setLoading(true);

      const { data, error } = await supabase
        // ✅ Cloud-View-Name: passt zu deinem Supabase "views" Listing
        .from("albums_of_the_week_score")
        .select("*")
        .order("week_start_date", { ascending: false })
        .limit(1)
        .maybeSingle();

      if (cancelled) return;

      if (error) {
        console.error("AlbumOfWeekCard load error:", error);
      }

      setRow(data ?? null);
      setLoading(false);
    }

    load();

    return () => {
      cancelled = true;
    };
  }, []);

  if (loading) return <div>Lade Album …</div>;
  if (!row) return <div>Noch kein Album</div>;

  return (
    <div style={{ padding: 16, border: "1px solid #ccc", borderRadius: 12 }}>
      {/* COVER + STAMPEL */}
      <div
        style={{
          position: "relative",
          display: "inline-block",
          marginBottom: 16,
        }}
      >
        {row.cover_url ? (
          <img
            src={row.cover_url}
            alt={`${row.title} Cover`}
            loading="lazy"
            style={{
              width: 320,
              maxWidth: "100%",
              borderRadius: 12,
              border: "2px solid #ddd",
              display: "block",
            }}
          />
        ) : (
          <div
            style={{
              width: 320,
              maxWidth: "100%",
              height: 320,
              borderRadius: 12,
              border: "2px solid #ddd",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: "#666",
              background: "#f7f7f7",
            }}
          >
            Kein Cover
          </div>
        )}

        {/* Stempel oben rechts auf dem Cover */}
        <div
          style={{
            position: "absolute",
            top: 12,
            right: 12,
            zIndex: 10,
            pointerEvents: "none",
          }}
        >
          <Stamp rating={row.final_rating} />
        </div>
      </div>

      {/* TITEL + ARTIST */}
      <h2 style={{ margin: "0 0 6px 0" }}>{row.title}</h2>
      <p style={{ margin: "0 0 12px 0", color: "#444" }}>{row.artist}</p>

      {/* VOTE-ZUSAMMENFASSUNG */}
      <p style={{ margin: 0 }}>
        Votes: {row.votes_total ?? 0} – Hit {row.votes_hit ?? 0} / Geht in Ordnung{" "}
        {row.votes_ok ?? 0} / Niete {row.votes_niete ?? 0}
      </p>
    </div>
  );
}
