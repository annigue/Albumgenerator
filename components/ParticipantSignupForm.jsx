"use client";

import { useState } from "react";

export default function ParticipantSignupForm({ onDone }) {
  const [display_name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [sending, setSending] = useState(false);
  const [ok, setOk] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    setSending(true);
    setOk(false);

    try {
      const res = await fetch("/api/participants", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email }),
      });

      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        alert(data?.error || `Fehler (HTTP ${res.status})`);
        return;
      }

      setOk(true);
      setName("");
      setEmail("");
      onDone?.(); // z.B. Liste neu laden
    } finally {
      setSending(false);
    }
  };

  if (ok) {
    return (
      <div className="form-card text-center">
        <p className="font-display text-xl tracking-wide text-retro-accent">
          ✅ Angemeldet!
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={submit} className="form-card">
      <h3 className="text-retro-accent font-display text-2xl mb-4 tracking-widest text-center">
        TEILNEHMER ANMELDEN
      </h3>

      <div className="form-group">
        <label>Name</label>
        <input value={name} onChange={(e) => setName(e.target.value)} required />
      </div>

      <div className="form-group">
        <label>Email (optional)</label>
        <input value={email} onChange={(e) => setEmail(e.target.value)} />
      </div>

      <button type="submit" disabled={sending}>
        {sending ? "WIRD GESENDET…" : "ANMELDEN"}
      </button>
    </form>
  );
}
