"use client";

import { useState } from "react";

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
  const [errorMsg, setErrorMsg] = useState("");

  const onChange = (e) =>
    setForm((f) => ({ ...f, [e.target.name]: e.target.value }));

  const onSubmit = async (e) => {
    e.preventDefault();
    setSending(true);
    setOk(false);
    setErrorMsg("");

    try {
      // 1) Spotify Daten holen (ID + Cover + Link)
      const spotifyRes = await fetch("/api/fetch_spotify_id", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: form.albumtitel,
          artist: form.interpret,
        }),
      });

      const spotifyJson = await spotifyRes.json().catch(() => ({}));
      if (!spotifyRes.ok) {
        throw new Error(spotifyJson?.error || "Spotify Lookup fehlgeschlagen");
      }

      // 2) Vorschlag server-side speichern (robust gegen RLS)
      const saveRes = await fetch("/api/suggestions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          spotify_id: spotifyJson.spotify_id ?? null,
          spotify_url: spotifyJson.spotify_link ?? null, // je nach DB-Spalte
          cover_url: spotifyJson.cover_url ?? null,
          title: form.albumtitel,
          artist: form.interpret,
          suggested_by: form.name,
          note: form.begruendung || null,
          // Falls du diese Felder auch speichern willst, muss /api/suggestions das unterstützen:
          liebstes_lied: form.liebstes_lied || null,
          liebste_textzeile: form.liebste_textzeile || null,
          schlechtestes_lied: form.schlechtestes_lied || null,
        }),
      });

      const saveJson = await saveRes.json().catch(() => ({}));
      if (!saveRes.ok) {
        throw new Error(saveJson?.error || "Speichern fehlgeschlagen");
      }

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
      setErrorMsg(err?.message || "Fehler beim Vorschlagen 😢");
      alert(err?.message || "Fehler beim Vorschlagen 😢");
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

      {errorMsg && (
        <p className="text-sm text-red-700 text-center mt-2">{errorMsg}</p>
      )}

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
