"use client";

import { useEffect, useState } from "react";
import { supabase } from "../lib/supabaseClient";

function Stamp({ rating }) {
  const label =
    rating === "hit"
      ? "HIT"
      : rating === "ok"
      ? "GEHT IN ORDNUNG"
      : rating === "niete"
      ? "NIETE"
      : "NO VOTES";

  return (
    <div
      style={{
        display: "inline-block",
        padding: "10px 14px",
        border: "2px solid currentColor",
        borderRadius: 14,
        transform: "rotate(-6deg)",
        fontWeight: 800,
        letterSpacing: 1,
      }}
    >
      {label}
    </div>
  );
}

export default function AlbumOfWeekCard() {
  const [row, setRow] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      const { data, error } = await supabase
      .from("albums_of_week_with_score")
      .select("*")
      .order("week_start_date", { ascending: false })
      .limit(1)
      .maybeSingle();
    

      setRow(data);
      setLoading(false);
    }

    load();
  }, []);

  if (loading) return <div>Lade Album …</div>;
  if (!row) return <div>Noch kein Album</div>;

  return (
    <div style={{ padding: 16, border: "1px solid #ccc", borderRadius: 12 }}>
      <h2>{row.title}</h2>
      <p>{row.artist}</p>

      <Stamp rating={row.final_rating} />

      <p>
        Votes: {row.votes_total} – Hit {row.hits} / Ok {row.okays} / Niete{" "}
        {row.flops}
      </p>
    </div>
  );
}
