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
   Cover URL: robust + korrekt (KEIN image-cdn-ak rewrite)
   - i.scdn.co funktioniert zuverlässig
   - wenn irgendwo ein Hash steckt: i.scdn.co/image/<hash>
   ────────────────────────────────────────────────────────── */
function coverCandidates(raw) {
  const url = (raw ?? "").toString().trim();
  if (!url) return [];

  // Extract spotify image hash if present
  const m = url.match(/ab[0-9a-f]{20,}/i);
  const hash = m?.[0];

  const list = [];

  // 1) Original URL (falls es schon i.scdn oder https ist)
  list.push(url);

  // 2) Wenn Hash vorhanden: i.scdn Fallback (das ist bei dir der zuverlässige Host)
  if (hash) {
    list.push(`https://i.scdn.co/image/${hash}`);
    // Optional: manchmal gibt es auch "image-cdn.spotifycdn.com", aber wir lassen es weg,
    // weil "image-cdn-ak" bei dir 404 liefert.
  }

  // Dedupe + nur sinnvolle (http/https) URLs behalten
  return Array.from(new Set(list)).filter((u) => /^https?:\/\//i.test(u));
}

/* Robust cover component that retries on error */
function CoverImage({ src, alt }) {
  const candidates = useMemo(() => coverCandidates(src), [src]);
  const [idx, setIdx] = useState(0);

  useEffect(() => {
    setIdx(0); // reset when album changes
  }, [src]);

  const current = candidates[idx] ?? "";

  if (!current) {
    return (
      <div className="w-full h-full border-2 border-retro-border bg-white/60 flex items-center justify-center text-sm opacity-70">
        Kein Cover vorhanden
      </div>
    );
  }

  return (
    <img
      src={current}
      alt={alt}
      className="w-full h-full object-cover border-2 border-retro-border"
      loading="lazy"
      // wichtig: keine zusätzlichen CORS-Spielereien
      referrerPolicy="no-referrer"
      onError={() => {
        if (idx < candidates.length - 1) setIdx((i) => i + 1);
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
   Hauptseite (NEUE WELT: albums_of_week + votes)
   ────────────────────────────────────────────────────────── */
export default function Home() {
  const [currentAlbum, setCurrentAlbum] = useState(null); // album_of_week_with_score (uuid id)
  const [pastAlbums, setPastAlbums] = useState([]); // album_of_week_with_score
  const [idx, setIdx] = useState(0);
  const [votes, setVotes] = useState([]); // votes rows
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

  const majority = useMemo(() => {
    if (!votes?.length) return null;

    const counts = { Hit: 0, "Geht in Ordnung": 0, Niete: 0 };
    for (const v of votes) {
      if (v.rating === 1) counts["Hit"]++;
      else if (v.rating === 0) counts["Geht in Ordnung"]++;
      else if (v.rating === -1) counts["Niete"]++;
    }

    const sorted = Object.entries(counts).sort((a, b) => b[1] - a[1]);
    const winner = sorted?.[0]?.[0] ?? null;
    if (!winner) return null;

    return { vote: winner, count: counts[winner] };
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

          {/* ──────────────────────────────────────────
              AKTUELLES ALBUM DER WOCHE
              (kein extra Cover – Player reicht)
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
              BISHERIGE ALBEN
              ────────────────────────────────────────── */}
          {pastAlbums.length > 0 && selectedPast ? (
            <div className="retro-card p-6 mb-12">
              <h3 className="font-display text-2xl text-retro-accent text-center mb-6">
                BISHERIGE ALBEN
              </h3>

              <div className="relative mx-auto mb-4 w-[240px] h-[240px]">
                <CoverImage
                  src={selectedPast.cover_url}
                  alt={`${selectedPast.title} Cover`}
                />

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
