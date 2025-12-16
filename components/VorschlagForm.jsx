// components/VorschlagForm.jsx
"use client";

import { useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import { TEILNEHMER } from "@/lib/constants";

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
      const res = await fetch("/api/fetch_spotify_id", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: form.albumtitel,
          artist: form.interpret,
        }),
      });

      const spotifyData = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(spotifyData.error || "Spotify error");

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
      <div className="text-center text-green-600 mt-10">
        ✅ Danke für deinen Vorschlag!
      </div>
    );
  }

  return (
    <form
      onSubmit={onSubmit}
      className="border-2 border-retro-border bg-retro-bg p-6 mt-10 space-y-3 text-center"
    >
      <h3 className="text-retro-accent font-display text-2xl mb-2 tracking-wide">
        NEUES ALBUM VORSCHLAGEN
      </h3>

      <select
        name="name"
        value={form.name}
        onChange={onChange}
        className="w-full border border-retro-border bg-transparent p-2 text-sm"
        required
      >
        <option value="">Teilnehmer wählen</option>
        {TEILNEHMER.map((t) => (
          <option key={t} value={t}>
            {t}
          </option>
        ))}
      </select>

      <input
        name="albumtitel"
        value={form.albumtitel}
        onChange={onChange}
        placeholder="Albumtitel"
        className="w-full border border-retro-border bg-transparent p-2 text-sm"
        required
      />

      <input
        name="interpret"
        value={form.interpret}
        onChange={onChange}
        placeholder="Interpret"
        className="w-full border border-retro-border bg-transparent p-2 text-sm"
        required
      />

      <textarea
        name="begruendung"
        value={form.begruendung}
        onChange={onChange}
        placeholder="Warum sollen wir dieses Album hören?"
        className="w-full border border-retro-border bg-transparent p-2 text-sm"
      />

      <input
        name="liebstes_lied"
        value={form.liebstes_lied}
        onChange={onChange}
        placeholder="Liebstes Lied"
        className="w-full border border-retro-border bg-transparent p-2 text-sm"
      />

      <textarea
        name="liebste_textzeile"
        value={form.liebste_textzeile}
        onChange={onChange}
        placeholder="Liebste Textzeile"
        className="w-full border border-retro-border bg-transparent p-2 text-sm"
      />

      <input
        name="schlechtestes_lied"
        value={form.schlechtestes_lied}
        onChange={onChange}
        placeholder="Schlechtestes Lied"
        className="w-full border border-retro-border bg-transparent p-2 text-sm"
      />

      <button
        type="submit"
        disabled={sending}
        className="w-full bg-retro-accent text-white font-display text-xl py-2 hover:bg-black transition disabled:opacity-50"
      >
        {sending ? "WIRD GESENDET…" : "SUBMIT"}
      </button>
    </form>
  );
}
