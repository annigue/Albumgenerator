"use client";

import { useEffect, useMemo, useState, useCallback } from "react";

import { supabase } from "../lib/supabaseClient";
import { getSpotifyUrls } from "../lib/spotifyUrls";

import BewertungForm from "../components/BewertungForm";
import VorschlagForm from "../components/VorschlagForm";
import AlbumOfWeekCard from "../components/AlbumOfWeekCard";

console.log("SUPA URL", process.env.NEXT_PUBLIC_SUPABASE_URL);
console.log("SUPA KEY?", !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);


/* ──────────────────────────────────────────────────────────
   Helpers: zählen + normalisieren
   ────────────────────────────────────────────────────────── */
function normalizeSongName(s) {
  if (!s) return "";
  return String(s).trim().replace(/\s+/g, " ").replace(/["“”]/g, '"');
}

function topCounts(items, topN = 5) {
  const map = new Map();
  for (const raw of items) {
    const key = normalizeSongName(raw);
    if (!key) continue;
    map.set(key, (map.get(key) || 0) + 1);
  }
  return Array.from(map.entries())
    .map(([label, count]) => ({ label, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, topN);
}

/* ──────────────────────────────────────────────────────────
   Mini-“Chart” Komponente (CSS Bars)
   ────────────────────────────────────────────────────────── */
function SongBars({ title, items }) {
  if (!items?.length) {
    return (
      <div className="border-2 border-retro-border bg-white/60 p-4">
        <p className="meta text-center">{title}</p>
        <p className="text-center text-sm opacity-70 mt-2">Keine Einträge</p>
      </div>
    );
  }

  const max = Math.max(...items.map((x) => x.count), 1);

  return (
    <div className="border-2 border-retro-border bg-white/60 p-4">
      <p className="meta text-center mb-3">{title}</p>

      <div className="space-y-2">
        {items.map((x) => {
          const w = Math.round((x.count / max) * 100);
          return (
            <div key={x.label} className="flex items-center gap-3">
              <div className="w-40 text-sm truncate" title={x.label}>
                {x.label}
              </div>

              <div className="flex-1 h-3 border-2 border-retro-border bg-transparent">
                <div className="h-full bg-retro-accent" style={{ width: `${w}%` }} />
              </div>

              <div className="w-10 text-right text-sm font-semibold tabular-nums">
                {x.count}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

/* ──────────────────────────────────────────────────────────
   Hauptseite
   ────────────────────────────────────────────────────────── */
export default function Home() {
  const [currentAlbum, setCurrentAlbum] = useState(null);
  const [pastAlbums, setPastAlbums] = useState([]);
  const [idx, setIdx] = useState(0);
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);

  const loadAlbums = useCallback(async () => {
    setLoading(true);

    // Aktuelles Album
    const { data: active, error: e1 } = await supabase
      .from("albums")
      .select("*")
      .eq("is_active", true)
      .limit(1)
      .maybeSingle();

    if (e1) console.error(e1);
    setCurrentAlbum(active ?? null);

    // Vergangene Alben
    const { data: past, error: e2 } = await supabase
      .from("albums")
      .select("*")
      .eq("is_active", false)
      .not("date", "is", null)
      .order("date", { ascending: false });

    if (e2) console.error(e2);

    const safePast = past ?? [];
    setPastAlbums(safePast);
    setIdx(0);

    setLoading(false);
  }, []);

  const loadReviewsForAlbumId = useCallback(async (albumId) => {
    if (!albumId) {
      setReviews([]);
      return;
    }

    const { data, error } = await supabase
      .from("bewertungen")
      .select("*")
      .eq("album_id", albumId)
      .order("created_at", { ascending: true });

    if (error) console.error(error);
    setReviews(data ?? []);
  }, []);

  useEffect(() => {
    loadAlbums();
  }, [loadAlbums]);

  // Auto-backfill Spotify Daten für das aktuelle Album (wenn etwas fehlt)
  useEffect(() => {
    if (!currentAlbum?.id) return;

    const missingSpotify =
      !currentAlbum.spotify_id || !currentAlbum.spotify_link || !currentAlbum.cover_url;

    if (!missingSpotify) return;

    (async () => {
      try {
        console.log("Backfilling Spotify data for album", currentAlbum.id);

        const res = await fetch("/api/backfill_album_spotify", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ albumId: currentAlbum.id }),
        });

        if (!res.ok) {
          const data = await res.json().catch(() => ({}));
          console.error("Backfill failed:", res.status, data);
          return;
        }

        await loadAlbums();
      } catch (err) {
        console.error("Spotify backfill failed:", err);
      }
    })();
  }, [
    currentAlbum?.id,
    currentAlbum?.spotify_id,
    currentAlbum?.spotify_link,
    currentAlbum?.cover_url,
    loadAlbums,
  ]);

  // Reviews für aktuell gewähltes vergangenes Album laden
  useEffect(() => {
    const album = pastAlbums[idx];
    loadReviewsForAlbumId(album?.id);
  }, [pastAlbums, idx, loadReviewsForAlbumId]);

  const majority = useMemo(() => {
    if (!reviews?.length) return null;

    const counts = { Hit: 0, "Geht in Ordnung": 0, Niete: 0 };
    for (const r of reviews) {
      if (counts[r.bewertung] !== undefined) counts[r.bewertung]++;
    }

    const sorted = Object.entries(counts).sort((a, b) => b[1] - a[1]);
    const winner = sorted?.[0]?.[0] ?? null;
    if (!winner) return null;

    return { vote: winner, count: counts[winner] };
  }, [reviews]);

  const favoritesTop = useMemo(() => {
    const list = (reviews ?? []).map((r) => r?.liebstes_lied);
    return topCounts(list, 5);
  }, [reviews]);

  const worstTop = useMemo(() => {
    const list = (reviews ?? []).map((r) => r?.schlechtestes_lied);
    return topCounts(list, 5);
  }, [reviews]);

  const currentSpotify = currentAlbum
    ? getSpotifyUrls({
        spotify_id: currentAlbum.spotify_id,
        spotify_link: currentAlbum.spotify_link,
        title: currentAlbum.title,
        artist: currentAlbum.artist,
      })
    : null;

  const selectedPast = pastAlbums[idx] ?? null;

  const pastSpotify = selectedPast
    ? getSpotifyUrls({
        spotify_id: selectedPast.spotify_id,
        spotify_link: selectedPast.spotify_link,
        title: selectedPast.title,
        artist: selectedPast.artist,
      })
    : null;

  return (
    <main className="bg-retro-bg text-retro-text min-h-screen">
      <div className="pattern-top" />

      <div className="content-bg">
        <div className="max-w-2xl mx-auto p-8 relative z-10">
          <h1>ALBUM DER WOCHE</h1>

          {/* ✅ HIER gehört das Album-der-Woche-View-Widget hin */}
          <div className="mb-10">
            <AlbumOfWeekCard />
          </div>

          <div className="w-24 h-[3px] bg-retro-accent mx-auto mb-10" />

          {/* ──────────────────────────────────────────
              AKTUELLES ALBUM (aus "albums" Tabelle)
              ────────────────────────────────────────── */}
          {loading ? (
            <p className="text-center text-gray-500 italic mb-8">Lädt…</p>
          ) : currentAlbum ? (
            <div className="retro-card p-6 mb-12 text-center">
              <h2 className="font-display text-3xl mb-2">{currentAlbum.title}</h2>
              <p className="meta text-center">{currentAlbum.artist}</p>

              {currentSpotify?.embedUrl && (
                <div className="mx-auto max-w-2xl">
                  <iframe
                    src={currentSpotify.embedUrl}
                    width="100%"
                    height="480"
                    allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture"
                    loading="lazy"
                    className="w-full rounded-xl overflow-hidden border-2 border-retro-border"
                  />
                </div>
              )}

              {currentSpotify?.openUrl && (
                <a
                  href={currentSpotify.openUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 text-retro-accent hover:underline mt-2"
                >
                  <img
                    src="https://upload.wikimedia.org/wikipedia/commons/8/84/Spotify_icon.svg"
                    className="w-5 h-5"
                    alt=""
                    style={{ border: "none" }}
                  />
                  Auf Spotify ansehen
                </a>
              )}

              <div className="mt-6">
                <BewertungForm album={currentAlbum} onSubmitted={loadAlbums} />
              </div>
            </div>
          ) : (
            <p className="text-center text-gray-500 italic mb-8">
              Noch kein aktuelles Album gesetzt.
            </p>
          )}

          {/* ──────────────────────────────────────────
              BISHERIGE ALBEN (aus "albums" Tabelle)
              ────────────────────────────────────────── */}
          {pastAlbums.length > 0 ? (
            <div className="retro-card p-6 mb-12">
              <h3 className="font-display text-2xl text-retro-accent text-center mb-6">
                BISHERIGE ALBEN
              </h3>

              {/* Null-safe: selectedPast existiert garantiert hier */}
              <div className="relative mx-auto mb-4 w-fit">
                {selectedPast?.cover_url ? (
                  <img
                    src={selectedPast.cover_url}
                    alt={`${selectedPast.title} Cover`}
                    className="border-2 border-retro-border"
                    loading="lazy"
                  />
                ) : (
                  <div className="border-2 border-retro-border bg-white/60 p-8 text-center">
                    Kein Cover vorhanden
                  </div>
                )}

                {/* Stempel auf dem Cover */}
                {majority && (
                  <div
                    className={`rating-stamp rating-${majority.vote
                      .toLowerCase()
                      .replace(/\s/g, "-")}`}
                  >
                    {majority.vote.toUpperCase()}
                  </div>
                )}
              </div>

              <h4 className="text-xl text-center font-semibold mb-1">
                {selectedPast.title}
                {pastSpotify?.openUrl && (
                  <a
                    href={pastSpotify.openUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-block ml-2 align-middle"
                    style={{ border: "none" }}
                  >
                    <img
                      src="https://upload.wikimedia.org/wikipedia/commons/8/84/Spotify_icon.svg"
                      alt="Spotify"
                      className="w-5 h-5 inline-block"
                      style={{ border: "none" }}
                    />
                  </a>
                )}
              </h4>

              <p className="meta text-center mb-4">{selectedPast.artist}</p>

              {/* Charts */}
              <div className="grid gap-4 md:grid-cols-2 mb-6">
                <SongBars title="Lieblingslieder (Top)" items={favoritesTop} />
                <SongBars title="Schlechteste Lieder (Top)" items={worstTop} />
              </div>

              {majority && (
                <p className="text-center text-xs uppercase tracking-wider opacity-70 mt-2">
                  {majority.count} Stimme{majority.count > 1 ? "n" : ""}
                </p>
              )}

              <div className="flex justify-between mt-2">
                <button
                  onClick={() => setIdx((i) => Math.max(i - 1, 0))}
                  disabled={idx === 0}
                  className="px-4 py-2 bg-retro-accent text-white border-2 border-retro-border hover:bg-black transition disabled:opacity-50"
                >
                  ◀ Vorheriges
                </button>

                <button
                  onClick={() => setIdx((i) => Math.min(i + 1, pastAlbums.length - 1))}
                  disabled={idx === pastAlbums.length - 1}
                  className="px-4 py-2 bg-retro-accent text-white border-2 border-retro-border hover:bg-black transition disabled:opacity-50"
                >
                  Nächstes ▶
                </button>
              </div>
            </div>
          ) : (
            <p className="text-center text-gray-500 italic mb-8">
              Noch keine bisherigen Alben vorhanden.
            </p>
          )}

          <VorschlagForm />
        </div>
      </div>

      <div className="pattern-bottom" />
    </main>
  );
}
