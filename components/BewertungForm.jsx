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
    display_name: "", // ✅ wichtig: so heißt das Feld jetzt
    liebstes_lied: "",
    beste_textzeile: "",
    schlechtestes_lied: "",
    bewertung: "",
  });

  const [ok, setOk] = useState(false);
  const [sending, setSending] = useState(false);

  useEffect(() => {
    let alive = true;

    (async () => {
      setLoadingParticipants(true);

      const { data, error } = await supabase
        .from("participants")
        .select("display_name")
        .order("display_name", { ascending: true });

      if (!alive) return;

      if (error) {
        console.error("participants load error:", error);
        setParticipants([]);
      } else {
        setParticipants((data ?? []).map((x) => x.display_name).filter(Boolean));
      }

      setLoadingParticipants(false);
    })();

    return () => {
      alive = false;
    };
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

    // Pflichtfelder (alles außer Textzeile)
    if (
      !form.display_name ||
      !form.liebstes_lied ||
      !form.schlechtestes_lied ||
      !form.bewertung
    ) {
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
      // ✅ Token holen und mitschicken (Server prüft User + setzt user_id serverseitig)
      const { data: sessionData, error: sessionErr } = await supabase.auth.getSession();
      if (sessionErr) console.error("getSession error:", sessionErr);

      const accessToken = sessionData?.session?.access_token;
      if (!accessToken) {
        alert("Bitte zuerst einloggen, um zu bewerten.");
        return;
      }

      const payload = {
        album_week_id: album.id, // UUID
        rating, // -1/0/1
        favorite_song: form.liebstes_lied.trim(),
        favorite_lyric: form.beste_textzeile?.trim() || null, // optional
        worst_song: form.schlechtestes_lied.trim(),
        comment: null,
        // ⚠️ KEIN voter / display_name mitsenden, das muss serverseitig über auth + participants kommen
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
        console.error("Vote POST failed:", res.status, data);
        alert(data?.error || `Fehler beim Absenden (HTTP ${res.status})`);
        return;
      }

      setOk(true);
      setForm({
        display_name: "",
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

      <div className="form-group">
  <label htmlFor="display_name">Teilnehmer</label>
  <select
    id="display_name"
    name="name"
    value={form.name}
    onChange={onChange}
    required
    disabled={loadingParticipants || sending}
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
</div>


      <div className="form-group">
        <label htmlFor="liebstes_lied">Liebstes Lied</label>
        <input
          id="liebstes_lied"
          name="liebstes_lied"
          value={form.liebstes_lied}
          onChange={onChange}
          required
          disabled={sending}
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
          disabled={sending}
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
          disabled={sending}
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
          disabled={sending}
        >
          <option value="">Bitte wählen…</option>
          <option value="Hit">Hit</option>
          <option value="Geht in Ordnung">Geht in Ordnung</option>
          <option value="Niete">Niete</option>
        </select>
      </div>

      <button type="submit" disabled={sending || loadingParticipants}>
        {sending ? "WIRD GESENDET…" : "SUBMIT"}
      </button>
    </form>
  );
}
