"use client";

import { useEffect, useState } from "react";
import { supabase } from "../../lib/supabaseClient"; // ✅ korrekt relativ zu /app/auth/callback

export default function AuthCallbackPage() {
  const [msg, setMsg] = useState("Anmeldung wird abgeschlossen…");

  useEffect(() => {
    (async () => {
      try {
        // 1) Versuch: Session aus URL übernehmen (Hash oder Code)
        // getSessionFromUrl gibt’s in supabase-js v2 (je nach Version)
        // fallback: exchangeCodeForSession (PKCE)
        let session = null;

        // A) Hash flow
        if (supabase.auth.getSessionFromUrl) {
          const { data, error } = await supabase.auth.getSessionFromUrl({ storeSession: true });
          if (error) console.warn("getSessionFromUrl error:", error);
          session = data?.session ?? null;
        }

        // B) PKCE code flow fallback
        if (!session) {
          const hasCode = typeof window !== "undefined" && new URLSearchParams(window.location.search).get("code");
          if (hasCode && supabase.auth.exchangeCodeForSession) {
            const { data, error } = await supabase.auth.exchangeCodeForSession(window.location.href);
            if (error) console.warn("exchangeCodeForSession error:", error);
            session = data?.session ?? null;
          }
        }

        // C) Wenn beides nicht greift: aus storage
        if (!session) {
          const { data, error } = await supabase.auth.getSession();
          if (error) throw error;
          session = data?.session ?? null;
        }

        if (!session?.user) {
          setMsg("Kein Login gefunden. Bitte Magic-Link erneut öffnen.");
          return;
        }

        const user = session.user;

        // 2) Name/E-Mail aus localStorage holen (vom LoginForm)
        const dn = localStorage.getItem("pending_display_name") || "";
        const em = localStorage.getItem("pending_email") || user.email || "";

        if (!dn || !em) {
          setMsg("Name oder E-Mail fehlt. Bitte nochmal anmelden.");
          return;
        }

        // 3) participant upsert (RLS: user_id = auth.uid())
        const { error: upsertErr } = await supabase
          .from("participants")
          .upsert({ user_id: user.id, display_name: dn, email: em }, { onConflict: "user_id" });

        if (upsertErr) throw upsertErr;

        localStorage.removeItem("pending_display_name");
        localStorage.removeItem("pending_email");

        setMsg("✅ Fertig! Du bist angemeldet. Weiterleitung…");
        setTimeout(() => (window.location.href = "/"), 600);
      } catch (e) {
        console.error(e);
        setMsg(`Fehler beim Abschluss: ${e?.message ?? "Unbekannt"}`);
      }
    })();
  }, []);

  return (
    <main className="bg-retro-bg text-retro-text min-h-screen">
      <div className="pattern-top" />
      <div className="content-bg">
        <div className="max-w-2xl mx-auto p-8">
          <div className="retro-card p-6 text-center">
            <h2 className="font-display text-3xl mb-2">Login</h2>
            <p className="meta">{msg}</p>
          </div>
        </div>
      </div>
      <div className="pattern-bottom" />
    </main>
  );
}
