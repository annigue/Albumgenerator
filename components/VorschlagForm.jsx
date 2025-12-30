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
        .select("display_name")
        .order("display_name", { ascending: true });

      if (error) console.error("participants load error:", error);

      setParticipants((data ?? []).map((x) => x.display_name));
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
        throw new Error(data?.error || `Fehler beim Vorschlagen (HTTP ${res.status})`);
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

      <div className="form-group">
        <label>Teilnehmer</label>
        <select
          name="suggested_by"
          value={form.suggested_by}
          onChange={onChange}
          required
          disabled={loadingParticipants}
        >
          <option value="">
            {loadingParticipants ? "Lade Teilnehmer…" : "Bitte wählen…"}
          </option>
          {participants.map((p) => (
            <option key={p} value={p}>
              {p}
            </option>
          ))}
        </select>
      </div>

      <div className="form-group">
        <label>Albumtitel</label>
        <input
          name="title"
          value={form.title}
          onChange={onChange}
          required
          placeholder="z.B. OK Computer"
        />
      </div>

      <div className="form-group">
        <label>Interpret</label>
        <input
          name="artist"
          value={form.artist}
          onChange={onChange}
          required
          placeholder="z.B. Radiohead"
        />
      </div>

      <div className="form-group">
        <label>Warum dieses Album?</label>
        <textarea
          name="reason"
          value={form.reason}
          onChange={onChange}
          rows={3}
          required
        />
      </div>

      <div className="form-group">
        <label>Lieblingslied</label>
        <input
          name="favorite_song"
          value={form.favorite_song}
          onChange={onChange}
          required
        />
      </div>

      <div className="form-group">
        <label>Liebste Textzeile (optional)</label>
        <textarea
          name="favorite_lyric"
          value={form.favorite_lyric}
          onChange={onChange}
          rows={2}
          placeholder="optional"
        />
      </div>

      <div className="form-group">
        <label>Schlechtestes Lied</label>
        <input
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
