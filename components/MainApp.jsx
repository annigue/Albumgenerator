"use client";

import { useEffect, useMemo, useState, useCallback } from "react";
import { supabase } from "../lib/supabaseClient";
import { getSpotifyUrls } from "../lib/spotifyUrls";

import BewertungForm from "./BewertungForm";
import VorschlagForm from "./VorschlagForm";

/* ===== Helper ===== */
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

/* ===== MainApp ===== */
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
      console.error(error);
      setLoading(false);
      return;
    }

    setCurrentAlbum(data?.[0] ?? null);
    setPastAlbums(data?.slice(1) ?? []);
    setIdx(0);
    setLoading(false);
  }, []);

  const loadVotes = useCallback(async (albumWeekId) => {
    if (!albumWeekId) return setVotes([]);

    const { data, error } = await supabase
      .from("votes")
      .select("*")
      .eq("album_week_id", albumWeekId);

    if (error) console.error(error);
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
      if (v.rating === 0) stats.okays++;
      if (v.rating === -1) stats.flops++;
    }
    return {
      ...stats,
      votes_total: votes.length,
    };
  }, [votes]);

  if (loading) {
    return <p className="text-center italic">Lade Album…</p>;
  }

  return (
    <div className="max-w-2xl mx-auto p-8">
      <h1 className="font-display text-6xl text-retro-accent text-right mb-12">
        ALBUM DER WOCHE
      </h1>

      {/* ===== Aktuelles Album ===== */}
      {currentAlbum && (
        <div className="retro-card p-6 mb-12 text-center">
          <h2 className="font-display text-3xl">{currentAlbum.title}</h2>
          <p className="meta">{currentAlbum.artist}</p>

          {getSpotifyUrls(currentAlbum)?.embedUrl && (
            <iframe
              src={getSpotifyUrls(currentAlbum).embedUrl}
              width="100%"
              height="480"
              loading="lazy"
              allow="autoplay; clipboard-write; encrypted-media"
              className="border-2 border-retro-border mt-4"
            />
          )}

          <BewertungForm album={currentAlbum} onSubmitted={loadAlbums} />
        </div>
      )}

      {/* ===== Vorschlag ===== */}
      <VorschlagForm />

      {/* ===== Statistik ===== */}
      {pastAlbums[idx] && (
        <p className="text-center text-xs mt-6 opacity-70">
          Votes: {voteStats.votes_total} – Hit {voteStats.hits} / Geht in Ordnung{" "}
          {voteStats.okays} / Niete {voteStats.flops}
        </p>
      )}
    </div>
  );
}
