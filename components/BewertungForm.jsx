"use client";

import { useEffect, useState } from "react";
import { supabase } from "../lib/supabaseClient";

function mapBewertungToRating(b) {
  if (b === "Hit") return 1;
  if (b === "Geht in Ordnung") return 0;
  if (b === "Niete") return -1;
  return null;
}

export default function BewertungForm({ album, onSubmitted }) {
  const [displayName, setDisplayName] = useState("");
  const [loadingMe, setLoadingMe] = useState(true);

  const [form, setForm] = useState({
    liebstes_lied: "",
    beste_textzeile: "",
    schlechtestes_lied: "",
    bewertung: "",
  });

  const [ok, setOk] = useState(false);
  const [sending, setSending] = useState(false);

  useEffect(() => {
    (async () => {
      setLoadingMe(true);

      const { data: sess } = await supabase.auth.getSession();
      const user = sess?.session?.user;

      if (!user) {
        setDisplayName("");
        setLoadingMe(false);
        return;
      }

      const { data, error } = await supabase
        .from("participants")
        .select("display_name")
        .eq("user_id", user.id)
        .maybeSingle();

      if (error) console.error(error);
      setDisplayName(data?.display_name || "");
      setLoadingMe(false);
    })();
  }, []);

  const onChange = (e) => setForm((f) => ({ ...f, [e.target.name]: e.target.value }));

  const onSubmit = async (e) => {
    e.preventDefault();
    setOk(false);

    if (!album?.id) return alert("Kein aktuelles Album gefunden.");

    if (!displayName) {
      alert("Nicht angemeldet. Bitte zuerst anmelden (Magic Link).");
      return;
    }

    // Pflichtfelder (Textzeile optional)
    if (!form.liebstes_lied || !form.schlechtestes_lied || !form.bewertung) {
      alert("Bitte alle Felder ausfüllen (außer Beste Textzeile).");
      return;
    }

    const rating = mapBewertungToRating(form.bewertung);
    if (rating === null) return alert("Bitte eine gültige Gesamtbewertung auswählen.");

    setSending(true);
    try {
      const { data: sessionData } = await supabase.auth.getSession();
      const token = sessionData?.session?.access_token;
      if (!token) {
        alert("Nicht eingeloggt. Bitte Magic Link nutzen.");
        return;
      }

      const payload = {
        album_week_id: album.id,
        rating,
        favorite_song: form.liebstes_lied.trim(),
        favorite_lyric: form.beste_textzeile?.trim() || null,
        worst_song: form.schlechtestes_lied.trim(),
        comment: null,
      };

      const res = await fetch("/api/votes", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify(payload),
      });

      const out = await res.json().catch(() => ({}));
      if (!res.ok) return alert(out?.error || `Fehler (HTTP ${res.status})`);

      setOk(true);
      setForm({ liebstes_lied: "", beste_textzeile: "", schlechtestes_lied: "", bewertung: "" });
      onSubmitted?.();
    } finally {
      setSending(false);
    }
  };

  if (!album) return null;

  if (!displayName && !loadingMe) {
    return (
      <div className="form-card text-left">
        <p className="meta">Teilnehmer</p>
        <p className="text-sm opacity-80">
          Nicht angemeldet.<br />
          Bitte unten anmelden (Magic Link), dann kannst du bewerten.
        </p>
      </div>
    );
  }

  if (ok) {
    return (
      <div className="form-card text-center">
        <p className="font-display text-xl tracking-wide text-retro-accent">✅ Danke für deine Bewertung!</p>
      </div>
    );
  }

  return (
    <form onSubmit={onSubmit} className="form-card" noValidate>
      <h3 className="text-retro-accent font-display text-2xl mb-1 tracking-widest text-center">
        ALBUM BEWERTEN
      </h3>

      <div className="form-group">
        <label>Teilnehmer</label>
        <input value={displayName || "…"} disabled className="opacity-80" />
      </div>

      <div className="form-group">
        <label htmlFor="liebstes_lied">Liebstes Lied</label>
        <input id="liebstes_lied" name="liebstes_lied" value={form.liebstes_lied} onChange={onChange} required disabled={sending} />
      </div>

      <div className="form-group">
        <label htmlFor="beste_textzeile">Beste Textzeile (optional)</label>
        <textarea id="beste_textzeile" name="beste_textzeile" value={form.beste_textzeile} onChange={onChange} rows={3} disabled={sending} />
      </div>

      <div className="form-group">
        <label htmlFor="schlechtestes_lied">Schlechtestes Lied</label>
        <input id="schlechtestes_lied" name="schlechtestes_lied" value={form.schlechtestes_lied} onChange={onChange} required disabled={sending} />
      </div>

      <div className="form-group">
        <label htmlFor="bewertung">Gesamtbewertung</label>
        <select id="bewertung" name="bewertung" value={form.bewertung} onChange={onChange} required disabled={sending}>
          <option value="">Bitte wählen…</option>
          <option value="Hit">Hit</option>
          <option value="Geht in Ordnung">Geht in Ordnung</option>
          <option value="Niete">Niete</option>
        </select>
      </div>

      <button type="submit" disabled={sending || loadingMe}>
        {sending ? "WIRD GESENDET…" : "SUBMIT"}
      </button>
    </form>
  );
}
