"use client";

import { useState } from "react";

const TEILNEHMER = ["Anne", "Moritz", "Max", "Kathi", "Lena"];

export default function VorschlagForm() {
  const [form, setForm] = useState({
    suggested_by: "",
    title: "",
    artist: "",
    reason: "",
    favorite_song: "",
    favorite_lyric: "",
    worst_song: "",
  });

  const [sending, setSending] = useState(false);
  const [ok, setOk] = useState(false);

  const onChange = (e) =>
    setForm((f) => ({ ...f, [e.target.name]: e.target.value }));

  const onSubmit = async (e) => {
    e.preventDefault();
    setSending(true);
    setOk(false);

    try {
      const res = await fetch("/api/suggestions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });

      const data = await res.json();

      if (!res.ok) {
        // Duplicate case (409)
        if (res.status === 409) {
          alert("Dieses Album wurde bereits vorgeschlagen 🙂");
          return;
        }
        throw new Error(data?.error || "Unbekannter Fehler");
      }

      setOk(true);
      setForm({
        suggested_by: "",
        title: "",
        artist: "",
        reason: "",
        favorite_song: "",
        favorite_lyric: "",
        worst_song: "",
      });
    } catch (err) {
      console.error(err);
      alert("Fehler beim Vorschlagen 😢");
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
    <form onSubmit={onSubmit} className="form-card mt-10">
      <h3 className="text-retro-accent font-display text-2xl mb-4 tracking-widest text-center">
        NEUES ALBUM VORSCHLAGEN
      </h3>

      {/* Teilnehmer */}
      <div className="form-group">
        <label>Teilnehmer</label>
        <select
          name="suggested_by"
          value={form.suggested_by}
          onChange={onChange}
          required
        >
          <option value="">Bitte wählen…</option>
          {TEILNEHMER.map((t) => (
            <option key={t} value={t}>
              {t}
            </option>
          ))}
        </select>
      </div>

      {/* Albumtitel */}
      <div className="form-group">
        <label>Albumtitel</label>
        <input
          name="title"
          value={form.title}
          onChange={onChange}
          placeholder="z.B. OK Computer"
          required
        />
      </div>

      {/* Artist */}
      <div className="form-group">
        <label>Interpret</label>
        <input
          name="artist"
          value={form.artist}
          onChange={onChange}
          placeholder="z.B. Radiohead"
          required
        />
      </div>

      {/* Begründung */}
      <div className="form-group">
        <label>Warum dieses Album?</label>
        <textarea
          name="reason"
          value={form.reason}
          onChange={onChange}
          rows={3}
          placeholder="Warum sollten wir dieses Album hören?"
        />
      </div>

      {/* Lieblingslied */}
      <div className="form-group">
        <label>Lieblingslied</label>
        <input
          name="favorite_song"
          value={form.favorite_song}
          onChange={onChange}
          placeholder="optional"
        />
      </div>

      {/* Lieblingszeile */}
      <div className="form-group">
        <label>Liebste Textzeile</label>
        <textarea
          name="favorite_lyric"
          value={form.favorite_lyric}
          onChange={onChange}
          rows={2}
          placeholder="optional"
        />
      </div>

      {/* Schlechtestes Lied */}
      <div className="form-group">
        <label>Schlechtestes Lied</label>
        <input
          name="worst_song"
          value={form.worst_song}
          onChange={onChange}
          placeholder="optional"
        />
      </div>

      <button type="submit" disabled={sending}>
        {sending ? "WIRD GESENDET…" : "SUBMIT"}
      </button>
    </form>
  );
}
