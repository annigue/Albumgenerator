"use client";

import { useEffect, useMemo, useState, useCallback } from "react";
import { supabase } from "../lib/supabaseClient";
import { getSpotifyUrls } from "../lib/spotifyUrls";

import BewertungForm from "./BewertungForm";
import VorschlagForm from "./VorschlagForm";

function normalizeSongName(s) {
  if (!s) return "";
  return String(s).trim().replace(/\s+/g, " ");
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

  const loadVotes = useCallback(async (albumWeekId) => {
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
    loadVotes(pastAlbums[idx]?.id);
  }, [idx, pastAlbums, loadVotes]);

  const voteStats = useMemo(() => {
    const stats = { hits: 0, okays: 0, flops: 0 };
    for (const v of votes) {
      if (v.rating === 1) stats.hits++;
      else if (v.rating === 0) stats.okays++;
      else if (v.rating === -1) stats.flops++;
    }
    return { ...stats, votes_total: votes.length };
  }, [votes]);

  const currentSpotify = useMemo(() => {
    if (!currentAlbum) return null;
    return getSpotifyUrls({
      spotify_id: currentAlbum.spotify_id,
      spotify_link: currentAlbum.spotify_url,
      title: currentAlbum.title,
      artist: currentAlbum.artist,
    });
  }, [currentAlbum]);

  if (loading) {
    return (
      <main className="bg-retro-bg text-retro-text min-h-screen">
        <div className="pattern-top" />
        <div className="content-bg">
          <div className="max-w-2xl mx-auto p-8">
            <div className="retro-card p-6 text-center">
              <p className="meta">Lade Album…</p>
            </div>
          </div>
        </div>
        <div className="pattern-bottom" />
      </main>
    );
  }

  return (
    <main className="bg-retro-bg text-retro-text min-h-screen">
      <div className="pattern-top" />
      <div className="content-bg">
        <div className="max-w-2xl mx-auto p-8">
          <h1>ALBUM DER WOCHE</h1>

          {/* Aktuelles Album */}
          {currentAlbum ? (
            <div className="retro-card p-6 mb-12 text-center">
              <h2 className="font-display text-3xl mb-2">{currentAlbum.title}</h2>
              <p className="meta text-center">{currentAlbum.artist}</p>

              {currentSpotify?.embedUrl && (
                <div className="mx-auto max-w-2xl">
                  <iframe
                    src={currentSpotify.embedUrl}
                    width="100%"
                    height="480"
                    loading="lazy"
                    allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture"
                    className="w-full overflow-hidden border-2 border-retro-border"
                  />
                </div>
              )}

              <div className="mt-6">
                <BewertungForm album={currentAlbum} onSubmitted={loadAlbums} />
              </div>
            </div>
          ) : (
            <div className="retro-card p-6 text-center">
              <p className="meta">Noch kein aktuelles Album gesetzt.</p>
            </div>
          )}

          {/* Vorschlag */}
          <VorschlagForm />

          {/* Mini-Statistik (für aktuelles pastAlbum idx) */}
          {pastAlbums[idx] && (
            <p className="text-center text-xs uppercase tracking-wider opacity-70 mt-6">
              Votes: {voteStats.votes_total} – Hit {voteStats.hits} / Geht in Ordnung{" "}
              {voteStats.okays} / Niete {voteStats.flops}
            </p>
          )}
        </div>
      </div>
      <div className="pattern-bottom" />
    </main>
  );
}
