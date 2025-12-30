"use client";

import { useState } from "react";
import { supabase } from "../lib/supabaseClient";

export default function ParticipantSignupForm({ onDone }) {
  const [displayName, setDisplayName] = useState("");
  const [email, setEmail] = useState("");

  const [sending, setSending] = useState(false);
  const [ok, setOk] = useState(false);

  const onSubmit = async (e) => {
    e.preventDefault();
    e.stopPropagation();

    const dn = displayName.trim();
    const em = email.trim();

    if (!dn) {
      alert("Bitte Name eingeben.");
      return;
    }
    if (!em) {
      alert("Bitte E-Mail eingeben.");
      return;
    }

    setSending(true);
    setOk(false);

    try {
      // Display-Name für den Callback merken
      if (typeof window !== "undefined") {
        localStorage.setItem("pending_display_name", dn);
        localStorage.setItem("pending_email", em);
      }

      // Magic Link senden (Login)
      const { error } = await supabase.auth.signInWithOtp({
        email: em,
        options: {
          // WICHTIG: diese Route erstellen wir unten
          emailRedirectTo: `${window.location.origin}/auth/callback`,
        },
      });

      if (error) throw error;

      setOk(true);
      // optional: Felder leeren
      // setDisplayName("");
      // setEmail("");

      onDone?.();
    } catch (err) {
      console.error(err);
      alert(`Konnte Login-Link nicht senden.\n${err?.message ?? ""}`);
    } finally {
      setSending(false);
    }
  };

  if (ok) {
    return (
      <div className="form-card text-center mt-10">
        <p className="font-display text-xl tracking-wide text-retro-accent">
          ✅ Check deine E-Mails – wir haben dir einen Login-Link geschickt.
        </p>
        <p className="text-sm opacity-70 mt-2">
          Nach dem Klick bist du angemeldet und wirst als Teilnehmer gespeichert.
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={onSubmit} className="form-card mt-10" noValidate>
      <h3 className="text-retro-accent font-display text-2xl mb-4 tracking-widest text-center">
        TEILNEHMER ANMELDEN
      </h3>

      <div className="form-group">
        <label htmlFor="displayName">Name</label>
        <input
          id="displayName"
          value={displayName}
          onChange={(e) => setDisplayName(e.target.value)}
          required
          disabled={sending}
        />
      </div>

      <div className="form-group">
        <label htmlFor="email">E-Mail</label>
        <input
          id="email"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          disabled={sending}
        />
      </div>

      <button type="submit" disabled={sending}>
        {sending ? "WIRD GESENDET…" : "LOGIN-LINK SENDEN"}
      </button>
    </form>
  );
}
