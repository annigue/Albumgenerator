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
  const [me, setMe] = useState(null); // { user_id, display_name }
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

      const { data: userData, error: userErr } = await supabase.auth.getUser();
      if (userErr) console.error("getUser error:", userErr);

      const user = userData?.user;
      if (!user) {
        setMe(null);
        setLoadingMe(false);
        return;
      }

      const { data: p, error: pErr } = await supabase
        .from("participants")
        .select("user_id, display_name")
        .eq("user_id", user.id)
        .maybeSingle();

      if (pErr) console.error("participants load error:", pErr);

      setMe(p ?? null);
      setLoadingMe(false);
    })();
  }, []);

  const onChange = (e) => {
    const { name, value } = e.target;
    setForm((f) => ({ ...f, [name]: value }));
  };

  const onSubmit = async (e) => {
    e.preventDefault();
    e.stopPropagation();

    setOk(false);

    if (!album?.id) {
      alert("Kein aktuelles Album gefunden (album.id fehlt).");
      return;
    }

    if (!me?.user_id) {
      alert("Du bist nicht richtig registriert. Bitte einmal neu einloggen und Name/E-Mail speichern.");
      return;
    }

    // Pflichtfelder (alles außer Textzeile)
    if (!form.liebstes_lied || !form.schlechtestes_lied || !form.bewertung) {
      alert("Bitte alle Felder ausfüllen (außer Beste Textzeile).");
      return;
    }

    const rating = mapBewertungToRating(form.bewertung);
    if (rating === null) {
      alert("Bitte eine gültige Gesamtbewertung auswählen.");
      return;
    }

    setSending(true);

    try {
      const { data: sessionData } = await supabase.auth.getSession();
      const accessToken = sessionData?.session?.access_token;
      if (!accessToken) {
        alert("Bitte zuerst einloggen, um zu bewerten.");
        return;
      }

      const payload = {
        album_week_id: album.id,
        rating,
        favorite_song: form.liebstes_lied.trim(),
        favorite_lyric: form.beste_textzeile?.trim() || null, // optional
        worst_song: form.schlechtestes_lied.trim(),
        comment: null,
      };

      const res = await fetch("/api/votes", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify(payload),
      });

      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        alert(data?.error || `Fehler beim Absenden (HTTP ${res.status})`);
        return;
      }

      setOk(true);
      setForm({
        liebstes_lied: "",
        beste_textzeile: "",
        schlechtestes_lied: "",
        bewertung: "",
      });

      onSubmitted?.();
    } catch (err) {
      console.error(err);
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

      <div className="text-center text-sm opacity-80">
        {loadingMe ? (
          <span className="meta">Lade Benutzer…</span>
        ) : me?.display_name ? (
          <span className="meta">Eingeloggt als: {me.display_name}</span>
        ) : (
          <span className="meta">Kein Teilnehmerprofil gefunden.</span>
        )}
      </div>

      <div className="form-group">
        <label htmlFor="liebstes_lied">Liebstes Lied</label>
        <input
          id="liebstes_lied"
          name="liebstes_lied"
          value={form.liebstes_lied}
          onChange={onChange}
          required
          disabled={sending || loadingMe}
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
          disabled={sending || loadingMe}
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
          disabled={sending || loadingMe}
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
          disabled={sending || loadingMe}
        >
          <option value="">Bitte wählen…</option>
          <option value="Hit">Hit</option>
          <option value="Geht in Ordnung">Geht in Ordnung</option>
          <option value="Niete">Niete</option>
        </select>
      </div>

      <button type="submit" disabled={sending || loadingMe || !me?.display_name}>
        {sending ? "WIRD GESENDET…" : "SUBMIT"}
      </button>
    </form>
  );
}
