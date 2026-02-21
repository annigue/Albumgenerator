"use client";

import { useEffect, useState } from "react";
import { supabase } from "../lib/supabaseClient";
import { ensureParticipant } from "../lib/ensureParticipant";

const initialForm = {
  title: "",
  artist: "",
  favorite_song: "",
  favorite_lyric: "",
  worst_song: "",
  reason: "",
};

export default function VorschlagForm() {
  const [me, setMe] = useState(null);
  const [loadingMe, setLoadingMe] = useState(true);

  const [form, setForm] = useState(initialForm);
  const [sending, setSending] = useState(false);
  const [ok, setOk] = useState(false);

  useEffect(() => {
    let alive = true;

    (async () => {
      setLoadingMe(true);
      try {
        const p = await ensureParticipant(); // ✅ auto-repair
        if (!alive) return;
        setMe(p);
      } catch (e) {
        console.error("ensureParticipant failed:", e);
        if (!alive) return;
        setMe(null);
      } finally {
        if (alive) setLoadingMe(false);
      }
    })();

    return () => {
      alive = false;
    };
  }, []);

  const onChange = (e) =>
    setForm((f) => ({ ...f, [e.target.name]: e.target.value }));

  const onSubmit = async (e) => {
    e.preventDefault();
    setSending(true);
    setOk(false);

    if (!me?.display_name) {
      alert("Nicht angemeldet. Bitte Magic Link nutzen.");
      setSending(false);
      return;
    }

    if (!form.title || !form.artist || !form.reason || !form.favorite_song || !form.worst_song) {
      alert("Bitte alle Felder ausfüllen (außer Liebste Textzeile).");
      setSending(false);
      return;
    }

    try {
      const { data: sessionData } = await supabase.auth.getSession();
      const accessToken = sessionData?.session?.access_token;
      if (!accessToken) {
        alert("Bitte zuerst einloggen, um vorzuschlagen.");
        return;
      }

      const payload = {
        title: form.title.trim(),
        artist: form.artist.trim(),
        reason: form.reason.trim(),
        favorite_song: form.favorite_song.trim(),
        favorite_lyric: form.favorite_lyric?.trim() || null,
        worst_song: form.worst_song.trim(),
      };

      const res = await fetch("/api/suggestions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${accessToken}`,
        },
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
    <form onSubmit={onSubmit} className="form-card" noValidate>
      <h3 className="text-retro-accent font-display text-2xl mb-4 tracking-widest text-center">
        NEUES ALBUM VORSCHLAGEN
      </h3>

      <div className="form-group">
        <label>Teilnehmer</label>
        <input
          value={loadingMe ? "…" : me?.display_name || ""}
          disabled
          className="opacity-80"
        />
      </div>

      <div className="form-group">
        <label>Albumtitel</label>
        <input name="title" value={form.title} onChange={onChange} required disabled={sending || loadingMe} />
      </div>

      <div className="form-group">
        <label>Interpret</label>
        <input name="artist" value={form.artist} onChange={onChange} required disabled={sending || loadingMe} />
      </div>

      <div className="form-group">
        <label>Lieblingslied</label>
        <input name="favorite_song" value={form.favorite_song} onChange={onChange} required disabled={sending || loadingMe} />
      </div>

      <div className="form-group">
        <label>Beste Textzeile</label>
        <textarea name="favorite_lyric" value={form.favorite_lyric} onChange={onChange} rows={2} disabled={sending || loadingMe} />
      </div>

      <div className="form-group">
        <label>Schlechtestes Lied</label>
        <input name="worst_song" value={form.worst_song} onChange={onChange} required disabled={sending || loadingMe} />
      </div>

      <div className="form-group">
        <label>Warum dieses Album</label>
        <textarea name="reason" value={form.reason} onChange={onChange} rows={3} required disabled={sending || loadingMe} />
      </div>

      <button type="submit" disabled={sending || loadingMe || !me?.display_name}>
        {sending ? "WIRD GESENDET…" : "SUBMIT"}
      </button>
    </form>
  );
}
