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

function CoverWithStamp({ title, coverUrl, rating }) {
  return (
    <div style={{ position: "relative", display: "inline-block" }}>
      {coverUrl ? (
        <img
          src={coverUrl}
          alt={`${title} Cover`}
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

      <div
        style={{
          position: "absolute",
          top: 12,
          right: 12,
          zIndex: 10,
          pointerEvents: "none",
        }}
      >
        <Stamp rating={rating} />
      </div>
    </div>
  );
}

function EmptyState() {
  return (
    <div
      style={{
        padding: 18,
        border: "1px solid rgba(0,0,0,0.2)",
        borderRadius: 14,
        background: "rgba(255,255,255,0.65)",
        backdropFilter: "blur(3px)",
        textAlign: "center",
        maxWidth: 520,
        margin: "0 auto 24px",
      }}
    >
      <div style={{ fontWeight: 900, letterSpacing: 1, marginBottom: 6 }}>
        Noch kein Album der Woche
      </div>
      <div style={{ opacity: 0.85, marginBottom: 12 }}>
        Sobald ein Album gezogen/gesetzt wurde, erscheint es hier automatisch – inklusive Stempel
        und Vote-Zusammenfassung.
      </div>
      <div style={{ fontSize: 13, opacity: 0.75 }}>
        Tipp: Erst mal ein paar Vorschläge eintragen, dann kann die Woche starten 🙂🎵
      </div>
    </div>
  );
}

function VotesLine({ row }) {
  // Falls deine View andere Spaltennamen hat, hier anpassen:
  const total = row?.votes_total ?? 0;
  const hit = row?.votes_hit ?? row?.hits ?? 0;
  const ok = row?.votes_ok ?? row?.okays ?? 0;
  const nie = row?.votes_niete ?? row?.flops ?? 0;

  return (
    <p style={{ margin: 0 }}>
      Votes: {total} – Hit {hit} / Geht in Ordnung {ok} / Niete {nie}
    </p>
  );
}

export default function AlbumOfWeekCard() {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [idx, setIdx] = useState(0);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      setLoading(true);

      const { data, error } = await supabase
        // ✅ WICHTIG: richtiger View-Name
        .from("albums_of_week_with_score")
        .select("*")
        .order("week_start_date", { ascending: false })
        .limit(24);

      if (cancelled) return;

      if (error) {
        console.error("AlbumOfWeekCard load error:", error);
      }

      setRows(Array.isArray(data) ? data : []);
      setIdx(0);
      setLoading(false);
    }

    load();

    return () => {
      cancelled = true;
    };
  }, []);

  if (loading) return <div>Lade Album …</div>;
  if (!rows.length) return <EmptyState />;

  const current = rows[0];
  const past = rows.slice(1);
  const shownPast = past[idx];

  return (
    <div style={{ marginBottom: 24 }}>
      {/* AKTUELLES ALBUM */}
      <div style={{ padding: 16, border: "1px solid #ccc", borderRadius: 12, marginBottom: 18 }}>
        <div style={{ marginBottom: 12, fontWeight: 900, letterSpacing: 1 }}>
          Aktuelles Album der Woche
        </div>

        <div style={{ display: "flex", gap: 16, flexWrap: "wrap", alignItems: "flex-start" }}>
          <CoverWithStamp
            title={current.title}
            coverUrl={current.cover_url}
            rating={current.final_rating}
          />

          <div style={{ minWidth: 260, flex: "1 1 260px" }}>
            <h2 style={{ margin: "0 0 6px 0" }}>{current.title}</h2>
            <p style={{ margin: "0 0 12px 0", color: "#444" }}>{current.artist}</p>

            {current.spotify_url && (
              <p style={{ margin: "0 0 12px 0" }}>
                <a href={current.spotify_url} target="_blank" rel="noopener noreferrer">
                  Auf Spotify öffnen
                </a>
              </p>
            )}

            <VotesLine row={current} />
          </div>
        </div>
      </div>

      {/* BISHERIGE ALBEN */}
      <div style={{ padding: 16, border: "1px solid #ccc", borderRadius: 12 }}>
        <div style={{ marginBottom: 12, fontWeight: 900, letterSpacing: 1 }}>
          Bisherige Alben
        </div>

        {!past.length ? (
          <div style={{ opacity: 0.8 }}>
            Noch keine bisherigen Alben – das ist die erste Woche 🙂
          </div>
        ) : (
          <>
            <div style={{ display: "flex", gap: 16, flexWrap: "wrap", alignItems: "flex-start" }}>
              <CoverWithStamp
                title={shownPast.title}
                coverUrl={shownPast.cover_url}
                rating={shownPast.final_rating}
              />

              <div style={{ minWidth: 260, flex: "1 1 260px" }}>
                <h3 style={{ margin: "0 0 6px 0" }}>{shownPast.title}</h3>
                <p style={{ margin: "0 0 12px 0", color: "#444" }}>{shownPast.artist}</p>

                <div style={{ opacity: 0.8, marginBottom: 8 }}>
                  Woche: {shownPast.week_start_date}
                </div>

                <VotesLine row={shownPast} />
              </div>
            </div>

            <div style={{ display: "flex", justifyContent: "space-between", marginTop: 14 }}>
              <button
                onClick={() => setIdx((i) => Math.max(i - 1, 0))}
                disabled={idx === 0}
                style={{
                  padding: "10px 14px",
                  borderRadius: 10,
                  border: "1px solid #bbb",
                  background: "white",
                  cursor: idx === 0 ? "not-allowed" : "pointer",
                  opacity: idx === 0 ? 0.5 : 1,
                }}
              >
                ◀ Vorheriges
              </button>

              <button
                onClick={() => setIdx((i) => Math.min(i + 1, past.length - 1))}
                disabled={idx === past.length - 1}
                style={{
                  padding: "10px 14px",
                  borderRadius: 10,
                  border: "1px solid #bbb",
                  background: "white",
                  cursor: idx === past.length - 1 ? "not-allowed" : "pointer",
                  opacity: idx === past.length - 1 ? 0.5 : 1,
                }}
              >
                Nächstes ▶
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
