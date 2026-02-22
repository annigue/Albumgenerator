"use client";

import { useEffect, useMemo, useState, useCallback } from "react";
import { supabase } from "../lib/supabaseClient";
import { getSpotifyUrls } from "../lib/spotifyUrls";

import BewertungForm from "./BewertungForm";
import VorschlagForm from "./VorschlagForm";

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
      <div className="tour-block">
        <p className="tour-title">{title}</p>
        <p className="tour-empty">Keine Einträge</p>
      </div>
    );
  }

  return (
    <div className="tour-block">
      <p className="tour-title">{title}</p>
      <div className="tour-list">
        {items.map((x) => (
          <div key={x.label} className="tour-row">
            <span className="tour-city" title={x.label}>
              {x.label}
            </span>
            <span className="tour-dots" />
            <span className="tour-count">{x.count}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function stampClass(winner) {
  const k = (winner || "").toLowerCase().replace(/\s+/g, "-");
  return `rating-stamp rating-${k}`;
}

function stampImageSrc(winner) {
  if (winner === "Hit") return "/hit.png";
  if (winner === "Geht in Ordnung") return "/gehtinordnung.png";
  if (winner === "Niete") return "/niete.png";
  return "";
}

function wikipediaArtistUrl(artist) {
  const q = encodeURIComponent(String(artist || "").trim());
  if (!q) return "";
  return `https://de.wikipedia.org/wiki/Spezial:Suche?search=${q}`;
}

function LyricCarousel({ title, items }) {
  const [i, setI] = useState(0);

  useEffect(() => {
    setI(0);
  }, [items?.length]);

  const hasItems = Array.isArray(items) && items.length > 0;
  const current = hasItems ? items[i % items.length] : { text: "", name: "" };

  return (
    <div className="lyrics-card">
      <div className="lyrics-title">{title}</div>
      <div className="lyrics-box">
        <div className="lyrics-meta">{current.name || ""}</div>
        <div className="lyrics-text">{current.text ? `“${current.text}”` : ""}</div>
      </div>
      <div className="lyrics-controls">
        <button
          type="button"
          onClick={() => hasItems && setI((v) => (v - 1 + items.length) % items.length)}
          aria-label="Vorherige Textzeile"
          disabled={!hasItems}
        >
          ◀
        </button>
        <button
          type="button"
          onClick={() => hasItems && setI((v) => (v + 1) % items.length)}
          aria-label="Nächste Textzeile"
          disabled={!hasItems}
        >
          ▶
        </button>
      </div>
    </div>
  );
}

/* ──────────────────────────────────────────────────────────
   MainApp
   ────────────────────────────────────────────────────────── */
export default function MainApp() {
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

  const bestLyrics = useMemo(() => {
    return (votes ?? [])
      .filter((v) => v?.favorite_lyric)
      .map((v) => ({ text: v.favorite_lyric, name: v.voter }));
  }, [votes]);

  const worstLyrics = useMemo(() => {
    return (votes ?? [])
      .filter((v) => v?.comment)
      .map((v) => ({ text: v.comment, name: v.voter }));
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
        <div className="w-full px-8 relative z-10">
          <div className="poster">
            <header className="poster-header">
              <img
                src="/title.png"
                alt="Album der Woche"
                className="poster-title-img"
              />
              <p className="poster-subtitle">
                Woche für Woche – hören, bewerten, vorschlagen.
              </p>
            </header>

            <div className="poster-grid">

              {/* Aktuelles Album */}
              <section className="poster-block poster-block--hero">
                <div className="poster-label">Aktuelles Album</div>
                {loading ? (
                  <p className="text-center text-gray-500 italic mb-8">Lädt…</p>
                ) : currentAlbum ? (
                  <div className="text-center">
                    <h2 className="font-display text-3xl mb-1">
                      {currentAlbum.title}
                    </h2>

                    <div className="mt-1 flex items-center justify-center gap-2 mb-4">
                      <p className="meta">{currentAlbum.artist}</p>

                      {currentSpotify?.openUrl && (
                        <a
                          href={currentSpotify.openUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center"
                          style={{ border: "none" }}
                          aria-label="Auf Spotify öffnen"
                          title="Auf Spotify öffnen"
                        >
                          <img
                            src="https://upload.wikimedia.org/wikipedia/commons/8/84/Spotify_icon.svg"
                            alt=""
                            className="spotify-icon"
                            width="18"
                            height="18"
                            style={{ width: 18, height: 18 }}
                          />
                        </a>
                      )}
                    </div>

                    <div className="current-album-cover">
                      <a
                        href={wikipediaArtistUrl(currentAlbum.artist)}
                        target="_blank"
                        rel="noopener noreferrer"
                        aria-label={`Wikipedia: ${currentAlbum.artist}`}
                        title={`Wikipedia: ${currentAlbum.artist}`}
                      >
                        <CoverImage
                          src={currentAlbum.cover_url}
                          alt={`${currentAlbum.title} Cover`}
                          spotifyUrl={currentAlbum.spotify_url || currentSpotify?.openUrl || ""}
                        />
                      </a>
                    </div>
                  </div>
                ) : (
                  <p className="text-center text-gray-500 italic mb-8">
                    Noch kein aktuelles Album gesetzt.
                  </p>
                )}
              </section>

              <div className="poster-sep" />

              {/* Bewertung */}
              <div className="poster-label">ALBUM BEWERTEN</div>
              <section className="poster-block poster-block--form">
                <BewertungForm album={currentAlbum} onSubmitted={loadAlbums} />
              </section>

              <div className="poster-sep" />

              {/* Bisherige Alben */}
              <div className="poster-label poster-label--stats">BISHERIGE ALBEN</div>
              <section className="poster-block poster-block--stats poster-block--stats-gray">
                  {pastAlbums.length > 0 && selectedPast ? (
                    <>
                      {/* Cover + Stempel */}
                      <div
                        className="relative mx-auto mb-4 w-[240px] h-[240px]"
                        style={{ position: "relative" }}
                      >
                        <CoverImage
                          src={selectedPast.cover_url}
                          alt={`${selectedPast.title} Cover`}
                          spotifyUrl={selectedPast.spotify_url || pastSpotify?.openUrl || ""}
                        />

                        {voteStats.winner && (
                          <div className={stampClass(voteStats.winner)}>
                            <img
                              src={stampImageSrc(voteStats.winner)}
                              alt={voteStats.winner}
                              className="rating-stamp-img"
                            />
                          </div>
                        )}
                      </div>

                      {/* Titel + Spotify Link (unterhalb, wie gewünscht) */}
                      <div className="text-center">
                        <h4 className="text-xl font-semibold leading-snug">
                          {selectedPast.title}
                        </h4>

                        <div className="mt-1 flex items-center justify-center gap-2">
                          <p className="meta">{selectedPast.artist}</p>

                          {pastSpotify?.openUrl && (
                            <a
                              href={pastSpotify.openUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center"
                              style={{ border: "none" }}
                              aria-label="Auf Spotify öffnen"
                              title="Auf Spotify öffnen"
                            >
                              <img
                                src="https://upload.wikimedia.org/wikipedia/commons/8/84/Spotify_icon.svg"
                                alt=""
                                className="spotify-icon"
                                width="18"
                                height="18"
                                style={{ width: 18, height: 18 }}
                              />
                            </a>
                          )}
                        </div>
                      </div>

                    {/* Top Songs */}
                    <div className="grid gap-4 md:grid-cols-2 mt-6">
                      <SongBars title="Lieblingslieder (Top)" items={favoritesTop} />
                      <SongBars title="Schlechteste Lieder (Top)" items={worstTop} />
                    </div>

                    {/* Textzeilen */}
                    <div className="lyrics-grid mt-6">
                      <LyricCarousel title="Beste Textzeilen" items={bestLyrics} />
                      <LyricCarousel title="Schlechteste Textzeilen" items={worstLyrics} />
                    </div>

                      {/* Vollständige Auswertung */}
                      <p className="text-center text-xs uppercase tracking-wider opacity-70 mt-4">
                        Votes: {voteStats.votes_total} – Hit {voteStats.hits} / Geht in Ordnung{" "}
                        {voteStats.okays} / Niete {voteStats.flops}
                      </p>

                      {/* Navigation */}
                      <div className="flex justify-between mt-3">
                        <button
                          onClick={() => setIdx((i) => Math.max(i - 1, 0))}
                          disabled={idx === 0}
                          className="px-4 py-2 bg-retro-accent text-white border-2 border-retro-border hover:bg-black transition disabled:opacity-50"
                          aria-label="Vorheriges Album"
                        >
                          ◀
                        </button>

                        <button
                          onClick={() => setIdx((i) => Math.min(i + 1, pastAlbums.length - 1))}
                          disabled={idx === pastAlbums.length - 1}
                          className="px-4 py-2 bg-retro-accent text-white border-2 border-retro-border hover:bg-black transition disabled:opacity-50"
                          aria-label="Nächstes Album"
                        >
                          ▶
                        </button>
                      </div>
                    </>
                  ) : (
                    <p className="text-center text-gray-500 italic mb-8">
                      Noch keine bisherigen Alben vorhanden.
                    </p>
                  )}
              </section>

              <div className="poster-sep" />

              {/* Vorschlagen */}
              <div className="poster-label">NEUES ALBUM VORSCHLAGEN</div>
              <section className="poster-block poster-block--form">
                <VorschlagForm />
              </section>

              <div className="poster-sep" />

              {/* Micro Image */}
              <section className="poster-block poster-block--image">
                <img src="/micro.png" alt="" className="poster-image" />
              </section>
            </div>
          </div>
        </div>
      </div>

      <div className="pattern-bottom" />
    </main>
  );
}
