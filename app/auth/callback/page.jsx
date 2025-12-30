"use client";

import { useEffect, useState } from "react";
import { supabase } from "../../../lib/supabaseClient.js";

export default function AuthCallbackPage() {
  const [msg, setMsg] = useState("Anmeldung wird abgeschlossen…");

  useEffect(() => {
    (async () => {
      try {
        const { data: sessionData, error: sessionErr } =
          await supabase.auth.getSession();
        if (sessionErr) throw sessionErr;

        const user = sessionData?.session?.user;
        if (!user) {
          setMsg("Kein Login gefunden. Bitte den Magic Link erneut öffnen.");
          return;
        }

        const dn = localStorage.getItem("pending_display_name") || "";
        const em =
          localStorage.getItem("pending_email") || user.email || "";

        if (!dn || !em) {
          setMsg("Name oder E-Mail fehlt. Bitte nochmal anmelden.");
          return;
        }

        const { error: upsertErr } = await supabase
          .from("participants")
          .upsert(
            { user_id: user.id, display_name: dn, email: em },
            { onConflict: "user_id" }
          );

        if (upsertErr) throw upsertErr;

        localStorage.removeItem("pending_display_name");
        localStorage.removeItem("pending_email");

        setMsg("✅ Fertig! Du wirst gleich weitergeleitet…");
        setTimeout(() => {
          window.location.href = "/";
        }, 600);
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
