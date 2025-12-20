"use client";

import { useState } from "react";
import { supabase } from "../lib/supabaseClient";

const TEILNEHMER = ["Anne", "Moritz", "Max", "Kathi", "Lena"];

export default function VorschlagForm() {
  const [form, setForm] = useState({
    name: "",
    albumtitel: "",
    interpret: "",
    begruendung: "",
    liebstes_lied: "",
    liebste_textzeile: "",
    schlechtestes_lied: "",
  });

  const [ok, setOk] = useState(false);
  const [sending, setSending] = useState(false);

  const onChange = (e) =>
    setForm((f) => ({ ...f, [e.target.name]: e.target.value }));

  const onSubmit = async (e) => {
    e.preventDefault();
    setSending(true);
    setOk(false);

    try {
      // 1) Spotify Daten holen (ID + Cover + Link)
      const res = await fetch("/api/fetch_spotify_id", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: form.albumtitel,
          artist: form.interpret,
        }),
      });

      const spotifyData = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(spotifyData.error || "Spotify error");
      }

      // 2) Vorschlag speichern
      const { error } = await supabase.from("vorschlaege").insert([
        {
          name: form.name,
          albumtitel: form.albumtitel,
          interpret: form.interpret,
          begruendung: form.begruendung || null,
          liebstes_lied: form.liebstes_lied || null,
          liebste_textzeile: form.liebste_textzeile || null,
          schlechtestes_lied: form.schlechtestes_lied || null,
          spotify_id: spotifyData.spotify_id ?? null,
          spotify_link: spotifyData.spotify_link ?? null,
          cover_url: spotifyData.cover_url ?? null,
        },
      ]);

      if (error) throw error;

      setOk(true);
      setForm({
        name: "",
        albumtitel: "",
        interpret: "",
        begruendung: "",
        liebstes_lied: "",
        liebste_textzeile: "",
        schlechtestes_lied: "",
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
      <h3 className="text-retro-accent font-display text-2xl mb-1 tracking-widest text-center">
        NEUES ALBUM VORSCHLAGEN
      </h3>

      <div className="form-group">
        <label htmlFor="name">Teilnehmer</label>
        <select
          id="name"
          name="name"
          value={form.name}
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

      <div className="form-group">
        <label htmlFor="albumtitel">Albumtitel</label>
        <input
          id="albumtitel"
          name="albumtitel"
          value={form.albumtitel}
          onChange={onChange}
          placeholder="z.B. OK Computer"
          required
        />
      </div>

      <div className="form-group">
        <label htmlFor="interpret">Interpret</label>
        <input
          id="interpret"
          name="interpret"
          value={form.interpret}
          onChange={onChange}
          placeholder="z.B. Radiohead"
          required
        />
      </div>

      <div className="form-group">
        <label htmlFor="begruendung">Begründung</label>
        <textarea
          id="begruendung"
          name="begruendung"
          value={form.begruendung}
          onChange={onChange}
          placeholder="optional"
          rows={3}
        />
      </div>

      <div className="form-group">
        <label htmlFor="liebstes_lied">Liebstes Lied</label>
        <input
          id="liebstes_lied"
          name="liebstes_lied"
          value={form.liebstes_lied}
          onChange={onChange}
          placeholder="optional"
        />
      </div>

      <div className="form-group">
        <label htmlFor="liebste_textzeile">Liebste Textzeile</label>
        <textarea
          id="liebste_textzeile"
          name="liebste_textzeile"
          value={form.liebste_textzeile}
          onChange={onChange}
          placeholder="optional"
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
          placeholder="optional"
        />
      </div>

      <button type="submit" disabled={sending}>
        {sending ? "WIRD GESENDET…" : "SUBMIT"}
      </button>
    </form>
  );
}
