"use client";

import { useEffect, useState } from "react";
import { supabase } from "../../../lib/supabaseClient";

export default function AuthCallbackPage() {
  const [msg, setMsg] = useState("Anmeldung wird abgeschlossen…");

  useEffect(() => {
    (async () => {
      try {
        // 1) PKCE-Code tauschen, falls vorhanden
        const url = new URL(window.location.href);
        const code = url.searchParams.get("code");
        if (code) {
          const { error } = await supabase.auth.exchangeCodeForSession(code);
          if (error) throw error;
        }
  
        // 2) Session prüfen
        const { data: sessionData, error: sessionErr } = await supabase.auth.getSession();
        if (sessionErr) throw sessionErr;
  
        if (!sessionData?.session) {
          setMsg("Kein Login gefunden. Bitte den Magic Link erneut öffnen.");
          return;
        }
  
        // 3) User holen
        const { data: userRes, error: userErr } = await supabase.auth.getUser();
        if (userErr) throw userErr;
  
        const user = userRes?.user;
        if (!user) {
          setMsg("Kein Login gefunden. Bitte den Magic Link erneut öffnen.");
          return;
        }
  
        // 4) Display Name / Email bestimmen
        const dnLocal = localStorage.getItem("pending_display_name") || "";
        const dnMeta = user.user_metadata?.display_name || "";
        const dn = (dnLocal || dnMeta || "").trim();
  
        const emLocal = localStorage.getItem("pending_email") || "";
        const em = (emLocal || user.email || "").trim();
  
        if (!dn) {
          setMsg("Name fehlt. Bitte nochmal anmelden und Name eingeben.");
          return;
        }
  
        // 5) participants upsert
        const { error: upsertErr } = await supabase
          .from("participants")
          .upsert(
            { user_id: user.id, display_name: dn, email: em || null },
            { onConflict: "user_id" }
          );
  
          if (upsertErr) {
            console.error("participants upsert failed", upsertErr);
            setMsg(`participants upsert failed: ${upsertErr.message}`);
            return;
          }
          
  
        // optional: localStorage aufräumen
        localStorage.removeItem("pending_display_name");
        localStorage.removeItem("pending_email");
  
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
