"use client";

import { useEffect, useState } from "react";
import { supabase } from "../lib/supabaseClient";

import ParticipantSignupForm from "../components/ParticipantSignupForm";
import MainApp from "../components/MainApp"; // <— das ist deine bisherige “richtige Seite” (Bewertung + Vorschlag + Past Albums etc.)

export default function Page() {
  const [loading, setLoading] = useState(true);
  const [session, setSession] = useState(null);

  useEffect(() => {
    let mounted = true;

    (async () => {
      const { data } = await supabase.auth.getSession();
      if (!mounted) return;
      setSession(data?.session ?? null);
      setLoading(false);
    })();

    const { data: sub } = supabase.auth.onAuthStateChange((_event, newSession) => {
      setSession(newSession);
      setLoading(false);
    });

    return () => {
      mounted = false;
      sub?.subscription?.unsubscribe?.();
    };
  }, []);

  if (loading) {
    return (
      <main className="bg-retro-bg text-retro-text min-h-screen">
        <div className="pattern-top" />
        <div className="content-bg">
          <div className="max-w-2xl mx-auto p-8">
            <p className="text-center opacity-70">Lädt…</p>
          </div>
        </div>
        <div className="pattern-bottom" />
      </main>
    );
  }

  // ✅ Nicht eingeloggt -> nur Signup
  if (!session) {
    return (
      <main className="bg-retro-bg text-retro-text min-h-screen">
        <div className="pattern-top" />
        <div className="content-bg">
          <div className="max-w-2xl mx-auto p-8">
            <h1>ALBUM DER WOCHE</h1>
            <ParticipantSignupForm />
          </div>
        </div>
        <div className="pattern-bottom" />
      </main>
    );
  }

  // ✅ Eingeloggt -> “richtige Seite”
  return <MainApp />;
}
