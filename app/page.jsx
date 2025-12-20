"use client";

import { useEffect, useMemo, useState, useCallback } from "react";
import { supabase } from "@/lib/supabaseClient";
import { getSpotifyUrls } from "@/lib/spotifyUrls";

import BewertungForm from "@/components/BewertungForm";
import VorschlagForm from "@/components/VorschlagForm";
import WordCloud from "@/components/WordCloud";

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

    const { data: active, error: e1 } = await supabase
      .from("albums")
      .select("*")
      .eq("is_active", true)
      .limit(1)
      .maybeSingle();

    if (e1) console.error(e1);
    setCurrentAlbum(active ?? null);

    const { data: past, error: e2 } = await supabase
      .from("albums")
      .select("*")
      .eq("is_active", false)
      .not("date", "is", null)
      .order("date", { ascending: false });

    if (e2) console.error(e2);
    setPastAlbums(past ?? []);
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
      !currentAlbum.spotify_id ||
      !currentAlbum.spotify_link ||
      !currentAlbum.cover_url;

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

        // Danach Alben neu laden → UI bekommt Cover + Player
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

    const [winner] = Object.entries(counts).sort((a, b) => b[1] - a[1])[0];
    return { vote: winner, count: counts[winner] };
  }, [reviews]);

  // Inhalte für WordCloud (Lieblingslied/Schlechtestes Lied)
  const insights = useMemo(() => {
    if (!reviews?.length) return null;

    const pick = (key) =>
      reviews
        .map((r) => r[key])
        .filter(Boolean)
        .map((v) => String(v).trim())
        .filter(Boolean);

    return {
      favorites: pick("liebstes_lied"),
      worst: pick("schlechtestes_lied"),
      quotes: pick("beste_textzeile"),
    };
  }, [reviews]);

  const currentSpotify = currentAlbum
    ? getSpotifyUrls({
        spotify_id: currentAlbum.spotify_id,
        spotify_link: currentAlbum.spotify_link,
        title: currentAlbum.title,
        artist: currentAlbum.artist,
      })
    : null;

  const pastSpotify = pastAlbums[idx]
    ? getSpotifyUrls({
        spotify_id: pastAlbums[idx].spotify_id,
        spotify_link: pastAlbums[idx].spotify_link,
        title: pastAlbums[idx].title,
        artist: pastAlbums[idx].artist,
      })
    : null;

  return (
    <main className="bg-retro-bg text-retro-text min-h-screen">
      <div className="pattern-top" />

      {/* Foto-Hintergrund nur hinter dem Content */}
      <div className="content-bg">
        <div className="max-w-2xl mx-auto p-8 relative z-10">
          <h1>ALBUM DER WOCHE</h1>
          <div className="w-24 h-[3px] bg-retro-accent mx-auto mb-10" />

          {loading ? (
            <p className="text-center text-gray-500 italic mb-8">Lädt…</p>
          ) : currentAlbum ? (
            <div className="retro-card p-6 mb-12 text-center">
              <h2 className="mb-2">{currentAlbum.title}</h2>
              <p className="meta text-center mb-4">{currentAlbum.artist}</p>

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

          {pastAlbums.length > 0 && (
            <div className="retro-card p-6 mb-12">
              <h3 className="mb-6">BISHERIGE ALBEN</h3>

              {pastAlbums[idx]?.cover_url && (
                <img
                  src={pastAlbums[idx].cover_url}
                  alt={`${pastAlbums[idx].title} Cover`}
                  className="mx-auto mb-4 border-2 border-retro-border"
                  loading="lazy"
                />
              )}

              <h4 className="text-center mb-1">
                {pastAlbums[idx].title}
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

              <p className="meta text-center mb-4">{pastAlbums[idx].artist}</p>

              {majority && (
                <p className="text-center font-medium mb-4">
                  🏆 Gesamtwertung: {majority.vote} ({majority.count} Stimmen)
                </p>
              )}

            {/* WordCloud statt GIF 
              {insights && (insights.favorites.length > 0 || insights.worst.length > 0) && (
                <div className="flex justify-center mb-6">
                  <div className="w-full max-w-xl">
                    <WordCloud
                      favorites={insights.favorites}
                      worst={insights.worst}
                      seed={pastAlbums[idx]?.id || 1}
                    />
                  </div>
                </div>
              )}
              */}

              <div className="flex justify-between mt-2">
                <button
                  onClick={() => setIdx((i) => Math.max(i - 1, 0))}
                  disabled={idx === 0}
                  className="px-4 py-2"
                >
                  ◀ Vorheriges
                </button>

                <button
                  onClick={() => setIdx((i) => Math.min(i + 1, pastAlbums.length - 1))}
                  disabled={idx === pastAlbums.length - 1}
                  className="px-4 py-2"
                >
                  Nächstes ▶
                </button>
              </div>
            </div>
          )}

          <VorschlagForm />
        </div>
      </div>

      <div className="pattern-bottom" />
    </main>
  );
}
