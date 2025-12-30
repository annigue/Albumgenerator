"use client";

import { useEffect, useState } from "react";
import { supabase } from "../lib/supabaseClient";

export default function ParticipantSignupForm() {
  const [displayName, setDisplayName] = useState("");
  const [email, setEmail] = useState("");

  const [sending, setSending] = useState(false);
  const [info, setInfo] = useState(""); // success/info message
  const [error, setError] = useState("");

  // ✅ Wenn User über Magic Link zurückkommt und Session existiert:
  // -> Participant upserten (einmalig)
  useEffect(() => {
    let mounted = true;

    (async () => {
      const { data } = await supabase.auth.getSession();
      const session = data?.session;
      if (!session) return;

      const pendingName = localStorage.getItem("pending_display_name") || "";
      const pendingEmail = localStorage.getItem("pending_email") || session.user.email || "";

      // Wenn kein Name gespeichert ist: nichts tun
      if (!pendingName) return;

      // Upsert Participant (user_id unique)
      const payload = {
        user_id: session.user.id,
        display_name: pendingName.trim(),
        email: pendingEmail.trim(),
      };

      const { error: upsertErr } = await supabase
        .from("participants")
        .upsert(payload, { onConflict: "user_id" });

      if (!mounted) return;

      if (upsertErr) {
        console.error("participants upsert error:", upsertErr);
        setError("Login ok, aber Profil konnte nicht gespeichert werden.");
        return;
      }

      // Clean up
      localStorage.removeItem("pending_display_name");
      localStorage.removeItem("pending_email");

      setInfo("✅ Eingeloggt! Du kannst jetzt bewerten und vorschlagen.");
    })();

    return () => {
      mounted = false;
    };
  }, []);

  const onSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setInfo("");

    if (!displayName.trim()) {
      setError("Bitte Name angeben.");
      return;
    }
    if (!email.trim()) {
      setError("Bitte Email angeben.");
      return;
    }

    setSending(true);

    try {
      // Name+Email zwischenspeichern, damit wir sie nach dem Login in participants schreiben können
      localStorage.setItem("pending_display_name", displayName.trim());
      localStorage.setItem("pending_email", email.trim());

      const redirectTo =
        typeof window !== "undefined"
          ? `${window.location.origin}/`
          : undefined;

      const { error: otpErr } = await supabase.auth.signInWithOtp({
        email: email.trim(),
        options: {
          emailRedirectTo: redirectTo,
        },
      });

      if (otpErr) throw otpErr;

      setInfo("✅ Magic Link ist unterwegs. Bitte Email öffnen und Link klicken.");
    } catch (err) {
      console.error(err);
      setError(err?.message || "Fehler beim Senden des Magic Links.");
    } finally {
      setSending(false);
    }
  };

  return (
    <form onSubmit={onSubmit} className="form-card mt-10" noValidate>
      <h3 className="text-retro-accent font-display text-2xl mb-4 tracking-widest text-center">
        TEILNEHMER ANMELDEN
      </h3>

      <div className="form-group">
        <label>Name</label>
        <input
          value={displayName}
          onChange={(e) => setDisplayName(e.target.value)}
          required
          disabled={sending}
          placeholder="z.B. Anne"
        />
      </div>

      <div className="form-group">
        <label>Email</label>
        <input
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          disabled={sending}
          placeholder="z.B. a.gue@gmx.net"
        />
      </div>

      {error && <p className="text-sm text-red-700">{error}</p>}
      {info && <p className="text-sm opacity-80">{info}</p>}

      <button type="submit" disabled={sending}>
        {sending ? "WIRD GESENDET…" : "MAGIC LINK SENDEN"}
      </button>

      <p className="text-xs opacity-70 mt-2">
        Nach dem Login kannst du bewerten und Alben vorschlagen.
      </p>
    </form>
  );
}
