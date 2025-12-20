"use client";

import { useState } from "react";
import { supabase } from "@/lib/supabaseClient";

const TEILNEHMER = ["Anne", "Moritz", "Max", "Kathi", "Lena"];

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

    const { error } = await supabase.from("bewertungen").insert([payload]);

    setSending(false);

    if (error) {
      console.error(error);
      alert("Fehler beim Absenden 😢");
      return;
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
    <form onSubmit={onSubmit} className="form-card">
      <h3 className="text-retro-accent font-display text-2xl mb-1 tracking-widest text-center">
        ALBUM BEWERTEN
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
        <label htmlFor="beste_textzeile">Beste Textzeile</label>
        <textarea
          id="beste_textzeile"
          name="beste_textzeile"
          value={form.beste_textzeile}
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

      <div className="form-group">
        <label htmlFor="bewertung">Gesamtbewertung</label>
        <select
          id="bewertung"
          name="bewertung"
          value={form.bewertung}
          onChange={onChange}
          required
        >
          <option value="">Bitte wählen…</option>
          <option value="Hit">Hit</option>
          <option value="Geht in Ordnung">Geht in Ordnung</option>
          <option value="Niete">Niete</option>
        </select>
      </div>

      <button type="submit" disabled={sending}>
        {sending ? "WIRD GESENDET…" : "SUBMIT"}
      </button>
    </form>
  );
}
