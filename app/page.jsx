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
   Spotify Cover URL Kandidaten + oEmbed Fallback
   ────────────────────────────────────────────────────────── */
function extractSpotifyImageHash(input) {
  const s = (input ?? "").toString();
  const m = s.match(/ab[0-9a-f]{20,}/i);
  return m?.[0] ?? "";
}

function coverCandidates(raw) {
  const url = (raw ?? "").toString().trim();
  if (!url) return [];

  const hash = extractSpotifyImageHash(url);

  const list = [];
  if (/^https?:\/\//i.test(url)) list.push(url);
  if (hash) list.push(`https://i.scdn.co/image/${hash}`);
  if (hash) list.push(`https://image-cdn-ak.spotifycdn.com/image/${hash}`);

  return Array.from(new Set(list));
}

/**
 * CoverImage:
 * - probiert Candidates der Reihe nach
 * - wenn alle scheitern: holt thumbnail_url über Spotify oEmbed (kein Key nötig)
 */
function CoverImage({ src, alt, spotifyUrl }) {
  const candidates = useMemo(() => coverCandidates(src), [src]);
  const [i, setI] = useState(0);

  const [oembedUrl, setOembedUrl] = useState("");
  const [triedOembed, setTriedOembed] = useState(false);

  useEffect(() => {
    setI(0);
    setOembedUrl("");
    setTriedOembed(false);
  }, [src, spotifyUrl]);

  const currentCandidate = candidates[i] ?? "";
  const finalSrc = oembedUrl || currentCandidate;

  if (!finalSrc) {
    return (
      <div className="w-full h-full border-2 border-retro-border bg-white/60 flex items-center justify-center text-sm opacity-70">
        Kein Cover vorhanden
      </div>
    );
  }

  async function fetchOembed() {
    if (!spotifyUrl || triedOembed) return;
    setTriedOembed(true);

    try {
      const res = await fetch(
        `https://open.spotify.com/oembed?url=${encodeURIComponent(spotifyUrl)}`
      );
      if (!res.ok) return;

      const data = await res.json().catch(() => null);
      const thumb = data?.thumbnail_url;
      if (thumb) setOembedUrl(thumb);
    } catch {
      // ignore
    }
  }

  return (
    <img
      src={finalSrc}
      alt={alt}
      className="w-full h-full object-cover border-2 border-retro-border"
      loading="lazy"
      onError={() => {
        if (oembedUrl) return;

        if (i < candidates.length - 1) {
          setI((prev) => prev + 1);
          return;
        }

        fetchOembed();
      }}
    />
  );
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
   Hauptseite (albums_of_week + votes)
   ────────────────────────────────────────────────────────── */
export default function Home() {
  const [currentAlbum, setCurrentAlbum] = useState(null);
  const [pastAlbums, setPastAlbums] = useState([]);
  const [idx, setIdx] = useState(0);
  const [votes, setVotes] = useState([]);
  const [loading, setLoading] = useState(true);

  const loadAlbums = useCallback(async () => {
    setLoading(true);

    const { data, error } = await supabase
      .from("album_of_week_with_score")
      .select("*")
      .order("week_start_date", { ascending: false });

    if (error) {
      console.error("loadAlbums error:", error);
      setCurrentAlbum(null);
      setPastAlbums([]);
      setIdx(0);
      setLoading(false);
      return;
    }

    const rows = data ?? [];
    setCurrentAlbum(rows[0] ?? null);
    setPastAlbums(rows.slice(1));
    setIdx(0);
    setLoading(false);
  }, []);

  const loadVotesForAlbumWeekId = useCallback(async (albumWeekId) => {
    if (!albumWeekId) {
      setVotes([]);
      return;
    }

    const { data, error } = await supabase
      .from("votes")
      .select("*")
      .eq("album_week_id", albumWeekId)
      .order("created_at", { ascending: true });

    if (error) console.error("loadVotes error:", error);
    setVotes(data ?? []);
  }, []);

  useEffect(() => {
    loadAlbums();
  }, [loadAlbums]);

  useEffect(() => {
    const album = pastAlbums[idx];
    loadVotesForAlbumWeekId(album?.id);
  }, [pastAlbums, idx, loadVotesForAlbumWeekId]);

  const selectedPast = pastAlbums[idx] ?? null;

  const voteStats = useMemo(() => {
    const stats = {
      votes_total: votes.length,
      hits: 0,
      okays: 0,
      flops: 0,
      winner: null,
    };

    for (const v of votes) {
      if (v.rating === 1) stats.hits++;
      else if (v.rating === 0) stats.okays++;
      else if (v.rating === -1) stats.flops++;
    }

    const max = Math.max(stats.hits, stats.okays, stats.flops);
    if (max > 0) {
      if (stats.hits === max) stats.winner = "Hit";
      else if (stats.okays === max) stats.winner = "Geht in Ordnung";
      else if (stats.flops === max) stats.winner = "Niete";
    }

    return stats;
  }, [votes]);

  const favoritesTop = useMemo(() => {
    const list = (votes ?? []).map((v) => v?.favorite_song);
    return topCounts(list, 5);
  }, [votes]);

  const worstTop = useMemo(() => {
    const list = (votes ?? []).map((v) => v?.worst_song);
    return topCounts(list, 5);
  }, [votes]);

  const currentSpotify = currentAlbum
    ? getSpotifyUrls({
        spotify_id: currentAlbum.spotify_id,
        spotify_link: currentAlbum.spotify_url,
        title: currentAlbum.title,
        artist: currentAlbum.artist,
      })
    : null;

  const pastSpotify = selectedPast
    ? getSpotifyUrls({
        spotify_id: selectedPast.spotify_id,
        spotify_link: selectedPast.spotify_url,
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

          <div className="mb-10">
            <AlbumOfWeekCard />
          </div>

          <div className="w-24 h-[3px] bg-retro-accent mx-auto mb-10" />

          {/* Aktuelles Album */}
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

          {/* Bisherige Alben */}
          {pastAlbums.length > 0 && selectedPast ? (
            <div className="retro-card p-6 mb-12">
              <h3 className="font-display text-2xl text-retro-accent text-center mb-6">
                BISHERIGE ALBEN
              </h3>

              <div className="relative mx-auto mb-4 w-[240px] h-[240px]">
                <CoverImage
                  src={selectedPast.cover_url}
                  alt={`${selectedPast.title} Cover`}
                  spotifyUrl={selectedPast.spotify_url || pastSpotify?.openUrl || ""}
                />

                {voteStats.winner && (
                  <div
                    className={`rating-stamp rating-${voteStats.winner
                      .toLowerCase()
                      .replace(/\s/g, "-")}`}
                  >
                    {voteStats.winner.toUpperCase()}
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

              <div className="grid gap-4 md:grid-cols-2 mb-6">
                <SongBars title="Lieblingslieder (Top)" items={favoritesTop} />
                <SongBars title="Schlechteste Lieder (Top)" items={worstTop} />
              </div>

              {/* ✅ Vollständige Auswertung */}
              <p className="text-center text-xs uppercase tracking-wider opacity-70 mt-3">
                Votes: {voteStats.votes_total} – Hit {voteStats.hits} / Geht in Ordnung{" "}
                {voteStats.okays} / Niete {voteStats.flops}
              </p>

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
