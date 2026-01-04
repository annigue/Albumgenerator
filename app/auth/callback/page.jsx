"use client";

import { useEffect, useState } from "react";
import { supabase } from "../../../lib/supabaseClient";

export default function AuthCallbackPage() {
  const [msg, setMsg] = useState("Anmeldung wird abgeschlossen…");

  useEffect(() => {
    (async () => {
      try {
        // ✅ Code-Flow abfangen (wenn Supabase ?code=... nutzt)
        const url = new URL(window.location.href);
        const code = url.searchParams.get("code");
        if (code) {
          const { error } = await supabase.auth.exchangeCodeForSession(code);
          if (error) throw error;
        }

        // ✅ User holen (damit haben wir session+metadata sicher)
        const { data: userData, error: userErr } = await supabase.auth.getUser();
        if (userErr) throw userErr;

        const user = userData?.user;
        if (!user) {
          setMsg("Kein Login gefunden. Bitte den Magic Link erneut öffnen.");
          return;
        }

        const dnLocal =
  (typeof window !== "undefined" && localStorage.getItem("pending_display_name")) || "";

const dnMeta = user?.user_metadata?.display_name || "";
const dn = (dnLocal || dnMeta || "").trim();

const em =
  (typeof window !== "undefined" && localStorage.getItem("pending_email")) ||
  user.email ||
  "";


  if (!dn) {
    setMsg("Name fehlt. Bitte nochmal anmelden und Name eingeben.");
    return;
  }
  

        // ✅ participants upsert
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
