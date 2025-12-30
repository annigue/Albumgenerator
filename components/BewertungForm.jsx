"use client";

import { useEffect, useState } from "react";
import { supabase } from "../lib/supabaseClient";

const TEILNEHMER = ["Anne", "Moritz", "Max", "Kathi", "Lena"];

function mapBewertungToRating(bewertung) {
  if (bewertung === "Hit") return 1;
  if (bewertung === "Geht in Ordnung") return 0;
  if (bewertung === "Niete") return -1;
  return null;
}

function mapRatingToBewertung(rating) {
  if (rating === 1) return "Hit";
  if (rating === 0) return "Geht in Ordnung";
  if (rating === -1) return "Niete";
  return "";
}

export default function BewertungForm({ album, onSubmitted }) {
  const [form, setForm] = useState({
    name: "",
    liebstes_lied: "",
    beste_textzeile: "",
    schlechtestes_lied: "",
    bewertung: "",
  });

  const [sending, setSending] = useState(false);
  const [ok, setOk] = useState(false);
  const [existingVote, setExistingVote] = useState(null);
  const [checking, setChecking] = useState(false);

  const onChange = (e) => {
    setForm((f) => ({ ...f, [e.target.name]: e.target.value }));
    setOk(false);
  };

  /* ──────────────────────────────────────────
     Prüfen: hat Teilnehmer schon bewertet?
     ────────────────────────────────────────── */
  useEffect(() => {
    if (!album?.id || !form.name) {
      setExistingVote(null);
      return;
    }

    setChecking(true);

    supabase
      .from("votes")
      .select("*")
      .eq("album_week_id", album.id)
      .eq("voter", form.name)
      .maybeSingle()
      .then(({ data, error }) => {
        if (error) {
          console.error(error);
          return;
        }

        if (data) {
          setExistingVote(data);
          setForm((f) => ({
            ...f,
            liebstes_lied: data.favorite_song ?? "",
            beste_textzeile: data.favorite_lyric ?? "",
            schlechtestes_lied: data.worst_song ?? "",
            bewertung: mapRatingToBewertung(data.rating),
          }));
        } else {
          setExistingVote(null);
        }
      })
      .finally(() => setChecking(false));
  }, [album?.id, form.name]);

  /* ────────────────────────────────────────── */

  const onSubmit = async (e) => {
    e.preventDefault();
    e.stopPropagation();

    if (!album?.id) return;

    const rating = mapBewertungToRating(form.bewertung);
    if (rating === null) {
      alert("Bitte eine Gesamtbewertung auswählen.");
      return;
    }

    setSending(true);

    try {
      const res = await fetch("/api/votes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          album_week_id: album.id,
          voter: form.name,
          rating,
          favorite_song: form.liebstes_lied || null,
          favorite_lyric: form.beste_textzeile || null,
          worst_song: form.schlechtestes_lied || null,
        }),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err?.error || "Fehler beim Speichern");
      }

      setOk(true);
      onSubmitted?.();
    } catch (err) {
      alert(err.message);
    } finally {
      setSending(false);
    }
  };

  if (!album) return null;

  if (ok) {
    return (
      <div className="form-card text-center">
        <p className="font-display text-xl text-retro-accent">
          ✅ Bewertung gespeichert
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={onSubmit} className="form-card" noValidate>
      <h3 className="text-retro-accent font-display text-2xl mb-2 text-center">
        ALBUM BEWERTEN
      </h3>

      {existingVote && (
        <p className="text-sm text-center mb-3 opacity-80">
          ✏️ Du hast dieses Album bereits bewertet – du kannst deine Bewertung
          ändern.
        </p>
      )}

      <div className="form-group">
        <label>Teilnehmer</label>
        <select name="name" value={form.name} onChange={onChange} required>
          <option value="">Bitte wählen…</option>
          {TEILNEHMER.map((t) => (
            <option key={t} value={t}>
              {t}
            </option>
          ))}
        </select>
      </div>

      <div className="form-group">
        <label>Liebstes Lied</label>
        <input
          name="liebstes_lied"
          value={form.liebstes_lied}
          onChange={onChange}
          placeholder="optional"
        />
      </div>

      <div className="form-group">
        <label>Beste Textzeile</label>
        <textarea
          name="beste_textzeile"
          value={form.beste_textzeile}
          onChange={onChange}
          rows={3}
          placeholder="optional"
        />
      </div>

      <div className="form-group">
        <label>Schlechtestes Lied</label>
        <input
          name="schlechtestes_lied"
          value={form.schlechtestes_lied}
          onChange={onChange}
          placeholder="optional"
        />
      </div>

      <div className="form-group">
        <label>Gesamtbewertung</label>
        <select
          name="bewertung"
          value={form.bewertung}
          onChange={onChange}
          required
        >
          <option value="">Bitte wählen…</option>
          <option value="Hit">Hit</option>
          <option value="Geht in Ordnung">Geht in Ordnung</option>
          <option value="Niete">Niete</option>
        </select>
      </div>

      <button type="submit" disabled={sending || checking}>
        {sending
          ? "WIRD GESPEICHERT…"
          : existingVote
          ? "BEWERTUNG AKTUALISIEREN"
          : "SUBMIT"}
      </button>
    </form>
  );
}
