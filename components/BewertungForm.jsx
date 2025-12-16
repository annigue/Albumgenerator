// components/BewertungForm.jsx
"use client";

import { useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import { TEILNEHMER } from "@/lib/constants";

export default function BewertungForm({ album, onSubmitted }) {
  const [form, setForm] = useState({
    name: "",
    liebstes_lied: "",
    beste_textzeile: "",
    schlechtestes_lied: "",
    bewertung: "",
  });
  const [ok, setOk] = useState(false);
  const [sending, setSending] = useState(false);

  const onChange = (e) =>
    setForm((f) => ({ ...f, [e.target.name]: e.target.value }));

  const onSubmit = async (e) => {
    e.preventDefault();
    if (!album?.id) {
      alert("Kein Album ausgewählt. Bitte versuche es erneut.");
      return;
    }

    setSending(true);
    setOk(false);

    const payload = {
      album_id: album.id,
      albumtitel: album.title,
      name: form.name,
      liebstes_lied: form.liebstes_lied || null,
      beste_textzeile: form.beste_textzeile || null,
      schlechtestes_lied: form.schlechtestes_lied || null,
      bewertung: form.bewertung,
    };

    try {
      // 1) Existiert schon eine Bewertung von name für album_id?
      const { data: existing, error: findErr } = await supabase
        .from("bewertungen")
        .select("id")
        .eq("album_id", album.id)
        .eq("name", form.name)
        .limit(1)
        .maybeSingle();

      if (findErr) throw findErr;

      // 2) Update wenn vorhanden, sonst Insert
      if (existing?.id) {
        const { error: updErr } = await supabase
          .from("bewertungen")
          .update(payload)
          .eq("id", existing.id);
        if (updErr) throw updErr;
      } else {
        const { error: insErr } = await supabase
          .from("bewertungen")
          .insert([payload]);
        if (insErr) throw insErr;
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
    } catch (error) {
      console.error(error);
      alert("Fehler beim Absenden 😢");
    } finally {
      setSending(false);
    }
  };

  if (!album) return null;

  if (ok) {
    return (
      <div className="text-center text-green-600 mt-4">
        ✅ Danke! (Wenn du nochmal abschickst, wird deine Bewertung überschrieben.)
      </div>
    );
  }

  return (
    <form
      onSubmit={onSubmit}
      className="border-2 border-retro-border bg-retro-bg p-6 space-y-3 text-center"
    >
      <h3 className="text-retro-accent font-display text-2xl mb-2 tracking-wide">
        ALBUM BEWERTEN
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
        name="liebstes_lied"
        value={form.liebstes_lied}
        onChange={onChange}
        placeholder="Liebstes Lied"
        className="w-full border border-retro-border bg-transparent p-2 text-sm"
      />

      <textarea
        name="beste_textzeile"
        value={form.beste_textzeile}
        onChange={onChange}
        placeholder="Beste Textzeile"
        className="w-full border border-retro-border bg-transparent p-2 text-sm"
      />

      <input
        name="schlechtestes_lied"
        value={form.schlechtestes_lied}
        onChange={onChange}
        placeholder="Schlechtestes Lied"
        className="w-full border border-retro-border bg-transparent p-2 text-sm"
      />

      <select
        name="bewertung"
        value={form.bewertung}
        onChange={onChange}
        className="w-full border border-retro-border bg-transparent p-2 text-sm"
        required
      >
        <option value="">Gesamtbewertung wählen</option>
        <option value="Hit">Hit</option>
        <option value="Geht in Ordnung">Geht in Ordnung</option>
        <option value="Niete">Niete</option>
      </select>

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
