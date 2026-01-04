"use client";

import { useEffect, useState } from "react";
import { supabase } from "../../../lib/supabaseClient";

function fallbackNameFromEmail(email) {
  if (!email) return "";
  const local = email.split("@")[0] || "";
  // hübscher machen: a.gue -> A gue
  const nice = local.replace(/[._-]+/g, " ").trim();
  if (!nice) return "";
  return nice.charAt(0).toUpperCase() + nice.slice(1);
}

export default function AuthCallbackPage() {
  const [msg, setMsg] = useState("Anmeldung wird abgeschlossen…");

  useEffect(() => {
    (async () => {
      try {
        // 1) Wenn Supabase "code"-flow nutzt: Session explizit tauschen
        const url = new URL(window.location.href);
        const code = url.searchParams.get("code");
        if (code) {
          const { error } = await supabase.auth.exchangeCodeForSession(code);
          if (error) throw error;
        }

        // 2) User holen (verlässlicher als getSession im Callback)
        const { data: userData, error: userErr } = await supabase.auth.getUser();
        if (userErr) throw userErr;

        const user = userData?.user;
        if (!user) {
          setMsg("Kein Login gefunden. Bitte den Magic Link erneut öffnen.");
          return;
        }

        // 3) Name/E-Mail aus localStorage – ABER fallback wenn leer (anderes Gerät / Mail-App)
        const dnRaw =
          (typeof window !== "undefined" && localStorage.getItem("pending_display_name")) || "";
        const emRaw =
          (typeof window !== "undefined" && localStorage.getItem("pending_email")) || "";

        const em = emRaw || user.email || "";
        const dn = dnRaw || fallbackNameFromEmail(user.email);

        if (!dn) {
          setMsg("Name fehlt. Bitte nochmal anmelden und Namen eingeben.");
          return;
        }

        // 4) Participants upsert (RLS: user_id = auth.uid())
        const { error: upsertErr } = await supabase
          .from("participants")
          .upsert(
            {
              user_id: user.id,
              display_name: dn,
              email: em || null,
            },
            { onConflict: "user_id" }
          );

        if (upsertErr) throw upsertErr;

        // Cleanup
        if (typeof window !== "undefined") {
          localStorage.removeItem("pending_display_name");
          localStorage.removeItem("pending_email");
        }

        setMsg("✅ Fertig! Weiterleitung…");
        window.location.replace("/");
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
