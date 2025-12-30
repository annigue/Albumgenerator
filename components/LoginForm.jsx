"use client";

import { useState } from "react";
import { supabase } from "../lib/supabaseClient";


export default function LoginForm() {
  const [displayName, setDisplayName] = useState("");
  const [email, setEmail] = useState("");
  const [sending, setSending] = useState(false);
  const [msg, setMsg] = useState("");

  const onSubmit = async (e) => {
    e.preventDefault();
    setMsg("");

    const dn = displayName.trim();
    const em = email.trim();

    if (!dn) return setMsg("Bitte Name eingeben.");
    if (!em) return setMsg("Bitte E-Mail eingeben.");

    setSending(true);
    try {
      // für callback-seite speichern
      localStorage.setItem("pending_display_name", dn);
      localStorage.setItem("pending_email", em);

      const redirectTo = `${window.location.origin}/auth/callback`;

      const { error } = await supabase.auth.signInWithOtp({
        email: em,
        options: { emailRedirectTo: redirectTo },
      });

      if (error) throw error;

      setMsg("✅ Magic Link wurde gesendet. Bitte E-Mail öffnen.");
    } catch (err) {
      console.error(err);
      setMsg(`Fehler: ${err?.message ?? "Unbekannt"}`);
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="retro-card p-6">
      <h2 className="font-display text-3xl mb-2 text-center">Login</h2>
      <p className="meta text-center mb-6">
        Name + E-Mail eingeben → du bekommst einen Magic Link
      </p>

      <form onSubmit={onSubmit} className="form-card" noValidate>
        <div className="form-group">
          <label>Name</label>
          <input
            value={displayName}
            onChange={(e) => setDisplayName(e.target.value)}
            required
            disabled={sending}
          />
        </div>

        <div className="form-group">
          <label>E-Mail</label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            disabled={sending}
          />
        </div>

        {msg && <p className="text-sm opacity-80">{msg}</p>}

        <button type="submit" disabled={sending}>
          {sending ? "WIRD GESENDET…" : "MAGIC LINK SENDEN"}
        </button>
      </form>
    </div>
  );
}
