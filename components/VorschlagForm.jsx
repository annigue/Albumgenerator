"use client";

import { useEffect, useState } from "react";
import { supabase } from "../lib/supabaseClient";

const initialForm = {
  suggested_by: "",
  title: "",
  artist: "",
  reason: "",
  favorite_song: "",
  favorite_lyric: "",
  worst_song: "",
};

export default function VorschlagForm() {
  const [participants, setParticipants] = useState([]);
  const [loadingParticipants, setLoadingParticipants] = useState(true);

  const [form, setForm] = useState(initialForm);
  const [sending, setSending] = useState(false);
  const [ok, setOk] = useState(false);

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

    setSending(true);
    setOk(false);

    // Pflichtfelder: alles außer favorite_lyric
    if (
      !form.suggested_by ||
      !form.title ||
      !form.artist ||
      !form.reason ||
      !form.favorite_song ||
      !form.worst_song
    ) {
      alert("Bitte alle Felder ausfüllen (außer Liebste Textzeile).");
      setSending(false);
      return;
    }

    const payload = {
      suggested_by: form.suggested_by.trim(),
      title: form.title.trim(),
      artist: form.artist.trim(),
      reason: form.reason.trim(),
      favorite_song: form.favorite_song.trim(),
      favorite_lyric: form.favorite_lyric?.trim() || null, // optional
      worst_song: form.worst_song.trim(),
    };

    try {
      const res = await fetch("/api/suggestions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        if (res.status === 409) {
          alert("Dieses Album wurde bereits vorgeschlagen 🙂");
          return;
        }

        const msg = data?.error || `Fehler beim Vorschlagen (HTTP ${res.status})`;
        throw new Error(msg);
      }

      setOk(true);
      setForm(initialForm);
    } catch (err) {
      console.error(err);
      alert(`Fehler beim Vorschlagen 😢\n${err?.message ?? ""}`);
    } finally {
      setSending(false);
    }
  };

  if (ok) {
    return (
      <div className="form-card text-center mt-10">
        <p className="font-display text-xl tracking-wide text-retro-accent">
          ✅ Danke für deinen Vorschlag!
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={onSubmit} className="form-card mt-10" noValidate>
      <h3 className="text-retro-accent font-display text-2xl mb-4 tracking-widest text-center">
        NEUES ALBUM VORSCHLAGEN
      </h3>

      {/* Teilnehmer */}
      <div className="form-group">
        <label htmlFor="suggested_by">Teilnehmer</label>
        <select
          id="suggested_by"
          name="suggested_by"
          value={form.suggested_by}
          onChange={onChange}
          required
          disabled={loadingParticipants}
        >
          <option value="">
            {loadingParticipants ? "Lade Teilnehmer…" : "Bitte wählen…"}
          </option>
          {participants.map((t) => (
            <option key={t} value={t}>
              {t}
            </option>
          ))}
        </select>

        <p className="text-xs opacity-70 mt-1">
          Fehlt dein Name? Dann melde dich unten an.
        </p>
      </div>

      {/* Albumtitel */}
      <div className="form-group">
        <label htmlFor="title">Albumtitel</label>
        <input
          id="title"
          name="title"
          value={form.title}
          onChange={onChange}
          placeholder="z.B. OK Computer"
          required
        />
      </div>

      {/* Artist */}
      <div className="form-group">
        <label htmlFor="artist">Interpret</label>
        <input
          id="artist"
          name="artist"
          value={form.artist}
          onChange={onChange}
          placeholder="z.B. Radiohead"
          required
        />
      </div>

      {/* Begründung */}
      <div className="form-group">
        <label htmlFor="reason">Warum dieses Album?</label>
        <textarea
          id="reason"
          name="reason"
          value={form.reason}
          onChange={onChange}
          rows={3}
          placeholder="Warum sollten wir dieses Album hören?"
          required
        />
      </div>

      {/* Lieblingslied */}
      <div className="form-group">
        <label htmlFor="favorite_song">Lieblingslied</label>
        <input
          id="favorite_song"
          name="favorite_song"
          value={form.favorite_song}
          onChange={onChange}
          required
        />
      </div>

      {/* Lieblingszeile */}
      <div className="form-group">
        <label htmlFor="favorite_lyric">Liebste Textzeile (optional)</label>
        <textarea
          id="favorite_lyric"
          name="favorite_lyric"
          value={form.favorite_lyric}
          onChange={onChange}
          rows={2}
          placeholder="optional"
        />
      </div>

      {/* Schlechtestes Lied */}
      <div className="form-group">
        <label htmlFor="worst_song">Schlechtestes Lied</label>
        <input
          id="worst_song"
          name="worst_song"
          value={form.worst_song}
          onChange={onChange}
          required
        />
      </div>

      <button type="submit" disabled={sending}>
        {sending ? "WIRD GESENDET…" : "SUBMIT"}
      </button>
    </form>
  );
}
