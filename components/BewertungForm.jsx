"use client";

import { useEffect, useState } from "react";
import { supabase } from "../lib/supabaseClient";

function mapBewertungToRating(bewertung) {
  if (bewertung === "Hit") return 1;
  if (bewertung === "Geht in Ordnung") return 0;
  if (bewertung === "Niete") return -1;
  return null;
}

export default function BewertungForm({ album, onSubmitted }) {
  const [participants, setParticipants] = useState([]);
  const [loadingParticipants, setLoadingParticipants] = useState(true);

  const [form, setForm] = useState({
    name: "",
    liebstes_lied: "",
    beste_textzeile: "",
    schlechtestes_lied: "",
    bewertung: "",
  });

  const [ok, setOk] = useState(false);
  const [sending, setSending] = useState(false);

  useEffect(() => {
    (async () => {
      setLoadingParticipants(true);
      const { data, error } = await supabase
        .from("participants")
        .select("name")
        .order("name", { ascending: true });

      if (error) console.error("participants load error:", error);
      setParticipants((data ?? []).map((x) => x.name));
      setLoadingParticipants(false);
    })();
  }, []);

  const onChange = (e) =>
    setForm((f) => ({ ...f, [e.target.name]: e.target.value }));

  const onSubmit = async (e) => {
    e.preventDefault();
    e.stopPropagation();

    setOk(false);

    if (!album?.id) {
      alert("Kein aktuelles Album gefunden (album.id fehlt).");
      return;
    }

    const rating = mapBewertungToRating(form.bewertung);
    if (rating === null) {
      alert("Bitte eine Gesamtbewertung auswählen.");
      return;
    }

    // Pflichtfelder (alles außer Textzeile)
    if (!form.name || !form.liebstes_lied || !form.schlechtestes_lied || !form.bewertung) {
      alert("Bitte alle Felder ausfüllen (außer Beste Textzeile).");
      return;
    }

    setSending(true);

    try {
      const payload = {
        album_week_id: album.id,
        voter: form.name,
        rating,
        favorite_song: form.liebstes_lied.trim(),
        favorite_lyric: form.beste_textzeile?.trim() || null, // optional
        worst_song: form.schlechtestes_lied.trim(),
        comment: null,
      };

      const res = await fetch("/api/votes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        alert(data?.error || `Fehler beim Absenden (HTTP ${res.status})`);
        return;
      }

      setOk(true);
      setForm({
        name: "",
        liebstes_lied: "",
        beste_textzeile: "",
        schlechtestes_lied: "",
        bewertung: "",
      });

      onSubmitted?.();
    } catch (err) {
      alert(`Fehler beim Absenden 😢\n${err?.message ?? ""}`);
    } finally {
      setSending(false);
    }
  };

  if (!album) return null;

  if (ok) {
    return (
      <div className="form-card text-center">
        <p className="font-display text-xl tracking-wide text-retro-accent">
          ✅ Danke für deine Bewertung!
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={onSubmit} className="form-card" noValidate>
      <h3 className="text-retro-accent font-display text-2xl mb-1 tracking-widest text-center">
        ALBUM BEWERTEN
      </h3>

      <div className="form-group">
        <label htmlFor="name">Teilnehmer</label>
        <select
          id="name"
          name="name"
          value={form.name}
          onChange={onChange}
          required
          disabled={loadingParticipants}
        >
          <option value="">
            {loadingParticipants ? "Lade Teilnehmer…" : "Bitte wählen…"}
          </option>
          {participants.map((n) => (
            <option key={n} value={n}>
              {n}
            </option>
          ))}
        </select>

        <p className="text-xs opacity-70 mt-1">
          Fehlt dein Name? Dann melde dich unten an.
        </p>
      </div>

      <div className="form-group">
        <label htmlFor="liebstes_lied">Liebstes Lied</label>
        <input
          id="liebstes_lied"
          name="liebstes_lied"
          value={form.liebstes_lied}
          onChange={onChange}
          required
        />
      </div>

      <div className="form-group">
        <label htmlFor="beste_textzeile">Beste Textzeile (optional)</label>
        <textarea
          id="beste_textzeile"
          name="beste_textzeile"
          value={form.beste_textzeile}
          onChange={onChange}
          rows={3}
        />
      </div>

      <div className="form-group">
        <label htmlFor="schlechtestes_lied">Schlechtestes Lied</label>
        <input
          id="schlechtestes_lied"
          name="schlechtestes_lied"
          value={form.schlechtestes_lied}
          onChange={onChange}
          required
        />
      </div>

      <div className="form-group">
        <label htmlFor="bewertung">Gesamtbewertung</label>
        <select
          id="bewertung"
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

      <button type="submit" disabled={sending}>
        {sending ? "WIRD GESENDET…" : "SUBMIT"}
      </button>
    </form>
  );
}
